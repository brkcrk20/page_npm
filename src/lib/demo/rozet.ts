import 'server-only';

import { cache } from 'react';

import { createSupabasePublicClient, isSupabaseServerConfigured } from '@/lib/supabase/server';

/**
 * Demo rozetinin görünürlüğü.
 *
 * Varsayılan AÇIK. Ayar okunamazsa da açık kabul ediliyor: işaretsiz bir
 * demo ilan, ziyaretçinin gerçek sanıp mesaj attığı ilan demek. Hata
 * durumunda güvenli taraf, rozeti göstermek.
 */
export const demoRozetiGorunur = cache(async (): Promise<boolean> => {
  if (!isSupabaseServerConfigured()) return true;

  try {
    const { data } = await createSupabasePublicClient()
      .from('app_settings')
      .select('value')
      .eq('key', 'demo')
      .maybeSingle();

    const deger = (data?.value ?? {}) as { badge_visible?: boolean };
    return deger.badge_visible !== false;
  } catch {
    return true;
  }
});

/**
 * Rozet kapalıysa is_demo alanı işaretsiz döndürülüyor.
 *
 * Kararı tek yerde vermek için: rozeti gösterip göstermeme ayarı sorgu
 * katmanında uygulanıyor, ekranlar yalnızca alana bakıyor. Aksi hâlde her
 * kart, her detay ve her liste ayrı ayrı ayarı okumak zorunda kalırdı.
 * Yönetim paneli veritabanını doğrudan sorguladığı için gerçek değeri
 * görmeye devam ediyor.
 */
export async function demoIsaretiniUygula<T extends { is_demo?: boolean | null }>(
  satirlar: T[]
): Promise<T[]> {
  if (await demoRozetiGorunur()) return satirlar;
  return satirlar.map((s) => (s.is_demo ? { ...s, is_demo: false } : s));
}

export async function demoIsaretiniUygulaTek<T extends { is_demo?: boolean | null }>(
  satir: T | null
): Promise<T | null> {
  if (!satir) return satir;
  const [sonuc] = await demoIsaretiniUygula([satir]);
  return sonuc;
}
