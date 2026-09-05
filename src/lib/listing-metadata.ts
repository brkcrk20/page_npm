import 'server-only';

import type { Metadata } from 'next';

import { SITE_URL } from '@/lib/site';
import { listingPhotoUrl } from '@/lib/supabase/storage';
import { listingHref } from '@/lib/listing-url';
import { seoAciklama, seoBaslikSec } from '@/lib/seo-metin';

/**
 * İlan sayfasının başlığı, açıklaması ve paylaşım kartı.
 *
 * İlan detayı kökten (/baslik-no) yeni adrese (/sehir/cins/baslik-no)
 * taşınırken bu blok iki rotaya birden kopyalanacaktı. Tek yerde:
 * ikisinden birinde yapılan düzeltmenin öbüründe unutulması bu kadar
 * uzun bir metadata bloğunda kaçınılmazdı.
 *
 * Başlık şehir ve cinsi de taşıyor: arama sonucunda görünen metin
 * "İzmir Toy Poodle" gibi bir aramayla birebir örtüşüyor.
 */
type IlanMeta = {
  id: number;
  slug: string;
  title: string;
  description: string;
  cities?: { name: string; slug: string } | null;
  breeds?: { name: string; slug: string } | null;
  listing_photos?: { storage_path: string; position: number; width?: number | null; height?: number | null }[];
};

export function listingMetadata(listing: IlanMeta): Metadata {
  /**
   * Paylaşım görseli.
   *
   * İlan sayfalarının og:image'i hiç yoktu: WhatsApp veya Facebook'ta
   * paylaşılan bir ilan fotoğrafsız, düz bir bağlantı olarak görünüyordu.
   * Bir ilan sitesinde paylaşımın tamamı fotoğraf üzerinden yürüyor.
   */
  const kapak = [...(listing.listing_photos ?? [])].sort((a, b) => a.position - b.position)[0];
  const gorselYolu = kapak ? listingPhotoUrl(kapak.storage_path) : null;
  const gorsel = gorselYolu
    ? {
        url: new URL(gorselYolu, SITE_URL).toString(),
        width: kapak?.width ?? undefined,
        height: kapak?.height ?? undefined,
        alt: listing.title,
      }
    : null;

  // "İzmir Toy Poodle — Sevimli yavrularımız". Şehir ve cins başta:
  // aranan kelimeler başlığın başında olduğunda sonuçta daha görünür.
  const onEk = [listing.cities?.name, listing.breeds?.name].filter(Boolean).join(' ');
  const baslik = seoBaslikSec(onEk ? `${onEk} — ${listing.title}` : listing.title, listing.title);

  /**
   * Açıklama.
   *
   * Eskiden ilan metninin ilk 160 karakteri ham olarak alınıyordu; kesme
   * kelimenin ortasına denk geliyor ("...aşı ve karnesi ta") ve iki
   * kelimelik ilanlarda arama sonucunda neredeyse boş bir satır kalıyordu.
   * Ölçüldü: iki ilanın açıklaması 70 karakterin altındaydı.
   *
   * Kısa metinlerde şehir/cins bağlamı ekleniyor — uydurma bir cümle değil,
   * ilanın kendi verisi.
   */
  const govde = listing.description.replace(/\s+/g, ' ').trim();
  const baglam = onEk
    ? `${onEk} ilanı. Fiyat, fotoğraflar ve satıcı bilgileri PetSemti'de.`
    : `İlan detayları, fotoğraflar ve satıcı bilgileri PetSemti'de.`;
  const aciklama = seoAciklama(govde.length >= 70 ? govde : `${govde} ${baglam}`.trim());

  const adres = new URL(listingHref(listing), SITE_URL).toString();

  return {
    title: baslik,
    description: aciklama,
    alternates: { canonical: listingHref(listing) },
    openGraph: {
      type: 'article',
      title: baslik,
      description: aciklama,
      url: adres,
      ...(gorsel ? { images: [gorsel] } : {}),
    },
    twitter: {
      card: gorsel ? 'summary_large_image' : 'summary',
      title: baslik,
      description: aciklama,
      ...(gorsel ? { images: [gorsel.url] } : {}),
    },
  };
}
