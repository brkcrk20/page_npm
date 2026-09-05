import type { Metadata } from 'next';

import { seoAciklama, seoBaslik } from '@/lib/seo-metin';
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
/**
 * Konu başına açıklama.
 *
 * Şablon açıklama ("... konusundaki PetSemti rehber yazıları.") 49 karakter
 * kalıyordu; arama sonucunda ayrılan yerin üçte biri bile dolmuyor ve on iki
 * konu sayfası neredeyse aynı cümleyi paylaşıyordu. Alt konular da listeye
 * eklendi — yalnızca üst konuların yazılmış olması, alt konuların hepsini
 * aynı şablona düşürüyordu.
 */
const ACIKLAMA: Record<string, string> = {
  kedi: 'Kedi bakımı, beslenmesi, sağlığı ve davranışı üzerine rehberler. Yavru kedi sahiplenmekten yaşlılık bakımına, günlük hayatta işinize yarayacak bilgiler.',
  'kedi-bakim': 'Kedi bakımının temelleri: tüy tarama, tırnak kesimi, kum kabı düzeni, banyo ve diş bakımı. Evde uygulayabileceğiniz adım adım rehberler.',
  'kedi-beslenme': 'Kedi beslenmesi rehberleri: yaşa göre mama seçimi, yaş-kuru mama dengesi, su tüketimi, yasak besinler ve kilo takibi.',
  'kedi-saglik': 'Kedi sağlığı rehberleri: aşı takvimi, iç ve dış parazit koruması, kısırlaştırma, sık görülen hastalıklar ve veterinere ne zaman gitmeli.',
  kopek: 'Köpek bakımı, eğitimi, beslenmesi ve sağlığı üzerine rehberler. Yavru köpek sahiplenmekten ırka özgü ihtiyaçlara kadar pratik bilgiler.',
  'kopek-bakim': 'Köpek bakımının temelleri: tüy bakımı, tırnak ve kulak temizliği, banyo sıklığı, tasma seçimi ve günlük yürüyüş düzeni.',
  'kopek-egitim': 'Köpek eğitimi rehberleri: temel itaat komutları, tuvalet eğitimi, tasma alışkanlığı, yalnız kalma kaygısı ve davranış problemleri.',
  'kopek-saglik': 'Köpek sağlığı rehberleri: aşı takvimi, parazit koruması, kısırlaştırma, ırka özgü riskler ve acil durumda ne yapmalı.',
  'diger-hayvanlar': 'Kuş, kemirgen, sürüngen ve akvaryum canlıları için bakım rehberleri. Kafes ve teraryum düzeni, beslenme ve sağlık takibi.',
  guvercin: 'Güvercin ırkları, yetiştiricilik, uçuş ve bakım rehberleri. Kümes düzeni, halka numarası, kuluçka ve yarış güvercini bakımı.',
  'kayip-bulundu': 'Kaybolan hayvanı arama, kayıp ilanı verme ve bulunan hayvanı sahibine ulaştırma rehberleri. İlk 24 saatte yapılması gerekenler.',
  hizmetler: 'Veteriner, pet oteli, kuaför, pet taksi ve eğitmen seçerken nelere dikkat etmeli. Soru listeleri ve fiyat beklentileri.',
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
    title: seoBaslik(`${konu.name} Rehberi`),
    description: seoAciklama(aciklama),
    alternates: { canonical: `/rehber/konu/${slug}` },
    openGraph: {
      type: 'website',
      title: `${konu.name} Rehberi | PetSemti`,
      description: aciklama,
      url: new URL(`/rehber/konu/${slug}`, SITE_URL).toString(),
      /* Kendi görseli olmayan sayfa üstteki görseli MİRAS ALMIYOR: openGraph
         alanı çocukta tanımlanınca ebeveyndeki tümüyle yerini bırakıyor.
         Markalı kart burada da açıkça veriliyor. */
      images: [{ url: `${SITE_URL}/marka/paylasim-karti.png`, width: 1200, height: 630 }],
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
