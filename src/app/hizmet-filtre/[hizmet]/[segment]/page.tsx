import type { Metadata } from 'next';

import { HizmetSegmenti } from '@/components/pages/HizmetSayfalari';
import { parseServiceFilters, type ServiceSearchParams } from '@/lib/queries/service-page';
import { getServiceConfigBySlug } from '@/lib/services-config';

/** Süzgeçli il listesi. Bkz. ../page.tsx. */
type Params = { hizmet: string; segment: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { hizmet, segment } = await params;
  return {
    title: getServiceConfigBySlug(hizmet)?.label,
    robots: { index: false, follow: true },
    alternates: { canonical: `/${hizmet}/${segment}` },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<ServiceSearchParams>;
}) {
  const { hizmet, segment } = await params;
  return (
    <HizmetSegmenti
      hizmet={hizmet}
      segment={segment}
      filters={parseServiceFilters(await searchParams)}
    />
  );
}
