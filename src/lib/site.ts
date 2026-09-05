/**
 * Site geneli sabitler.
 *
 * Kanonik adres tek yerde: sitemap, robots.txt ve paylaşım etiketleri hep
 * aynı adresi üretmek zorunda. Farklı yerlerde farklı adres kullanmak arama
 * motorunda kopya içerik olarak sayılır.
 */

/** Yayındaki alan adı. Kanonik adres, site haritası ve robots.txt buradan. */
const URETIM_ADRESI = 'https://www.petsemti.com';

/**
 * VERCEL_URL ÜRETİMDE KULLANILMIYOR.
 *
 * Eskiden sıralama "ortam değişkeni → VERCEL_URL → üretim adresi" idi.
 * Vercel'de NEXT_PUBLIC_SITE_URL tanımlı olmadığı için VERCEL_URL devreye
 * giriyordu; o değişken her zaman dağıtıma özel adresi veriyor
 * (petsemti-xxxx.vercel.app), asıl alan adını değil. Sonuç: robots.txt ve
 * site haritası arama motoruna yanlış alan adını gösteriyordu —
 * kanonikleştirmeyi bozan, sessiz ve pahalı bir hata.
 *
 * VERCEL_URL artık yalnızca ÖNİZLEME dağıtımlarında kullanılıyor; üretimde
 * her zaman gerçek alan adı.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : '') ||
  URETIM_ADRESI
).replace(/\/$/, '');

export const SITE_NAME = 'PetSemti';

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
