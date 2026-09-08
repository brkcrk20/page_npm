import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { SegmentListesi, SUZGECSIZ, segmentiCoz } from '@/components/pages/ListeSayfalari';
import {
  breedDisplayName,
  getBreedsByCategoryId,
  getCategories,
} from '@/lib/queries/catalog';
import { getPageContent } from '@/lib/queries/page-content';
import { seoAciklama, seoAciklamaSec, seoBaslik, seoBaslikSec } from '@/lib/seo-metin';
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

/** Çözümleme gövdeyle ortak; iki yerde ayrı kural kalmasın. */
const load = (params: Params) => segmentiCoz(params.slug, params.segment);

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
    const [kardesler, icerik] = await Promise.all([
      getBreedsByCategoryId(category.id),
      getPageContent({ categoryId: category.id, breedId: resolved.breed.id }),
    ]);
    const ad = breedDisplayName(resolved.breed, kardesler);

    // Yönetimden yazılan başlık/açıklama şablonun önüne geçiyor. Sayfaya
    // özgün metin yazıldıysa başlığın da ona uyması gerekiyor; kategori
    // sayfalarında bu zaten böyleydi, cins sayfalarında unutulmuştu.
    if (icerik?.seo_title || icerik?.seo_description) {
      return {
        title: seoBaslik(icerik.seo_title ?? `${ad} İlanları`),
        description: icerik.seo_description ? seoAciklama(icerik.seo_description) : undefined,
        alternates: { canonical: `/${category.slug}/${resolved.breed.slug}` },
      };
    }

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
        alternates: { canonical: `/${category.slug}/${resolved.breed.slug}` },
      };
    }

    /**
     * Başlıkta "fiyatları" geçiyor.
     *
     * Türkiye'de bu sayfalara gelen aramanın baskın kalıbı
     * "<cins> fiyatları": kullanıcı önce fiyat aralığını öğrenmek
     * istiyor, sonra ilana bakıyor. Başlık "Satılık ve Sahiplendirme"
     * derken aranan kelime hiç geçmiyordu.
     *
     * Yanıltıcı değil: sayfada fiyatlı satılık ilanlar da ücretsiz
     * sahiplendirme ilanları da listeleniyor.
     */
    return {
      title: seoBaslikSec(
        `${ad} Fiyatları ve Satılık İlanları`,
        `${ad} Fiyatları ve İlanları`,
        `${ad} — Satılık ve Sahiplendirme`,
        `${ad} İlanları`
      ),
      description: seoAciklamaSec(
        `${ad} fiyatları ve güncel ilanları: satılık ve ücretsiz sahiplendirme. Türkiye'nin her ilinden ${ad} ilanlarına PetSemti'den ulaşın.`,
        `${ad} fiyatları ve güncel ilanları: satılık ve ücretsiz sahiplendirme. Her ildeki ilanlara PetSemti'den ulaşın.`
      ),
      alternates: { canonical: `/${category.slug}/${resolved.breed.slug}` },
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
    alternates: { canonical: `/${category.slug}/${resolved.city.slug}` },
  };
}

export default async function CategorySegmentPage({ params }: { params: Promise<Params> }) {
  const { slug, segment } = await params;
  return <SegmentListesi slug={slug} segment={segment} listeParams={SUZGECSIZ} />;
}
