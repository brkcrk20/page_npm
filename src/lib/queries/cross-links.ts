import 'server-only';

import { unstable_cache } from 'next/cache';

import {
  createSupabasePublicClient,
  isSupabaseServerConfigured,
} from '@/lib/supabase/server';

/**
 * Cins × şehir çapraz bağlantıları.
 *
 * "izmir toy poodle" araması cins × şehir sayfasına düşüyor ama o sayfaya
 * siteden hiçbir bağlantı yoksa arama motoru onu ancak site haritasından
 * bulur ve zayıf sayar. Cins sayfası ilanı olan illeri, şehir sayfası ilanı
 * olan cinsleri listeliyor; ikisi de gerçekten sonuç veren bağlantılar.
 *
 * Boş kombinasyona bağlantı verilmiyor: kullanıcıyı boş listeye götürmek
 * hem işe yaramıyor hem de arama motoruna değersiz sayfa gösteriyor.
 */

export type CaprazBaglanti = { slug: string; name: string; count: number };

async function cinseGoreSehirlerHam(
  categoryId: number,
  breedId: number
): Promise<CaprazBaglanti[]> {
  if (!isSupabaseServerConfigured()) return [];
  const supabase = createSupabasePublicClient();

  const { data } = await supabase
    .from('listings')
    .select('cities!inner(slug, name)')
    .eq('status', 'yayinda')
    .eq('category_id', categoryId)
    .eq('breed_id', breedId)
    .limit(1000);

  return topla(data as unknown as { cities: { slug: string; name: string } }[] | null, 'cities');
}

async function sehreGoreCinslerHam(
  categoryId: number,
  cityId: number
): Promise<CaprazBaglanti[]> {
  if (!isSupabaseServerConfigured()) return [];
  const supabase = createSupabasePublicClient();

  const { data } = await supabase
    .from('listings')
    .select('breeds!inner(slug, name)')
    .eq('status', 'yayinda')
    .eq('category_id', categoryId)
    .eq('city_id', cityId)
    .limit(1000);

  return topla(data as unknown as { breeds: { slug: string; name: string } }[] | null, 'breeds');
}

function topla<T extends 'cities' | 'breeds'>(
  rows: Record<T, { slug: string; name: string }>[] | null,
  alan: T
): CaprazBaglanti[] {
  const sayac = new Map<string, CaprazBaglanti>();
  for (const row of rows ?? []) {
    const x = row[alan];
    if (!x) continue;
    const mevcut = sayac.get(x.slug);
    if (mevcut) mevcut.count++;
    else sayac.set(x.slug, { slug: x.slug, name: x.name, count: 1 });
  }
  return [...sayac.values()].sort((a, b) => b.count - a.count);
}

/**
 * 5 dakikalık önbellek: bu sorgular her liste sayfasında çalışıyor ve
 * sonuçları ilan eklendikçe değişiyor ama dakikalar ölçeğinde.
 */
export const cinseGoreSehirler = unstable_cache(cinseGoreSehirlerHam, ['cins-sehirler'], {
  revalidate: 300,
});
export const sehreGoreCinsler = unstable_cache(sehreGoreCinslerHam, ['sehir-cinsler'], {
  revalidate: 300,
});
