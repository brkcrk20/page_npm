import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { kategoriRengi } from '@/lib/kategori-renkleri';
import type { Metadata } from 'next';

import { Button } from '@/components/ui/button';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { CategorySidebar } from '@/components/layout/CategorySidebar';
import { getSidebarData } from '@/lib/queries/catalog';
import { createSupabasePublicClient } from '@/lib/supabase/server';
import { getListings, getFeaturedListings } from '@/lib/queries/listings';

/**
 * Ana sayfa.
 *
 * Server component: veriyi sunucuda çekiyor, arama motoru dolu HTML görüyor.
 * Tek veri kaynağı public.listings; koda gömülü örnek ilan yok.
 */

export const metadata: Metadata = {
  // Ana sayfanın kendi başlığı yok: kök adres marka başlığını kullanıyor
  // (bkz. app/layout.tsx). Buraya ayrı bir başlık yazmak, aynı sayfayı iki
  // farklı isimle tanıtmak olurdu.
  description:
    'Kedi, köpek, kuş, akvaryum ve güvercin ilanları; kayıp-bulundu; veteriner, pet oteli ve kuaför rehberi. Irka, ile ve ilçeye göre inceleyin, sahibiyle doğrudan görüşün.',
};

/**
 * Her istekte taze veri çekiliyordu (force-dynamic) ve sayfa sekiz sorgu
 * yapıyor. Veritabanı Singapur'da olduğu için bu, kullanıcı başına birkaç
 * saniyelik bekleme demekti.
 *
 * Bir ilan sitesinde ana sayfanın 60 saniye gecikmeyle güncellenmesinin
 * pratik bir maliyeti yok; ilan sahibi kendi ilanını zaten kendi
 * sayfasından görüyor.
 */
export const revalidate = 60;

export default async function HomePage() {
  const sidebar = await getSidebarData();

  const [featured, categorySections] = await Promise.all([
    getFeaturedListings(8),
    Promise.all(
      sidebar.categories.map(async (category) => {
        const { listings, total } = await getListings({
          categoryId: category.id,
          perPage: 8,
        });
        return { category, listings, total };
      })
    ),
  ]);

  const totalListings = categorySections.reduce((sum, s) => sum + s.total, 0);

  /**
   * Ana sayfa sayaçları tek bir RPC'den.
   *
   * Kullanıcı sayısını istemciden saymak mümkün değil: profiles üzerindeki
   * RLS yalnızca kişinin kendi satırını gösteriyor. RPC yalnızca toplamları
   * döndürüyor, satırlar dışarı çıkmıyor.
   */
  const { data: statsRow } = await createSupabasePublicClient().rpc('site_stats');
  const stats = (Array.isArray(statsRow) ? statsRow[0] : statsRow) ?? {
    listings_active: totalListings,
    members: 0,
    online_now: 0,
  };


  return (
    <div className="bg-secondary/50">
      <div className="w-full px-5 pb-10 pt-6 md:container md:mx-auto">
        {/* Her sayfanın kendi ilan verme düğmesi var; alt menüdeki genel
            "+" kaldırıldı. Buradan verilen ilan hayvan ilanı. */}
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Evcil Hayvan İlanları</h1>
            {/* Tek satırlık marka cümlesi. Kaldırdığımız büyük giriş bölümünü
                geri getirmiyor; sayfanın ilanlarla başlaması korunuyor ama
                ziyaretçi "burası ne" sorusunun cevabını görüyor. Aynı cümle
                alt bilgide ve site açıklamasında da geçiyor. */}
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              İlanlar, yerel pet hizmetleri ve güvercin dünyası tek platformda.
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {stats.listings_active} ilan yayında · {stats.members} üye
            </p>
          </div>
          <Button asChild>
            <Link href="/ilan-ver/sahiplendirme">
              <Plus className="mr-1.5 h-4 w-4" />
              Hayvan İlanı Ver
            </Link>
          </Button>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr]">
          <aside className="hidden md:block">
            <div className="sticky top-4">
              <CategorySidebar categories={sidebar.categories} cities={sidebar.cities} />
            </div>
          </aside>

          <main className="min-w-0 space-y-10">
            {totalListings === 0 && (
              <section className="rounded-xl border border-dashed bg-white p-10 text-center">
                <h2 className="text-2xl font-bold">Henüz yayında ilan yok</h2>
                <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                  PetSemti yeni yayında. İlk ilanı vererek başlayabilirsin.
                </p>
                <Button asChild className="mt-6">
                  <Link href="/ilan-ver/sahiplendirme">Hemen İlan Ver</Link>
                </Button>
              </section>
            )}

            {featured.length > 0 && (
              <section>
                <h2 className="mb-4 text-2xl font-bold">Vitrin İlanları</h2>
                <ListingGrid listings={featured} />
              </section>
            )}


            {categorySections
              .filter((section) => section.listings.length > 0)
              .map(({ category, listings, total }) => (
                <section key={category.id}>
                  {/* Kategori kendi rengini taşıyor: sayfa tek düze siyah-beyaz
                      bir liste olmaktan çıkıyor ve kullanıcı hangi bölüme
                      baktığını renkten anlıyor. */}
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2.5 text-2xl font-bold">
                      <span
                        aria-hidden
                        className={cn('h-6 w-1.5 rounded-full', kategoriRengi(category.code).dolu)}
                      />
                      {category.name}
                    </h2>
                    <Button variant="link" asChild className="text-primary">
                      <Link href={`/${category.slug}`}>
                        Tümünü Gör ({total}) <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <ListingGrid listings={listings} />
                </section>
              ))}

          </main>
        </div>
      </div>
    </div>
  );
}
