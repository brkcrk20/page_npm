import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { CategoryBrowser } from '@/components/listings/CategoryBrowser';
import {
  breedDisplayName,
  getBreedsByCategoryId,
  getCategories,
  getCategoryBySlug,
  getSidebarData,
  resolveCategorySegment,
} from '@/lib/queries/catalog';
import { getListings, parseListingParams } from '@/lib/queries/listings';
import { getPageContent } from '@/lib/queries/page-content';
import { cinseGoreSehirler, sehreGoreCinsler } from '@/lib/queries/cross-links';
import { CrossLinks } from '@/components/listings/CrossLinks';
import { seoAciklama, seoAciklamaSec, seoBaslikSec } from '@/lib/seo-metin';
import { MALZEME_KATEGORISI } from '@/lib/routing';

/**
 * /<kategori>/<segment>
 *
 * Segment ya bir CİNS ("akbas") ya da bir ŞEHİR ("ankara") olabilir. Eski
 * yapıda kategori başına ayrı bir [sehir] route'u vardı; Next.js statik
 * segmenti ("kopek-ilanlari") dinamik olana tercih ettiği için her ikinci
 * segment şehir sanılıyordu ve cins sayfaları "Akbas şehrinde ilan bulunamadı"
 * diyordu. Tek route + veritabanından çözümleme bu karışıklığı kökten
 * ortadan kaldırıyor.
 */

type Params = { slug: string; segment: string };

async function load(params: Params) {
  const category = await getCategoryBySlug(params.slug);
  if (!category) return null;

  const resolved = await resolveCategorySegment(category, params.segment);
  if (resolved.kind === 'unknown') return null;

  return { category, resolved };
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

/**
 * Cins sayfalarını önceden üret.
 *
 * Bu rota hem cins (/kopek-ilanlari/golden-retriever) hem şehir
 * (/kopek-ilanlari/istanbul) sayfalarını karşılıyor. Yalnızca CİNSLER
 * üretiliyor:
 *
 *  - Arama trafiğinin ağırlığı burada. Kullanıcı "golden retriever yavru"
 *    arıyor, ana sayfaya değil doğrudan bu sayfaya düşüyor.
 *  - Cins sayısı yönetilebilir (~190). Altı kategori × 81 il = 486 şehir
 *    sayfasını da üretmek derleme süresini gereksiz yere uzatırdı; onlar
 *    ilk istekte render edilip önbelleğe alınıyor.
 */
export async function generateStaticParams() {
  const categories = await getCategories();

  const params = await Promise.all(
    categories.map(async (category) => {
      const breeds = await getBreedsByCategoryId(category.id);
      return breeds.map((breed) => ({ slug: category.slug, segment: breed.slug }));
    })
  );

  return params.flat();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const loaded = await load(await params);
  if (!loaded) return { title: 'Sayfa Bulunamadı' };

  const { category, resolved } = loaded;

  if (resolved.kind === 'breed') {
    const kardesler = await getBreedsByCategoryId(category.id);
    const ad = breedDisplayName(resolved.breed, kardesler);

    // Malzeme sayfalarında "sahiplendirme" yanlış: bir kafes sahiplendirilmiyor,
    // satılıyor ya da devrediliyor. Kategoriye göre ayrı metin gerekiyor.
    if (category.slug === MALZEME_KATEGORISI) {
      return {
        title: seoBaslikSec(
          `${ad} — İkinci El ve Sıfır İlanları`,
          `${ad} — İkinci El İlanları`,
          `${ad} İlanları`
        ),
        description: seoAciklamaSec(
          `${ad} ilanları: ikinci el ve sıfır ürünler, sahibinden fiyatlarla. Semtinizdeki ${ad.toLocaleLowerCase('tr')} ilanlarını PetSemti'de karşılaştırın.`,
          `${ad} ilanları: ikinci el ve sıfır ürünler, sahibinden fiyatlarla. Semtinizdeki satıcıları PetSemti'de karşılaştırın.`
        ),
      };
    }

    return {
      title: seoBaslikSec(
        `${ad} — Satılık ve Sahiplendirme İlanları`,
        `${ad} — Satılık ve Sahiplendirme`,
        `${ad} İlanları`
      ),
      description: seoAciklamaSec(
        `${ad} cinsi için güncel satılık ve ücretsiz sahiplendirme ilanları. Türkiye'nin her ilinden ${ad} ilanlarına PetSemti'den ulaşın.`,
        `${ad} cinsi için güncel satılık ve ücretsiz sahiplendirme ilanları. Türkiye'nin her ilindeki ilanlara PetSemti'den ulaşın.`
      ),
    };
  }

  const cityName = resolved.city.name;
  const malzeme = category.slug === MALZEME_KATEGORISI;
  return {
    title: seoBaslikSec(
      malzeme
        ? `${cityName} ${category.name} — İkinci El ve Sıfır`
        : `${cityName} ${category.name} — Satılık ve Sahiplendirme`,
      `${cityName} ${category.name}`
    ),
    description: seoAciklama(
      malzeme
        ? `${cityName} ve ilçelerindeki ikinci el ve sıfır ${category.name.toLocaleLowerCase('tr')}. Semtinizdeki ilanları görün, satıcıyla doğrudan görüşün.`
        : `${cityName} ve ilçelerindeki güncel ${category.name.toLocaleLowerCase('tr')}. Semtinizdeki ilanları görün, satıcıyla doğrudan görüşün.`
    ),
  };
}

export default async function CategorySegmentPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ sirala?: string; min?: string; max?: string; kimden?: string }>;
}) {
  const resolvedParams = await params;
  const listeParams = parseListingParams(await searchParams);
  const loaded = await load(resolvedParams);
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
            href={(slug) => `/${category.slug}/${resolved.breed.slug}/${slug}`}
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
          href={(slug) => `/${category.slug}/${slug}/${resolved.city.slug}`}
        />
      }
    />
  );
}
