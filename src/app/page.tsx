import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

import { Button } from '@/components/ui/button';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { getCategories, getBreedsByCategoryId, getCities } from '@/lib/queries/catalog';
import { getListings, getFeaturedListings } from '@/lib/queries/listings';

/**
 * Ana sayfa.
 *
 * Server component: veriyi sunucuda çekiyor, arama motoru dolu HTML görüyor.
 * Eski sürüm 'use client' idi ve iki ayrı kaynaktan besleniyordu — Firestore
 * ve koda gömülü statik "örnek" ilanlar. İkisi de kaldırıldı; tek kaynak
 * Supabase'deki public.listings.
 */

export const metadata: Metadata = {
  title: 'Evcil Hayvan İlanları — Sahiplendirme, Satılık Kedi ve Köpek | PetSemti',
  description:
    'PetSemti: evcil hayvan ilanları, kedi ve köpek sahiplendirme, satılık yavru ilanları. Semtinizdeki en güncel ilanlara ulaşın, güvenle sahiplenin.',
};

// Ana sayfa sık değişen içerik gösteriyor; her istekte taze veri çekiyoruz.
// Trafik arttığında burada revalidate süresi tanımlanabilir.
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const categories = await getCategories();

  const [featured, cities, categorySections] = await Promise.all([
    getFeaturedListings(8),
    getCities(),
    Promise.all(
      categories.map(async (category) => {
        const [{ listings, total }, breeds] = await Promise.all([
          getListings({ categoryId: category.id, perPage: 8 }),
          getBreedsByCategoryId(category.id),
        ]);
        return { category, listings, total, breeds };
      })
    ),
  ]);

  const totalListings = categorySections.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="bg-secondary/50">
      <div className="w-full px-5 pb-10 pt-4 md:container md:mx-auto">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[280px_1fr]">
          {/* --- Yan menü: kategoriler ve cinsleri --- */}
          <aside className="hidden md:block">
            <div className="sticky top-4 space-y-4">
              {categorySections.map(({ category, breeds }) => (
                <div key={category.id} className="rounded-lg bg-white p-4 shadow-sm">
                  <Link
                    href={`/${category.slug}`}
                    className="mb-3 flex items-center justify-between font-bold hover:text-primary"
                  >
                    {category.name}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <ul className="max-h-56 space-y-0.5 overflow-y-auto pr-1">
                    {breeds.slice(0, 40).map((breed) => (
                      <li key={breed.id}>
                        <Link
                          href={`/${category.slug}/${breed.slug}`}
                          className="block rounded px-2 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-primary"
                        >
                          {breed.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="rounded-lg bg-white p-4 shadow-sm">
                <h2 className="mb-3 font-bold">Popüler Şehirler</h2>
                <ul className="space-y-0.5">
                  {['istanbul', 'ankara', 'izmir', 'bursa', 'antalya', 'adana']
                    .map((slug) => cities.find((c) => c.slug === slug))
                    .filter(Boolean)
                    .map((city) => (
                      <li key={city!.id}>
                        <Link
                          href={`/kopek-ilanlari/${city!.slug}`}
                          className="block rounded px-2 py-1 text-sm text-muted-foreground hover:bg-secondary hover:text-primary"
                        >
                          {city!.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* --- İçerik --- */}
          <main className="space-y-10">
            {totalListings === 0 && (
              <section className="rounded-xl border border-dashed bg-white p-10 text-center">
                <h1 className="text-2xl font-bold">Henüz yayında ilan yok</h1>
                <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                  PetSemti yeni yayında. İlk ilanı vererek başlayabilirsin —
                  sahiplendirme ilanları her zaman ücretsiz.
                </p>
                <Button asChild className="mt-6">
                  <Link href="/ilan-ver">Hemen İlan Ver</Link>
                </Button>
              </section>
            )}

            {featured.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Vitrin İlanları</h2>
                </div>
                <ListingGrid listings={featured} />
              </section>
            )}

            {categorySections
              .filter((section) => section.listings.length > 0)
              .map(({ category, listings, total }) => (
                <section key={category.id}>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold">{category.name}</h2>
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
