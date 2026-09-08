import type { Metadata } from 'next';

import { UcuncuSegmentListesi } from '@/components/pages/ListeSayfalari';
import { getCategoryBySlug } from '@/lib/queries/catalog';
import { parseListingParams } from '@/lib/queries/listings';

/** Süzgeçli ilçe / cins+şehir listesi. Bkz. ../../page.tsx. */
type Params = { slug: string; segment: string; district: string };
type Suzgec = { sirala?: string; min?: string; max?: string; kimden?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug, segment, district } = await params;
  return {
    title: (await getCategoryBySlug(slug))?.name,
    robots: { index: false, follow: true },
    alternates: { canonical: `/${slug}/${segment}/${district}` },
  };
}

export default async function FiltreliIlcePage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Suzgec>;
}) {
  const { slug, segment, district } = await params;
  return (
    <UcuncuSegmentListesi
      slug={slug}
      segment={segment}
      district={district}
      listeParams={parseListingParams(await searchParams)}
    />
  );
}
