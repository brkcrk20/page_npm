import 'server-only';

/**
 * Katalog sorguları: kategori, cins, şehir, ilçe.
 *
 * Bu veriler nadiren değişir ve tamamen herkese açıktır, bu yüzden sorgular
 * oturumsuz public istemciyle yapılıyor — çerez okunmadığı için Next.js
 * önbelleği devrede kalıyor.
 *
 * Veritabanına ulaşılamazsa koddaki statik yedeğe düşüyoruz (static-catalog.ts).
 * Sebep: kategori sorgusu null döndüğünde sayfa notFound() çağırıp 404
 * veriyordu, yani eksik bir ortam değişkeni tüm kategori ve cins sayfalarını
 * yok ediyordu. Sitenin iskeleti veritabanının ayakta olmasına bağlı olmamalı;
 * kesinti hâlinde yalnızca ilan listesi boş kalmalı.
 */

import {
  createSupabasePublicClient,
  isSupabaseServerConfigured,
  warnMissingConfig,
} from '@/lib/supabase/server';
import {
  staticCategories,
  staticBreeds,
  staticCities,
  staticDistrictsFor,
  findStaticCategory,
  findStaticBreed,
  findStaticCity,
  findStaticDistrict,
} from '@/lib/static-catalog';

export type Category = { id: number; slug: string; name: string; code: string };
export type Breed = { id: number; slug: string; name: string; category_id: number };
export type City = { id: number; slug: string; name: string };
export type District = { id: number; slug: string; name: string; city_id: number };

/**
 * Sorguyu çalıştırır, yapılandırma eksik ya da sorgu hatalıysa yedeğe düşer.
 * Hata yutulmuyor, konsola yazılıyor — sessiz bozulma en kötü senaryo.
 */
async function withFallback<T>(
  label: string,
  run: () => Promise<{ data: T | null; error: { message: string } | null }>,
  fallback: () => T
): Promise<T> {
  if (!isSupabaseServerConfigured()) {
    warnMissingConfig(label);
    return fallback();
  }

  try {
    const { data, error } = await run();
    if (error) {
      console.error(`[katalog] ${label} başarısız, statik yedeğe düşülüyor: ${error.message}`);
      return fallback();
    }
    return data ?? fallback();
  } catch (error: any) {
    console.error(`[katalog] ${label} hata verdi, statik yedeğe düşülüyor: ${error?.message}`);
    return fallback();
  }
}

export async function getCategories(): Promise<Category[]> {
  const data = await withFallback<Category[]>(
    'getCategories',
    async () =>
      createSupabasePublicClient()
        .from('categories')
        .select('id, slug, name, code')
        .eq('is_active', true)
        .order('position'),
    () => staticCategories
  );
  return data.length > 0 ? data : staticCategories;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  return withFallback<Category | null>(
    'getCategoryBySlug',
    async () =>
      createSupabasePublicClient()
        .from('categories')
        .select('id, slug, name, code')
        .eq('slug', slug)
        .maybeSingle(),
    () => findStaticCategory(slug)
  );
}

export async function getBreedsByCategoryId(categoryId: number): Promise<Breed[]> {
  const data = await withFallback<Breed[]>(
    'getBreedsByCategoryId',
    async () =>
      createSupabasePublicClient()
        .from('breeds')
        .select('id, slug, name, category_id')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('position'),
    () => staticBreeds.filter((b) => b.category_id === categoryId)
  );
  return data.length > 0 ? data : staticBreeds.filter((b) => b.category_id === categoryId);
}

export async function getBreed(categoryId: number, breedSlug: string): Promise<Breed | null> {
  return withFallback<Breed | null>(
    'getBreed',
    async () =>
      createSupabasePublicClient()
        .from('breeds')
        .select('id, slug, name, category_id')
        .eq('category_id', categoryId)
        .eq('slug', breedSlug)
        .maybeSingle(),
    () => findStaticBreed(categoryId, breedSlug)
  );
}

export async function getCityBySlug(slug: string): Promise<City | null> {
  return withFallback<City | null>(
    'getCityBySlug',
    async () =>
      createSupabasePublicClient()
        .from('cities')
        .select('id, slug, name')
        .eq('slug', slug)
        .maybeSingle(),
    () => findStaticCity(slug)
  );
}

export async function getDistrict(cityId: number, districtSlug: string): Promise<District | null> {
  return withFallback<District | null>(
    'getDistrict',
    async () =>
      createSupabasePublicClient()
        .from('districts')
        .select('id, slug, name, city_id')
        .eq('city_id', cityId)
        .eq('slug', districtSlug)
        .maybeSingle(),
    () => findStaticDistrict(cityId, districtSlug)
  );
}

export async function getCities(): Promise<City[]> {
  const data = await withFallback<City[]>(
    'getCities',
    async () => createSupabasePublicClient().from('cities').select('id, slug, name').order('name'),
    () => staticCities
  );
  return data.length > 0 ? data : staticCities;
}

export async function getDistrictsByCitySlug(citySlug: string): Promise<District[]> {
  const city = await getCityBySlug(citySlug);
  if (!city) return [];

  const data = await withFallback<District[]>(
    'getDistrictsByCitySlug',
    async () =>
      createSupabasePublicClient()
        .from('districts')
        .select('id, slug, name, city_id')
        .eq('city_id', city.id)
        .order('name'),
    () => staticDistrictsFor(citySlug)
  );
  return data.length > 0 ? data : staticDistrictsFor(citySlug);
}

/**
 * /<kategori>/<segment> içindeki ikinci segmenti çözer.
 *
 * Sitedeki en kritik ayrım burası: aynı konumda hem cins ("akbas") hem şehir
 * ("ankara") gelebiliyor. Eski yapıda kategori başına ayrı [sehir] route'u
 * olduğu için her ikinci segment şehir sanılıyor ve cins sayfaları
 * "X şehrinde ilan bulunamadı" diyordu.
 *
 * Önce cinse bakıyoruz: cins listesi kategoriye özgü ve daha dar bir küme.
 * Şehir/cins slug çakışması veritabanı trigger'ıyla zaten engelleniyor
 * (bkz. 0002_reference.sql), yani sıra bir belirsizlik yaratmıyor.
 */
export async function resolveCategorySegment(
  category: Category,
  segment: string
): Promise<
  | { kind: 'breed'; breed: Breed }
  | { kind: 'city'; city: City }
  | { kind: 'unknown' }
> {
  const [breed, city] = await Promise.all([
    getBreed(category.id, segment),
    getCityBySlug(segment),
  ]);

  if (breed) return { kind: 'breed', breed };
  if (city) return { kind: 'city', city };
  return { kind: 'unknown' };
}
