import Link from 'next/link';

import { ListingGrid } from '@/components/listings/ListingGrid';
import { CategorySidebar } from '@/components/layout/CategorySidebar';
import { PigeonBreedSidebar } from '@/components/listings/PigeonBreedSidebar';
import type { ListingCard } from '@/lib/queries/listings';
import type { Category, SidebarData } from '@/lib/queries/catalog';

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
  sidebar,
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
  sidebar: SidebarData;
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
            {/* Güvercinde ırk menüsü kategoriye özel: 59 ırk gruplu
                gösteriliyor ve kategori seçimi diye bir şey yok — ziyaretçi
                zaten güvercinde. Şehir menüsü altında ayrıca duruyor. */}
            <div className="sticky top-4 space-y-4">
              {category.code === 'Pigeon' ? (
                <>
                  <PigeonBreedSidebar
                    breeds={sidebar.categories.find((c) => c.id === category.id)?.breeds ?? []}
                    categorySlug={category.slug}
                    categoryName={category.name}
                    activeBreedSlug={activeBreedSlug}
                  />
                  <CategorySidebar
                    categories={[]}
                    cities={sidebar.cities}
                    activeCitySlug={activeCitySlug}
                    cityLinkCategorySlug={category.slug}
                  />
                </>
              ) : (
                <CategorySidebar
                  categories={sidebar.categories}
                  cities={sidebar.cities}
                  activeBreedSlug={activeBreedSlug}
                  activeCitySlug={activeCitySlug}
                  cityLinkCategorySlug={category.slug}
                  activeCategoryId={category.id}
                />
              )}
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
