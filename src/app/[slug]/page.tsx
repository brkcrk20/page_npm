import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';

import { CategoryBrowser } from '@/components/listings/CategoryBrowser';
import { PigeonLanding } from '@/components/listings/PigeonLanding';
import { ListingDetail } from '@/components/listings/ListingDetail';
import { getCategories, getCategoryBySlug, getSidebarData } from '@/lib/queries/catalog';
import {
  getListings,
  getListingById,
  getListingsWithVideo,
  getSellerInfo,
  getSimilarListings,
  getAdjacentListings,
} from '@/lib/queries/listings';
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
      // Kategoriye özel SEO metni varsa o kullanılıyor; güvercin gibi kendi
      // terminolojisi olan kategorilerde genel şablon yetersiz kalıyor.
      return {
        title: `${category.seo_title ?? `${category.name} — Satılık ve Ücretsiz Sahiplendirme`} | PetSemti`,
        description:
          category.seo_description ??
          `Türkiye genelindeki güncel ${category.name.toLowerCase()}. Semtinizdeki ilanları görün, güvenle sahiplenin.`,
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

    const [{ listings, total }, sidebar] = await Promise.all([
      getListings({ categoryId: category.id }),
      getSidebarData(),
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

    const detail = listing as any;
    const [seller, similar, adjacent] = await Promise.all([
      getSellerInfo(detail.owner_id),
      getSimilarListings(detail.id, detail.breed_id ?? null, detail.category_id),
      getAdjacentListings(detail.id, detail.category_id, detail.published_at),
    ]);

    return (
      <ListingDetail
        listing={detail}
        seller={seller}
        similar={similar}
        adjacent={adjacent}
      />
    );
  }

  // "-<sayı>" ile bitmeyen ve kategori de olmayan eski adresler.
  notFound();
}
