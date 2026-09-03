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
 * Güvercin silueti — inline SVG.
 *
 * Türkiye'ye özgü bölgesel taklacıların (Adana, Mardin, Antep, Konya...)
 * özgür lisanslı fotoğrafı hiçbir arşivde yok; Commons aramaları şehir
 * kolajı ve harita döndürüyor. Yanlış ırkın fotoğrafını koymak, hele bir
 * alım satım sitesinde, en kötü seçenek.
 *
 * Harf yedeği de bu kategoride işe yaramıyordu: on altı ırkın adı
 * "... Taklacısı" ile bittiği için baş harfler birbirine giriyordu ve
 * liste "eksik" görünüyordu. Siluet, eksik bir görselin yerini tutmak
 * yerine bilinçli bir simge gibi duruyor.
 */
function pigeonGlyph(color: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="32" fill="${color}"/>` +
    // Gövde, boyun ve baş tek bir yolda; kuyruk ve kanat ayrı katmanlarda.
    `<path d="M45 22c-2.6 0-4.7 1.5-5.9 3.6-1.4-.6-3-.9-4.6-.9-6.2 0-11.3 3.9-13.3 9.3l-6.7 2.4c-.9.3-1 1.6-.1 2l6.2 2.7c.6 5 4.6 8.9 9.7 8.9h4.4c.8 0 1.3-.9.9-1.6l-2.4-3.9c4.9-1.4 8.6-5.5 9.4-10.6l4.6-4.9c.5-.5.3-1.4-.4-1.6l-2.6-.8c.5-.8.8-1.8.8-2.8 0-.9-.4-1.8-1-2.4z" fill="#fff" fill-opacity=".92"/>` +
    // Göz
    `<circle cx="43.4" cy="27.4" r="1.3" fill="${color}"/>` +
    // Kanat
    `<path d="M30 32c3.4-.4 6.6.7 8.6 3.1-2.2 2.6-5.6 3.8-9 3.1-1.9-.4-3.3-1.7-3.8-3.3.9-1.5 2.4-2.6 4.2-2.9z" fill="${color}" fill-opacity=".28"/>` +
    `</svg>`
  );
}

/**
 * Görsel yokken kullanılan yedek — inline SVG data URI.
 *
 * Ağ isteği yok: 100+ cins için eksik dosya başına bir 404 isteği hem yavaş
 * hem de sunucu günlüklerini kirletirdi.
 */
export function breedFallbackImage(
  breedName: string,
  seed: string,
  categoryCode?: string
): string {
  const color = colorFor(seed);

  const svg =
    categoryCode === 'Pigeon'
      ? pigeonGlyph(color)
      : `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="${color}"/><text x="32" y="41" font-family="system-ui,sans-serif" font-size="24" font-weight="600" fill="#fff" text-anchor="middle">${initialsFor(breedName)}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
