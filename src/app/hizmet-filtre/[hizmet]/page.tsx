import type { Metadata } from 'next';

import { HizmetRehberi } from '@/components/pages/HizmetSayfalari';
import { parseServiceFilters, type ServiceSearchParams } from '@/lib/queries/service-page';
import { getServiceConfigBySlug } from '@/lib/services-config';

/**
 * Süzgeçli hizmet rehberi.
 *
 * Kullanıcıya görünmeyen adres: /veteriner?ozellik=gece-nobeti gibi süzgeç
 * taşıyan istekleri next.config buraya yeniden yazıyor. Sebebi
 * HizmetSayfalari.tsx'in başında. Süzgeç bir sayfa değil, aynı listenin
 * daraltılmışı; hepsi noindex ve kanonik olarak süzgeçsiz adresi gösteriyor.
 */
type Params = { hizmet: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { hizmet } = await params;
  return {
    title: getServiceConfigBySlug(hizmet)?.label,
    robots: { index: false, follow: true },
    alternates: { canonical: `/${hizmet}` },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<ServiceSearchParams>;
}) {
  const { hizmet } = await params;
  return <HizmetRehberi hizmet={hizmet} filters={parseServiceFilters(await searchParams)} />;
}
