import { notFound, permanentRedirect } from 'next/navigation';
import { SITE_URL } from '@/lib/site';
import { listingHref } from '@/lib/listing-url';
import { getPageContent } from '@/lib/queries/page-content';
import type { Metadata } from 'next';

import { CategoryBrowser } from '@/components/listings/CategoryBrowser';
import { PigeonLanding } from '@/components/listings/PigeonLanding';
import { getCategories, getCategoryBySlug, getSidebarData } from '@/lib/queries/catalog';
import {
  getListings,
  getListingById,
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

  // İlan metadata'sı artık ilanın kendi rotasında; burası yalnızca
  // eski adresi yönlendiriyor.

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

  /**
   * ESKİ İLAN ADRESLERİ
   *
   * İlan adresleri /<sehir>/<cins>/<baslik>-<no> biçimine taşındı; kökteki
   * /<baslik>-<no> adresleri artık yalnızca oraya yönlendiriyor. Paylaşılmış
   * ve indekslenmiş adresler kırılmasın diye kalıcı (308) yönlendirme:
   * geçici yönlendirmede arama motoru eski adresi indekste tutmaya devam
   * ederdi.
   */
  if (resolution.kind === 'listing') {
    const listing = await getListingById(resolution.ilanNo);
    if (!listing) notFound();
    permanentRedirect(listingHref(listing as never));
  }

  // "-<sayı>" ile bitmeyen ve kategori de olmayan eski adresler.
  notFound();
}
