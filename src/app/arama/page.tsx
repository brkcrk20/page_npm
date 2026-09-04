import type { Metadata } from 'next';
import Link from 'next/link';
import { SearchX } from 'lucide-react';

import { ListingGrid } from '@/components/listings/ListingGrid';
import { CategorySidebar } from '@/components/layout/CategorySidebar';
import { Button } from '@/components/ui/button';
import { getCityBySlug, getSidebarData } from '@/lib/queries/catalog';
import { getListings } from '@/lib/queries/listings';

/**
 * Arama sonuçları.
 *
 * Başlıktaki arama kutusu kategori seçilmemişse ana sayfaya `?q=` ile
 * gidiyordu ve ana sayfa bu parametreyi hiç okumuyordu: kullanıcı arama
 * yapıyor, "Bul"a basıyor, ana sayfaya dönüyor ve tüm ilanları görüyordu.
 * Aradığıyla ilgisi olmayan bir liste, hata mesajı bile yok.
 *
 * Arama artık kendi sayfasında. Sonuç sayfasının ayrı bir adresi olması
 * paylaşılabilir ve tarayıcı geçmişinde anlamlı olmasını da sağlıyor.
 */

export const metadata: Metadata = {
  title: 'Arama Sonuçları',
  // Arama sonuçları indekslenmemeli: sonsuz sayıda üretilebilir ve
  // kategori sayfalarıyla kopya içerik yaratır.
  robots: { index: false, follow: true },
};

export const dynamic = 'force-dynamic';

type Params = { q?: string; city?: string; district?: string };

export default async function Page({ searchParams }: { searchParams: Promise<Params> }) {
  const { q, city, district } = await searchParams;
  const term = (q ?? '').trim();

  const sidebar = await getSidebarData();
  const cityRow = city ? await getCityBySlug(city) : null;

  const { listings, total } = await getListings({
    search: term || undefined,
    cityId: cityRow?.id,
    perPage: 24,
  });

  const nerede = [cityRow?.name, district].filter(Boolean).join(' / ');

  return (
    <div className="bg-secondary/50">
      <div className="w-full px-5 pb-10 pt-4 md:container md:mx-auto">
        <nav aria-label="Kırıntı navigasyonu" className="mb-3 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary hover:underline">
            Ana Sayfa
          </Link>
          <span aria-hidden className="mx-1">›</span>
          <span className="text-foreground">Arama</span>
        </nav>

        <header className="mb-5">
          <h1 className="text-2xl font-bold md:text-3xl">
            {term ? `“${term}” için sonuçlar` : 'Arama Sonuçları'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} ilan bulundu{nerede && ` · ${nerede}`}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]">
          <aside className="hidden md:block">
            <div className="sticky top-4">
              <CategorySidebar categories={sidebar.categories} cities={sidebar.cities} />
            </div>
          </aside>

          <main>
            {listings.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-white py-16 text-center">
                <SearchX className="mx-auto h-10 w-10 text-muted-foreground" />
                <h2 className="mt-3 font-bold">Sonuç bulunamadı</h2>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                  {term
                    ? `“${term}” için ilan bulunamadı. Daha genel bir kelime deneyin ya da soldaki menüden kategoriye göre inceleyin.`
                    : 'Aramak için yukarıdaki kutuyu kullanın.'}
                </p>
                <Button asChild className="mt-4" variant="outline">
                  <Link href="/">Tüm İlanlara Dön</Link>
                </Button>
              </div>
            ) : (
              <ListingGrid listings={listings} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
