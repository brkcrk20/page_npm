import type { Metadata } from 'next';

import { VetDirectory } from '@/components/services/VetDirectory';
import {
  parseVetFilters,
  buildVetBasePath,
  loadVetPage,
  type VetSearchParams,
} from '@/lib/queries/vet-page';

/**
 * Veteriner rehberi — Türkiye geneli.
 *
 * Server component: filtreler URL'de tutulup sunucuda uygulandığı için
 * filtrelenmiş sayfalar da arama motoruna dolu içerik olarak gidiyor.
 */

export const metadata: Metadata = {
  title: 'Veteriner Klinikleri — Size En Yakın Veteriner Hekim | PetSemti',
  description:
    'Türkiye genelindeki veteriner klinikleri: 7/24 acil servis, röntgen, laboratuvar ve yatılı tedavi hizmeti verenler. Şehrinize göre filtreleyin, çalışma saatlerini görün.',
};

export const dynamic = 'force-dynamic';

export default async function VeterinerPage({
  searchParams,
}: {
  searchParams: Promise<VetSearchParams>;
}) {
  const params = await searchParams;
  const filters = parseVetFilters(params);
  const data = await loadVetPage(filters);

  return (
    <VetDirectory
      title="Veteriner Klinikleri"
      intro="Türkiye geneli"
      crumbs={[{ label: 'Veteriner' }]}
      providers={data.providers}
      total={data.total}
      page={data.page}
      pageCount={data.pageCount}
      featureGroups={data.featureGroups}
      activeFeatures={filters.featureSlugs}
      activeSearch={filters.search}
      verifiedOnly={filters.verifiedOnly}
      cities={data.cities}
      basePath={buildVetBasePath('/veteriner', filters)}
      emptyMessage="Bu kriterlere uyan veteriner kliniği bulunamadı."
    />
  );
}
