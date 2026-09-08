import { notFound } from 'next/navigation';
import { getPageContent } from '@/lib/queries/page-content';
import type { Metadata } from 'next';
import { seoAciklama, seoBaslik, seoBaslikSec } from '@/lib/seo-metin';

import { KategoriListesi, SUZGECSIZ } from '@/components/pages/ListeSayfalari';
import { getCategories, getCategoryBySlug } from '@/lib/queries/catalog';
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
          title: seoBaslik(icerik.seo_title ?? `${category.name} İlanları`),
          description: icerik.seo_description ? seoAciklama(icerik.seo_description) : undefined,
          alternates: { canonical: `/${category.slug}` },
        };
      }
      // Kategoriye özel SEO metni varsa o kullanılıyor; güvercin gibi kendi
      // terminolojisi olan kategorilerde genel şablon yetersiz kalıyor.
      //
      // Yönetimden girilen metin de sınırdan geçiriliyor: elle yazılan bir
      // başlığın 60 karakteri aşması, şablonun aşmasından daha olası.
      return {
        title: category.seo_title
          ? seoBaslik(category.seo_title)
          : seoBaslikSec(
              `${category.name} — Satılık ve Sahiplendirme İlanları`,
              `${category.name} — Satılık ve Sahiplendirme`,
              category.name
            ),
        description: seoAciklama(
          category.seo_description ??
            `Türkiye genelindeki güncel ${category.name.toLocaleLowerCase('tr')}. Semtinizdeki ilanları görün, güvenle sahiplenin.`
        ),
        alternates: { canonical: `/${category.slug}` },
      };
    }
  }

  return { title: 'Sayfa Bulunamadı' };
}

export default async function RootSlugPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const resolution = resolveRootSegment(slug);

  // İlan detayları buraya hiç gelmiyor: "-<sayı>" ile biten adresler
  // next.config'teki rewrite ile /ilan/[slug] rotasına gidiyor.
  if (resolution?.kind !== 'category') notFound();

  return <KategoriListesi slug={slug} listeParams={SUZGECSIZ} />;
}
