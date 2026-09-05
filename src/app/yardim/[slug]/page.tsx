import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { JsonLd } from '@/components/JsonLd';
import { SITE_URL } from '@/lib/site';
import { getListingSettings } from '@/lib/queries/site-settings';
import { seoAciklama, seoBaslik } from '@/lib/seo-metin';
import { YARDIM_YAZILARI, yardimYazisiBul } from '@/lib/yardim';

type Params = { slug: string };

export const revalidate = 3600;

export function generateStaticParams() {
  return YARDIM_YAZILARI.map((y) => ({ slug: y.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const bulunan = yardimYazisiBul(slug);
  if (!bulunan) return { title: 'Yardım Konusu Bulunamadı' };

  return {
    title: seoBaslik(bulunan.yazi.baslik),
    description: seoAciklama(bulunan.yazi.ozet),
    alternates: { canonical: `/yardim/${slug}` },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const bulunan = yardimYazisiBul(slug);
  if (!bulunan) notFound();

  const { yazi, grup } = bulunan;
  const { maxPhotos, durationDays } = await getListingSettings();
  const ayarlar = { maxPhotos, durationDays };

  const paragraflar = yazi.govde(ayarlar);
  const sorular = yazi.sorular?.(ayarlar) ?? [];

  // Aynı gruptaki diğer yazılar: okuyucunun sorusu çoğu zaman tek başına
  // gelmiyor ("ilan nasıl verilir" sorusunun ardından "ne kadar yayında
  // kalır" geliyor).
  const digerleri = grup.yazilar.filter((y) => y.slug !== yazi.slug);

  return (
    <div className="bg-secondary/30">
      {sorular.length > 0 && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: sorular.map((s) => ({
              '@type': 'Question',
              name: s.soru,
              acceptedAnswer: { '@type': 'Answer', text: s.cevap },
            })),
          }}
        />
      )}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Yardım Merkezi', item: `${SITE_URL}/yardim` },
            {
              '@type': 'ListItem',
              position: 3,
              name: yazi.baslik,
              item: `${SITE_URL}/yardim/${yazi.slug}`,
            },
          ],
        }}
      />

      <div className="mx-auto w-full max-w-3xl px-5 py-8 md:py-12">
        <nav aria-label="Kırıntı navigasyonu" className="mb-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary hover:underline">
            Ana Sayfa
          </Link>
          <span aria-hidden className="mx-1">›</span>
          <Link href="/yardim" className="hover:text-primary hover:underline">
            Yardım Merkezi
          </Link>
          <span aria-hidden className="mx-1">›</span>
          <span className="text-foreground">{yazi.baslik}</span>
        </nav>

        <article className="rounded-xl border bg-white p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">{grup.ad}</p>
          <h1 className="mt-1 text-2xl font-bold md:text-3xl">{yazi.baslik}</h1>

          <div className="mt-5 space-y-4 text-sm leading-relaxed text-foreground/90">
            {paragraflar.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>

          {sorular.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 text-lg font-bold">Sık Sorulan Sorular</h2>
              <dl className="divide-y border-t">
                {sorular.map((s) => (
                  <div key={s.soru} className="py-3.5">
                    <dt className="font-medium">{s.soru}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {s.cevap}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {yazi.baglantilar && yazi.baglantilar.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2 border-t pt-5">
              {yazi.baglantilar.map((b) => (
                <Link
                  key={b.href}
                  href={b.href}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  {b.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          )}
        </article>

        {digerleri.length > 0 && (
          <section className="mt-6 overflow-hidden rounded-xl border bg-white">
            <h2 className="border-l-4 border-primary px-5 py-3.5 font-bold">
              {grup.ad} başlığındaki diğer konular
            </h2>
            <ul className="divide-y border-t">
              {digerleri.map((y) => (
                <li key={y.slug}>
                  <Link
                    href={`/yardim/${y.slug}`}
                    className="flex items-center justify-between gap-3 px-5 py-3 transition-colors hover:bg-accent"
                  >
                    <span className="min-w-0">
                      <span className="block font-medium">{y.baslik}</span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{y.ozet}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <Link
          href="/yardim"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Yardım Merkezi’ne dön
        </Link>
      </div>
    </div>
  );
}
