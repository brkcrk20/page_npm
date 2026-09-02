import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { CategoryBrowser } from '@/components/listings/CategoryBrowser';
import {
  getCategoryBySlug,
  getBreedsByCategoryId,
  getCities,
  resolveCategorySegment,
} from '@/lib/queries/catalog';
import { getListings } from '@/lib/queries/listings';

/**
 * /<kategori>/<segment>
 *
 * Segment ya bir CİNS ("akbas") ya da bir ŞEHİR ("ankara") olabilir. Eski
 * yapıda kategori başına ayrı bir [sehir] route'u vardı; Next.js statik
 * segmenti ("kopek-ilanlari") dinamik olana tercih ettiği için her ikinci
 * segment şehir sanılıyordu ve cins sayfaları "Akbas şehrinde ilan bulunamadı"
 * diyordu. Tek route + veritabanından çözümleme bu karışıklığı kökten
 * ortadan kaldırıyor.
 */

type Params = { slug: string; segment: string };

async function load(params: Params) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) return null;

  const resolved = await resolveCategorySegment(category, params.segment);
  if (resolved.kind === 'unknown') return null;

  return { category, resolved };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const loaded = await load(await params);
  if (!loaded) return { title: 'Sayfa Bulunamadı' };

  const { category, resolved } = loaded;

  if (resolved.kind === 'breed') {
    const name = resolved.breed.name;
    return {
      title: `${name} İlanları — Satılık ve Sahiplendirme | PetSemti`,
      description: `${name} cinsi için güncel satılık ve ücretsiz sahiplendirme ilanları. Türkiye'nin her ilinden ${name} ilanlarına PetSemti'den ulaşın.`,
    };
  }

  const cityName = resolved.city.name;
  return {
    title: `${cityName} ${category.name} — Satılık ve Sahiplendirme | PetSemti`,
    description: `${cityName} ilindeki güncel ${category.name.toLowerCase()}. Semtinizdeki ilanlara PetSemti'den ulaşın.`,
  };
}

export default async function CategorySegmentPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const resolvedParams = await params;
  const loaded = await load(resolvedParams);
  if (!loaded) notFound();

  const { category, resolved } = loaded;

  const [breeds, cities] = await Promise.all([
    getBreedsByCategoryId(category.id),
    getCities(),
  ]);

  if (resolved.kind === 'breed') {
    const { listings, total } = await getListings({
      categoryId: category.id,
      breedId: resolved.breed.id,
    });

    return (
      <CategoryBrowser
        title={`${resolved.breed.name} İlanları`}
        crumbs={[
          { label: category.name, href: `/${category.slug}` },
          { label: resolved.breed.name },
        ]}
        listings={listings}
        total={total}
        breeds={breeds}
        cities={cities}
        category={category}
        activeBreedSlug={resolved.breed.slug}
        emptyMessage={`Şu an yayında ${resolved.breed.name} ilanı yok.`}
      />
    );
  }

  const { listings, total } = await getListings({
    categoryId: category.id,
    cityId: resolved.city.id,
  });

  return (
    <CategoryBrowser
      title={`${resolved.city.name} ${category.name}`}
      crumbs={[
        { label: category.name, href: `/${category.slug}` },
        { label: resolved.city.name },
      ]}
      listings={listings}
      total={total}
      breeds={breeds}
      cities={cities}
      category={category}
      activeCitySlug={resolved.city.slug}
      emptyMessage={`${resolved.city.name} ilinde yayında ${category.name.toLowerCase()} yok.`}
    />
  );
}
