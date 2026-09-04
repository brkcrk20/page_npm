import 'server-only';

/**
 * Hizmet sağlayıcı sorguları (veteriner, pet oteli, kuaför…).
 *
 * İlan sorgularından ayrı: hizmet sağlayıcı bir ilan değil, kalıcı bir işletme
 * kaydı. Yaşam döngüsü, sıralaması (puana göre) ve filtreleri farklı.
 */

import {
  createSupabasePublicClient,
  isSupabaseServerConfigured,
  warnMissingConfig,
} from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';
import { getSellerListings } from '@/lib/queries/listings';

export type ServiceType = Database['public']['Enums']['service_type'];

export type ServiceFeature = {
  id: number;
  slug: string;
  name: string;
  group_name: string;
  position: number;
};

export type OpeningHour = {
  weekday: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  is_24h: boolean;
};

export type ServiceProviderCard = {
  logo_url?: string | null;
  id: number;
  slug: string;
  name: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  address: string | null;
  is_verified: boolean;
  rating_average: number;
  rating_count: number;
  view_count: number;
  cities: { id: number; name: string; slug: string } | null;
  districts: { id: number; name: string; slug: string } | null;
  service_provider_features: { service_features: ServiceFeature }[];
  service_provider_hours: OpeningHour[];
};

const CARD_COLUMNS = `
  id, slug, name, description, phone, whatsapp, website, address,
  is_verified, rating_average, rating_count, view_count, logo_url,
  cities!inner ( id, name, slug ),
  districts ( id, name, slug ),
  service_provider_features ( service_features ( id, slug, name, group_name, position ) ),
  service_provider_hours ( weekday, opens_at, closes_at, is_closed, is_24h )
`;

export type ServiceFilters = {
  serviceType: ServiceType;
  cityId?: number;
  districtId?: number;
  /** Özellik slug'ları — hepsini birden sağlayanlar (VE mantığı). */
  featureSlugs?: string[];
  search?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  page?: number;
  perPage?: number;
};

export const SERVICES_PER_PAGE = 20;

/**
 * Filtrelenmiş hizmet sağlayıcı listesi.
 *
 * Özellik filtresi VE mantığıyla çalışıyor: "röntgen" ve "7/24 acil"
 * işaretlendiğinde ikisini birden sunan klinikler dönüyor. VEYA mantığı
 * kullanıcı için işe yaramaz — "acil VEYA röntgen" pratikte hiçbir şeyi
 * daraltmıyor.
 *
 * Bu, PostgREST'te tek sorguyla ifade edilemediği için önce eşleşen sağlayıcı
 * kimlikleri bulunuyor, sonra kayıtlar çekiliyor.
 */
export async function getServiceProviders(filters: ServiceFilters) {
  const perPage = filters.perPage ?? SERVICES_PER_PAGE;
  const page = Math.max(1, filters.page ?? 1);

  const empty = {
    providers: [] as ServiceProviderCard[],
    total: 0,
    page,
    perPage,
    pageCount: 1,
  };

  if (!isSupabaseServerConfigured()) {
    warnMissingConfig('getServiceProviders');
    return empty;
  }

  const supabase = createSupabasePublicClient();

  // Özellik filtresi: her özellik için ayrı bir eşleşme kümesi alıp kesişimini
  // hesaplıyoruz. Tek sorguda "hepsini birden sağlayan" ifadesi PostgREST'te
  // yok; kesişim istemci tarafında ama küme boyutları küçük.
  let idFilter: number[] | null = null;

  if (filters.featureSlugs?.length) {
    const { data: featureRows, error: featureError } = await supabase
      .from('service_features')
      .select('id, slug')
      .eq('service_type', filters.serviceType)
      .in('slug', filters.featureSlugs);

    if (featureError) {
      console.error('Özellikler alınamadı:', featureError.message);
      return empty;
    }

    const featureIds = (featureRows ?? []).map((f: any) => f.id);
    // Bilinmeyen özellik slug'ı gönderilmişse hiçbir sonuç dönmemeli;
    // sessizce yok saymak kullanıcıya yanlış sonuç göstermek olurdu.
    if (featureIds.length !== filters.featureSlugs.length) return empty;

    for (const featureId of featureIds) {
      const { data: matches, error } = await supabase
        .from('service_provider_features')
        .select('provider_id')
        .eq('feature_id', featureId);

      if (error) {
        console.error('Özellik eşleşmesi alınamadı:', error.message);
        return empty;
      }

      const ids = (matches ?? []).map((m: any) => m.provider_id as number);
      idFilter = idFilter === null ? ids : idFilter.filter((id) => ids.includes(id));
      if (idFilter.length === 0) return empty;
    }
  }

  let query = supabase
    .from('service_providers')
    .select(CARD_COLUMNS, { count: 'exact' })
    .eq('service_type', filters.serviceType)
    .eq('status', 'yayinda');

  if (idFilter !== null) query = query.in('id', idFilter);
  if (filters.cityId !== undefined) query = query.eq('city_id', filters.cityId);
  if (filters.districtId !== undefined) query = query.eq('district_id', filters.districtId);
  if (filters.minRating !== undefined) query = query.gte('rating_average', filters.minRating);
  if (filters.verifiedOnly) query = query.eq('is_verified', true);

  if (filters.search) {
    query = query.textSearch('search_vector', filters.search, {
      type: 'websearch',
      config: 'turkish',
    });
  }

  const from = (page - 1) * perPage;
  const { data, error, count } = await query
    // Doğrulanmış işletmeler önce, sonra puan, sonra yorum sayısı.
    // Puanı 5.0 olan tek yorumlu bir klinik, 4.7 puanlı 200 yorumlunun
    // üstüne çıkmasın diye yorum sayısı ikinci ölçüt.
    .order('is_verified', { ascending: false })
    .order('rating_average', { ascending: false })
    .order('rating_count', { ascending: false })
    .range(from, from + perPage - 1);

  if (error) {
    console.error('Hizmet sağlayıcılar alınamadı:', error.message);
    return empty;
  }

  const total = count ?? 0;
  return {
    providers: (data ?? []) as unknown as ServiceProviderCard[],
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getServiceProviderById(id: number, serviceType: ServiceType) {
  if (!isSupabaseServerConfigured()) return null;
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from('service_providers')
    .select(
      `*,
       cities ( id, name, slug ),
       districts ( id, name, slug ),
       service_provider_features ( service_features ( id, slug, name, group_name, position ) ),
       service_provider_hours ( weekday, opens_at, closes_at, is_closed, is_24h ),
       service_provider_photos ( id, storage_path, width, height, caption, position )`
    )
    .eq('id', id)
    .eq('service_type', serviceType)
    .eq('status', 'yayinda')
    .maybeSingle();

  if (error) {
    console.error('Hizmet sağlayıcı alınamadı:', error.message);
    return null;
  }
  return data;
}

/** Filtre panelindeki özellik kataloğu, grup başlıklarına göre bölünmüş. */
export async function getServiceFeatures(serviceType: ServiceType) {
  if (!isSupabaseServerConfigured()) return [] as { group: string; features: ServiceFeature[] }[];
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from('service_features')
    .select('id, slug, name, group_name, position')
    .eq('service_type', serviceType)
    .eq('is_active', true)
    .order('position');

  if (error) {
    console.error('Özellik kataloğu alınamadı:', error.message);
    return [];
  }

  const grouped = new Map<string, ServiceFeature[]>();
  for (const feature of (data ?? []) as ServiceFeature[]) {
    const list = grouped.get(feature.group_name) ?? [];
    list.push(feature);
    grouped.set(feature.group_name, list);
  }

  return Array.from(grouped, ([group, features]) => ({ group, features }));
}

/** Bu hizmet tipinde ilan bulunan şehirler ve sayıları. */
export async function getServiceCityCounts(serviceType: ServiceType) {
  if (!isSupabaseServerConfigured()) return [] as { slug: string; name: string; count: number }[];
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from('service_city_counts')
    .select('city_slug, city_name, provider_count')
    .eq('service_type', serviceType);

  if (error) {
    console.error('Şehir sayımları alınamadı:', error.message);
    return [];
  }

  return (data ?? [])
    .map((row: any) => ({
      slug: row.city_slug as string,
      name: row.city_name as string,
      count: Number(row.provider_count),
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'tr'));
}

export type ServiceReview = {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  public_profiles: { full_name: string | null; username: string | null; avatar_url: string | null } | null;
};

export async function getServiceReviews(providerId: number, limit = 20) {
  if (!isSupabaseServerConfigured()) return [] as ServiceReview[];
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from('service_reviews')
    .select(
      `id, rating, comment, created_at,
       public_profiles!service_reviews_user_id_fkey ( full_name, username, avatar_url )`
    )
    .eq('provider_id', providerId)
    .eq('is_published', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Değerlendirmeler alınamadı:', error.message);
    return [];
  }
  return (data ?? []) as unknown as ServiceReview[];
}

/**
 * İşletmenin vitrini.
 *
 * Petshop gibi hem işletme kaydı olan hem ilan veren üyeler için işletme
 * sayfası ile ilanlar birbirinden kopuktu: kullanıcı kliniği/mağazayı
 * buluyor ama sattığı mamayı göremiyordu. İkisini burada birleştiriyoruz.
 */
export async function getProviderStorefront(ownerId: string | null) {
  if (!ownerId || !isSupabaseServerConfigured()) return null;
  const supabase = createSupabasePublicClient();

  const { data: profile } = await supabase
    .from('public_profiles')
    .select('username')
    .eq('id', ownerId)
    .maybeSingle();

  const { listings, total } = await getSellerListings(ownerId, 1, 8);
  if (total === 0) return null;

  return { username: (profile as any)?.username as string | null, listings, total };
}

/** Bir üyenin yayındaki işletme kaydı — satıcı profilinden işletmeye bağlantı için. */
export async function getProviderForOwner(ownerId: string) {
  if (!isSupabaseServerConfigured()) return null;
  const supabase = createSupabasePublicClient();

  const { data } = await supabase
    .from('service_providers')
    .select('id, slug, name, service_type, is_verified, rating_average, rating_count')
    .eq('owner_id', ownerId)
    .eq('status', 'yayinda')
    .order('id')
    .limit(1)
    .maybeSingle();

  return data as {
    id: number; slug: string; name: string; service_type: string;
    is_verified: boolean; rating_average: number; rating_count: number;
  } | null;
}
