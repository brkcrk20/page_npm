'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { BreedAvatar } from '@/components/BreedAvatar';
import { kategoriRengi } from '@/lib/kategori-renkleri';
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
  /** Bulunulan kategori; menüde yalnızca onun cinsleri açık başlar. */
  activeCategoryId,
  /**
   * Kategori listesi yerine gösterilecek özel tür listesi.
   *
   * Güvercin ve pet malzemeleri kendi dikeyleri: orada "kategori" seçmek
   * anlamsız, ama "ırk" ve "malzeme türü" seçmek gerekiyor. Önceden bu iki
   * sayfada ayrı bir panel ve altında ikinci bir şehir paneli duruyordu;
   * site genelinde menü tek panel ve iki sekme olduğu için tutarsızdı.
   */
  typeGroups,
  typeTabLabel = 'Kategoriler',
  typeLinkBase,
  activeTypeSlug,
}: {
  categories: SidebarCategory[];
  cities: SidebarCity[];
  activeBreedSlug?: string;
  activeCitySlug?: string;
  cityLinkCategorySlug?: string;
  activeCategoryId?: number;
  typeGroups?: [string, { slug: string; name: string; count: number }[]][];
  typeTabLabel?: string;
  typeLinkBase?: string;
  activeTypeSlug?: string;
}) {
  /**
   * Kategori listesi boş verilebiliyor: güvercin sayfası menüyü yalnızca
   * şehir filtresi için kullanıyor, kategori seçimi orada anlamsız
   * (ziyaretçi zaten güvercinde). O durumda sekme çubuğu hiç
   * gösterilmiyor ve doğrudan şehirler açılıyor — boş bir "Kategoriler"
   * sekmesiyle karşılamak kırık görünürdü.
   */
  const hasTypeGroups = Boolean(typeGroups?.length);
  const hasCategories = categories.length > 0 || hasTypeGroups;

  const [tab, setTab] = useState<'kategoriler' | 'sehirler'>(
    hasCategories ? 'kategoriler' : 'sehirler'
  );
  const [query, setQuery] = useState('');

  /**
   * Hangi kategorilerin cins listesi açık.
   *
   * Eskiden hepsi açıktı ve /al-sat gibi kategori ayrımı olmayan sayfalarda
   * menü 161 cins satırı basıyordu: hem 161 avatar isteği hem de içinde
   * gezinilemeyecek bir duvar. Köpek ilanına bakan birine kuş ırklarının
   * tamamını göstermenin bir faydası yok.
   *
   * Bulunulan kategori açık başlıyor; diğerleri tek satıra kapanıyor ve
   * tıklanınca açılıyor. Arama yapıldığında hepsi açılıyor — kullanıcı zaten
   * kategoriler arasında arıyor.
   */
  const [openCategoryIds, setOpenCategoryIds] = useState<number[] | null>(null);
  /** "Tümünü Gör" ile ilanı olmayan cinsleri de açılan kategoriler. */
  const [expandedAll, setExpandedAll] = useState<Set<number>>(() => new Set());

  const normalized = query.trim().toLocaleLowerCase('tr');

  const isOpen = (categoryId: number, index: number) => {
    if (query.trim()) return true;
    if (openCategoryIds !== null) return openCategoryIds.includes(categoryId);
    // Varsayılan: bulunulan kategori; belirlenemiyorsa yalnızca ilki.
    if (activeCategoryId != null) return categoryId === activeCategoryId;
    return index === 0;
  };

  const toggleCategory = (categoryId: number, currentlyOpen: boolean) => {
    setOpenCategoryIds((prev) => {
      const base =
        prev ??
        categories
          .filter((c, i) => (activeCategoryId != null ? c.id === activeCategoryId : i === 0))
          .map((c) => c.id);
      return currentlyOpen ? base.filter((id) => id !== categoryId) : [...base, categoryId];
    });
  };

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
      {hasCategories ? (
        <div className="grid grid-cols-2 border-b">
          <TabButton active={tab === 'kategoriler'} onClick={() => setTab('kategoriler')}>
            {typeTabLabel}
          </TabButton>
          <TabButton active={tab === 'sehirler'} onClick={() => setTab('sehirler')}>
            Şehirler
          </TabButton>
        </div>
      ) : (
        <div className="border-b bg-secondary/50 px-4 py-3">
          <h2 className="font-bold">Şehirler</h2>
          <p className="text-xs text-muted-foreground">İline göre daralt</p>
        </div>
      )}

      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              tab === 'kategoriler'
                ? hasTypeGroups
                  ? `${typeTabLabel} içinde ara...`
                  : 'Cins ara...'
                : 'Şehir ara...'
            }
            className="h-9 pl-8"
            aria-label={tab === 'kategoriler' ? `${typeTabLabel} ara` : 'Şehir ara'}
          />
        </div>
      </div>

      {tab === 'kategoriler' && hasTypeGroups ? (
        /* Özel tür listesi: güvercin ırkları veya malzeme türleri.
           Kategori ağacıyla aynı görsel dili kullanıyor. */
        <div className="max-h-[70vh] overflow-y-auto">
          {(() => {
            const q = query.trim().toLocaleLowerCase('tr-TR');
            const shown = (typeGroups ?? [])
              .map(([g, items]) => [g, q ? items.filter((i) => i.name.toLocaleLowerCase('tr-TR').includes(q)) : items] as const)
              .filter(([, items]) => items.length > 0);

            if (shown.length === 0) {
              return (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Sonuç bulunamadı.
                </p>
              );
            }

            return shown.map(([group, items]) => (
              <section key={group}>
                <div className="border-y bg-secondary/40 px-4 py-2.5 text-sm font-bold">
                  {group}
                </div>
                <ul>
                  {items.map((item) => (
                    <li key={item.slug}>
                      <Link
                        href={`/${typeLinkBase}/${item.slug}`}
                        aria-current={item.slug === activeTypeSlug ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-2 border-b px-4 py-2 text-sm transition-colors last:border-b-0',
                          item.slug === activeTypeSlug
                            ? 'bg-primary/5 font-semibold text-primary'
                            : 'hover:bg-secondary/50'
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate">{item.name}</span>
                        {item.count > 0 && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {item.count}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ));
          })()}
        </div>
      ) : tab === 'kategoriler' ? (
        <div className="max-h-[70vh] overflow-y-auto">
          {filteredCategories.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Sonuç bulunamadı.
            </p>
          ) : (
            filteredCategories.map((category, index) => {
              const open = isOpen(category.id, index);
              return (
              <section key={category.id}>
                {/* Kategori rengi yalnızca ince bir şerit.
                    Önce başlığın tamamı o renge boyanıyordu; yedi kategori
                    yan yana gelince menü alacalı bir listeye dönüşüyordu. */}
                <div className="flex items-stretch border-y bg-secondary/60">
                  <span
                    aria-hidden
                    className={cn('w-1 shrink-0', kategoriRengi(category.code).dolu)}
                  />
                  <Link
                    href={`/${category.slug}`}
                    className="flex flex-1 items-center justify-between px-3 py-2.5 text-sm font-bold hover:text-primary"
                  >
                    <span>{category.name}</span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {category.count}
                    </span>
                  </Link>
                  {/* Başlığın kendisi kategori sayfasına gidiyor; açma
                      kapama ayrı bir düğme olmalı ki ikisi çakışmasın. */}
                  <button
                    type="button"
                    onClick={() => toggleCategory(category.id, open)}
                    aria-expanded={open}
                    aria-label={`${category.name} cinslerini ${open ? 'gizle' : 'göster'}`}
                    className="px-3 text-muted-foreground hover:text-primary"
                  >
                    <ChevronDown
                      className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
                    />
                  </button>
                </div>

                {/* Kapalı kategori HİÇ basılmıyor. hidden ile gizlemek
                    yeterli değildi: 161 satır yine DOM'a giriyor, HTML'i
                    şişiriyor ve React'e boşuna iş çıkarıyordu. */}
                {open && (() => {
                  /**
                   * Popüler cinsler önce, tamamı istendiğinde.
                   *
                   * 161 cinsin tamamı alt alta diziliyordu ve ilanı olan üç
                   * cins, ilanı olmayan yüz elli sekizin arasında
                   * kayboluyordu. Menünün asıl işi "nerede ilan var"
                   * sorusunu cevaplamak.
                   *
                   * İlanı olanlar sayısıyla birlikte üstte; geri kalanı
                   * "Tümünü Gör" ile aynı listenin devamı olarak açılıyor.
                   * Ayrı bir sayfaya göndermek, tek bir cinse bakmak isteyen
                   * kullanıcıyı gereksiz bir adıma sokardı.
                   */
                  const populer = category.breeds.filter((b) => b.count > 0);
                  const digerleri = category.breeds.filter((b) => b.count === 0);
                  const hepsiAcik = expandedAll.has(category.id);
                  const gosterilen = hepsiAcik ? category.breeds : populer;

                  return (
                    <>
                      {populer.length > 0 && !hepsiAcik && (
                        <p className="px-4 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Popüler cinsler
                        </p>
                      )}

                      <ul>
                        {gosterilen.map((breed) => (
                          <li key={breed.id}>
                            <Link
                              href={`/${category.slug}/${breed.slug}`}
                              className={cn(
                                'flex items-center gap-3 border-b px-4 py-2 text-sm transition-colors hover:bg-secondary/60',
                                breed.slug === activeBreedSlug
                                  ? 'bg-primary/8 font-semibold text-primary'
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
                              {breed.count > 0 && (
                                <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-primary">
                                  {breed.count} ilan
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>

                      {digerleri.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedAll((prev) => {
                              const yeni = new Set(prev);
                              if (yeni.has(category.id)) yeni.delete(category.id);
                              else yeni.add(category.id);
                              return yeni;
                            })
                          }
                          className="flex w-full items-center justify-center gap-1 border-b px-4 py-2 text-xs font-medium text-primary hover:bg-secondary/60"
                        >
                          {hepsiAcik
                            ? 'Daha az göster'
                            : `Tümünü Gör (${category.breeds.length})`}
                          <ChevronDown
                            className={cn('h-3.5 w-3.5 transition-transform', hepsiAcik && 'rotate-180')}
                          />
                        </button>
                      )}

                      {populer.length === 0 && !hepsiAcik && (
                        <p className="px-4 py-3 text-xs text-muted-foreground">
                          Bu kategoride henüz ilan yok.
                        </p>
                      )}
                    </>
                  );
                })()}
              </section>
              );
            })
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
