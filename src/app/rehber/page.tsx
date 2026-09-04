import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock } from 'lucide-react';

import { getGuides, getGuideTopics } from '@/lib/queries/guides';
import { businessImageUrl } from '@/lib/supabase/storage';
import { cn } from '@/lib/utils';

/**
 * PetSemti Rehber.
 *
 * Sitede ilan ve hizmet vardı, bilgi yoktu. "Yavru köpek sahiplenirken
 * nelere dikkat edilir", "köpeklerde aşı takvimi", "kedim kayboldu ne
 * yapmalıyım" aramada en çok yazılan sorular ve karşılığı olmadığı için o
 * kullanıcılar siteye hiç uğramıyordu.
 *
 * Rehber blogdan farklı: her yazı ilgili ilan listesine, cinse ya da
 * hizmet rehberine bağlanıyor. Amaç yazı okutmak değil, aramadan geleni
 * doğru bölüme götürmek.
 */

export const metadata: Metadata = {
  title: 'PetSemti Rehber — Bakım, Beslenme, Sağlık ve Sahiplenme Rehberleri',
  description:
    'Kedi ve köpek bakımı, beslenme, aşı takvimi, sahiplenme öncesi bilinmesi gerekenler, kayıp hayvan rehberi ve hizmet seçimi. PetSemti Rehber.',
  alternates: { canonical: '/rehber' },
};

export const revalidate = 300;

type SP = Promise<{ konu?: string }>;

export default async function RehberPage({ searchParams }: { searchParams: SP }) {
  const { konu } = await searchParams;
  const [yazilar, konular] = await Promise.all([getGuides({ topicSlug: konu }), getGuideTopics()]);

  const ustKonular = konular.filter((k) => k.parent_id === null);
  const seciliKonu = konu ? konular.find((k) => k.slug === konu) : undefined;

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-6">
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

      {/* Konu şeridi */}
      <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
        <Link
          href="/rehber"
          className={cn(
            'shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
            !konu ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary'
          )}
        >
          Tümü
        </Link>
        {ustKonular.map((k) => (
          <Link
            key={k.id}
            href={`/rehber?konu=${k.slug}`}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
              konu === k.slug
                ? 'border-primary bg-primary text-primary-foreground'
                : 'hover:border-primary'
            )}
          >
            {k.name}
          </Link>
        ))}
      </div>

      {yazilar.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 font-bold">
            {seciliKonu ? `${seciliKonu.name} rehberi henüz hazırlanıyor` : 'Rehber hazırlanıyor'}
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Yeni yazılar eklendikçe burada görünecek.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {yazilar.map((y) => {
            const kapak = businessImageUrl(y.cover_path);
            return (
              <li key={y.id}>
                <Link
                  href={`/rehber/${y.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-primary/50"
                >
                  <div className="relative aspect-[16/9] bg-muted">
                    {kapak ? (
                      <Image src={kapak} alt="" fill sizes="(max-width:640px) 100vw, 33vw" className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 p-4">
                    {y.guide_topics && (
                      <span className="text-xs font-semibold text-primary">
                        {y.guide_topics.name}
                      </span>
                    )}
                    <h2 className="font-bold leading-snug group-hover:text-primary">{y.title}</h2>
                    {y.excerpt && (
                      <p className="line-clamp-3 text-sm text-muted-foreground">{y.excerpt}</p>
                    )}
                    {y.published_at && (
                      <p className="mt-auto flex items-center gap-1 pt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(y.published_at).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
