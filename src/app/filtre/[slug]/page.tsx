import type { Metadata } from 'next';

import { KategoriListesi } from '@/components/pages/ListeSayfalari';
import { getCategoryBySlug } from '@/lib/queries/catalog';
import { parseListingParams } from '@/lib/queries/listings';

/**
 * Süzgeçli kategori listesi.
 *
 * Bu adres kullanıcıya hiç görünmüyor: /kopek-ilanlari?sirala=ucuz gibi
 * süzgeç parametresi taşıyan istekleri next.config buraya yeniden yazıyor.
 * Ayrı rota olmasının sebebi ListeSayfalari.tsx'in başında yazıyor —
 * searchParams okuyan rota önbelleğe giremiyor, o yüzden süzgeçsiz
 * gezinme temiz rotada kalıyor.
 *
 * Sıralama ve fiyat aralığı ayrı bir sayfa değil, aynı listenin başka
 * dizilişi. Arama motorunun her permütasyonu ayrı sayfa sanmaması için
 * hepsi noindex ve kanonik olarak süzgeçsiz adresi gösteriyor.
 */
type Params = { slug: string };
type Suzgec = { sirala?: string; min?: string; max?: string; kimden?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Başlık dizin için değil, sekmede duran kullanıcı için: süzgeç açan
  // ziyaretçi sayfanın adını görmeye devam etsin.
  const category = await getCategoryBySlug(slug);
  return {
    title: category?.name,
    robots: { index: false, follow: true },
    alternates: { canonical: `/${slug}` },
  };
}

export default async function FiltreliKategoriPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Suzgec>;
}) {
  const { slug } = await params;
  return <KategoriListesi slug={slug} listeParams={parseListingParams(await searchParams)} />;
}
