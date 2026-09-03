import { slugify } from './routing';

/**
 * Cins küçük görselleri.
 *
 * Dosyalar public/cins-gorselleri/<kategori>/<uzun-seo-adi>.webp altında durur.
 *
 * Dosya adı bilerek uzun ve açıklayıcı: görsel arama sonuçlarında dosya adı
 * sıralama sinyallerinden biri ve bu sayfalarda görsel arama ciddi bir trafik
 * kaynağı. Ad kullanıcıya hiçbir yerde gösterilmiyor, o yüzden uzunluğun bir
 * maliyeti yok.
 *
 * Görsel yoksa harf tabanlı bir yedek üretiliyor (aşağıda). Böylece menü
 * fotoğraflar hazır olmadan da düzgün görünüyor ve eksik dosya kırık resim
 * simgesine dönüşmüyor.
 */

/** Örn: "toy-poodle-kopek-cinsi-yavru-satilik-sahiplendirme-ilanlari.webp" */
export function breedImageFilename(breedName: string, categoryCode: string): string {
  const base = slugify(breedName);

  const suffix =
    categoryCode === 'Dog'
      ? 'kopek-cinsi-yavru-satilik-sahiplendirme-ilanlari'
      : categoryCode === 'Cat'
        ? 'kedi-cinsi-yavru-satilik-sahiplendirme-ilanlari'
        : categoryCode === 'Bird'
          ? 'kus-turu-satilik-sahiplendirme-ilanlari'
          : categoryCode === 'Aquarium'
            ? 'akvaryum-baligi-turu-satilik-ilanlari'
            : categoryCode === 'Pigeon'
              ? 'guvercin-irki-taklaci-posta-sus-guvercini-satilik-ilanlari'
              : 'evcil-hayvan-turu-satilik-sahiplendirme-ilanlari';

  return `${base}-${suffix}.webp`;
}

export function breedImagePath(breedName: string, categorySlug: string, categoryCode: string): string {
  return `/cins-gorselleri/${categorySlug}/${breedImageFilename(breedName, categoryCode)}`;
}

/**
 * Görsel alt metni. Dosya adından çok daha önemli bir SEO sinyali ve ekran
 * okuyucular için de gerçek içerik taşıması gerekiyor.
 */
export function breedImageAlt(breedName: string, categoryName: string): string {
  return `${breedName} — ${categoryName.replace(/ İlanları$/, '')} cinsi yavru ve yetişkin ilanları`;
}

// ---------------------------------------------------------------------------
// Görsel yokken kullanılan yedek
// ---------------------------------------------------------------------------

// Turuncu ana renkle uyumlu, birbirinden ayırt edilebilir sıcak tonlar.
const FALLBACK_COLORS = [
  '#f97316', '#ea580c', '#f59e0b', '#d97706',
  '#84cc16', '#10b981', '#0ea5e9', '#6366f1',
  '#a855f7', '#ec4899', '#ef4444', '#14b8a6',
];

/** Slug'dan deterministik renk: aynı cins her zaman aynı rengi alır. */
function colorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

/**
 * "Toy Poodle" -> "TP", "Akbaş" -> "AK", "Adana Taklacısı" -> "AD"
 *
 * Baş harfleri almak, ikinci kelimesi ortak olan ırk ailelerinde çöküyordu:
 * on altı bölgesel taklacının hepsi "…T" oluyor, Kayseri ile Konya ikisi de
 * "KT" çıkıyordu. Ayırt edici bilgi İLK kelimede olduğu için, sonraki kelime
 * jenerik bir tür adıysa ilk kelimenin iki harfi kullanılıyor.
 */
const GENERIC_WORDS =
  /^(taklacisi|taklaci|guvercin|guvercini|kedisi|kedi|kopegi|kopek|kusu|kus|papagani|baligi|terrier|kurdu)$/i;

function initialsFor(name: string): string {
  const words = name.trim().replace(/[()\/]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toLocaleUpperCase('tr');

  const second = words[1]
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i');

  if (GENERIC_WORDS.test(second)) {
    return words[0].slice(0, 2).toLocaleUpperCase('tr');
  }
  return (words[0][0] + words[1][0]).toLocaleUpperCase('tr');
}

/**
 * Harf tabanlı yedek görsel — inline SVG data URI.
 *
 * Ağ isteği yok: 100+ cins için eksik dosya başına bir 404 isteği hem yavaş
 * hem de sunucu günlüklerini kirletirdi.
 */
export function breedFallbackImage(breedName: string, seed: string): string {
  const color = colorFor(seed);
  const initials = initialsFor(breedName);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="${color}"/><text x="32" y="41" font-family="system-ui,sans-serif" font-size="24" font-weight="600" fill="#fff" text-anchor="middle">${initials}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
