import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

import { ServiceDirectory } from '@/components/services/ServiceDirectory';
import { ServiceDetail } from '@/components/services/ServiceDetail';
import { getCityBySlug } from '@/lib/queries/catalog';
import {
  getServiceProviderById,
  getServiceReviews,
  getServiceProviders,
} from '@/lib/queries/services';
import { getServiceConfigBySlug } from '@/lib/services-config';
import {
  parseServiceFilters,
  buildServiceBasePath,
  loadServicePage,
  type ServiceSearchParams,
} from '@/lib/queries/service-page';

// ÜRETİLMİŞ DOSYA — scripts/generate-service-pages.ts
//
// Segment ya bir ŞEHİR ("istanbul") ya da bir İŞLETME ("dost-klinik-12").
// Ayrım belirsiz değil: işletme adresi her zaman "-<sayı>" ile biter, şehir
// slug'ları asla rakamla bitmez — ilan/kategori ayrımıyla aynı kural.

const config = getServiceConfigBySlug('petshop')!;

type Params = { segment: string };

function parseProviderSegment(segment: string) {
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
  const parsed = parseProviderSegment(segment);

  if (parsed) {
    const data = await getServiceProviderById(parsed.id, config.type);
    if (data) {
      const location = [(data as any).cities?.name, (data as any).districts?.name]
        .filter(Boolean)
        .join(', ');
      return {
        title: `${data.name}${location ? ` — ${location}` : ''} | ${config.label}`,
        description:
          data.description?.slice(0, 160) ??
          `${data.name}: adres, telefon, çalışma saatleri ve sunulan hizmetler.`,
      };
    }
    return { title: 'Sayfa Bulunamadı' };
  }

  const city = await getCityBySlug(segment);
  if (!city) return { title: 'Sayfa Bulunamadı' };

  return {
    title: `${city.name} ${config.label}`,
    description: `${city.name} ilindeki ${config.label.toLocaleLowerCase('tr')}. Çalışma saatleri ve sunulan hizmetlere göre filtreleyin.`,
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
  const { segment } = await params;

  const parsed = parseProviderSegment(segment);
  if (parsed) {
    const provider = await getServiceProviderById(parsed.id, config.type);
    if (!provider) notFound();

    // Ad değişmişse slug da değişir; eski adres kanonik adrese kalıcı
    // yönlendiriliyor ki arama motorunda tek sürüm kalsın.
    if (provider.slug !== parsed.slug) {
      permanentRedirect(`/${config.slug}/${provider.slug}-${provider.id}`);
    }

    const cityId = (provider as any).cities?.id as number | undefined;

    const [reviews, nearbyResult] = await Promise.all([
      getServiceReviews(provider.id),
      cityId
        ? getServiceProviders({ serviceType: config.type, cityId, perPage: 6 })
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

    return (
      <ServiceDetail config={config} provider={provider as any} reviews={reviews} nearby={nearby} />
    );
  }

  const city = await getCityBySlug(segment);
  if (!city) notFound();

  const filters = parseServiceFilters(await searchParams);
  const data = await loadServicePage(config.type, filters, { cityId: city.id });

  return (
    <ServiceDirectory
      config={config}
      title={`${city.name} ${config.label}`}
      crumbs={[{ label: config.label, href: `/${config.slug}` }, { label: city.name }]}
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
      basePath={buildServiceBasePath(`/${config.slug}/${city.slug}`, filters)}
      emptyMessage={`${city.name} ilinde bu kriterlere uyan ${config.unit} bulunamadı.`}
    />
  );
}
