import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

import { VetDirectory } from '@/components/services/VetDirectory';
import { VetDetail } from '@/components/services/VetDetail';
import { getCityBySlug } from '@/lib/queries/catalog';
import {
  getServiceProviderById,
  getServiceReviews,
  getServiceProviders,
} from '@/lib/queries/services';
import {
  parseVetFilters,
  buildVetBasePath,
  loadVetPage,
  type VetSearchParams,
} from '@/lib/queries/vet-page';

/**
 * /veteriner/<segment>
 *
 * Segment ya bir ŞEHİR ("istanbul") ya da bir KLİNİK ("dost-veteriner-12").
 * Ayrım belirsiz değil: klinik adresi her zaman "-<sayı>" ile biter, şehir
 * slug'ları asla rakamla bitmez — sitenin geri kalanındaki ilan/kategori
 * ayrımıyla aynı kural.
 */

type Params = { segment: string };

/** "-<sayı>" ile bitiyorsa klinik detayı. */
function parseProviderSegment(segment: string): { slug: string; id: number } | null {
  const match = /^(.*)-(\d+)$/.exec(segment);
  if (!match || !match[1]) return null;
  return { slug: match[1], id: Number(match[2]) };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { segment } = await params;
  const provider = parseProviderSegment(segment);

  if (provider) {
    const data = await getServiceProviderById(provider.id, 'veteriner');
    if (data) {
      const location = [(data as any).cities?.name, (data as any).districts?.name]
        .filter(Boolean)
        .join(', ');
      return {
        title: `${data.name}${location ? ` — ${location}` : ''} | Veteriner | PetSemti`,
        description:
          data.description?.slice(0, 160) ??
          `${data.name} veteriner kliniği: adres, telefon, çalışma saatleri ve sunduğu hizmetler.`,
      };
    }
    return { title: 'Klinik Bulunamadı | PetSemti' };
  }

  const city = await getCityBySlug(segment);
  if (!city) return { title: 'Sayfa Bulunamadı | PetSemti' };

  return {
    title: `${city.name} Veteriner Klinikleri — Nöbetçi ve 7/24 Açık | PetSemti`,
    description: `${city.name} ilindeki veteriner klinikleri. Çalışma saatleri, acil servis ve sunulan hizmetlere göre filtreleyin.`,
  };
}

export const dynamic = 'force-dynamic';

export default async function VetSegmentPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<VetSearchParams>;
}) {
  const { segment } = await params;

  // --- Klinik detayı ---
  const parsed = parseProviderSegment(segment);
  if (parsed) {
    const provider = await getServiceProviderById(parsed.id, 'veteriner');
    if (!provider) notFound();

    // Ad değişmişse slug da değişir; eski adres kanonik adrese kalıcı
    // yönlendiriliyor ki arama motorunda tek sürüm kalsın.
    if (provider.slug !== parsed.slug) {
      permanentRedirect(`/veteriner/${provider.slug}-${provider.id}`);
    }

    const cityId = (provider as any).cities?.id as number | undefined;

    const [reviews, nearbyResult] = await Promise.all([
      getServiceReviews(provider.id),
      cityId
        ? getServiceProviders({ serviceType: 'veteriner', cityId, perPage: 6 })
        : Promise.resolve({ providers: [] }),
    ]);

    const nearby = (nearbyResult.providers ?? [])
      .filter((p) => p.id !== provider.id)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        districts: p.districts ? { name: p.districts.name } : null,
      }));

    return <VetDetail provider={provider as any} reviews={reviews} nearby={nearby} />;
  }

  // --- Şehir sayfası ---
  const city = await getCityBySlug(segment);
  if (!city) notFound();

  const filters = parseVetFilters(await searchParams);
  const data = await loadVetPage(filters, { cityId: city.id });

  return (
    <VetDirectory
      title={`${city.name} Veteriner Klinikleri`}
      crumbs={[{ label: 'Veteriner', href: '/veteriner' }, { label: city.name }]}
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
      basePath={buildVetBasePath(`/veteriner/${city.slug}`, filters)}
      emptyMessage={`${city.name} ilinde bu kriterlere uyan veteriner kliniği bulunamadı.`}
    />
  );
}
