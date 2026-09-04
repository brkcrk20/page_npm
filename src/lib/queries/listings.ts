import 'server-only';

import { unstable_cache } from 'next/cache';

/**
 * İlan sorguları — sunucu tarafı.
 *
 * Sayfalar Supabase'e doğrudan gitmek yerine buradan geçiyor ki select
 * listeleri, sıralama ve "yalnızca yayında" filtresi tek yerde tanımlı olsun.
 *
 * Hepsi server component'lerden çağrılır: HTML sunucuda dolu üretilir, arama
 * motoru gerçek içeriği görür.
 */

import {
  createSupabasePublicClient,
  isSupabaseServerConfigured,
  warnMissingConfig,
} from '@/lib/supabase/server';
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
  id, slug, title, kind, price, currency, is_negotiable, event_date,
  age_months, gender, published_at,
  breeds!inner ( id, name, slug ),
  categories!inner ( id, slug, name ),
  cities!inner ( id, name, slug ),
  districts ( id, name, slug ),
  listing_photos ( storage_path, position )
`;

/**
 * Süresi geçmemiş ilan koşulu.
 *
 * Süresi dolanları kapatan iş her gece çalışıyor (pg_cron → expire_listings).
 * Yalnızca ona güvenmek, işin çalışmadığı gün sitenin bayat ilan göstermesi
 * demekti; tarih sorguda ayrıca süzülüyor. İki katman da ucuz: hem status
 * hem expires_at indeksli.
 */
function suresiGecmemis(): string {
  return `expires_at.is.null,expires_at.gt.${new Date().toISOString()}`;
}

export type ListingCard = Pick<
  ListingRow,
  'id' | 'slug' | 'title' | 'kind' | 'price' | 'currency' | 'is_negotiable' | 'age_months' | 'gender' | 'published_at' | 'event_date'
> & {
  breeds: { id: number; name: string; slug: string } | null;
  categories: { id: number; slug: string; name: string } | null;
  cities: { id: number; name: string; slug: string } | null;
  districts: { id: number; name: string; slug: string } | null;
  listing_photos: { storage_path: string; position: number }[];
};

export type ListingFilters = {
  categoryId?: number;
  /**
   * Bu kategorileri listeden çıkar.
   *
   * Güvercin ayrı bir dikey: kendi ırk sınıflandırması, kendi terminolojisi
   * ve kendi sayfası var. Sahiplendirme ve satılık listelerinde köpek ve
   * kedilerin arasında görünmesi ne alıcıya ne satıcıya yarıyor — güvercin
   * arayan zaten güvercin sayfasına gidiyor.
   */
  excludeCategoryIds?: number[];
  breedId?: number;
  cityId?: number;
  districtId?: number;
  kind?: Database['public']['Enums']['listing_kind'];
  /**
   * Birden çok ilan türü (kayıp + bulundu gibi).
   *
   * Kayıp ve bulundu ilanları normal listelerde görünmemeli: satılık kedi
   * arayan kişiye kaybolmuş kedi göstermek işe yaramaz. O yüzden bu iki tür
   * varsayılan olarak DIŞARIDA — ancak açıkça istendiğinde geliyor.
   */
  kinds?: Database['public']['Enums']['listing_kind'][];
  /**
   * Kimden: sahibinden (bireysel) veya mağazadan (kurumsal).
   *
   * profiles'a join atmak yerine ilan üzerinde tutuluyor; bkz. göç 0043.
   */
  seller?: Database['public']['Enums']['account_type'];
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
  /**
   * Sıralama.
   *
   * İncelediğim Türk emsal sitelerinin tamamı yalnızca tarihe göre
   * sıralıyor; fiyata göre sıralama hiçbirinde yok. Alıcının en sık
   * ihtiyacı olan sıralama bu — özellikle ikinci el malzemede.
   */
  sort?: 'yeni' | 'eski' | 'ucuz' | 'pahali';
};

export const DEFAULT_PER_PAGE = 24;

/**
 * Adres çubuğundaki sıralama ve fiyat parametrelerini filtreye çevirir.
 *
 * Tek yerde: aynı ayrıştırmayı her sayfada tekrar yazmak, birinde yapılan
 * düzeltmenin diğerlerine geçmemesi demek.
 */
export function parseListingParams(params: {
  sirala?: string;
  min?: string;
  max?: string;
  kimden?: string;
}): Pick<ListingFilters, 'sort' | 'minPrice' | 'maxPrice' | 'seller'> {
  const sayi = (v?: string) => {
    const n = Number(v);
    return v && Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const gecerli = ['yeni', 'eski', 'ucuz', 'pahali'] as const;

  const kimden =
    params.kimden === 'sahibinden'
      ? ('bireysel' as const)
      : params.kimden === 'magazadan'
        ? ('kurumsal' as const)
        : undefined;

  return {
    sort: gecerli.includes(params.sirala as any) ? (params.sirala as ListingFilters['sort']) : undefined,
    minPrice: sayi(params.min),
    maxPrice: sayi(params.max),
    seller: kimden,
  };
}

/**
 * Sıralama seçeneğini sorgu parametresine çevirir.
 *
 * Fiyat sıralamasında nullsFirst kapalı: fiyatı olmayan (ücretsiz
 * sahiplendirme) ilanlar "en ucuz" listesinin başında bir yığın
 * oluşturmasın, sonda dursun.
 */
function listingOrder(
  sort: ListingFilters['sort']
): [string, { ascending: boolean; nullsFirst?: boolean }] {
  switch (sort) {
    case 'eski':
      return ['published_at', { ascending: true }];
    case 'ucuz':
      return ['price', { ascending: true, nullsFirst: false }];
    case 'pahali':
      return ['price', { ascending: false, nullsFirst: false }];
    default:
      return ['published_at', { ascending: false }];
  }
}

/**
 * Filtrelenmiş ilan listesi.
 *
 * Filtreler kimlik (id) üzerinden çalışıyor, slug üzerinden değil: slug'dan
 * kimliğe çeviriyi çağıran sayfa zaten yapıyor (kategori/cins/şehir kaydını
 * göstermek için de ona ihtiyacı var), böylece burada ikinci bir join
 * gerekmiyor ve kısmi indeksler doğrudan kullanılabiliyor.
 */
/**
 * Filtrelenmiş ilan listesi — ÖNBELLEKLİ.
 *
 * Kategori, cins ve şehir sayfalarının tamamı bu fonksiyondan besleniyor ve
 * her istek Singapur'daki veritabanına iki gidiş dönüş demekti; ölçümde
 * sayfa başına ~0,45 saniye. Önbellek anahtarı filtre nesnesinden türüyor,
 * yani her kombinasyon ayrı saklanıyor.
 *
 * Altmış saniye: yeni ilan bir dakika içinde listeye giriyor. İlan sahibi
 * kendi ilanını zaten kendi panelinden anında görüyor.
 */
export const getListings = unstable_cache(
  async (filters: ListingFilters = {}) => fetchListings(filters),
  ['listings'],
  { revalidate: 60, tags: ['listings'] }
);

async function fetchListings(filters: ListingFilters = {}) {
  const perPage = filters.perPage ?? DEFAULT_PER_PAGE;
  const page = Math.max(1, filters.page ?? 1);

  if (!isSupabaseServerConfigured()) {
    warnMissingConfig('getListings');
    return { listings: [] as ListingCard[], total: 0, page, perPage, pageCount: 1 };
  }

  const supabase = createSupabasePublicClient();
  const from = (page - 1) * perPage;

  let query = supabase
    .from('listings')
    .select(CARD_COLUMNS, { count: 'exact' })
    .eq('status', 'yayinda')
    .or(suresiGecmemis());

  if (filters.categoryId !== undefined) query = query.eq('category_id', filters.categoryId);
  if (filters.excludeCategoryIds?.length) {
    query = query.not('category_id', 'in', `(${filters.excludeCategoryIds.join(',')})`);
  }
  if (filters.breedId !== undefined) query = query.eq('breed_id', filters.breedId);
  if (filters.cityId !== undefined) query = query.eq('city_id', filters.cityId);
  if (filters.districtId !== undefined) query = query.eq('district_id', filters.districtId);
  if (filters.kinds?.length) {
    query = query.in('kind', filters.kinds);
  } else if (filters.kind) {
    query = query.eq('kind', filters.kind);
  } else {
    query = query.not('kind', 'in', '(kayip,bulundu)');
  }
  if (filters.gender) query = query.eq('gender', filters.gender);
  if (filters.seller) query = query.eq('owner_account_type', filters.seller);

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
    .order(...listingOrder(filters.sort))
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
  if (!isSupabaseServerConfigured()) { warnMissingConfig('getListingById'); return null; }
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from('listings')
    .select(
      `*,
       breeds ( id, name, slug ),
       categories ( id, slug, name, code ),
       cities ( id, name, slug ),
       districts ( id, name, slug ),
       listing_photos ( storage_path, position ),
       listing_videos ( id, provider, storage_path, playback_url, duration_seconds, width, height, position, title, status )`
    )
    .eq('id', id)
    .eq('status', 'yayinda')
    .or(suresiGecmemis())
    .maybeSingle();

  if (error) throw new Error(`İlan getirilemedi: ${error.message}`);
  return data;
}

/** Ana sayfa vitrini — aktif "anasayfa_vitrin" dopingi olan ilanlar. */
export async function getFeaturedListings(limit = 8): Promise<ListingCard[]> {
  if (!isSupabaseServerConfigured()) return [];
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

// ---------------------------------------------------------------------------
// İlan detay sayfası
// ---------------------------------------------------------------------------

export type SellerInfo = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  account_type: string;
  company_title: string | null;
  member_since: string;
  total_listings: number;
  active_listings: number;
  /** Profilde gösterilen serbest metin. */
  bio: string | null;
  city_id: number | null;
};

/**
 * Detay sayfasının satıcı kartı.
 *
 * profiles tablosuna doğrudan gitmiyoruz: RLS orada yalnızca kişinin kendi
 * satırını gösteriyor (telefon, TCKN, vergi no o tabloda). Herkese açık
 * alanlar public_profiles view'ında, sayımlar seller_stats view'ında.
 */
export async function getSellerInfo(userId: string): Promise<SellerInfo | null> {
  if (!isSupabaseServerConfigured()) return null;
  const supabase = createSupabasePublicClient();

  const [profile, stats] = await Promise.all([
    supabase
      .from('public_profiles')
      .select('id, full_name, username, avatar_url, is_verified, account_type, company_title, bio, city_id')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('seller_stats')
      .select('member_since, total_listings, active_listings')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  if (profile.error || !profile.data) {
    if (profile.error) console.error('Satıcı bilgisi alınamadı:', profile.error.message);
    return null;
  }

  return {
    ...(profile.data as any),
    member_since: (stats.data as any)?.member_since ?? new Date().toISOString(),
    total_listings: Number((stats.data as any)?.total_listings ?? 0),
    active_listings: Number((stats.data as any)?.active_listings ?? 0),
  };
}

/** Aynı cinsten benzer ilanlar (mevcut ilan hariç). */
export async function getSimilarListings(
  listingId: number,
  breedId: number | null,
  categoryId: number,
  limit = 5
): Promise<ListingCard[]> {
  if (!isSupabaseServerConfigured()) return [];
  const supabase = createSupabasePublicClient();

  let query = supabase
    .from('listings')
    .select(CARD_COLUMNS)
    .eq('status', 'yayinda')
    .or(suresiGecmemis())
    .neq('id', listingId);

  // Cins bilgisi varsa aynı cinsten, yoksa aynı kategoriden gösteriyoruz —
  // "benzer ilan" bölümünü boş bırakmaktansa daha geniş bir eşleşme iyidir.
  if (breedId !== null) query = query.eq('breed_id', breedId);
  else query = query.eq('category_id', categoryId);

  const { data, error } = await query.order('published_at', { ascending: false }).limit(limit);

  if (error) {
    console.error('Benzer ilanlar alınamadı:', error.message);
    return [];
  }
  return (data ?? []) as unknown as ListingCard[];
}

export type AdjacentListings = {
  previous: { id: number; slug: string } | null;
  next: { id: number; slug: string } | null;
};

/**
 * Önceki / sonraki ilan bağlantıları.
 *
 * Liste yeniden eskiye sıralı olduğu için "önceki" daha YENİ, "sonraki" daha
 * ESKİ ilan oluyor — kullanıcının listede yukarı/aşağı hareketiyle aynı yön.
 */
export async function getAdjacentListings(
  listingId: number,
  categoryId: number,
  publishedAt: string | null
): Promise<AdjacentListings> {
  if (!isSupabaseServerConfigured() || !publishedAt) {
    return { previous: null, next: null };
  }
  const supabase = createSupabasePublicClient();

  const [newer, older] = await Promise.all([
    supabase
      .from('listings')
      .select('id, slug')
      .eq('status', 'yayinda')
    .or(suresiGecmemis())
      .eq('category_id', categoryId)
      .gt('published_at', publishedAt)
      .order('published_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('listings')
      .select('id, slug')
      .eq('status', 'yayinda')
    .or(suresiGecmemis())
      .eq('category_id', categoryId)
      .lt('published_at', publishedAt)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    previous: (newer.data as any) ?? null,
    next: (older.data as any) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Satıcı profili
// ---------------------------------------------------------------------------

/**
 * Kullanıcı adından herkese açık satıcı profili.
 *
 * profiles tablosuna doğrudan gidilmiyor: RLS orada yalnızca kişinin kendi
 * satırını gösteriyor. Herkese açık alanlar public_profiles view'ında.
 */
export async function getSellerByUsername(username: string): Promise<SellerInfo | null> {
  if (!isSupabaseServerConfigured()) return null;
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from('public_profiles')
    .select('id, full_name, username, avatar_url, is_verified, account_type, company_title, bio, city_id')
    .eq('username', username.toLocaleLowerCase('tr'))
    .maybeSingle();

  if (error || !data) return null;
  return getSellerInfo((data as any).id);
}

/** Bir satıcının yayındaki ilanları. */
export async function getSellerListings(userId: string, page = 1, perPage = 24) {
  if (!isSupabaseServerConfigured()) {
    return { listings: [] as ListingCard[], total: 0, page, perPage, pageCount: 1 };
  }

  const supabase = createSupabasePublicClient();
  const from = (page - 1) * perPage;

  const { data, error, count } = await supabase
    .from('listings')
    .select(CARD_COLUMNS, { count: 'exact' })
    .eq('owner_id', userId)
    .eq('status', 'yayinda')
    .or(suresiGecmemis())
    .order('published_at', { ascending: false })
    .range(from, from + perPage - 1);

  if (error) {
    console.error('Satıcı ilanları alınamadı:', error.message);
    return { listings: [] as ListingCard[], total: 0, page, perPage, pageCount: 1 };
  }

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
 * Videosu olan ilanlar.
 *
 * Güvercin giriş sayfasında uçuş videolu ilanlar öne çıkarılıyor: alıcı
 * kuşun hareketini görmek istiyor ve videolu ilan bu kategoride belirgin bir
 * fark yaratıyor.
 */
export async function getListingsWithVideo(categoryId: number, limit = 8): Promise<ListingCard[]> {
  if (!isSupabaseServerConfigured()) return [];
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from('listings')
    // !inner: video kaydı olmayan ilanlar tamamen elensin. inner olmadan
    // PostgREST satırı bırakıp yalnızca gömülü diziyi boşaltıyor.
    .select(`${CARD_COLUMNS}, listing_videos!inner ( id )`)
    .eq('status', 'yayinda')
    .or(suresiGecmemis())
    .eq('category_id', categoryId)
    .eq('listing_videos.status', 'hazir')
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Videolu ilanlar alınamadı:', error.message);
    return [];
  }
  return (data ?? []) as unknown as ListingCard[];
}
