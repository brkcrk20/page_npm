import type { Metadata } from 'next';

import { HizmetIlcesi } from '@/components/pages/HizmetSayfalari';
import { parseServiceFilters, type ServiceSearchParams } from '@/lib/queries/service-page';
import { getServiceConfigBySlug } from '@/lib/services-config';

/** Süzgeçli ilçe listesi. Bkz. ../../page.tsx. */
type Params = { hizmet: string; segment: string; district: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { hizmet, segment, district } = await params;
  return {
    title: getServiceConfigBySlug(hizmet)?.label,
    robots: { index: false, follow: true },
    alternates: { canonical: `/${hizmet}/${segment}/${district}` },
  };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<ServiceSearchParams>;
}) {
  const { hizmet, segment, district } = await params;
  return (
    <HizmetIlcesi
      hizmet={hizmet}
      segment={segment}
      district={district}
      filters={parseServiceFilters(await searchParams)}
    />
  );
}
