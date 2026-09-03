/**
 * Site geneli sabitler.
 *
 * Kanonik adres tek yerde: sitemap, robots.txt ve paylaşım etiketleri hep
 * aynı adresi üretmek zorunda. Farklı yerlerde farklı adres kullanmak arama
 * motorunda kopya içerik olarak sayılır.
 */

/**
 * Ortam değişkeni tanımlıysa o kullanılıyor; Vercel önizleme dağıtımlarında
 * otomatik gelen VERCEL_URL yedek. İkisi de yoksa üretim adresine düşüyoruz.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
  'https://www.petsemti.com'
).replace(/\/$/, '');

export const SITE_NAME = 'PetSemti';

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
