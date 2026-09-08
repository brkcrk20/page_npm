import { notFound, permanentRedirect } from 'next/navigation';

import { ServiceDirectory } from '@/components/services/ServiceDirectory';
import { ServiceDetail } from '@/components/services/ServiceDetail';
import { getCityBySlug, getDistrict } from '@/lib/queries/catalog';
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
} from '@/lib/queries/service-page';

/**
 * Hizmet rehberi sayfalarının gövdesi.
 *
 * Neden rota dosyasında değil: ListeSayfalari.tsx'in başındaki açıklamanın
 * aynısı. Süzgeç okuyan rota önbelleğe giremiyor; süzgeçsiz gezinme temiz
 * rotada kalıyor, "ozellik/q/dogrulanmis/sayfa" taşıyan istekler
 * /hizmet-filtre altındaki aynı gövdeye yeniden yazılıyor.
 *
 * Yedi hizmet kategorisi (veteriner, petshop, pet oteli, kuaför, taksi,
 * eğitmen, gezdirici) aynı bileşenleri kullanıyor; ayrımı config yapıyor.
 */

export type HizmetSuzgeci = ReturnType<typeof parseServiceFilters>;

/** Süzgeçsiz görünüm. Temiz adresler bunu kullanıyor. */
export const HIZMET_SUZGECSIZ: HizmetSuzgeci = parseServiceFilters({});

function config(hizmet: string) {
  const c = getServiceConfigBySlug(hizmet);
  if (!c) notFound();
  return c;
}

/* ------------------------------------------------------------------ */
/* /<hizmet>                                                           */
/* ------------------------------------------------------------------ */

export async function HizmetRehberi({
  hizmet,
  filters,
}: {
  hizmet: string;
  filters: HizmetSuzgeci;
}) {
  const c = config(hizmet);
  const data = await loadServicePage(c.type, filters);

  return (
    <ServiceDirectory
      config={c}
      title={c.label}
      intro="Türkiye geneli"
      crumbs={[{ label: c.label }]}
      providers={data.providers}
      total={data.total}
      page={data.page}
      pageCount={data.pageCount}
      featureGroups={data.featureGroups}
      activeFeatures={filters.featureSlugs}
      activeSearch={filters.search}
      verifiedOnly={filters.verifiedOnly}
      cities={data.cities}
      basePath={buildServiceBasePath(`/${c.slug}`, filters)}
      emptyMessage={`Bu kriterlere uyan ${c.unit} bulunamadı.`}
    />
  );
}

/* ------------------------------------------------------------------ */
/* /<hizmet>/<sehir|isletme>                                           */
/* ------------------------------------------------------------------ */

/**
 * Segment ya bir ŞEHİR ("istanbul") ya da bir İŞLETME ("dost-klinik-12").
 * Ayrım belirsiz değil: işletme adresi her zaman "-<sayı>" ile biter, şehir
 * slug'ları asla rakamla bitmez — ilan/kategori ayrımıyla aynı kural.
 */
export function isletmeSegmentiCoz(segment: string) {
  const match = /^(.*)-(\d+)$/.exec(segment);
  if (!match || !match[1]) return null;
  return { slug: match[1], id: Number(match[2]) };
}

export async function HizmetSegmenti({
  hizmet,
  segment,
  filters,
}: {
  hizmet: string;
  segment: string;
  filters: HizmetSuzgeci;
}) {
  const c = config(hizmet);
  const parsed = isletmeSegmentiCoz(segment);

  if (parsed) {
    const provider = await getServiceProviderById(parsed.id, c.type);
    if (!provider) notFound();

    // Ad değişmişse slug da değişir; eski adres kanonik adrese kalıcı
    // yönlendiriliyor ki arama motorunda tek sürüm kalsın.
    if (provider.slug !== parsed.slug) {
      permanentRedirect(`/${c.slug}/${provider.slug}-${provider.id}`);
    }

    const cityId = (provider as any).cities?.id as number | undefined;

    const [reviews, nearbyResult] = await Promise.all([
      getServiceReviews(provider.id),
      cityId
        ? getServiceProviders({ serviceType: c.type, cityId, perPage: 6 })
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

    return <ServiceDetail config={c} provider={provider as any} reviews={reviews} nearby={nearby} />;
  }

  const city = await getCityBySlug(segment);
  if (!city) notFound();

  const data = await loadServicePage(c.type, filters, { cityId: city.id });

  return (
    <ServiceDirectory
      config={c}
      title={`${city.name} ${c.label}`}
      crumbs={[{ label: c.label, href: `/${c.slug}` }, { label: city.name }]}
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
      basePath={buildServiceBasePath(`/${c.slug}/${city.slug}`, filters)}
      emptyMessage={`${city.name} ilinde bu kriterlere uyan ${c.unit} bulunamadı.`}
    />
  );
}

/* ------------------------------------------------------------------ */
/* /<hizmet>/<sehir>/<ilce>                                            */
/* ------------------------------------------------------------------ */

export async function hizmetIlcesiniCoz(segment: string, district: string) {
  const city = await getCityBySlug(segment);
  if (!city) return null;
  const ilce = await getDistrict(city.id, district);
  if (!ilce) return null;
  return { city, district: ilce };
}

export async function HizmetIlcesi({
  hizmet,
  segment,
  district,
  filters,
}: {
  hizmet: string;
  segment: string;
  district: string;
  filters: HizmetSuzgeci;
}) {
  const c = config(hizmet);
  const loaded = await hizmetIlcesiniCoz(segment, district);
  if (!loaded) notFound();

  const { city, district: ilce } = loaded;
  const data = await loadServicePage(c.type, filters, {
    cityId: city.id,
    districtId: ilce.id,
  });

  return (
    <ServiceDirectory
      config={c}
      title={`${ilce.name} ${c.label}`}
      intro={city.name}
      crumbs={[
        { label: c.label, href: `/${c.slug}` },
        { label: city.name, href: `/${c.slug}/${city.slug}` },
        { label: ilce.name },
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
      basePath={buildServiceBasePath(`/${c.slug}/${city.slug}/${ilce.slug}`, filters)}
      emptyMessage={`${ilce.name} bölgesinde bu kriterlere uyan ${c.unit} bulunamadı.`}
    />
  );
}
