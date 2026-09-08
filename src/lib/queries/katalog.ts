import 'server-only';

import {
  createSupabasePublicClient,
  isSupabaseServerConfigured,
} from '@/lib/supabase/server';

/**
 * İşletme kataloğu sorguları.
 *
 * Katalog iki şey birden: petshopta stoklu ÜRÜN, diğer bölümlerde fiyatlı
 * HİZMET. Ayrımın gerekçesi 0066 numaralı göçün başında yazıyor.
 */

export type { KatalogSatiri } from '@/lib/katalog';
export { URUN_GRUPLARI, urunGrubuAdi } from '@/lib/katalog';

import type { KatalogSatiri } from '@/lib/katalog';

const SUTUNLAR =
  'id, provider_id, kind, name, brand, description, category, price, currency, unit, stock, photo_path, position, is_active';

/** Bir işletmenin yayındaki katalog satırları. */
export async function getKatalog(providerId: number): Promise<KatalogSatiri[]> {
  if (!isSupabaseServerConfigured()) return [];
  const supabase = createSupabasePublicClient();

  const { data, error } = await supabase
    .from('service_items')
    .select(SUTUNLAR)
    .eq('provider_id', providerId)
    .eq('is_active', true)
    .order('position', { ascending: true })
    .order('id', { ascending: true });

  if (error) {
    console.error('Katalog alınamadı:', error.message);
    return [];
  }
  return (data ?? []) as KatalogSatiri[];
}

/**
 * Arama metnine uyan katalog satırlarını taşıyan işletmelerin numaraları.
 *
 * Rehberdeki arama kutusu eskiden yalnızca işletme adına ve adresine
 * bakıyordu; "royal canin" yazan kişi hiçbir şey bulamıyordu. Artık aynı
 * kutu kataloğu da tarıyor ve mamayı satan mağazayı getiriyor.
 *
 * ilike kullanılıyor, tam metin araması değil: marka adları ("Royal Canin",
 * "N&D") Türkçe sözlükten geçince köklerine ayrılıp bozuluyor. Sütunda
 * trigram indeksi var (bkz. 0066), ilike bu indeksten yararlanıyor.
 */
export async function katalogdaAra(
  aranan: string,
  kapsam: { cityId?: number; districtId?: number } = {}
): Promise<number[]> {
  const terim = aranan.trim();
  if (!isSupabaseServerConfigured() || terim.length < 2) return [];
  const supabase = createSupabasePublicClient();

  // %, _ ve \ ilike'ta joker; kullanıcı metninde kaçırılmazsa "%" araması
  // bütün kataloğu getirir.
  const kalip = `%${terim.replace(/[\\%_]/g, (k) => `\\${k}`)}%`;

  let sorgu = supabase
    .from('service_items')
    .select('provider_id, service_providers!inner ( city_id, district_id, status )')
    .eq('is_active', true)
    .eq('service_providers.status', 'yayinda')
    .or(`name.ilike.${kalip},brand.ilike.${kalip}`)
    .limit(500);

  if (kapsam.cityId !== undefined) {
    sorgu = sorgu.eq('service_providers.city_id', kapsam.cityId);
  }
  if (kapsam.districtId !== undefined) {
    sorgu = sorgu.eq('service_providers.district_id', kapsam.districtId);
  }

  const { data, error } = await sorgu;
  if (error) {
    console.error('Katalog araması başarısız:', error.message);
    return [];
  }

  return [...new Set((data ?? []).map((r: any) => r.provider_id as number))];
}

/**
 * Verilen işletmelerin arama metnine uyan satırları.
 *
 * Liste sayfasında kartın altında "bu mağazada eşleşen ürünler" göstermek
 * için. Kullanıcı "royal canin" arayıp beş mağaza görünce hangisinde hangi
 * paketin olduğunu da görmeli; yoksa tek tek girmek zorunda kalıyor.
 */
export async function eslesenKatalogSatirlari(
  providerIds: number[],
  aranan: string
): Promise<Map<number, KatalogSatiri[]>> {
  const terim = aranan.trim();
  const bos = new Map<number, KatalogSatiri[]>();
  if (!isSupabaseServerConfigured() || terim.length < 2 || providerIds.length === 0) return bos;

  const supabase = createSupabasePublicClient();
  const kalip = `%${terim.replace(/[\\%_]/g, (k) => `\\${k}`)}%`;

  const { data, error } = await supabase
    .from('service_items')
    .select(SUTUNLAR)
    .in('provider_id', providerIds)
    .eq('is_active', true)
    .or(`name.ilike.${kalip},brand.ilike.${kalip}`)
    .order('position', { ascending: true })
    .limit(200);

  if (error) {
    console.error('Eşleşen katalog satırları alınamadı:', error.message);
    return bos;
  }

  const harita = new Map<number, KatalogSatiri[]>();
  for (const satir of (data ?? []) as KatalogSatiri[]) {
    const liste = harita.get(satir.provider_id) ?? [];
    // Kartta en fazla üç satır gösteriliyor; fazlası kartı listeye çeviriyor.
    if (liste.length < 3) liste.push(satir);
    harita.set(satir.provider_id, liste);
  }
  return harita;
}
