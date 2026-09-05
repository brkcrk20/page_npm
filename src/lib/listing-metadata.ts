import 'server-only';

import type { Metadata } from 'next';

import { SITE_URL } from '@/lib/site';
import { listingPhotoUrl } from '@/lib/supabase/storage';
import { listingHref } from '@/lib/listing-url';

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
  const baslik = onEk ? `${onEk} — ${listing.title}` : listing.title;
  const aciklama = listing.description.slice(0, 160);
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
