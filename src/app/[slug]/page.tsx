import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

import { CategoryBrowser } from '@/components/listings/CategoryBrowser';
import { ListingDetail } from '@/components/listings/ListingDetail';
import {
  getCategoryBySlug,
  getBreedsByCategoryId,
  getCities,
} from '@/lib/queries/catalog';
import { getListings, getListingById } from '@/lib/queries/listings';
import { resolveRootSegment } from '@/lib/routing';

/**
 * Kökteki tek segment: /<kategori> VEYA /<baslik-slug>-<ilanNo>
 *
 * İkisi aynı konumda olduğu için Next.js'te iki ayrı dinamik route
 * tanımlanamıyor; ayrımı burada yapıyoruz. Ayrım belirsiz değil: ilan URL'i
 * her zaman "-<sayı>" ile biter, kategori slug'ları asla rakamla bitmez.
 *
 * /veteriner, /login, /ilan-ver gibi statik yollar Next.js tarafından dinamik
 * route'tan önce eşleştirildiği için buraya hiç ulaşmaz.
 */

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolution = resolveRootSegment(slug);

  if (resolution?.kind === 'category') {
    const category = await getCategoryBySlug(slug);
    if (category) {
      return {
        title: `${category.name} — Satılık ve Ücretsiz Sahiplendirme | PetSemti`,
        description: `Türkiye genelindeki güncel ${category.name.toLowerCase()}. Semtinizdeki ilanları görün, güvenle sahiplenin.`,
      };
    }
  }

  if (resolution?.kind === 'listing') {
    const listing = await getListingById(resolution.ilanNo);
    if (listing) {
      return {
        title: `${listing.title} | PetSemti`,
        description: listing.description.slice(0, 160),
      };
    }
  }

  return { title: 'Sayfa Bulunamadı | PetSemti' };
}

export default async function RootSlugPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const resolution = resolveRootSegment(slug);

  if (!resolution) notFound();

  // --- Kategori sayfası ---
  if (resolution.kind === 'category') {
    const category = await getCategoryBySlug(slug);
    if (!category) notFound();

    const [{ listings, total }, breeds, cities] = await Promise.all([
      getListings({ categoryId: category.id }),
      getBreedsByCategoryId(category.id),
      getCities(),
    ]);

    return (
      <CategoryBrowser
        title={category.name}
        crumbs={[{ label: category.name }]}
        listings={listings}
        total={total}
        breeds={breeds}
        cities={cities}
        category={category}
        emptyMessage={`Şu an yayında ${category.name.toLowerCase()} yok. İlk ilanı sen ver!`}
      />
    );
  }

  // --- İlan detay ---
  if (resolution.kind === 'listing') {
    const listing = await getListingById(resolution.ilanNo);
    if (!listing) notFound();

    // Başlık değişmişse slug da değişmiştir; eski adresi kanonik adrese
    // yönlendiriyoruz ki arama motorunda tek bir sürüm kalsın.
    //
    // redirect() değil permanentRedirect(): redirect() 307 (geçici) döner ve
    // arama motoru eski adresi indekste tutmaya devam eder. Kanonikleştirmenin
    // işe yaraması için 308 gerekiyor.
    if (listing.slug !== resolution.slug) {
      permanentRedirect(`/${listing.slug}-${listing.id}`);
    }

    return <ListingDetail listing={listing as any} />;
  }

  // "-<sayı>" ile bitmeyen ve kategori de olmayan eski adresler.
  notFound();
}
