/**
 * Katalog verisinin kod içindeki yedeği.
 *
 * Kategori, cins, il ve ilçe listeleri normalde Supabase'den geliyor. Ancak
 * bunlar aslında sabit veriler ve zaten kod tabanında mevcut (routing.ts,
 * breeds.ts, turkiye-data.ts) — seed dosyası da bunlardan üretiliyor.
 *
 * Veritabanına ulaşılamadığında (ortam değişkeni eksik, geçici kesinti)
 * sayfaların 404 vermesi yerine bu yedeğe düşüyoruz. Sitenin iskeleti —
 * hangi kategoriler var, hangi cinsler var, hangi iller var — veritabanının
 * ayakta olmasına bağlı olmamalı; yalnızca ilan listesi boş kalır.
 *
 * Kimlikler burada sentetik (sırayla üretilmiş). Sorun değil: veritabanı
 * yokken ilan sorguları zaten boş dönüyor, kimlikler sadece React anahtarı
 * ve bağlantı üretimi için kullanılıyor.
 */

import { CATEGORY_DEFS, slugify } from './routing';
import { categories as breedCategories } from './breeds';
import { citiesData } from './turkiye-data';

export type StaticCategory = { id: number; slug: string; name: string; code: string };
export type StaticBreed = { id: number; slug: string; name: string; category_id: number };
export type StaticCity = { id: number; slug: string; name: string };
export type StaticDistrict = { id: number; slug: string; name: string; city_id: number };

export const staticCategories: StaticCategory[] = CATEGORY_DEFS.map((def, index) => ({
  id: index + 1,
  slug: def.slug,
  name: def.title,
  code: def.type,
}));

const categoryIdBySlug = new Map(staticCategories.map((c) => [c.slug, c.id]));

export const staticBreeds: StaticBreed[] = (() => {
  const out: StaticBreed[] = [];
  let id = 1;
  for (const category of breedCategories) {
    const categoryId = categoryIdBySlug.get(category.slug);
    if (!categoryId) continue;
    for (const breed of category.breeds) {
      const slug = slugify(breed.name);
      if (!slug) continue;
      out.push({ id: id++, slug, name: breed.name, category_id: categoryId });
    }
  }
  return out;
})();

export const staticCities: StaticCity[] = Object.keys(citiesData)
  .map((name, index) => ({ id: index + 1, slug: slugify(name), name }))
  .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

const cityByslug = new Map(staticCities.map((c) => [c.slug, c]));

export function staticDistrictsFor(citySlug: string): StaticDistrict[] {
  const city = cityByslug.get(citySlug);
  if (!city) return [];

  const names = citiesData[city.name] ?? [];
  return names.map((name, index) => ({
    id: city.id * 1000 + index,
    slug: slugify(name),
    name,
    city_id: city.id,
  }));
}

export function findStaticCategory(slug: string) {
  return staticCategories.find((c) => c.slug === slug) ?? null;
}

export function findStaticBreed(categoryId: number, slug: string) {
  return staticBreeds.find((b) => b.category_id === categoryId && b.slug === slug) ?? null;
}

export function findStaticCity(slug: string) {
  return cityByslug.get(slug) ?? null;
}

export function findStaticDistrict(cityId: number, districtSlug: string) {
  const city = staticCities.find((c) => c.id === cityId);
  if (!city) return null;
  return staticDistrictsFor(city.slug).find((d) => d.slug === districtSlug) ?? null;
}
