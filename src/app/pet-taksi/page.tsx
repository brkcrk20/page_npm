import type { Metadata } from 'next';

import { ServiceDirectory } from '@/components/services/ServiceDirectory';
import { getServiceConfigBySlug } from '@/lib/services-config';
import {
  parseServiceFilters,
  buildServiceBasePath,
  loadServicePage,
  type ServiceSearchParams,
} from '@/lib/queries/service-page';

// ÜRETİLMİŞ DOSYA — scripts/generate-service-pages.ts
// Yedi hizmet kategorisi aynı bileşenleri kullanıyor; sayfalar yalnızca
// yapılandırmayı bağlayan ince sarmalayıcılar.

const config = getServiceConfigBySlug('pet-taksi')!;

export const metadata: Metadata = {
  title: `${config.seoTitle} | PetSemti`,
  description: config.seoDescription,
};

export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<ServiceSearchParams>;
}) {
  const filters = parseServiceFilters(await searchParams);
  const data = await loadServicePage(config.type, filters);

  return (
    <ServiceDirectory
      config={config}
      title={config.label}
      intro="Türkiye geneli"
      crumbs={[{ label: config.label }]}
      providers={data.providers}
      total={data.total}
      page={data.page}
      pageCount={data.pageCount}
      featureGroups={data.featureGroups}
      activeFeatures={filters.featureSlugs}
      activeSearch={filters.search}
      verifiedOnly={filters.verifiedOnly}
      cities={data.cities}
      basePath={buildServiceBasePath(`/${config.slug}`, filters)}
      emptyMessage={`Bu kriterlere uyan ${config.unit} bulunamadı.`}
    />
  );
}
