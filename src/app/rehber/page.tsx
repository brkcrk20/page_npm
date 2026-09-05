import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

import { JsonLd } from '@/components/JsonLd';
import { GuideCardList, GuideTopicStrip } from '@/components/guides/GuideList';
import { getGuides, getGuideTopics } from '@/lib/queries/guides';
import { SITE_URL } from '@/lib/site';

/**
 * PetSemti Rehber.
 *
 * Sitede ilan ve hizmet vardı, bilgi yoktu. "Yavru köpek sahiplenirken
 * nelere dikkat edilir", "köpeklerde aşı takvimi", "kedim kayboldu ne
 * yapmalıyım" aramada en çok yazılan sorular ve karşılığı olmadığı için o
 * kullanıcılar siteye hiç uğramıyordu.
 *
 * Konu süzmesi artık sorgu parametresiyle değil kendi adresleriyle
 * (/rehber/konu/kedi): sorgu dizeli sayfalar arama motorlarında kendi
 * başına bir sayfa sayılmıyor.
 */

export const metadata: Metadata = {
  title: 'PetSemti Rehber — Bakım, Beslenme ve Sağlık',
  description:
    'Kedi ve köpek bakımı, beslenme, aşı takvimi, sahiplenme öncesi bilinmesi gerekenler, kayıp hayvan rehberi ve hizmet seçimi. PetSemti Rehber.',
  alternates: { canonical: '/rehber' },
  openGraph: {
    type: 'website',
    title: 'PetSemti Rehber',
    description:
      'Kedi ve köpek bakımı, beslenme, aşı takvimi, kayıp hayvan ve hizmet seçimi rehberleri.',
    url: `${SITE_URL}/rehber`,
    /* Kendi görseli olmayan sayfa üstteki görseli MİRAS ALMIYOR: openGraph
       alanı çocukta tanımlanınca ebeveyndeki tümüyle yerini bırakıyor.
       Markalı kart burada da açıkça veriliyor. */
    images: [{ url: `${SITE_URL}/marka/paylasim-karti.png`, width: 1200, height: 630 }],
  },
};

export const revalidate = 300;

export default async function RehberPage() {
  const [yazilar, konular] = await Promise.all([getGuides(), getGuideTopics()]);
  const ustKonular = konular.filter((k) => k.parent_id === null);

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-6">
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
              { '@type': 'ListItem', position: 2, name: 'Rehber', item: `${SITE_URL}/rehber` },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: 'PetSemti Rehber',
            description:
              'Kedi ve köpek bakımı, beslenme, aşı takvimi, kayıp hayvan ve hizmet seçimi rehberleri.',
            url: `${SITE_URL}/rehber`,
            hasPart: yazilar.slice(0, 20).map((y) => ({
              '@type': 'Article',
              headline: y.title,
              url: `${SITE_URL}/rehber/${y.slug}`,
              datePublished: y.published_at ?? undefined,
            })),
          },
        ]}
      />

      <nav aria-label="Kırıntı navigasyonu" className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary hover:underline">Ana Sayfa</Link>
        <span aria-hidden className="mx-1">›</span>
        <span className="text-foreground">Rehber</span>
      </nav>

      <header className="mb-6">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold md:text-3xl">
          <BookOpen className="h-7 w-7 text-primary" />
          PetSemti Rehber
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Sahiplenme öncesi bilinmesi gerekenler, bakım ve beslenme, aşı takvimi, kayıp
          hayvan ve hizmet seçimi rehberleri.
        </p>
      </header>

      <GuideTopicStrip konular={ustKonular} />
      <GuideCardList yazilar={yazilar} />
    </div>
  );
}
