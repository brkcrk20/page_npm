import { notFound, permanentRedirect } from 'next/navigation';
import { SITE_URL } from '@/lib/site';
import { listingHref } from '@/lib/listing-url';
import { listingMetadata } from '@/lib/listing-metadata';
import { ListingDetail } from '@/components/listings/ListingDetail';
import { getPageContent } from '@/lib/queries/page-content';
import type { Metadata } from 'next';

import { CategoryBrowser } from '@/components/listings/CategoryBrowser';
import { PigeonLanding } from '@/components/listings/PigeonLanding';
import { getCategories, getCategoryBySlug, getSidebarData } from '@/lib/queries/catalog';
import {
  getListings,
  getListingById,
  getSellerInfo,
  getSimilarListings,
  getAdjacentListings,
  getListingsWithVideo,
  parseListingParams } from '@/lib/queries/listings';
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

/**
 * 60 saniyelik önbellek.
 *
 * Bu rota hem kategori/cins/şehir listelerini hem de tek tek ilan
 * detaylarını karşılıyor. İkisi de dakikalar ölçeğinde değişen içerik;
 * her istekte Singapur'daki veritabanına gitmek yalnızca beklemeye yol
 * açıyordu. İlan sahibi kendi değişikliğini kendi panelinden anında
 * görüyor, o sayfalar önbelleğe alınmıyor.
 */
export const revalidate = 60;

/**
 * Kategori sayfalarını önceden üret.
 *
 * Bu rota iki işi birden görüyor: kategori sayfaları (/kopek-ilanlari) ve
 * tek tek ilan detayları (/baslik-123). revalidate tek başına yetmiyordu —
 * generateStaticParams olmadan Next rotayı tamamen dinamik sayıyor ve her
 * istekte React ağacını yeniden kuruyor. Ölçüm: kategori sayfası 0,5 sn,
 * aynı işi yapan statik /al-sat 0,07 sn.
 *
 * Yalnızca altı kategori üretiliyor; ilan detayları listede olmadığı için
 * istendiğinde render edilip önbelleğe alınıyor (dynamicParams varsayılan
 * olarak açık). Yani derleme süresi uzamıyor.
 */
export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

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
      // Yönetimden yazılan başlık/açıklama, kategorinin kendi alanlarından
      // önce gelir: metni değiştirmek için yayın gerekmesin.
      const icerik = await getPageContent({ categoryId: category.id });
      if (icerik?.seo_title || icerik?.seo_description) {
        return {
          title: icerik.seo_title ?? `${category.name} İlanları`,
          description: icerik.seo_description ?? undefined,
        };
      }
      // Kategoriye özel SEO metni varsa o kullanılıyor; güvercin gibi kendi
      // terminolojisi olan kategorilerde genel şablon yetersiz kalıyor.
      return {
        title: `${category.seo_title ?? `${category.name} — Satılık ve Sahiplendirme İlanları`}`,
        description:
          category.seo_description ??
          `Türkiye genelindeki güncel ${category.name.toLowerCase()}. Semtinizdeki ilanları görün, güvenle sahiplenin.`,
      };
    }
  }

  if (resolution?.kind === 'listing') {
    const listing = await getListingById(resolution.ilanNo);
    if (listing) return listingMetadata(listing as never);
  }

  return { title: 'Sayfa Bulunamadı' };
}

export default async function RootSlugPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ sirala?: string; min?: string; max?: string; kimden?: string }>;
}) {
  const { slug } = await params;
  const listeParams = parseListingParams(await searchParams);
  const resolution = resolveRootSegment(slug);

  if (!resolution) notFound();

  // --- Kategori sayfası ---
  if (resolution.kind === 'category') {
    const category = await getCategoryBySlug(slug);
    if (!category) notFound();

    const [{ listings, total }, sidebar, icerik] = await Promise.all([
      getListings({ ...listeParams, categoryId: category.id }),
      getSidebarData(),
      getPageContent({ categoryId: category.id }),
    ]);

    // Güvercin kategorisinin kendine özgü giriş sayfası var: alıcı fotoğrafa
    // değil uçuşa bakıyor, bu yüzden videolu ilanlar öne çıkarılıyor ve ırk
    // seçimi görünür kılınıyor. Veri katmanı diğer kategorilerle ortak.
    if (category.code === 'Pigeon') {
      const withVideo = await getListingsWithVideo(category.id);
      return (
        <PigeonLanding
          category={category}
          sidebar={sidebar}
          listings={listings}
          withVideo={withVideo}
          total={total}
        />
      );
    }

    return (
      <CategoryBrowser
        title={category.name}
        crumbs={[{ label: category.name }]}
        listings={listings}
        total={total}
        sidebar={sidebar}
        category={category}
        emptyMessage={`Şu an yayında ${category.name.toLowerCase()} yok. İlk ilanı sen ver!`}
        icerik={icerik}
      />
    );
  }

  // --- İlan detay ---
  if (resolution.kind === 'listing') {
    const listing = await getListingById(resolution.ilanNo);
    if (!listing) notFound();

    /**
     * Kanonik adres: /<sehir>-<cins>-<baslik>-<no>
     *
     * Adres bundan farklıysa (eski düz adres, düzenlenmiş başlık, değişmiş
     * şehir ya da cins) doğru adrese yönlendiriliyor. Kalıcı (308) çünkü
     * geçici yönlendirmede arama motoru eski adresi indekste tutmaya devam
     * ederdi; kanonikleştirmenin işe yaraması için 308 gerekiyor.
     */
    const kanonik = listingHref(listing as never);
    if (kanonik !== `/${slug}`) permanentRedirect(kanonik);

    const detail = listing as any;
    const [seller, similar, adjacent] = await Promise.all([
      getSellerInfo(detail.owner_id),
      getSimilarListings(detail.id, detail.breed_id ?? null, detail.category_id),
      getAdjacentListings(detail.id, detail.category_id, detail.published_at),
    ]);

    return (
      <ListingDetail listing={detail} seller={seller} similar={similar} adjacent={adjacent} />
    );
  }

  // "-<sayı>" ile bitmeyen ve kategori de olmayan eski adresler.
  notFound();
}
