import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { ServiceDirectory } from '@/components/services/ServiceDirectory';
import { getCityBySlug, getDistrict } from '@/lib/queries/catalog';
import { getServiceConfigBySlug } from '@/lib/services-config';
import {
  parseServiceFilters,
  buildServiceBasePath,
  loadServicePage,
  type ServiceSearchParams,
} from '@/lib/queries/service-page';

// ÜRETİLMİŞ DOSYA — scripts/generate-service-pages.ts
// Yalnızca ikinci segment bir şehir olduğunda anlamlı; işletme detayının
// altında ilçe kırılımı yok.

const config = getServiceConfigBySlug('veteriner')!;

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
  if (!loaded) return { title: 'Sayfa Bulunamadı' };

  const { city, district } = loaded;
  return {
    title: `${district.name} ${config.label} — ${city.name}`,
    description: `${city.name} ${district.name} bölgesindeki ${config.label.toLocaleLowerCase('tr')}.`,
  };
}

// İşletme kayıtları nadiren değişiyor; beş dakikalık önbellek
// her istekte veritabanına gitmekten çok daha hızlı.
export const revalidate = 300;

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<ServiceSearchParams>;
}) {
  const loaded = await load(await params);
  if (!loaded) notFound();

  const { city, district } = loaded;
  const filters = parseServiceFilters(await searchParams);
  const data = await loadServicePage(config.type, filters, {
    cityId: city.id,
    districtId: district.id,
  });

  return (
    <ServiceDirectory
      config={config}
      title={`${district.name} ${config.label}`}
      intro={city.name}
      crumbs={[
        { label: config.label, href: `/${config.slug}` },
        { label: city.name, href: `/${config.slug}/${city.slug}` },
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
      basePath={buildServiceBasePath(`/${config.slug}/${city.slug}/${district.slug}`, filters)}
      emptyMessage={`${district.name} bölgesinde bu kriterlere uyan ${config.unit} bulunamadı.`}
    />
  );
}
