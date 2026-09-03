import 'server-only';

import { unstable_cache } from 'next/cache';

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

export type Category = {
  id: number;
  slug: string;
  name: string;
  code: string;
  seo_title?: string | null;
  seo_description?: string | null;
};
export type Breed = {
  id: number;
  slug: string;
  name: string;
  category_id: number;
  /** Alt tür grubu; güvercinde ırk grubu, malzemede eşya grubu. */
  group_name?: string | null;
};
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
        .select('id, slug, name, code, seo_title, seo_description')
        .eq('is_active', true)
        .order('position'),
    () => staticCategories
  );
  return data.length > 0 ? data : staticCategories;
}

/**
 * Kategori çözümlemesi her sayfa yüklemesinde yapılıyor ve sonucu neredeyse
 * hiç değişmiyor (altı kategori, slug'ları sabit). Singapur'daki veritabanına
 * bunun için gitmenin anlamı yok.
 */
export const getCategoryBySlug = unstable_cache(
  async (slug: string): Promise<Category | null> => fetchCategoryBySlug(slug),
  ['category-by-slug'],
  { revalidate: 300, tags: ['catalog'] }
);

async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  return withFallback<Category | null>(
    'getCategoryBySlug',
    async () =>
      createSupabasePublicClient()
        .from('categories')
        .select('id, slug, name, code, seo_title, seo_description')
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
        .select('id, slug, name, category_id, group_name')
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
        .select('id, slug, name, category_id, group_name')
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

// ---------------------------------------------------------------------------
// Sol menü verisi
// ---------------------------------------------------------------------------

/**
 * Güvercin ayrı bir dikey olarak kurgulandı: kendi giriş sayfası, kendi ırk
 * menüsü (59 ırk, beş grup) ve kendi terminolojisi var. Genel listelerde
 * ("tüm ilanlar", "sahiplendirme", "satılık") kedi ve köpeklerin arasında
 * görünmesi iki tarafa da yaramıyor.
 *
 * Kategori kimliği sabit değil, koda göre bulunuyor: kimlik veritabanına
 * bağlı ve gömmek kırılgan olurdu.
 */
export function withoutPigeons<T extends { code: string }>(categories: T[]): T[] {
  return categories.filter((c) => c.code !== 'Pigeon');
}

/**
 * Genel hayvan listelerinde görünmemesi gereken kategoriler.
 *
 * Güvercin kendi dikeyinde; pet malzemeleri ise hayvan bile değil — kafes ve
 * akvaryum, sahiplendirme listesinde kedi köpeğin arasında görünmemeli.
 */
const NON_ANIMAL_CODES = ['Pigeon', 'Supply'];

export function animalCategories<T extends { code: string }>(categories: T[]): T[] {
  return categories.filter((c) => !NON_ANIMAL_CODES.includes(c.code));
}

export function categoryIdsByCode(
  categories: { id: number; code: string }[],
  codes: string[]
): number[] {
  return categories.filter((c) => codes.includes(c.code)).map((c) => c.id);
}

export function nonAnimalCategoryIds(categories: { id: number; code: string }[]): number[] {
  return categoryIdsByCode(categories, NON_ANIMAL_CODES);
}

export function supplyCategoryId(categories: { id: number; code: string }[]): number | null {
  return categories.find((c) => c.code === 'Supply')?.id ?? null;
}

export function pigeonCategoryId(categories: { id: number; code: string }[]): number | null {
  return categories.find((c) => c.code === 'Pigeon')?.id ?? null;
}

export type SidebarData = {
  categories: {
    id: number;
    slug: string;
    name: string;
    code: string;
    count: number;
    breeds: { id: number; slug: string; name: string; count: number; group: string | null }[];
  }[];
  cities: { id: number; slug: string; name: string; count: number }[];
};

/**
 * Sol menünün ihtiyaç duyduğu her şeyi tek seferde toplar.
 *
 * Sayımlar 0009'daki view'lardan geliyor. Cins başına ayrı sorgu atmak 100+
 * istek demekti; PostgREST GROUP BY desteklemediği için sayım veritabanı
 * tarafında view'a taşındı.
 *
 * Veritabanı erişilemezse statik katalogla sayımsız (0) olarak dönülüyor —
 * menünün tamamen kaybolmasındansa sayaçların sıfır görünmesi yeğdir.
 */
/**
 * Sol menü sıralaması: ilanı olanlar önce, sonra alfabetik.
 *
 * İlanı olan cinsler ilan sayısına göre azalan sırada en üstte; ilanı
 * olmayanların tamamı altta Türkçe alfabetik sırada. Amaç, ziyaretçinin
 * gerçekten içerik bulacağı cinsleri önce görmesi ama listenin geri kalanının
 * yine de taranabilir kalması — saf alfabetik sıra popüler cinsleri listenin
 * ortasına gömüyor, saf sayı sırası ise 0 ilanlı 90 cinsi rastgele diziyordu.
 *
 * localeCompare 'tr' ile: Türkçe'de ç/ğ/ı/ö/ş/ü harflerinin alfabedeki yeri
 * varsayılan sıralamadan farklı.
 */
function byCountThenName<T extends { name: string; count: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.count !== b.count && (a.count > 0 || b.count > 0)) return b.count - a.count;
    return a.name.localeCompare(b.name, 'tr');
  });
}

/**
 * Menü verisinin ÖNBELLEKLİ hâli.
 *
 * Bu veri her sayfa yüklemesinde çekiliyor ve beş sorgu artı iki gidiş
 * dönüş demek. Veritabanı ap-southeast-1'de (Singapur), uygulama ise
 * kullanıcıya yakın bir bölgede çalışıyor; her sorgu yarım saniyeye
 * yaklaşabiliyor. Ölçüm: ana sayfa 7 saniyede açılıyordu.
 *
 * İçerik nadiren değişiyor — kategori, şehir ve ırk listesi neredeyse hiç,
 * ilan sayıları ise iki dakikalık gecikmeyle gösterilmesinde sakınca
 * olmayacak kadar yavaş. Bu yüzden 120 saniyelik önbellek.
 *
 * Oturum okunmuyor (public istemci, çerez yok), bu yüzden önbellek herkes
 * için aynı ve güvenli.
 */
export const getSidebarData = unstable_cache(
  async (): Promise<SidebarData> => fetchSidebarData(),
  ['sidebar-data'],
  { revalidate: 120, tags: ['catalog'] }
);

async function fetchSidebarData(): Promise<SidebarData> {
  const [categories, cities] = await Promise.all([getCategories(), getCities()]);

  const emptyCounts = (): SidebarData => ({
    categories: categories.map((category) => ({
      ...category,
      count: 0,
      breeds: byCountThenName(
        staticBreeds
          .filter((b) => b.category_id === category.id)
          .map((b) => ({ id: b.id, slug: b.slug, name: b.name, count: 0, group: null }))
      ),
    })),
    cities: byCountThenName(cities.map((c) => ({ ...c, count: 0 }))),
  });

  if (!isSupabaseServerConfigured()) {
    warnMissingConfig('getSidebarData');
    return emptyCounts();
  }

  try {
    const supabase = createSupabasePublicClient();
    const [breedCounts, categoryCounts, cityCounts] = await Promise.all([
      supabase
        .from('breed_listing_counts')
        .select('breed_id, category_id, breed_slug, breed_name, group_name, position, listing_count')
        .order('position'),
      supabase.from('category_listing_counts').select('category_id, listing_count'),
      supabase.from('city_listing_counts').select('city_id, listing_count'),
    ]);

    if (breedCounts.error || !breedCounts.data?.length) {
      if (breedCounts.error) {
        console.error('[katalog] getSidebarData sayımları alınamadı:', breedCounts.error.message);
      }
      return emptyCounts();
    }

    const categoryCountById = new Map(
      (categoryCounts.data ?? []).map((r: any) => [r.category_id, Number(r.listing_count)])
    );
    const cityCountById = new Map(
      (cityCounts.data ?? []).map((r: any) => [r.city_id, Number(r.listing_count)])
    );

    return {
      categories: categories.map((category) => ({
        ...category,
        count: categoryCountById.get(category.id) ?? 0,
        breeds: byCountThenName(
          (breedCounts.data as any[])
            .filter((b) => b.category_id === category.id)
            .map((b) => ({
              id: b.breed_id,
              slug: b.breed_slug,
              name: b.breed_name,
              count: Number(b.listing_count),
              group: (b.group_name as string | null) ?? null,
            }))
        ),
      })),
      cities: byCountThenName(
        cities.map((c) => ({ ...c, count: cityCountById.get(c.id) ?? 0 }))
      ),
    };
  } catch (error: any) {
    console.error('[katalog] getSidebarData hata verdi:', error?.message);
    return emptyCounts();
  }
}
