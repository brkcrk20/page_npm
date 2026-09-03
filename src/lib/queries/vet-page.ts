import 'server-only';

/**
 * Veteriner rehberi sayfalarının ortak yükleme mantığı.
 *
 * Genel liste, şehir ve ilçe sayfaları aynı filtreleri ve aynı yan menüyü
 * kullanıyor; sorgu kurulumunu üç dosyada tekrarlamak yerine burada topluyoruz.
 */

import {
  getServiceProviders,
  getServiceFeatures,
  getServiceCityCounts,
} from '@/lib/queries/services';

export type VetSearchParams = { [key: string]: string | string[] | undefined };

/** URL sorgu dizesinden filtreleri okur. */
export function parseVetFilters(searchParams: VetSearchParams) {
  const raw = searchParams.ozellik;
  const featureSlugs = Array.isArray(raw) ? raw : raw ? [raw] : [];

  const search = typeof searchParams.q === 'string' ? searchParams.q : '';
  const verifiedOnly = searchParams.dogrulanmis === '1';
  const page = Number(searchParams.sayfa) || 1;

  return { featureSlugs, search, verifiedOnly, page };
}

/** Filtreleri koruyarak sayfalama bağlantılarının temelini üretir. */
export function buildVetBasePath(
  pathname: string,
  filters: ReturnType<typeof parseVetFilters>
): string {
  const params = new URLSearchParams();
  for (const slug of filters.featureSlugs) params.append('ozellik', slug);
  if (filters.search) params.set('q', filters.search);
  if (filters.verifiedOnly) params.set('dogrulanmis', '1');

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export async function loadVetPage(
  filters: ReturnType<typeof parseVetFilters>,
  scope: { cityId?: number; districtId?: number } = {}
) {
  const [result, featureGroups, cities] = await Promise.all([
    getServiceProviders({
      serviceType: 'veteriner',
      featureSlugs: filters.featureSlugs.length ? filters.featureSlugs : undefined,
      search: filters.search || undefined,
      verifiedOnly: filters.verifiedOnly || undefined,
      page: filters.page,
      ...scope,
    }),
    getServiceFeatures('veteriner'),
    getServiceCityCounts('veteriner'),
  ]);

  return {
    ...result,
    featureGroups,
    // Kliniği olmayan 81 ilin tamamını listelemek yan menüyü kullanılmaz
    // hale getiriyor; yalnızca kayıt bulunan iller gösteriliyor.
    cities: cities.filter((c) => c.count > 0),
  };
}
