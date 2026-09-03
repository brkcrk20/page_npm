import 'server-only';

/**
 * Hizmet rehberi sayfalarının ortak yükleme mantığı.
 *
 * Yedi kategori ve her birinin genel/şehir/ilçe sayfaları aynı filtreleri ve
 * aynı yan menüyü kullanıyor; sorgu kurulumunu her dosyada tekrarlamak yerine
 * burada topluyoruz.
 */

import {
  getServiceProviders,
  getServiceFeatures,
  getServiceCityCounts,
  type ServiceType,
} from '@/lib/queries/services';

export type ServiceSearchParams = { [key: string]: string | string[] | undefined };

/** URL sorgu dizesinden filtreleri okur. */
export function parseServiceFilters(searchParams: ServiceSearchParams) {
  const raw = searchParams.ozellik;
  const featureSlugs = Array.isArray(raw) ? raw : raw ? [raw] : [];

  const search = typeof searchParams.q === 'string' ? searchParams.q : '';
  const verifiedOnly = searchParams.dogrulanmis === '1';
  const page = Number(searchParams.sayfa) || 1;

  return { featureSlugs, search, verifiedOnly, page };
}

/** Filtreleri koruyarak sayfalama bağlantılarının temelini üretir. */
export function buildServiceBasePath(
  pathname: string,
  filters: ReturnType<typeof parseServiceFilters>
): string {
  const params = new URLSearchParams();
  for (const slug of filters.featureSlugs) params.append('ozellik', slug);
  if (filters.search) params.set('q', filters.search);
  if (filters.verifiedOnly) params.set('dogrulanmis', '1');

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export async function loadServicePage(
  serviceType: ServiceType,
  filters: ReturnType<typeof parseServiceFilters>,
  scope: { cityId?: number; districtId?: number } = {}
) {
  const [result, featureGroups, cities] = await Promise.all([
    getServiceProviders({
      serviceType,
      featureSlugs: filters.featureSlugs.length ? filters.featureSlugs : undefined,
      search: filters.search || undefined,
      verifiedOnly: filters.verifiedOnly || undefined,
      page: filters.page,
      ...scope,
    }),
    getServiceFeatures(serviceType),
    getServiceCityCounts(serviceType),
  ]);

  return {
    ...result,
    featureGroups,
    // Kaydı olmayan 81 ilin tamamını listelemek yan menüyü kullanılmaz hale
    // getiriyor; yalnızca kayıt bulunan iller gösteriliyor.
    cities: cities.filter((c) => c.count > 0),
  };
}
