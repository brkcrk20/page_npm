import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock } from 'lucide-react';

import { guideCoverUrl } from '@/lib/supabase/storage';
import type { GuideCard, GuideTopic } from '@/lib/queries/guides';
import { cn } from '@/lib/utils';

/**
 * Rehber kart listesi ve konu şeridi.
 *
 * Rehber ana sayfası ve konu sayfaları aynı listeyi çiziyor; iki yerde
 * kopyalamak, birinde yapılan düzeltmenin öbüründe unutulması demekti.
 */

export function GuideTopicStrip({
  konular,
  aktif,
}: {
  konular: GuideTopic[];
  aktif?: string;
}) {
  return (
    <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1">
      <Link
        href="/rehber"
        className={cn(
          'shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
          !aktif ? 'border-primary bg-primary text-primary-foreground' : 'hover:border-primary'
        )}
      >
        Tümü
      </Link>
      {konular.map((k) => (
        <Link
          key={k.id}
          href={`/rehber/konu/${k.slug}`}
          className={cn(
            'shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
            aktif === k.slug
              ? 'border-primary bg-primary text-primary-foreground'
              : 'hover:border-primary'
          )}
        >
          {k.name}
        </Link>
      ))}
    </div>
  );
}

export function GuideCardList({
  yazilar,
  bosMesaj = 'Rehber hazırlanıyor.',
}: {
  yazilar: GuideCard[];
  bosMesaj?: string;
}) {
  if (yazilar.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-16 text-center">
        <BookOpen className="mx-auto h-10 w-10 text-muted-foreground" />
        <h2 className="mt-3 font-bold">{bosMesaj}</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
          Yeni yazılar eklendikçe burada görünecek.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {yazilar.map((y, i) => {
        const kapak = guideCoverUrl(y.cover_path);
        return (
          <li key={y.id}>
            <Link
              href={`/rehber/${y.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-primary/50"
            >
              <div className="relative aspect-[16/9] bg-muted">
                {kapak ? (
                  <Image
                    src={kapak}
                    alt=""
                    fill
                    sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
                    className="object-cover"
                    /* İlk üç kart ekranın üstünde; geç yüklenmeleri en büyük
                       içerik boyamasını geciktiriyordu. */
                    priority={i < 3}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-4">
                {y.guide_topics && (
                  <span className="text-xs font-semibold text-primary">{y.guide_topics.name}</span>
                )}
                <h2 className="font-bold leading-snug group-hover:text-primary">{y.title}</h2>
                {y.excerpt && (
                  <p className="line-clamp-3 text-sm text-muted-foreground">{y.excerpt}</p>
                )}
                {y.published_at && (
                  <p className="mt-auto flex items-center gap-1 pt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <time dateTime={y.published_at}>
                      {new Date(y.published_at).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </time>
                  </p>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * İlan sayfasının altındaki rehber şeridi.
 *
 * GuideCardList'ten ayrı: orada yazı listesi sayfanın ASIL içeriği, burada
 * yan bir öneri. Aynı büyüklükte kartlar kullanmak ilanın kendisiyle
 * yarışırdı; tek satırlık, kapak görseli küçük bir liste yeterli.
 */
export function GuideStrip({ yazilar, baslik }: { yazilar: GuideCard[]; baslik: string }) {
  if (yazilar.length === 0) return null;

  return (
    <section className="mt-6 overflow-hidden rounded-lg border bg-white">
      <h2 className="border-l-4 border-primary px-4 py-3 font-bold">{baslik}</h2>
      <ul className="divide-y border-t">
        {yazilar.map((yazi) => {
          const kapak = guideCoverUrl(yazi.cover_path);
          return (
            <li key={yazi.id}>
              <Link
                href={`/rehber/${yazi.slug}`}
                className="flex items-center gap-3 p-3 transition-colors hover:bg-accent"
              >
                <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded bg-muted">
                  {kapak ? (
                    <Image src={kapak} alt="" fill sizes="80px" className="object-cover" />
                  ) : (
                    <BookOpen className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{yazi.title}</span>
                  {yazi.excerpt && (
                    <span className="mt-0.5 line-clamp-2 block text-sm text-muted-foreground">
                      {yazi.excerpt}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
