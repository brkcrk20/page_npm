import type { Metadata } from 'next';

import { SegmentListesi } from '@/components/pages/ListeSayfalari';
import { getCategoryBySlug } from '@/lib/queries/catalog';
import { parseListingParams } from '@/lib/queries/listings';

/** Süzgeçli cins/şehir listesi. Bkz. ../page.tsx. */
type Params = { slug: string; segment: string };
type Suzgec = { sirala?: string; min?: string; max?: string; kimden?: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug, segment } = await params;
  return {
    title: (await getCategoryBySlug(slug))?.name,
    robots: { index: false, follow: true },
    alternates: { canonical: `/${slug}/${segment}` },
  };
}

export default async function FiltreliSegmentPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<Suzgec>;
}) {
  const { slug, segment } = await params;
  return (
    <SegmentListesi
      slug={slug}
      segment={segment}
      listeParams={parseListingParams(await searchParams)}
    />
  );
}
