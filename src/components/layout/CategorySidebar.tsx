'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { BreedAvatar } from '@/components/BreedAvatar';
import { cn } from '@/lib/utils';

/**
 * Sol menü: kategori/cins listesi ve şehir listesi.
 *
 * Tek bileşen iki sekme taşıyor. Eskiden kategori menüsü ana sayfada, şehir
 * menüsü kategori sayfalarında ayrı ayrı yazılmıştı ve ikisi zamanla
 * ayrışmıştı; burada birleşiyorlar.
 *
 * Arama kutusu istemci tarafında filtreliyor: cins sayısı 100 civarında,
 * sunucuya gitmek gereksiz gecikme olurdu.
 */

export type SidebarBreed = {
  id: number;
  slug: string;
  name: string;
  count: number;
};

export type SidebarCategory = {
  id: number;
  slug: string;
  name: string;
  code: string;
  count: number;
  breeds: SidebarBreed[];
};

export type SidebarCity = {
  id: number;
  slug: string;
  name: string;
  count: number;
};

export function CategorySidebar({
  categories,
  cities,
  activeBreedSlug,
  activeCitySlug,
  /** Şehir bağlantılarının hangi kategori altına gideceği. */
  cityLinkCategorySlug = 'kopek-ilanlari',
}: {
  categories: SidebarCategory[];
  cities: SidebarCity[];
  activeBreedSlug?: string;
  activeCitySlug?: string;
  cityLinkCategorySlug?: string;
}) {
  const [tab, setTab] = useState<'kategoriler' | 'sehirler'>('kategoriler');
  const [query, setQuery] = useState('');

  const normalized = query.trim().toLocaleLowerCase('tr');

  const filteredCategories = useMemo(() => {
    if (!normalized) return categories;
    return categories
      .map((category) => ({
        ...category,
        breeds: category.breeds.filter((b) =>
          b.name.toLocaleLowerCase('tr').includes(normalized)
        ),
      }))
      // Aramada eşleşme kalmayan kategoriyi hiç göstermiyoruz; boş başlık
      // yığını listeyi okunmaz hale getiriyordu.
      .filter((category) => category.breeds.length > 0);
  }, [categories, normalized]);

  const filteredCities = useMemo(() => {
    if (!normalized) return cities;
    return cities.filter((c) => c.name.toLocaleLowerCase('tr').includes(normalized));
  }, [cities, normalized]);

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="grid grid-cols-2 border-b">
        <TabButton active={tab === 'kategoriler'} onClick={() => setTab('kategoriler')}>
          Kategoriler
        </TabButton>
        <TabButton active={tab === 'sehirler'} onClick={() => setTab('sehirler')}>
          Şehirler
        </TabButton>
      </div>

      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === 'kategoriler' ? 'Cins ara...' : 'Şehir ara...'}
            className="h-9 pl-8"
            aria-label={tab === 'kategoriler' ? 'Cins ara' : 'Şehir ara'}
          />
        </div>
      </div>

      {tab === 'kategoriler' ? (
        <div className="max-h-[70vh] overflow-y-auto">
          {filteredCategories.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Sonuç bulunamadı.
            </p>
          ) : (
            filteredCategories.map((category) => (
              <section key={category.id}>
                <Link
                  href={`/${category.slug}`}
                  className="flex items-center justify-between border-y bg-secondary/40 px-4 py-2.5 text-sm font-bold hover:text-primary"
                >
                  <span>{category.name}</span>
                  <span className="text-primary">{category.count}</span>
                </Link>

                <ul>
                  {category.breeds.map((breed) => (
                    <li key={breed.id}>
                      <Link
                        href={`/${category.slug}/${breed.slug}`}
                        className={cn(
                          'flex items-center gap-3 border-b px-4 py-2 text-sm transition-colors hover:bg-secondary/50',
                          breed.slug === activeBreedSlug
                            ? 'bg-primary/5 font-semibold text-primary'
                            : 'text-foreground'
                        )}
                      >
                        <BreedAvatar
                          breedName={breed.name}
                          breedSlug={breed.slug}
                          categorySlug={category.slug}
                          categoryCode={category.code}
                          categoryName={category.name}
                        />
                        <span className="min-w-0 flex-1 truncate">{breed.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {breed.count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-y-auto">
          {filteredCities.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Sonuç bulunamadı.
            </p>
          ) : (
            <ul>
              {filteredCities.map((city) => (
                <li key={city.id}>
                  <Link
                    href={`/${cityLinkCategorySlug}/${city.slug}`}
                    className={cn(
                      'flex items-center justify-between border-b px-4 py-2 text-sm transition-colors hover:bg-secondary/50',
                      city.slug === activeCitySlug
                        ? 'bg-primary/5 font-semibold text-primary'
                        : 'text-foreground'
                    )}
                  >
                    <span>{city.name}</span>
                    <span className="text-xs text-muted-foreground">{city.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-3 text-sm font-semibold transition-colors',
        active
          ? 'border-b-2 border-primary text-primary'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}
