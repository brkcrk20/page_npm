import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { seoAciklama, seoAciklamaSec, seoBaslikSec } from '@/lib/seo-metin';

import {
  SUZGECSIZ,
  UcuncuSegmentListesi,
  ucuncuSegmentiCoz,
} from '@/components/pages/ListeSayfalari';

/**
 * Üçüncü segment iki şeyden biri olabiliyor:
 *
 *   /<kategori>/<sehir>/<ilce>   → İzmir > Konak köpek ilanları
 *   /<kategori>/<cins>/<sehir>   → İzmir Toy Poodle ilanları
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

/** Çözümleme gövdeyle ortak; iki yerde ayrı kural kalmasın. */
const load = (params: Params) => ucuncuSegmentiCoz(params.slug, params.segment, params.district);

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
 * Boş liste, ama gerekli.
 *
 * generateStaticParams olmadan Next bu rotayı "her istekte yeniden çiz"
 * kabul ediyor ve revalidate'i hiç uygulamıyor. Boş dizi + dynamicParams
 * (varsayılan açık) istenen davranışı veriyor: derlemede hiçbir ilçe
 * sayfası üretilmiyor — 973 ilçe × kategori sayısı kadar sayfayı önceden
 * çizmenin anlamı yok — ilk isteyen üretiyor, sonrakiler önbellekten
 * alıyor.
 */
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const loaded = await load(await params);
  if (!loaded) return { title: 'Sayfa Bulunamadı' };

  const { category, cozum } = loaded;

  if (cozum.kind === 'cins-sehir') {
    const { breed, city } = cozum;
    /**
     * Başlık aranan sırayla: "İzmir Toy Poodle İlanları".
     * Kullanıcı arama kutusuna şehri önce yazıyor.
     */
    return {
      title: seoBaslikSec(
        `${city.name} ${breed.name} Fiyatları ve İlanları`,
        `${city.name} ${breed.name} İlanları`
      ),
      description: seoAciklamaSec(
        `${city.name} ilindeki güncel ${breed.name} ilanları. Sahiplendirme ve satılık ${breed.name} ilanlarını ilçeye göre inceleyin, sahibiyle doğrudan görüşün.`,
        `${city.name} ilindeki güncel ${breed.name} ilanları. Sahiplendirme ve satılık ilanları ilçeye göre inceleyin, sahibiyle doğrudan görüşün.`
      ),
      alternates: { canonical: `/${category.slug}/${breed.slug}/${city.slug}` },
    };
  }

  const { city, district } = cozum;
  const kategoriAdi = category.name.toLocaleLowerCase('tr');
  return {
    title: seoBaslikSec(
      `${district!.name} ${city!.name} ${category.name}`,
      `${district!.name} ${category.name}`
    ),
    // Tek cümlelik açıklama arama sonucunda yarım kalmış görünüyordu;
    // ilçe sayfasının ne sunduğunu söyleyen ikinci cümle eklendi.
    description: seoAciklama(
      `${city!.name} ${district!.name} bölgesindeki güncel ${kategoriAdi}. Semtinizdeki satılık ve sahiplendirme ilanlarını görün, sahibiyle doğrudan görüşün.`
    ),
    alternates: { canonical: `/${category.slug}/${city!.slug}/${district!.slug}` },
  };
}

export default async function DistrictPage({ params }: { params: Promise<Params> }) {
  const { slug, segment, district } = await params;
  return (
    <UcuncuSegmentListesi
      slug={slug}
      segment={segment}
      district={district}
      listeParams={SUZGECSIZ}
    />
  );
}
