// src/lib/routing.ts
//
// Sitenin URL şemasının TEK doğruluk kaynağı.
//
//   /kopek-ilanlari                    kategori
//   /kopek-ilanlari/toy-poodle         cins
//   /kopek-ilanlari/istanbul           şehir
//   /kopek-ilanlari/istanbul/kadikoy   ilçe
//   /toy-poodle-yavrulari-3056         ilan detay  (slug + "-" + ilanNo)
//   /ilan-ver                          ilan verme
//
// İlan URL'i her zaman "-<sayı>" ile biter; kategori slug'ları asla rakamla
// bitmez. Bu sayede tek segmentlik kök route ikisini kesin olarak ayırabilir.
//
// Bu dosya bilerek React'ten bağımsızdır (ikon/JSX importu yok) — hem server
// component'lerden hem middleware'den hem de sitemap üretiminden çağrılabilsin.

import { citiesData } from './turkiye-data';

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------

// Türkçe karakterler NFD normalizasyonuyla güvenilir şekilde çözülmüyor:
// 'ı' hiç ayrışmıyor ve \w sınıfına da girmediği için sessizce siliniyor
// ("Kırıkkale" -> "krkkale"). Bu yüzden açık bir harf haritası kullanıyoruz.
const TR_CHAR_MAP: Record<string, string> = {
  ı: 'i', İ: 'i', I: 'i', i: 'i',
  ş: 's', Ş: 's',
  ğ: 'g', Ğ: 'g',
  ü: 'u', Ü: 'u',
  ö: 'o', Ö: 'o',
  ç: 'c', Ç: 'c',
  â: 'a', Â: 'a',
  î: 'i', Î: 'i',
  û: 'u', Û: 'u',
};

export function slugify(text: string): string {
  if (!text) return '';

  const mapped = Array.from(text)
    .map((ch) => TR_CHAR_MAP[ch] ?? ch)
    .join('');

  return mapped
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // kalan aksanları at
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // harf/rakam dışındaki her şey tire
    .replace(/^-+|-+$/g, '') // baştaki/sondaki tireleri kırp
    .replace(/-{2,}/g, '-');
}

// ---------------------------------------------------------------------------
// Kategoriler
// ---------------------------------------------------------------------------

export type CategoryType = 'Dog' | 'Cat' | 'Bird' | 'Aquarium' | 'Other';

export type CategoryDef = {
  /** URL'de görünen slug. */
  slug: string;
  /** Kod içinde kullanılan kanonik tip. */
  type: CategoryType;
  /** Kullanıcıya gösterilen başlık. */
  title: string;
  /** Firestore'daki `hayvanTuru` alanında geçen Türkçe değerler. */
  aliases: string[];
};

export const CATEGORY_DEFS: CategoryDef[] = [
  { slug: 'kopek-ilanlari', type: 'Dog', title: 'Köpek İlanları', aliases: ['köpek', 'kopek', 'dog'] },
  { slug: 'kedi-ilanlari', type: 'Cat', title: 'Kedi İlanları', aliases: ['kedi', 'cat'] },
  { slug: 'kus-ilanlari', type: 'Bird', title: 'Kuş İlanları', aliases: ['kuş', 'kus', 'bird'] },
  { slug: 'akvaryum-ilanlari', type: 'Aquarium', title: 'Akvaryum İlanları', aliases: ['akvaryum', 'balık', 'balik', 'aquarium'] },
  { slug: 'diger-ilanlar', type: 'Other', title: 'Diğer İlanlar', aliases: ['diğer', 'diger', 'other'] },
];

const categoryBySlug = new Map(CATEGORY_DEFS.map((c) => [c.slug, c]));

const categoryByAlias = new Map<string, CategoryDef>();
for (const def of CATEGORY_DEFS) {
  categoryByAlias.set(def.type.toLowerCase(), def);
  for (const alias of def.aliases) categoryByAlias.set(alias.toLowerCase(), def);
}

export function getCategoryBySlug(slug: string): CategoryDef | undefined {
  return categoryBySlug.get(slug);
}

/** Firestore'daki serbest biçimli tür değerini ("Köpek", "dog", "kopek") kategoriye çevirir. */
export function getCategoryByType(value: string | undefined | null): CategoryDef | undefined {
  if (!value) return undefined;
  return categoryByAlias.get(value.toLowerCase().trim());
}

// ---------------------------------------------------------------------------
// Şehir / ilçe
// ---------------------------------------------------------------------------

const cityBySlug = new Map<string, string>();
const districtsByCitySlug = new Map<string, Map<string, string>>();

for (const [city, districts] of Object.entries(citiesData)) {
  const citySlug = slugify(city);
  cityBySlug.set(citySlug, city);

  const districtMap = new Map<string, string>();
  for (const district of districts) {
    districtMap.set(slugify(district), district);
  }
  districtsByCitySlug.set(citySlug, districtMap);
}

/** Slug'dan gerçek şehir adını döner ("istanbul" -> "İstanbul"). */
export function getCityBySlug(slug: string): string | undefined {
  return cityBySlug.get(slug);
}

/** Şehir slug'ı + ilçe slug'ından gerçek ilçe adını döner. */
export function getDistrictBySlug(citySlug: string, districtSlug: string): string | undefined {
  return districtsByCitySlug.get(citySlug)?.get(districtSlug);
}

export function getCitySlug(city: string): string {
  return slugify(city);
}

/** Sitemap ve statik üretim için tüm şehir slug'ları. */
export function allCitySlugs(): string[] {
  return Array.from(cityBySlug.keys());
}

// ---------------------------------------------------------------------------
// URL üreticileri
// ---------------------------------------------------------------------------

export function categoryPath(categorySlug: string): string {
  return `/${categorySlug}`;
}

export function breedPath(categorySlug: string, breedSlug: string): string {
  return `/${categorySlug}/${breedSlug}`;
}

export function cityPath(categorySlug: string, city: string): string {
  return `/${categorySlug}/${slugify(city)}`;
}

export function districtPath(categorySlug: string, city: string, district: string): string {
  return `/${categorySlug}/${slugify(city)}/${slugify(district)}`;
}

type ListingLike = {
  baslik?: string;
  baslik_slug?: string;
  ilan_no?: number | string;
  id?: string;
};

/**
 * İlan detay yolu: /<baslik-slug>-<ilanNo>
 *
 * `ilan_no` yoksa link üretilemez (kanonik URL sayısal ID gerektirir); bu
 * durumda eski `baslik_slug` üzerinden legacy yola düşeriz.
 */
export function listingPath(listing: ListingLike): string {
  const base = listing.baslik_slug || slugify(listing.baslik || '') || 'ilan';
  const no = listing.ilan_no;

  if (no !== undefined && no !== null && `${no}`.length > 0 && /^\d+$/.test(`${no}`)) {
    return `/${base}-${no}`;
  }

  // ilan_no'su olmayan eski kayıtlar: slug'ın kendisi yol olur.
  return `/${base}`;
}

// ---------------------------------------------------------------------------
// URL çözümleyiciler
// ---------------------------------------------------------------------------

export type RootSegmentResolution =
  | { kind: 'category'; category: CategoryDef }
  | { kind: 'listing'; slug: string; ilanNo: number }
  | { kind: 'legacy-listing'; slug: string };

/**
 * Kökteki tek segmenti çözer. Next.js statik route'ları dinamik olanlardan
 * önce eşleştirdiği için /ilan-ver, /login, /profil gibi yollar buraya hiç
 * ulaşmaz.
 */
export function resolveRootSegment(segment: string): RootSegmentResolution | null {
  const category = getCategoryBySlug(segment);
  if (category) return { kind: 'category', category };

  const match = /^(.*)-(\d+)$/.exec(segment);
  if (match && match[1]) {
    return { kind: 'listing', slug: match[1], ilanNo: Number(match[2]) };
  }

  if (segment.length > 0) return { kind: 'legacy-listing', slug: segment };

  return null;
}

export type CategorySegmentResolution =
  | { kind: 'city'; city: string; citySlug: string }
  | { kind: 'breed'; breedSlug: string };

/**
 * /<kategori>/<segment> içindeki ikinci segmenti çözer.
 *
 * Şehir listesi kapalı bir küme olduğu için önce ona bakarız; eşleşmezse
 * segment bir cins slug'ıdır ve doğrulaması çağıran sayfaya bırakılır.
 * (Cins adları hep çok kelimeli olduğundan — "van-kedisi", "ankara-kedisi" —
 *  şehir slug'larıyla çakışmazlar; `assertNoSlugCollisions` bunu doğrular.)
 */
export function resolveCategorySegment(segment: string): CategorySegmentResolution {
  const city = getCityBySlug(segment);
  if (city) return { kind: 'city', city, citySlug: segment };
  return { kind: 'breed', breedSlug: segment };
}

/**
 * Cins slug'larıyla şehir slug'ları arasında çakışma olup olmadığını döner.
 * Testten/CI'dan çağrılmak üzere; çakışma olursa o cins sayfası erişilemez olur.
 */
export function findSlugCollisions(breedSlugs: string[]): string[] {
  return breedSlugs.filter((s) => cityBySlug.has(s));
}
