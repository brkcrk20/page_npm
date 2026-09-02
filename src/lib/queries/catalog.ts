import 'server-only';

/**
 * Katalog sorguları: kategori, cins, şehir, ilçe.
 *
 * Bu veriler nadiren değişir ve tamamen herkese açıktır, bu yüzden sorgular
 * oturumsuz public istemciyle yapılıyor — çerez okunmadığı için Next.js
 * önbelleği devrede kalıyor.
 */

import {
  createSupabasePublicClient,
  isSupabaseServerConfigured,
  warnMissingConfig,
} from '@/lib/supabase/server';

export type Category = {
  id: number;
  slug: string;
  name: string;
  code: string;
};

export type Breed = {
  id: number;
  slug: string;
  name: string;
  category_id: number;
};

export type City = { id: number; slug: string; name: string };
export type District = { id: number; slug: string; name: string; city_id: number };

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseServerConfigured()) { warnMissingConfig('getCategories'); return []; }
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name, code')
    .eq('is_active', true)
    .order('position');

  if (error) throw new Error(`Kategoriler getirilemedi: ${error.message}`);
  return data ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!isSupabaseServerConfigured()) { warnMissingConfig('getCategoryBySlug'); return null; }
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('categories')
    .select('id, slug, name, code')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(`Kategori getirilemedi: ${error.message}`);
  return data;
}

export async function getBreedsByCategoryId(categoryId: number): Promise<Breed[]> {
  if (!isSupabaseServerConfigured()) return [];
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('breeds')
    .select('id, slug, name, category_id')
    .eq('category_id', categoryId)
    .eq('is_active', true)
    .order('position');

  if (error) throw new Error(`Cinsler getirilemedi: ${error.message}`);
  return data ?? [];
}

export async function getBreed(categoryId: number, breedSlug: string): Promise<Breed | null> {
  if (!isSupabaseServerConfigured()) return null;
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('breeds')
    .select('id, slug, name, category_id')
    .eq('category_id', categoryId)
    .eq('slug', breedSlug)
    .maybeSingle();

  if (error) throw new Error(`Cins getirilemedi: ${error.message}`);
  return data;
}

export async function getCityBySlug(slug: string): Promise<City | null> {
  if (!isSupabaseServerConfigured()) return null;
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('cities')
    .select('id, slug, name')
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(`Şehir getirilemedi: ${error.message}`);
  return data;
}

export async function getDistrict(cityId: number, districtSlug: string): Promise<District | null> {
  if (!isSupabaseServerConfigured()) return null;
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase
    .from('districts')
    .select('id, slug, name, city_id')
    .eq('city_id', cityId)
    .eq('slug', districtSlug)
    .maybeSingle();

  if (error) throw new Error(`İlçe getirilemedi: ${error.message}`);
  return data;
}

export async function getCities(): Promise<City[]> {
  if (!isSupabaseServerConfigured()) return [];
  const supabase = createSupabasePublicClient();
  const { data, error } = await supabase.from('cities').select('id, slug, name').order('name');
  if (error) throw new Error(`Şehirler getirilemedi: ${error.message}`);
  return data ?? [];
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
