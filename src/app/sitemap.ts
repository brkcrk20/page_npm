import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/site';
import { createSupabasePublicClient } from '@/lib/supabase/server';
import { getCategories, getBreedsByCategoryId, getCities } from '@/lib/queries/catalog';
import { getListings } from '@/lib/queries/listings';
import { getServiceProviders, getServiceCityCounts } from '@/lib/queries/services';
import { SERVICE_CONFIGS } from '@/lib/services-config';

/**
 * sitemap.xml
 *
 * Bu sitenin trafiği tamamen organik aramadan geleceği için site haritası
 * kritik: kategori, cins ve şehir sayfalarının çoğuna site içinden yalnızca
 * yan menü üzerinden bağlantı var; harita olmadan arama motorunun binlerce
 * sayfayı keşfetmesi aylar sürer.
 *
 * Öncelik değerleri kasıtlı: cins ve şehir sayfaları uzun kuyruk aramaların
 * ana hedefi olduğu için kategori sayfalarıyla neredeyse eşit ağırlıkta.
 * Filtreli adresler (?ozellik=...) haritaya girmiyor — robots.txt'te de
 * kapalılar, aynı içeriğin kombinasyonları tarama bütçesini tüketirdi.
 */

// Tek dosya sınırı 50.000 URL. Referans sayfaları ~600 tuttuğu için ilan
// tarafına geniş bir pay kalıyor; bu sınır aşılırsa generateSitemaps ile
// parçalamak gerekir.
const MAX_LISTINGS = 40000;

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE_URL}/es-arayanlar`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/kayip`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${SITE_URL}/rehber`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    // İlan türüne göre listeler. "Ücretsiz sahiplendirme" yüksek niyetli bir
    // arama ve tür ayrımı yapmayan kategori sayfasına değil buraya düşmeli.
    { url: `${SITE_URL}/sahiplendirme`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/al-sat`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    // Bilgilendirme ve sözleşme sayfaları. Nadiren değişiyorlar ama
    // indekslenmeleri gerekiyor: arama motorları bir pazaryerinde kullanım
    // şartları, gizlilik ve iletişim sayfasının varlığını güven sinyali
    // olarak değerlendiriyor.
    { url: `${SITE_URL}/hakkimizda`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/iletisim`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/ilan-kurallari`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE_URL}/kullanim-sartlari`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/gizlilik-politikasi`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/gorsel-kaynaklari`, lastModified: now, changeFrequency: 'monthly', priority: 0.2 },
    // Yedi hizmet rehberinin kök sayfaları
    ...SERVICE_CONFIGS.map((service) => ({
      url: `${SITE_URL}/${service.slug}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })),
  ];

  const [categories, cities] = await Promise.all([getCategories(), getCities()]);

  // --- Kategoriler ---
  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/${category.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.9,
  }));

  // --- Cinsler ve şehir kırılımları ---
  const breedLists = await Promise.all(
    categories.map((category) => getBreedsByCategoryId(category.id))
  );

  const breedEntries: MetadataRoute.Sitemap = [];
  const cityEntries: MetadataRoute.Sitemap = [];

  categories.forEach((category, index) => {
    for (const breed of breedLists[index]) {
      breedEntries.push({
        url: `${SITE_URL}/${category.slug}/${breed.slug}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.8,
      });
    }

    for (const city of cities) {
      cityEntries.push({
        url: `${SITE_URL}/${category.slug}/${city.slug}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.7,
      });
    }
  });

  // --- İlanlar ---
  // Sayfalayarak çekiyoruz: tek istekte 40.000 satır hem Supabase tarafında
  // hem bellekte makul değil.
  const listingEntries: MetadataRoute.Sitemap = [];
  const perPage = 1000;

  for (let page = 1; listingEntries.length < MAX_LISTINGS; page++) {
    const { listings, pageCount } = await getListings({ page, perPage });
    if (listings.length === 0) break;

    for (const listing of listings) {
      listingEntries.push({
        url: `${SITE_URL}/${listing.slug}-${listing.id}`,
        lastModified: listing.published_at ? new Date(listing.published_at) : now,
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }

    if (page >= pageCount) break;
  }

  // --- Hizmet rehberleri ---
  // Yedi kategorinin şehir sayfaları ve işletme kayıtları. Kategori başına
  // ayrı ayrı yazmak yerine yapılandırma üzerinden dönüyoruz.
  const serviceEntries: MetadataRoute.Sitemap = [];

  for (const service of SERVICE_CONFIGS) {
    const [cityCounts, providers] = await Promise.all([
      getServiceCityCounts(service.type),
      getServiceProviders({ serviceType: service.type, perPage: 1000 }),
    ]);

    // Yalnızca kayıt bulunan iller: boş şehir sayfası arama motoruna
    // gönderilecek bir içerik değil.
    for (const city of cityCounts.filter((c) => c.count > 0)) {
      serviceEntries.push({
        url: `${SITE_URL}/${service.slug}/${city.slug}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }

    for (const provider of providers.providers) {
      serviceEntries.push({
        url: `${SITE_URL}/${service.slug}/${provider.slug}-${provider.id}`,
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }

  // Rehber yazıları: aramadan gelen trafiğin hedefi bunlar.
  const { data: rehberYazilari } = await createSupabasePublicClient()
    .from('guides')
    .select('slug, updated_at')
    .eq('status', 'yayinda')
    .limit(1000);

  const guideEntries: MetadataRoute.Sitemap = (
    (rehberYazilari ?? []) as { slug: string; updated_at: string }[]
  ).map((y) => ({
    url: `${SITE_URL}/rehber/${y.slug}`,
    lastModified: new Date(y.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [
    ...staticEntries,
    ...guideEntries,
    ...categoryEntries,
    ...breedEntries,
    ...cityEntries,
    ...listingEntries,
    ...serviceEntries,
  ];
}
