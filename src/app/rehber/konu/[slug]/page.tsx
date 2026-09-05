import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookOpen } from 'lucide-react';

import { JsonLd } from '@/components/JsonLd';
import { GuideCardList, GuideTopicStrip } from '@/components/guides/GuideList';
import { getGuides, getGuideTopics } from '@/lib/queries/guides';
import { SITE_URL } from '@/lib/site';

/**
 * Konuya göre rehber listesi.
 *
 * Konular önce ?konu= sorgu parametresiyle süzülüyordu. Sorgu dizeli
 * sayfalar arama motorlarında kendi başına bir sayfa sayılmıyor; "kedi
 * bakımı" gibi aranan bir konu için indekslenebilir bir adres gerekiyordu.
 * Her konunun artık kendi adresi, kendi başlığı ve kendi açıklaması var.
 */

type Params = { slug: string };

export async function generateStaticParams() {
  const konular = await getGuideTopics();
  return konular.map((k) => ({ slug: k.slug }));
}

export const revalidate = 300;

/** Konu sayfalarının arama başlığı ve açıklaması. */
const ACIKLAMA: Record<string, string> = {
  kedi: 'Kedi bakımı, beslenmesi, sağlığı ve davranışı üzerine rehberler.',
  kopek: 'Köpek bakımı, eğitimi, beslenmesi ve sağlığı üzerine rehberler.',
  'diger-hayvanlar': 'Kuş, kemirgen, sürüngen ve akvaryum canlıları için bakım rehberleri.',
  guvercin: 'Güvercin ırkları, yetiştiricilik, uçuş ve bakım rehberleri.',
  'kayip-bulundu': 'Kaybolan hayvanı arama, kayıp ilanı verme ve bulunan hayvanı sahibine ulaştırma rehberleri.',
  hizmetler: 'Veteriner, pet oteli, kuaför ve eğitmen seçerken dikkat edilmesi gerekenler.',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const konular = await getGuideTopics();
  const konu = konular.find((k) => k.slug === slug);
  if (!konu) return { title: 'Konu Bulunamadı' };

  const aciklama =
    ACIKLAMA[slug] ?? `${konu.name} konusundaki PetSemti rehber yazıları.`;

  return {
    title: `${konu.name} Rehberi`,
    description: aciklama,
    alternates: { canonical: `/rehber/konu/${slug}` },
    openGraph: {
      type: 'website',
      title: `${konu.name} Rehberi | PetSemti`,
      description: aciklama,
      url: new URL(`/rehber/konu/${slug}`, SITE_URL).toString(),
    },
  };
}

export default async function TopicPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [konular, yazilar] = await Promise.all([getGuideTopics(), getGuides({ topicSlug: slug })]);

  const konu = konular.find((k) => k.slug === slug);
  if (!konu) notFound();

  const aciklama = ACIKLAMA[slug] ?? `${konu.name} konusundaki rehber yazıları.`;

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
              {
                '@type': 'ListItem',
                position: 3,
                name: konu.name,
                item: `${SITE_URL}/rehber/konu/${slug}`,
              },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${konu.name} Rehberi`,
            description: aciklama,
            url: `${SITE_URL}/rehber/konu/${slug}`,
          },
        ]}
      />

      <nav aria-label="Kırıntı navigasyonu" className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary hover:underline">Ana Sayfa</Link>
        <span aria-hidden className="mx-1">›</span>
        <Link href="/rehber" className="hover:text-primary hover:underline">Rehber</Link>
        <span aria-hidden className="mx-1">›</span>
        <span className="text-foreground">{konu.name}</span>
      </nav>

      <header className="mb-6">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold md:text-3xl">
          <BookOpen className="h-7 w-7 text-primary" />
          {konu.name} Rehberi
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{aciklama}</p>
      </header>

      <GuideTopicStrip konular={konular.filter((k) => k.parent_id === null)} aktif={slug} />

      <GuideCardList
        yazilar={yazilar}
        bosMesaj={`${konu.name} rehberi henüz hazırlanıyor.`}
      />
    </div>
  );
}
