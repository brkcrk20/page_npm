import Link from 'next/link';
import { Plus } from 'lucide-react';

import { ListingGrid } from '@/components/listings/ListingGrid';
import { CategorySidebar } from '@/components/layout/CategorySidebar';
import { Button } from '@/components/ui/button';
import type { ListingCard } from '@/lib/queries/listings';
import type { SidebarData } from '@/lib/queries/catalog';

/**
 * İlan TÜRÜNE göre listeleme sayfası (sahiplendirme / satılık).
 *
 * Bu iki bağlantı başlıktaki kategori şeridinde en başından beri vardı ama
 * karşılığı olan sayfa yoktu: her ikisi de 404 veriyordu. Sorgu katmanı
 * (getListings) kind filtresini zaten destekliyordu, kullanan yoktu.
 *
 * Kategoriden ayrı bir sayfa olması SEO açısından da doğru: "ücretsiz
 * sahiplendirme" araması, tür ayrımı yapmayan bir kategori sayfasına değil
 * doğrudan buraya düşmeli.
 */
export function KindBrowser({
  title,
  lead,
  /** Bölümün kendi ilan verme sayfası. */
  createHref = '/ilan-ver',
  createLabel = 'İlan Ver',
  listings,
  total,
  sidebar,
  emptyMessage,
  seo,
}: {
  title: string;
  lead: string;
  createHref?: string;
  createLabel?: string;
  listings: ListingCard[];
  total: number;
  sidebar: SidebarData;
  emptyMessage: string;
  seo: { heading: string; paragraphs: string[] };
}) {
  return (
    <div className="bg-secondary/50">
      <div className="w-full px-5 pb-10 pt-4 md:container md:mx-auto">
        <nav aria-label="Kırıntı navigasyonu" className="mb-3 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary hover:underline">
            Ana Sayfa
          </Link>
          <span aria-hidden className="mx-1">›</span>
          <span className="text-foreground">{title}</span>
        </nav>

        {/* Bu sayfanın kendi ilan verme düğmesi; başka bölüme götürmüyor. */}
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{lead}</p>
            <p className="mt-1 text-sm text-muted-foreground">{total} ilan bulundu</p>
          </div>
          <Button asChild>
            <Link href={createHref}>
              <Plus className="mr-1.5 h-4 w-4" />
              {createLabel}
            </Link>
          </Button>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]">
          <aside className="hidden md:block">
            <div className="sticky top-4">
              <CategorySidebar categories={sidebar.categories} cities={sidebar.cities} />
            </div>
          </aside>

          <main>
            <ListingGrid listings={listings} emptyMessage={emptyMessage} />
          </main>
        </div>

        {/* Arama motorunun indeksleyeceği özgün metin; ilan listesi tek başına
            içerik sayılmıyor. */}
        <section className="mt-12 space-y-3 rounded-xl border bg-white p-6 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-bold text-foreground">{seo.heading}</h2>
          {seo.paragraphs.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}
          <Button asChild size="sm" className="mt-2">
            <Link href={createHref}>{createLabel}</Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
