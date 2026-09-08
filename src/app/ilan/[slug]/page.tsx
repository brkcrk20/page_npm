import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

import { listingHref } from '@/lib/listing-url';
import { listingMetadata } from '@/lib/listing-metadata';
import { ListingDetail } from '@/components/listings/ListingDetail';
import { getGuidesForListing } from '@/lib/queries/guides';
import {
  getListingById,
  getSellerInfo,
  getSimilarListings,
  getAdjacentListings,
} from '@/lib/queries/listings';

/**
 * İlan detayı — /<sehir>-<cins>-<baslik>-<no>
 *
 * ADRES BU DEĞİL
 * Kullanıcı bu yolu hiç görmüyor. next.config'teki rewrite, "-<sayı>" ile
 * biten tek segmentlik adresleri sessizce buraya yönlendiriyor; tarayıcıdaki
 * adres değişmiyor.
 *
 * NEDEN AYRI ROTA
 * İlan detayı eskiden kategori sayfasıyla aynı /[slug] rotasındaydı. O rota
 * süzgeç ve sıralama için searchParams okuyor; searchParams'ı okuyan bir rota
 * Next'te tamamen dinamik sayılıyor ve yanıt "no-store" ile çıkıyor. Sonuç:
 * her ilan tıklaması CDN'i ıskalayıp sunucuya gidiyor, sunucu da beş ayrı
 * veritabanı sorgusu yapıyordu — tıklamayla sayfanın açılması arasında
 * saniyeler vardı. İlan detayında hiçbir süzgeç yok; ayrılınca sayfa
 * revalidate ile önbelleğe giriyor ve tekrar tıklayan herkese kenardan
 * anında dönüyor.
 */

type Params = { slug: string };

/** "golden-yavru-123" -> 123 */
function ilanNoAyikla(slug: string): number | null {
  const eslesme = /^(.*)-(\d+)$/.exec(slug);
  if (!eslesme || !eslesme[1]) return null;
  return Number(eslesme[2]);
}

export const revalidate = 60;

/**
 * Boş liste, ama gerekli.
 *
 * generateStaticParams olmadan Next bu rotayı "her istekte yeniden çiz"
 * kabul ediyor ve revalidate'i hiç uygulamıyor. Boş dizi + dynamicParams
 * (varsayılan açık) istenen davranışı veriyor: derlemede hiçbir ilan
 * üretilmiyor, ilk isteyen sayfayı üretiyor, sonraki istekler önbellekten
 * dönüyor.
 */
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const ilanNo = ilanNoAyikla((await params).slug);
  if (ilanNo === null) return { title: 'Sayfa Bulunamadı' };

  const listing = await getListingById(ilanNo);
  if (!listing) return { title: 'Sayfa Bulunamadı' };
  return listingMetadata(listing as never);
}

export default async function IlanPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const ilanNo = ilanNoAyikla(slug);
  if (ilanNo === null) notFound();

  const listing = await getListingById(ilanNo);
  if (!listing) notFound();

  /**
   * Kanonik adres: /<sehir>-<cins>-<baslik>-<no>
   *
   * Adres bundan farklıysa (eski düz adres, düzenlenmiş başlık, değişmiş
   * şehir ya da cins) doğru adrese yönlendiriliyor. Kalıcı (308) çünkü
   * geçici yönlendirmede arama motoru eski adresi indekste tutmaya devam
   * ederdi; kanonikleştirmenin işe yaraması için 308 gerekiyor.
   */
  const kanonik = listingHref(listing as never);
  if (kanonik !== `/${slug}`) permanentRedirect(kanonik);

  const detail = listing as any;
  const [seller, similar, adjacent, rehberYazilari] = await Promise.all([
    getSellerInfo(detail.owner_id),
    getSimilarListings(detail.id, detail.breed_id ?? null, detail.category_id),
    getAdjacentListings(detail.id, detail.category_id, detail.published_at),
    getGuidesForListing(detail.category_id ?? null, detail.breed_id ?? null),
  ]);

  return (
    <ListingDetail
      listing={detail}
      seller={seller}
      similar={similar}
      adjacent={adjacent}
      rehberYazilari={rehberYazilari}
    />
  );
}
