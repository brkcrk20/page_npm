import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { CategoryBrowser } from '@/components/listings/CategoryBrowser';
import {
  getCategoryBySlug,
  getSidebarData,
  getCityBySlug,
  getDistrict,
} from '@/lib/queries/catalog';
import { getListings } from '@/lib/queries/listings';

/**
 * /<kategori>/<sehir>/<ilce>
 *
 * Yalnızca ikinci segment bir ŞEHİR olduğunda anlamlı. Cins altında ilçe
 * kırılımı yok (/kopek-ilanlari/akbas/kadikoy gibi bir adres 404 döner),
 * çünkü böyle bir sayfa hem içerik olarak boş kalır hem de arama motorunda
 * sonsuz sayıda değersiz kombinasyon üretirdi.
 */

type Params = { slug: string; segment: string; district: string };

async function load(params: Params) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) return null;

  const city = await getCityBySlug(params.segment);
  if (!city) return null;

  const district = await getDistrict(city.id, params.district);
  if (!district) return null;

  return { category, city, district };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const loaded = await load(await params);
  if (!loaded) return { title: 'Sayfa Bulunamadı | PetSemti' };

  const { category, city, district } = loaded;
  return {
    title: `${district.name} ${city.name} ${category.name} | PetSemti`,
    description: `${city.name} ${district.name} bölgesindeki güncel ${category.name.toLowerCase()}.`,
  };
}

export default async function DistrictPage({ params }: { params: Promise<Params> }) {
  const loaded = await load(await params);
  if (!loaded) notFound();

  const { category, city, district } = loaded;

  const [{ listings, total }, sidebar] = await Promise.all([
    getListings({ categoryId: category.id, cityId: city.id, districtId: district.id }),
    getSidebarData(),
  ]);

  return (
    <CategoryBrowser
      title={`${district.name}, ${city.name} — ${category.name}`}
      crumbs={[
        { label: category.name, href: `/${category.slug}` },
        { label: city.name, href: `/${category.slug}/${city.slug}` },
        { label: district.name },
      ]}
      listings={listings}
      total={total}
      sidebar={sidebar}
      category={category}
      activeCitySlug={city.slug}
      emptyMessage={`${district.name} bölgesinde yayında ${category.name.toLowerCase()} yok.`}
    />
  );
}
