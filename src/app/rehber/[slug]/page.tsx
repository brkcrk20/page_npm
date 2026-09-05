import type { Metadata } from 'next';

import { seoAciklama, seoBaslik } from '@/lib/seo-metin';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { JsonLd } from '@/components/JsonLd';
import { getGuideBySlug, getRelatedGuides } from '@/lib/queries/guides';
import { guideCoverUrl } from '@/lib/supabase/storage';
import { getServiceConfig } from '@/lib/services-config';
import { SITE_URL } from '@/lib/site';

/**
 * Rehber yazısı.
 *
 * Sayfanın sonundaki "ilgili" bloğu rehberin varlık sebebi: aramadan gelen
 * kullanıcı yazıyı okuyup çıkmasın, aradığı ilana ya da hizmete geçsin.
 * Bağlantılar yazının kendi alanlarından üretiliyor; elle yazılan bir
 * bağlantı listesi zamanla kırılırdı.
 */

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const yazi = await getGuideBySlug(slug);
  if (!yazi) return { title: 'Rehber Yazısı Bulunamadı' };

  const kapak = guideCoverUrl(yazi.cover_path);
  const ham = yazi.seo_description ?? yazi.excerpt ?? null;
  const aciklama = ham ? seoAciklama(ham) : undefined;

  return {
    // Yönetimden yazılan başlık da sınırdan geçiyor; elle yazılan metnin
    // 60 karakteri aşması şablonun aşmasından daha olası.
    title: seoBaslik(yazi.seo_title ?? yazi.title),
    description: aciklama,
    alternates: { canonical: `/rehber/${yazi.slug}` },
    openGraph: {
      type: 'article',
      title: yazi.title,
      description: aciklama,
      url: new URL(`/rehber/${yazi.slug}`, SITE_URL).toString(),
      ...(kapak ? { images: [{ url: new URL(kapak, SITE_URL).toString(), alt: yazi.title }] } : {}),
    },
  };
}

export const revalidate = 300;

export default async function GuidePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const yazi = await getGuideBySlug(slug);
  if (!yazi) notFound();

  const kapak = guideCoverUrl(yazi.cover_path);
  const paragraflar = yazi.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  // Okuma süresi: dakikada ~200 kelime. Listede ve yazının başında
  // gösteriliyor; okuyucunun yazıya girip girmeme kararını kolaylaştırıyor.
  const kelime = yazi.body.trim().split(/\s+/).length;
  const okumaDakika = Math.max(1, Math.round(kelime / 200));

  // İlgili yazılar — iç bağlantı ağının ikinci ayağı.
  const digerYazilar = await getRelatedGuides(yazi.slug, yazi.guide_topics?.slug);

  // İlgili bağlantılar yazının alanlarından üretiliyor.
  const ilgili: { label: string; href: string }[] = [];
  if (yazi.breeds) {
    const kategoriSlug = yazi.categories?.slug;
    if (kategoriSlug) {
      ilgili.push({
        label: `${yazi.breeds.name} ilanları`,
        href: `/${kategoriSlug}/${yazi.breeds.slug}`,
      });
    }
  } else if (yazi.categories) {
    ilgili.push({ label: `${yazi.categories.name}`, href: `/${yazi.categories.slug}` });
  }
  if (yazi.related_service) {
    const svc = getServiceConfig(yazi.related_service as never);
    ilgili.push({
      label: yazi.cities ? `${yazi.cities.name} ${svc.label}` : svc.label,
      href: yazi.cities ? `/${svc.slug}/${yazi.cities.slug}` : `/${svc.slug}`,
    });
  }
  for (const b of yazi.related_links ?? []) {
    if (b?.label && b?.href?.startsWith('/')) ilgili.push(b);
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-6">
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: yazi.title,
            description: yazi.excerpt ?? undefined,
            datePublished: yazi.published_at ?? undefined,
            dateModified: yazi.published_at ?? undefined,
            inLanguage: 'tr-TR',
            wordCount: kelime,
            articleSection: yazi.guide_topics?.name,
            mainEntityOfPage: new URL(`/rehber/${yazi.slug}`, SITE_URL).toString(),
            author: { '@type': 'Organization', name: 'PetSemti' },
            publisher: {
              '@type': 'Organization',
              name: 'PetSemti',
              logo: {
                '@type': 'ImageObject',
                url: new URL('/marka/amblem-512.png', SITE_URL).toString(),
              },
            },
            ...(kapak ? { image: new URL(kapak, SITE_URL).toString() } : {}),
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
              { '@type': 'ListItem', position: 2, name: 'Rehber', item: `${SITE_URL}/rehber` },
              ...(yazi.guide_topics
                ? [
                    {
                      '@type': 'ListItem',
                      position: 3,
                      name: yazi.guide_topics.name,
                      item: `${SITE_URL}/rehber/konu/${yazi.guide_topics.slug}`,
                    },
                  ]
                : []),
              {
                '@type': 'ListItem',
                position: yazi.guide_topics ? 4 : 3,
                name: yazi.title,
                item: `${SITE_URL}/rehber/${yazi.slug}`,
              },
            ],
          },
        ]}
      />

      <nav aria-label="Kırıntı navigasyonu" className="mb-4 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary hover:underline">Ana Sayfa</Link>
        <span aria-hidden className="mx-1">›</span>
        <Link href="/rehber" className="hover:text-primary hover:underline">Rehber</Link>
        {yazi.guide_topics && (
          <>
            <span aria-hidden className="mx-1">›</span>
            <Link
              href={`/rehber/konu/${yazi.guide_topics.slug}`}
              className="hover:text-primary hover:underline"
            >
              {yazi.guide_topics.name}
            </Link>
          </>
        )}
      </nav>

      <article>
        <h1 className="text-2xl font-bold leading-tight md:text-3xl">{yazi.title}</h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {yazi.published_at && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <time dateTime={yazi.published_at}>
                {new Date(yazi.published_at).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
            </span>
          )}
          <span>{okumaDakika} dakikalık okuma</span>
        </p>

        {kapak && (
          <div className="relative mt-5 aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
            <Image src={kapak} alt={yazi.title} fill sizes="(max-width:768px) 100vw, 768px" className="object-cover" priority />
          </div>
        )}

        {yazi.excerpt && (
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{yazi.excerpt}</p>
        )}

        <div className="mt-5 space-y-4 leading-relaxed">
          {paragraflar.map((p) =>
            // "## " ile başlayan satır ara başlık; tam bir markdown çözücü
            // yüklemek bu kadarlık biçim için gereksiz ağırlık olurdu.
            p.startsWith('## ') ? (
              <h2 key={p} className="pt-2 text-xl font-bold">{p.slice(3)}</h2>
            ) : (
              <p key={p} className="whitespace-pre-line">{p}</p>
            )
          )}
        </div>
      </article>

      {ilgili.length > 0 && (
        <section className="mt-10 rounded-2xl border bg-secondary/40 p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <BookOpen className="h-4 w-4 text-primary" />
            Bu yazıyla ilgili
          </h2>
          <ul className="mt-3 space-y-2">
            {ilgili.map((b) => (
              <li key={b.href}>
                <Button asChild variant="outline" className="w-full justify-between bg-card">
                  <Link href={b.href}>
                    {b.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {digerYazilar.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold">
            İlgili rehber yazıları
          </h2>
          <ul className="space-y-2">
            {digerYazilar.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/rehber/${d.slug}`}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3.5 transition-colors hover:border-primary"
                >
                  <span className="min-w-0">
                    <span className="block font-medium leading-snug">{d.title}</span>
                    {d.excerpt && (
                      <span className="mt-0.5 line-clamp-1 block text-sm text-muted-foreground">
                        {d.excerpt}
                      </span>
                    )}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 text-center">
        <Link href="/rehber" className="text-sm text-primary hover:underline">
          ← Tüm rehber yazıları
        </Link>
      </p>
    </div>
  );
}
