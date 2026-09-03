import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { VetDirectory } from '@/components/services/VetDirectory';
import { getCityBySlug, getDistrict } from '@/lib/queries/catalog';
import {
  parseVetFilters,
  buildVetBasePath,
  loadVetPage,
  type VetSearchParams,
} from '@/lib/queries/vet-page';

/**
 * /veteriner/<sehir>/<ilce>
 *
 * Yalnızca ikinci segment bir şehir olduğunda anlamlı; klinik detayının
 * altında ilçe kırılımı yok.
 */

type Params = { segment: string; district: string };

async function load(params: Params) {
  const city = await getCityBySlug(params.segment);
  if (!city) return null;

  const district = await getDistrict(city.id, params.district);
  if (!district) return null;

  return { city, district };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const loaded = await load(await params);
  if (!loaded) return { title: 'Sayfa Bulunamadı | PetSemti' };

  const { city, district } = loaded;
  return {
    title: `${district.name} Veteriner Klinikleri — ${city.name} | PetSemti`,
    description: `${city.name} ${district.name} bölgesindeki veteriner klinikleri, çalışma saatleri ve acil servis bilgileri.`,
  };
}

export const dynamic = 'force-dynamic';

export default async function VetDistrictPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<VetSearchParams>;
}) {
  const loaded = await load(await params);
  if (!loaded) notFound();

  const { city, district } = loaded;
  const filters = parseVetFilters(await searchParams);
  const data = await loadVetPage(filters, { cityId: city.id, districtId: district.id });

  return (
    <VetDirectory
      title={`${district.name} Veteriner Klinikleri`}
      intro={city.name}
      crumbs={[
        { label: 'Veteriner', href: '/veteriner' },
        { label: city.name, href: `/veteriner/${city.slug}` },
        { label: district.name },
      ]}
      providers={data.providers}
      total={data.total}
      page={data.page}
      pageCount={data.pageCount}
      featureGroups={data.featureGroups}
      activeFeatures={filters.featureSlugs}
      activeSearch={filters.search}
      verifiedOnly={filters.verifiedOnly}
      cities={data.cities}
      activeCitySlug={city.slug}
      basePath={buildVetBasePath(`/veteriner/${city.slug}/${district.slug}`, filters)}
      emptyMessage={`${district.name} bölgesinde bu kriterlere uyan veteriner kliniği bulunamadı.`}
    />
  );
}
