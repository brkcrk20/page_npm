import 'server-only';

/**
 * İlan sorguları — sunucu tarafı.
 *
 * Sayfalar Supabase'e doğrudan gitmek yerine buradan geçiyor ki select
 * listeleri, sıralama ve "yalnızca yayında" filtresi tek yerde tanımlı olsun.
 *
 * Hepsi server component'lerden çağrılır: HTML sunucuda dolu üretilir, arama
 * motoru gerçek içeriği görür.
 */

import { createSupabasePublicClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';

type ListingRow = Database['public']['Tables']['listings']['Row'];

/**
 * Kart için gereken alanlar.
 *
 * İlişkili tablolar `!inner` ile bağlanıyor. Bu şart: PostgREST'te gömülü bir
 * tabloya `.eq('breeds.slug', ...)` uygulamak, join `!inner` değilse satırı
 * elemiyor — yalnızca gömülü nesneyi null yapıyor. Yani `!inner` olmadan
 * filtreler sessizce hiçbir şey yapmıyor ve tüm ilanlar dönüyordu.
 */
const CARD_COLUMNS = `
  id, slug, title, kind, price, currency, is_negotiable,
  age_months, gender, published_at,
  breeds!inner ( id, name, slug ),
  categories!inner ( id, slug, name ),
  cities!inner ( id, name, slug ),
  districts ( id, name, slug ),
  listing_photos ( storage_path, position )
`;

export type ListingCard = Pick<
  ListingRow,
  'id' | 'slug' | 'title' | 'kind' | 'price' | 'currency' | 'is_negotiable' | 'age_months' | 'gender' | 'published_at'
> & {
  breeds: { id: number; name: string; slug: string } | null;
  categories: { id: number; slug: string; name: string } | null;
  cities: { id: number; name: string; slug: string } | null;
  districts: { id: number; name: string; slug: string } | null;
  listing_photos: { storage_path: string; position: number }[];
};

export type ListingFilters = {
  categoryId?: number;
  breedId?: number;
  cityId?: number;
  districtId?: number;
  kind?: Database['public']['Enums']['listing_kind'];
  gender?: Database['public']['Enums']['pet_gender'];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minAgeMonths?: number;
  maxAgeMonths?: number;
  isVaccinated?: boolean;
  hasPedigree?: boolean;
  acceptsCreditCard?: boolean;
  shipsIntercity?: boolean;
  page?: number;
  perPage?: number;
};

export const DEFAULT_PER_PAGE = 24;

/**
 * Filtrelenmiş ilan listesi.
 *
 * Filtreler kimlik (id) üzerinden çalışıyor, slug üzerinden değil: slug'dan
 * kimliğe çeviriyi çağıran sayfa zaten yapıyor (kategori/cins/şehir kaydını
 * göstermek için de ona ihtiyacı var), böylece burada ikinci bir join
 * gerekmiyor ve kısmi indeksler doğrudan kullanılabiliyor.
 */
export async function getListings(filters: ListingFilters = {}) {
  const supabase = createSupabasePublicClient();
  const perPage = filters.perPage ?? DEFAULT_PER_PAGE;
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * perPage;

  let query = supabase
    .from('listings')
    .select(CARD_COLUMNS, { count: 'exact' })
    .eq('status', 'yayinda');

  if (filters.categoryId !== undefined) query = query.eq('category_id', filters.categoryId);
  if (filters.breedId !== undefined) query = query.eq('breed_id', filters.breedId);
  if (filters.cityId !== undefined) query = query.eq('city_id', filters.cityId);
  if (filters.districtId !== undefined) query = query.eq('district_id', filters.districtId);
  if (filters.kind) query = query.eq('kind', filters.kind);
  if (filters.gender) query = query.eq('gender', filters.gender);

  if (filters.minPrice !== undefined) query = query.gte('price', filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte('price', filters.maxPrice);
  if (filters.minAgeMonths !== undefined) query = query.gte('age_months', filters.minAgeMonths);
  if (filters.maxAgeMonths !== undefined) query = query.lte('age_months', filters.maxAgeMonths);

  // Boolean filtreler yalnızca true iken uygulanır: "aşılı" kutusu işaretsizken
  // aşısızları göstermek değil, hiç filtrelememek isteniyor.
  if (filters.isVaccinated) query = query.eq('is_vaccinated', true);
  if (filters.hasPedigree) query = query.eq('has_pedigree', true);
  if (filters.acceptsCreditCard) query = query.eq('accepts_credit_card', true);
  if (filters.shipsIntercity) query = query.eq('ships_intercity', true);

  if (filters.search) {
    query = query.textSearch('search_vector', filters.search, {
      type: 'websearch',
      config: 'turkish',
    });
  }

  const { data, error, count } = await query
    .order('published_at', { ascending: false })
    .range(from, from + perPage - 1);

  if (error) throw new Error(`İlanlar getirilemedi: ${error.message}`);

  const total = count ?? 0;
  return {
    listings: (data ?? []) as unknown as ListingCard[],
    total,
    page,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

/**
 * Tek ilan — URL'deki sayısal id ile.
 *
 * Slug'a hiç bakmıyoruz: başlık değiştiğinde slug değişse bile eski link
 * çalışmaya devam etsin. Kanonik slug dönen kayıttan okunur.
 */
export async function getListingById(id: number) {
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from('listings')
    .select(
      `*,
       breeds ( id, name, slug ),
       categories ( id, slug, name ),
       cities ( id, name, slug ),
       districts ( id, name, slug ),
       listing_photos ( storage_path, position )`
    )
    .eq('id', id)
    .eq('status', 'yayinda')
    .maybeSingle();

  if (error) throw new Error(`İlan getirilemedi: ${error.message}`);
  return data;
}

/** Ana sayfa vitrini — aktif "anasayfa_vitrin" dopingi olan ilanlar. */
export async function getFeaturedListings(limit = 8): Promise<ListingCard[]> {
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from('active_listing_promotions')
    .select(`listing_id, promotions, listings!inner ( ${CARD_COLUMNS} )`)
    .contains('promotions', ['anasayfa_vitrin'])
    .limit(limit);

  if (error) {
    // Vitrin boşsa ana sayfa yine açılmalı; bu bölüm kritik değil.
    console.error('Vitrin ilanları getirilemedi:', error.message);
    return [];
  }

  return (data ?? []).map((row: any) => row.listings).filter(Boolean) as ListingCard[];
}
