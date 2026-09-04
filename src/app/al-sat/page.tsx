import type { Metadata } from 'next';
import Link from 'next/link';
import { PackageSearch, Plus } from 'lucide-react';

import { ListingGrid } from '@/components/listings/ListingGrid';
import { CategorySidebar } from '@/components/layout/CategorySidebar';
import { Button } from '@/components/ui/button';
import {
  getBreedsByCategoryId,
  getCategories,
  getSidebarData,
  supplyCategoryId,
} from '@/lib/queries/catalog';
import { getListings } from '@/lib/queries/listings';

export const metadata: Metadata = {
  title: 'İkinci El Pet Malzemeleri — Kafes, Akvaryum, Tasma ve Fazlası',
  description:
    'İkinci el ve sıfır pet malzemeleri: kafes, akvaryum, taşıma çantası, tasma, yatak, oyuncak, kuluçka makinesi ve bakım ürünleri. Şehrinize göre inceleyin, satıcıyla doğrudan görüşün.',
  alternates: { canonical: '/al-sat' },
};

export const revalidate = 60;

/**
 * Al & Sat — ikinci el pet malzemeleri.
 *
 * Bu sayfa eskiden "satılık hayvan ilanları" idi, yani sahiplendirme
 * sayfasının fiyatlı ikizi: aynı ilanlar, aynı ırk/tür filtreleri, farklı
 * süzgeç. İki sayfanın da varlığını haklı çıkaran bir fark yoktu.
 *
 * Artık burada hayvan değil EŞYA satılıyor. Bu yüzden ırk ve tür filtresi
 * yok — onların yerini eşya grupları alıyor (barınak, akvaryum, taşıma,
 * besleme...). Şehir filtresi duruyor: ikinci el eşyada alıcı genellikle
 * elden teslim istiyor.
 */
export default async function Page() {
  const [categories, sidebar] = await Promise.all([getCategories(), getSidebarData()]);
  const supplyId = supplyCategoryId(categories);

  const [{ listings, total }, types] = await Promise.all([
    supplyId
      ? getListings({ categoryId: supplyId, perPage: 24 })
      : Promise.resolve({ listings: [], total: 0 }),
    supplyId ? getBreedsByCategoryId(supplyId) : Promise.resolve([]),
  ]);

  // Eşya türleri grupları altında; sayımlar menü verisinden geliyor.
  const counted = sidebar.categories.find((c) => c.id === supplyId)?.breeds ?? [];
  const countBySlug = new Map(counted.map((b) => [b.slug, b.count]));

  const groups = new Map<string, { slug: string; name: string; count: number }[]>();
  for (const t of types) {
    const key = (t as { group_name?: string | null }).group_name ?? 'Genel';
    const list = groups.get(key) ?? [];
    list.push({ slug: t.slug, name: t.name, count: countBySlug.get(t.slug) ?? 0 });
    groups.set(key, list);
  }

  // Hayvan türleri önce, hepsine uyan ürünler ("Genel") en sonda: menüye
  // bakan kişi önce kendi hayvanını arıyor.
  const GROUP_ORDER = [
    'Köpek Eşyaları',
    'Kedi Eşyaları',
    'Kuş ve Güvercin',
    'Akvaryum ve Balık',
    'Kemirgen ve Tavşan',
    'Sürüngen ve Teraryum',
    'Genel',
  ];
  const orderedGroups: [string, { slug: string; name: string; count: number }[]][] = [
    ...GROUP_ORDER.filter((g) => groups.has(g)).map(
      (g) => [g, groups.get(g)!] as [string, { slug: string; name: string; count: number }[]]
    ),
    ...[...groups.entries()].filter(([g]) => !GROUP_ORDER.includes(g)),
  ];

  return (
    <div className="bg-secondary/50">
      <div className="w-full px-5 pb-10 pt-4 md:container md:mx-auto">
        <nav aria-label="Kırıntı navigasyonu" className="mb-3 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary hover:underline">
            Ana Sayfa
          </Link>
          <span aria-hidden className="mx-1">›</span>
          <span className="text-foreground">Al &amp; Sat</span>
        </nav>

        {/* Bu sayfanın ilan verme düğmesi yalnızca malzeme formunu açıyor. */}
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">İkinci El Pet Malzemeleri</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Kullanmadığınız kafesi, akvaryumu, taşıma çantasını satın; ihtiyacınız olanı
              uygun fiyata bulun. Burada hayvan ilanı yayınlanmaz.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{total} ilan bulundu</p>
          </div>
          <Button asChild>
            <Link href="/ilan-ver/al-sat">
              <Plus className="mr-1.5 h-4 w-4" />
              Malzeme İlanı Ver
            </Link>
          </Button>
        </header>

        {/* Mobilde kenar menüsü gizli; hayvan türü kısayolları burada. */}
        <div className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5 pb-1 md:hidden">
          {orderedGroups.map(([group, items]) => (
            <Link
              key={group}
              href={`/pet-malzemeleri/${items[0].slug}`}
              className="shrink-0 whitespace-nowrap rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:border-primary hover:text-primary"
            >
              {group}
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]">
          <aside className="hidden md:block">
            {/* Malzeme türleri ve şehir. Hayvan kategorisi listesi
                verilmiyor: burada tür seçmek anlamsız. */}
            {/* Tek panel, iki sekme — site genelindeki menüyle aynı yapı. */}
            <div className="sticky top-4">
              <CategorySidebar
                categories={[]}
                cities={sidebar.cities}
                cityLinkCategorySlug="pet-malzemeleri"
                typeGroups={orderedGroups}
                typeTabLabel="Malzemeler"
                typeLinkBase="pet-malzemeleri"
              />
            </div>
          </aside>

          <main>
            {listings.length === 0 ? (
              <div className="rounded-xl border border-dashed bg-white py-16 text-center">
                <PackageSearch className="mx-auto h-10 w-10 text-muted-foreground" />
                <h2 className="mt-3 font-bold">Henüz malzeme ilanı yok</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Kullanmadığınız pet malzemelerini ücretsiz satışa çıkarabilirsiniz.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/ilan-ver/al-sat">Malzeme İlanı Ver</Link>
                </Button>
              </div>
            ) : (
              <ListingGrid listings={listings} />
            )}
          </main>
        </div>

        <section className="mt-12 space-y-3 rounded-xl border bg-white p-6 text-sm leading-relaxed text-muted-foreground">
          <h2 className="text-lg font-bold text-foreground">İkinci El Alırken Nelere Dikkat Etmeli?</h2>
          <p>
            Kafes, taşıma çantası ve akvaryum gibi ürünlerde ölçüler belirleyicidir; ilanda
            yazan iç ölçüleri hayvanınızın boyutuyla karşılaştırın. Fotoğrafta küçük görünen
            bir kafes, kuşunuz için dar kalabilir.
          </p>
          <p>
            Elektrikli ürünlerde (kuluçka makinesi, akvaryum filtresi, ısıtıcı, tıraş
            makinesi) satın almadan önce çalışır durumda görmek en doğrusu. Isıtıcı ve
            filtrelerde kullanım süresi ömrü doğrudan etkiler.
          </p>
          <p>
            Kullanılmış barınak ve kaplar, yeni hayvanınıza girmeden önce iyice temizlenip
            dezenfekte edilmelidir. Hastalık geçişinin en yaygın yollarından biri paylaşılan
            ekipmandır.
          </p>
          <p>
            Ürünü görmeden kapora göndermeyin. Elden teslim, ikinci el alışverişte hem
            fiyatı hem de ürünün durumunu görme imkânı verir.
          </p>
        </section>
      </div>
    </div>
  );
}
