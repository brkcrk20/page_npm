import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

import { CategoryBrowser } from '@/components/listings/CategoryBrowser';
import {
  getCategoryBySlug,
  getSidebarData,
  getCityBySlug,
  getDistrict,
  getBreed,
} from '@/lib/queries/catalog';
import {
  getListings,
  parseListingParams,
  getListingById,
  getSellerInfo,
  getSimilarListings,
  getAdjacentListings,
} from '@/lib/queries/listings';
import { ListingDetail } from '@/components/listings/ListingDetail';
import { ilanNoAyikla, listingHref } from '@/lib/listing-url';
import { listingMetadata } from '@/lib/listing-metadata';
import { getPageContent } from '@/lib/queries/page-content';
import { cinseGoreSehirler } from '@/lib/queries/cross-links';
import { CrossLinks } from '@/components/listings/CrossLinks';

/**
 * Üçüncü segment üç şeyden biri olabiliyor:
 *
 *   /<kategori>/<sehir>/<ilce>          → İzmir > Konak köpek ilanları
 *   /<kategori>/<cins>/<sehir>          → İzmir Toy Poodle ilanları
 *   /<sehir>/<cins>/<baslik>-<no>       → tek ilan
 *
 * ÜÇÜNCÜSÜ NASIL AYRILIYOR
 * Son parça "-<sayı>" ile bitiyorsa ilandır. Şehir ve ilçe adresleri asla
 * rakamla bitmiyor; aynı kural sitenin başka yerlerinde de kullanılıyor
 * (işletme adresleri), yani yeni bir kural getirmiyor.
 *
 * İKİNCİSİ NEDEN VAR
 * Arama kutusuna yazılan şey çoğunlukla "izmir toy poodle" ya da "denizli
 * toy poodle" gibi CİNS + ŞEHİR birleşimi. Sitede cins sayfası
 * (/kopek-ilanlari/toy-poodle) ve şehir sayfası (/kopek-ilanlari/izmir)
 * ayrı ayrı vardı ama ikisinin kesişimi yoktu; o aramanın karşılığı olan
 * bir sayfa hiç üretilmiyordu.
 *
 * Cins altında İLÇE kırılımı hâlâ yok (/kopek-ilanlari/toy-poodle/konak
 * 404 döner): 220 cins × 973 ilçe, neredeyse tamamı boş olan iki yüz bin
 * sayfa demek. Cins × il ise 81 ile sınırlı ve gerçekten aranan bir şey.
 */

type Params = { slug: string; segment: string; district: string };

type Cozum =
  | { kind: 'sehir-ilce'; city: Awaited<ReturnType<typeof getCityBySlug>>; district: Awaited<ReturnType<typeof getDistrict>> }
  | { kind: 'cins-sehir'; breed: NonNullable<Awaited<ReturnType<typeof getBreed>>>; city: NonNullable<Awaited<ReturnType<typeof getCityBySlug>>> };

async function load(params: Params) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) return null;

  // Önce şehir/ilçe: mevcut adresler bozulmasın.
  const city = await getCityBySlug(params.segment);
  if (city) {
    const district = await getDistrict(city.id, params.district);
    if (district) {
      return { category, cozum: { kind: 'sehir-ilce', city, district } as Cozum };
    }
    return null;
  }

  // Sonra cins + şehir.
  const breed = await getBreed(category.id, params.segment);
  if (breed) {
    const breedCity = await getCityBySlug(params.district);
    if (breedCity) {
      return { category, cozum: { kind: 'cins-sehir', breed, city: breedCity } as Cozum };
    }
  }

  return null;
}

/**
 * 60 saniyelik önbellek.
 *
 * Bu rota hem kategori/cins/şehir listelerini hem de tek tek ilan
 * detaylarını karşılıyor. İkisi de dakikalar ölçeğinde değişen içerik;
 * her istekte Singapur'daki veritabanına gitmek yalnızca beklemeye yol
 * açıyordu. İlan sahibi kendi değişikliğini kendi panelinden anında
 * görüyor, o sayfalar önbelleğe alınmıyor.
 */
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const p = await params;

  const ilanNo = ilanNoAyikla(p.district);
  if (ilanNo !== null) {
    const listing = await getListingById(ilanNo);
    if (!listing) return { title: 'İlan Bulunamadı' };
    return listingMetadata(listing as never);
  }

  const loaded = await load(p);
  if (!loaded) return { title: 'Sayfa Bulunamadı' };

  const { category, cozum } = loaded;

  if (cozum.kind === 'cins-sehir') {
    const { breed, city } = cozum;
    /**
     * Başlık aranan sırayla: "İzmir Toy Poodle İlanları".
     * Kullanıcı arama kutusuna şehri önce yazıyor.
     */
    return {
      title: `${city.name} ${breed.name} İlanları — Satılık ve Sahiplendirme`,
      description: `${city.name} ilindeki güncel ${breed.name} ilanları. Sahiplendirme ve satılık ${breed.name} ilanlarını ilçeye göre inceleyin, sahibiyle doğrudan görüşün.`,
      alternates: { canonical: `/${category.slug}/${breed.slug}/${city.slug}` },
    };
  }

  const { city, district } = cozum;
  return {
    title: `${district!.name} ${city!.name} ${category.name}`,
    description: `${city!.name} ${district!.name} bölgesindeki güncel ${category.name.toLowerCase()}.`,
    alternates: { canonical: `/${category.slug}/${city!.slug}/${district!.slug}` },
  };
}

export default async function DistrictPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ sirala?: string; min?: string; max?: string; kimden?: string }>;
}) {
  const p = await params;

  // --- Tek ilan: /<sehir>/<cins>/<baslik>-<no> ---
  const ilanNo = ilanNoAyikla(p.district);
  if (ilanNo !== null) {
    const listing = await getListingById(ilanNo);
    if (!listing) notFound();

    /**
     * Adres kanonik hâlinden farklıysa (başlık düzenlenmiş, şehir ya da cins
     * değişmiş) doğru adrese yönlendiriliyor. Kalıcı yönlendirme: geçici
     * olsaydı arama motoru eski adresi indekste tutmaya devam ederdi.
     */
    const kanonik = listingHref(listing as never);
    if (kanonik !== `/${p.slug}/${p.segment}/${p.district}`) {
      permanentRedirect(kanonik);
    }

    const detail = listing as any;
    const [seller, similar, adjacent] = await Promise.all([
      getSellerInfo(detail.owner_id),
      getSimilarListings(detail.id, detail.breed_id ?? null, detail.category_id),
      getAdjacentListings(detail.id, detail.category_id, detail.published_at),
    ]);

    return (
      <ListingDetail listing={detail} seller={seller} similar={similar} adjacent={adjacent} />
    );
  }

  const loaded = await load(p);
  if (!loaded) notFound();

  const { category, cozum } = loaded;

  // parseListingParams içeri alınmıştı ama hiç çağrılmıyordu: sıralama ve
  // fiyat kutuları adres çubuğunu değiştiriyor, sonuç hiç değişmiyordu.
  // Çalışmayan bir denetim, olmayandan kötü.
  const listeParams = parseListingParams(await searchParams);

  if (cozum.kind === 'cins-sehir') {
    const { breed, city } = cozum;
    const [{ listings, total }, sidebar, icerik, digerSehirler] = await Promise.all([
      getListings({
        ...listeParams,
        categoryId: category.id,
        breedId: breed.id,
        cityId: city.id,
      }),
      getSidebarData(),
      getPageContent({ categoryId: category.id, breedId: breed.id, cityId: city.id }),
      cinseGoreSehirler(category.id, breed.id),
    ]);

    return (
      <CategoryBrowser
        title={`${city.name} ${breed.name} İlanları`}
        crumbs={[
          { label: category.name, href: `/${category.slug}` },
          { label: breed.name, href: `/${category.slug}/${breed.slug}` },
          { label: city.name },
        ]}
        listings={listings}
        total={total}
        sidebar={sidebar}
        category={category}
        activeBreedSlug={breed.slug}
        activeCitySlug={city.slug}
        emptyMessage={`${city.name} ilinde yayında ${breed.name} ilanı yok.`}
        icerik={icerik}
        caprazBaglantilar={
          <CrossLinks
            baslik={`${breed.name} ilanı olan diğer iller`}
            baglantilar={digerSehirler.filter((x) => x.slug !== city.slug)}
            href={(slug) => `/${category.slug}/${breed.slug}/${slug}`}
          />
        }
      />
    );
  }

  const { city, district } = cozum;
  const [{ listings, total }, sidebar, icerik] = await Promise.all([
    getListings({
      ...listeParams,
      categoryId: category.id,
      cityId: city!.id,
      districtId: district!.id,
    }),
    getSidebarData(),
    getPageContent({ categoryId: category.id, cityId: city!.id, districtId: district!.id }),
  ]);

  return (
    <CategoryBrowser
      title={`${district!.name}, ${city!.name} — ${category.name}`}
      crumbs={[
        { label: category.name, href: `/${category.slug}` },
        { label: city!.name, href: `/${category.slug}/${city!.slug}` },
        { label: district!.name },
      ]}
      listings={listings}
      total={total}
      sidebar={sidebar}
      category={category}
      activeCitySlug={city!.slug}
      emptyMessage={`${district!.name} bölgesinde yayında ${category.name.toLowerCase()} yok.`}
      icerik={icerik}
    />
  );
}
