import { notFound } from 'next/navigation';

import { CategoryBrowser } from '@/components/listings/CategoryBrowser';
import { PigeonLanding } from '@/components/listings/PigeonLanding';
import { CrossLinks } from '@/components/listings/CrossLinks';
import {
  getBreed,
  getCategoryBySlug,
  getCityBySlug,
  getDistrict,
  getSidebarData,
  resolveCategorySegment,
} from '@/lib/queries/catalog';
import { getListings, getListingsWithVideo, parseListingParams } from '@/lib/queries/listings';
import { getPageContent } from '@/lib/queries/page-content';
import {
  cinseGoreSehirler,
  kategoriyeGoreCinsler,
  kategoriyeGoreSehirler,
  sehreGoreCinsler,
} from '@/lib/queries/cross-links';

/**
 * İlan listesi sayfalarının gövdesi.
 *
 * NEDEN ROTA DOSYASINDA DEĞİL
 * Aynı liste iki adresten çiziliyor: temiz adres (/kopek-ilanlari) ve
 * süzgeçli adres (next.config'in /filtre altına yeniden yazdığı
 * /kopek-ilanlari?sirala=ucuz). Ayrım şundan: searchParams okuyan bir rotayı
 * Next tamamen dinamik sayıyor, yanıt "no-store" ile çıkıyor ve CDN'e hiç
 * uğramıyor. Ziyaretlerin ezici çoğunluğunda süzgeç yok; o istekler artık
 * searchParams'a hiç bakmayan rotadan geçiyor ve önbellekten dönüyor.
 * Süzgeçli istekler eskisi gibi her seferinde çiziliyor — zaten
 * indekslenmeleri de istenmiyor.
 *
 * Gövde burada durunca iki rota da aynı kodu çiziyor; süzgeçli sürümün
 * sessizce geride kalması mümkün değil.
 */

export type ListeSuzgeci = ReturnType<typeof parseListingParams>;

/** Süzgeçsiz görünüm. Temiz adresler bunu kullanıyor. */
export const SUZGECSIZ: ListeSuzgeci = parseListingParams({});

/* ------------------------------------------------------------------ */
/* /<kategori>                                                         */
/* ------------------------------------------------------------------ */

export async function KategoriListesi({
  slug,
  listeParams,
}: {
  slug: string;
  listeParams: ListeSuzgeci;
}) {
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [{ listings, total }, sidebar, icerik, sehirler, cinsler] = await Promise.all([
    getListings({ ...listeParams, categoryId: category.id }),
    getSidebarData(),
    getPageContent({ categoryId: category.id }),
    kategoriyeGoreSehirler(category.id),
    kategoriyeGoreCinsler(category.id),
  ]);

  // Güvercin kategorisinin kendine özgü giriş sayfası var: alıcı fotoğrafa
  // değil uçuşa bakıyor, bu yüzden videolu ilanlar öne çıkarılıyor ve ırk
  // seçimi görünür kılınıyor. Veri katmanı diğer kategorilerle ortak.
  if (category.code === 'Pigeon') {
    const withVideo = await getListingsWithVideo(category.id);
    return (
      <PigeonLanding
        category={category}
        sidebar={sidebar}
        listings={listings}
        withVideo={withVideo}
        total={total}
        icerik={icerik}
      />
    );
  }

  return (
    <CategoryBrowser
      title={category.name}
      crumbs={[{ label: category.name }]}
      listings={listings}
      total={total}
      sidebar={sidebar}
      category={category}
      emptyMessage={`Şu an yayında ${category.name.toLowerCase()} yok. İlk ilanı sen ver!`}
      icerik={icerik}
      caprazBaglantilar={
        /**
         * Kategori sayfası siteden en çok bağlantı ALAN ama en az
         * bağlantı VEREN sayfaydı. Buradaki iki liste hem kullanıcıyı
         * aradığı şehre/cinse götürüyor hem de cins ve şehir sayfalarına
         * site içinden gerçek bağlantı veriyor — o sayfalar daha önce
         * yalnızca site haritasından bulunuyordu.
         */
        <>
          <CrossLinks
            baslik={`${category.name} olan iller`}
            baglantilar={sehirler}
            href={(sehirSlug) => `/${category.slug}/${sehirSlug}`}
          />
          <CrossLinks
            baslik={`${category.name.replace(' İlanları', '')} cinsleri`}
            baglantilar={cinsler}
            href={(cinsSlug) => `/${category.slug}/${cinsSlug}`}
          />
        </>
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* /<kategori>/<cins|sehir>                                            */
/* ------------------------------------------------------------------ */

/** Segment ya bir CİNS ya da bir ŞEHİR; ayrımı veritabanı yapıyor. */
export async function segmentiCoz(slug: string, segment: string) {
  const category = await getCategoryBySlug(slug);
  if (!category) return null;

  const resolved = await resolveCategorySegment(category, segment);
  if (resolved.kind === 'unknown') return null;

  return { category, resolved };
}

export async function SegmentListesi({
  slug,
  segment,
  listeParams,
}: {
  slug: string;
  segment: string;
  listeParams: ListeSuzgeci;
}) {
  const loaded = await segmentiCoz(slug, segment);
  if (!loaded) notFound();

  const { category, resolved } = loaded;
  const sidebar = await getSidebarData();

  if (resolved.kind === 'breed') {
    const [{ listings, total }, icerik, sehirler] = await Promise.all([
      getListings({
        ...listeParams,
        categoryId: category.id,
        breedId: resolved.breed.id,
      }),
      getPageContent({ categoryId: category.id, breedId: resolved.breed.id }),
      cinseGoreSehirler(category.id, resolved.breed.id),
    ]);

    return (
      <CategoryBrowser
        title={`${resolved.breed.name} İlanları`}
        crumbs={[
          { label: category.name, href: `/${category.slug}` },
          { label: resolved.breed.name },
        ]}
        listings={listings}
        total={total}
        sidebar={sidebar}
        category={category}
        activeBreedSlug={resolved.breed.slug}
        emptyMessage={`Şu an yayında ${resolved.breed.name} ilanı yok.`}
        icerik={icerik}
        caprazBaglantilar={
          <CrossLinks
            baslik={`${resolved.breed.name} ilanı olan iller`}
            baglantilar={sehirler}
            href={(sehirSlug) => `/${category.slug}/${resolved.breed.slug}/${sehirSlug}`}
          />
        }
      />
    );
  }

  const [{ listings, total }, sehirIcerigi, cinsler] = await Promise.all([
    getListings({
      ...listeParams,
      categoryId: category.id,
      cityId: resolved.city.id,
    }),
    getPageContent({ categoryId: category.id, cityId: resolved.city.id }),
    sehreGoreCinsler(category.id, resolved.city.id),
  ]);

  return (
    <CategoryBrowser
      title={`${resolved.city.name} ${category.name}`}
      crumbs={[
        { label: category.name, href: `/${category.slug}` },
        { label: resolved.city.name },
      ]}
      listings={listings}
      total={total}
      sidebar={sidebar}
      category={category}
      activeCitySlug={resolved.city.slug}
      emptyMessage={`${resolved.city.name} ilinde yayında ${category.name.toLowerCase()} yok.`}
      icerik={sehirIcerigi}
      caprazBaglantilar={
        <CrossLinks
          baslik={`${resolved.city.name} ilinde ilanı olan cinsler`}
          baglantilar={cinsler}
          href={(cinsSlug) => `/${category.slug}/${cinsSlug}/${resolved.city.slug}`}
        />
      }
    />
  );
}

/* ------------------------------------------------------------------ */
/* /<kategori>/<sehir>/<ilce> ve /<kategori>/<cins>/<sehir>            */
/* ------------------------------------------------------------------ */

type UcuncuCozum =
  | {
      kind: 'sehir-ilce';
      city: NonNullable<Awaited<ReturnType<typeof getCityBySlug>>>;
      district: NonNullable<Awaited<ReturnType<typeof getDistrict>>>;
    }
  | {
      kind: 'cins-sehir';
      breed: NonNullable<Awaited<ReturnType<typeof getBreed>>>;
      city: NonNullable<Awaited<ReturnType<typeof getCityBySlug>>>;
    };

export async function ucuncuSegmentiCoz(slug: string, segment: string, district: string) {
  const category = await getCategoryBySlug(slug);
  if (!category) return null;

  // Önce şehir/ilçe: mevcut adresler bozulmasın.
  const city = await getCityBySlug(segment);
  if (city) {
    const ilce = await getDistrict(city.id, district);
    if (ilce) {
      return { category, cozum: { kind: 'sehir-ilce', city, district: ilce } as UcuncuCozum };
    }
    return null;
  }

  // Sonra cins + şehir.
  const breed = await getBreed(category.id, segment);
  if (breed) {
    const breedCity = await getCityBySlug(district);
    if (breedCity) {
      return { category, cozum: { kind: 'cins-sehir', breed, city: breedCity } as UcuncuCozum };
    }
  }

  return null;
}

export async function UcuncuSegmentListesi({
  slug,
  segment,
  district,
  listeParams,
}: {
  slug: string;
  segment: string;
  district: string;
  listeParams: ListeSuzgeci;
}) {
  const loaded = await ucuncuSegmentiCoz(slug, segment, district);
  if (!loaded) notFound();

  const { category, cozum } = loaded;

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
            href={(sehirSlug) => `/${category.slug}/${breed.slug}/${sehirSlug}`}
          />
        }
      />
    );
  }

  const { city, district: ilce } = cozum;
  const [{ listings, total }, sidebar, icerik] = await Promise.all([
    getListings({
      ...listeParams,
      categoryId: category.id,
      cityId: city.id,
      districtId: ilce.id,
    }),
    getSidebarData(),
    getPageContent({ categoryId: category.id, cityId: city.id, districtId: ilce.id }),
  ]);

  return (
    <CategoryBrowser
      title={`${ilce.name}, ${city.name} — ${category.name}`}
      crumbs={[
        { label: category.name, href: `/${category.slug}` },
        { label: city.name, href: `/${category.slug}/${city.slug}` },
        { label: ilce.name },
      ]}
      listings={listings}
      total={total}
      sidebar={sidebar}
      category={category}
      activeCitySlug={city.slug}
      emptyMessage={`${ilce.name} bölgesinde yayında ${category.name.toLowerCase()} yok.`}
      icerik={icerik}
    />
  );
}
