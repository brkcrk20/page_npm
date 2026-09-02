import Link from 'next/link';

import { ListingGrid } from '@/components/listings/ListingGrid';
import { Badge } from '@/components/ui/badge';
import type { ListingCard } from '@/lib/queries/listings';
import type { Breed, Category, City } from '@/lib/queries/catalog';

/**
 * Kategori / cins / şehir sayfalarının ortak gövdesi.
 *
 * Üç sayfa da aynı şeyi gösteriyor: bir başlık, kırıntı navigasyonu, yan
 * menüde daralt seçenekleri ve bir ilan ızgarası. Eskiden bunların her biri
 * ayrı dosyada kopyalanmıştı ve zamanla birbirinden ayrışmıştı — şehir
 * sayfası cinsleri, cins sayfası şehirleri tanımıyordu. Tek bileşende
 * toplamak bu ayrışmayı yapısal olarak imkânsız kılıyor.
 */

type Crumb = { label: string; href?: string };

export function CategoryBrowser({
  title,
  description,
  crumbs,
  listings,
  total,
  breeds,
  cities,
  category,
  activeBreedSlug,
  activeCitySlug,
  emptyMessage,
}: {
  title: string;
  description?: string;
  crumbs: Crumb[];
  listings: ListingCard[];
  total: number;
  breeds: Breed[];
  cities: City[];
  category: Category;
  activeBreedSlug?: string;
  activeCitySlug?: string;
  emptyMessage?: string;
}) {
  return (
    <div className="bg-secondary/50">
      <div className="w-full px-5 pb-10 pt-4 md:container md:mx-auto">
        <nav aria-label="Kırıntı navigasyonu" className="mb-4 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-primary hover:underline">
                Ana Sayfa
              </Link>
            </li>
            {crumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1">
                <span aria-hidden>›</span>
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-primary hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <header className="mb-6">
          <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} ilan bulundu
            {description ? ` · ${description}` : ''}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]">
          <aside className="hidden md:block">
            <div className="sticky top-4 space-y-6">
              <FacetList
                heading="Cinsler"
                items={breeds.map((b) => ({
                  key: b.slug,
                  label: b.name,
                  href: `/${category.slug}/${b.slug}`,
                  active: b.slug === activeBreedSlug,
                }))}
              />
              <FacetList
                heading="Şehirler"
                items={cities.map((c) => ({
                  key: c.slug,
                  label: c.name,
                  href: `/${category.slug}/${c.slug}`,
                  active: c.slug === activeCitySlug,
                }))}
              />
            </div>
          </aside>

          <main>
            <ListingGrid listings={listings} emptyMessage={emptyMessage} />
          </main>
        </div>
      </div>
    </div>
  );
}

function FacetList({
  heading,
  items,
}: {
  heading: string;
  items: { key: string; label: string; href: string; active: boolean }[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-bold">{heading}</h2>
      {/* Uzun listeler (81 şehir, 100+ cins) sayfayı taşırmasın diye kendi
          içinde kayıyor. */}
      <ul className="max-h-80 space-y-1 overflow-y-auto pr-1">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className={
                item.active
                  ? 'flex items-center justify-between rounded-md bg-primary/10 px-2 py-1.5 text-sm font-semibold text-primary'
                  : 'flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-primary'
              }
            >
              <span>{item.label}</span>
              {item.active && (
                <Badge variant="secondary" className="text-[10px]">
                  seçili
                </Badge>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
