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

/** Kart göstermek için gereken alanlar — tüm satırı çekmeye gerek yok. */
const CARD_COLUMNS = `
  id,
  slug,
  title,
  kind,
  price,
  currency,
  is_negotiable,
  age_months,
  gender,
  published_at,
  breed_id,
  breeds ( name, slug ),
  categories ( slug, name ),
  cities ( name, slug ),
  districts ( name, slug ),
  listing_photos ( storage_path, position )
` as const;

export type ListingCard = Pick<
  ListingRow,
  'id' | 'slug' | 'title' | 'kind' | 'price' | 'currency' | 'is_negotiable' | 'age_months' | 'gender' | 'published_at' | 'breed_id'
> & {
  breeds: { name: string; slug: string } | null;
  categories: { slug: string; name: string } | null;
  cities: { name: string; slug: string } | null;
  districts: { name: string; slug: string } | null;
  listing_photos: { storage_path: string; position: number }[];
};

export type ListingFilters = {
  categorySlug?: string;
  breedSlug?: string;
  citySlug?: string;
  districtSlug?: string;
  kind?: Database['public']['Enums']['listing_kind'];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minAgeMonths?: number;
  maxAgeMonths?: number;
  gender?: Database['public']['Enums']['pet_gender'];
  isVaccinated?: boolean;
  hasPedigree?: boolean;
  acceptsCreditCard?: boolean;
  shipsIntercity?: boolean;
  limit?: number;
  offset?: number;
};

/**
 * Filtrelenmiş ilan listesi.
 *
 * Firestore'da bu filtrelerin her kombinasyonu ayrı composite index isterdi;
 * Postgres'te tek sorgu yetiyor.
 */
export async function getListings(filters: ListingFilters = {}) {
  const supabase = createSupabasePublicClient();
  const limit = filters.limit ?? 24;
  const offset = filters.offset ?? 0;

  let query = supabase
    .from('listings')
    .select(CARD_COLUMNS, { count: 'exact' })
    .eq('status', 'yayinda');

  if (filters.categorySlug) query = query.eq('categories.slug', filters.categorySlug);
  if (filters.breedSlug) query = query.eq('breeds.slug', filters.breedSlug);
  if (filters.citySlug) query = query.eq('cities.slug', filters.citySlug);
  if (filters.districtSlug) query = query.eq('districts.slug', filters.districtSlug);
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
    .range(offset, offset + limit - 1);

  if (error) throw new Error(`İlanlar getirilemedi: ${error.message}`);

  return { listings: (data ?? []) as unknown as ListingCard[], total: count ?? 0 };
}

/**
 * Tek ilan — URL'deki sayısal id ile.
 *
 * Slug'a hiç bakmıyoruz: başlık değiştiğinde slug değişse bile eski link
 * çalışmaya devam etsin. Kanonik slug dönen kayıttan okunup gerekiyorsa
 * yönlendirme yapılır.
 */
export async function getListingById(id: number) {
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from('listings')
    .select(
      `*,
       breeds ( name, slug ),
       categories ( slug, name ),
       cities ( name, slug ),
       districts ( name, slug ),
       listing_photos ( storage_path, position ),
       public_profiles!listings_owner_id_fkey (
         id, full_name, username, avatar_url, is_verified, account_type,
         company_title, created_at
       )`
    )
    .eq('id', id)
    .eq('status', 'yayinda')
    .maybeSingle();

  if (error) throw new Error(`İlan getirilemedi: ${error.message}`);
  return data;
}

/** Ana sayfa vitrini — aktif doping'i olan ilanlar. */
export async function getFeaturedListings(limit = 8) {
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from('active_listing_promotions')
    .select(`listing_id, promotions, listings!inner ( ${CARD_COLUMNS} )`)
    .contains('promotions', ['anasayfa_vitrin'])
    .limit(limit);

  if (error) throw new Error(`Vitrin ilanları getirilemedi: ${error.message}`);

  return (data ?? [])
    .map((row: any) => row.listings)
    .filter(Boolean) as ListingCard[];
}

/** Kategori sayfası başlıkları ve sayaçları için. */
export async function getCategoriesWithCounts() {
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name, code, position')
    .eq('is_active', true)
    .order('position');

  if (error) throw new Error(`Kategoriler getirilemedi: ${error.message}`);
  return data ?? [];
}

/** Bir kategorinin cinsleri — sidebar ve cins sayfaları için. */
export async function getBreedsByCategory(categorySlug: string) {
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from('breeds')
    .select('id, slug, name, position, categories!inner ( slug )')
    .eq('categories.slug', categorySlug)
    .eq('is_active', true)
    .order('position');

  if (error) throw new Error(`Cinsler getirilemedi: ${error.message}`);
  return data ?? [];
}
