import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, LifeBuoy, Mail } from 'lucide-react';

import { JsonLd } from '@/components/JsonLd';
import { SITE_URL } from '@/lib/site';
import { getListingSettings } from '@/lib/queries/site-settings';
import { YARDIM_GRUPLARI, sikSorulanlar } from '@/lib/yardim';

export const metadata: Metadata = {
  title: 'Yardım Merkezi — Sık Sorulan Sorular',
  description:
    'PetSemti yardım merkezi: ilan verme, kimlik doğrulama, telefon görünürlüğü, dolandırıcılıktan korunma ve şikayet konularında sık sorulan sorular.',
  alternates: { canonical: '/yardim' },
};

export const revalidate = 3600;

/**
 * Yardım Merkezi.
 *
 * Site büyüdükçe aynı sorular iletişim formundan gelmeye başladı: "neden
 * fiyat yazamıyorum", "onaylı rozeti ne demek", "numaramı kim görüyor".
 * Bunların cevabı tek tek e-postayla verilecek şeyler değil; hem soran
 * kişiyi bekletiyor hem de aynı cevabı defalarca yazdırıyor.
 *
 * Sayfa aynı zamanda arama tarafında karşılık buluyor: "petsemti ilan
 * nasıl verilir", "sahiplendirme ilanında para istenir mi" gibi aramalar
 * doğrudan buraya düşüyor.
 */
export default async function Page() {
  const { maxPhotos, durationDays } = await getListingSettings();
  const ayarlar = { maxPhotos, durationDays };
  const sorular = sikSorulanlar(ayarlar);

  return (
    <div className="bg-secondary/30">
      {/* SSS işaretlemesi yalnızca aşağıda GÖRÜNEN soruları taşıyor. */}
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
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Yardım Merkezi', item: `${SITE_URL}/yardim` },
          ],
        }}
      />

      <div className="mx-auto w-full max-w-4xl px-5 py-8 md:py-12">
        <nav aria-label="Kırıntı navigasyonu" className="mb-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary hover:underline">
            Ana Sayfa
          </Link>
          <span aria-hidden className="mx-1">›</span>
          <span className="text-foreground">Yardım Merkezi</span>
        </nav>

        <header className="rounded-xl border bg-white p-6 md:p-8">
          <div className="flex items-start gap-4">
            <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-primary sm:flex">
              <LifeBuoy className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">Yardım Merkezi</h1>
              <p className="mt-2 text-muted-foreground">
                İlan verme, hesap, güvenlik ve bölümlerle ilgili sorularınızın cevapları.
                Aradığınızı bulamazsanız iletişim sayfasından yazın.
              </p>
            </div>
          </div>
        </header>

        <div className="mt-6 space-y-6">
          {YARDIM_GRUPLARI.map((grup) => (
            <section key={grup.slug} className="overflow-hidden rounded-xl border bg-white">
              <div className="border-l-4 border-primary px-5 py-4">
                <h2 className="font-bold">{grup.ad}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{grup.aciklama}</p>
              </div>
              <ul className="divide-y border-t">
                {grup.yazilar.map((yazi) => {
                  const Icon = yazi.icon;
                  return (
                    <li key={yazi.slug}>
                      <Link
                        href={`/yardim/${yazi.slug}`}
                        className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-accent"
                      >
                        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{yazi.baslik}</span>
                          <span className="mt-0.5 block text-sm text-muted-foreground">
                            {yazi.ozet}
                          </span>
                        </span>
                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-6 rounded-xl border bg-white p-6 md:p-8">
          <h2 className="text-lg font-bold">Sık Sorulan Sorular</h2>
          <dl className="mt-3 divide-y">
            {sorular.map((s) => (
              <div key={s.soru} className="py-3.5 first:pt-0 last:pb-0">
                <dt className="font-medium">{s.soru}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.cevap}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-6 flex flex-col items-start gap-3 rounded-xl border bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold">Cevabını bulamadınız mı?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sorunuzu yazın, en kısa sürede dönüş yapalım.
            </p>
          </div>
          <Link
            href="/iletisim"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Mail className="h-4 w-4" />
            İletişime geçin
          </Link>
        </section>
      </div>
    </div>
  );
}
