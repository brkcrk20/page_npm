import type { Metadata } from 'next';

import { KindBrowser } from '@/components/listings/KindBrowser';
import { animalCategories, getSidebarData, nonAnimalCategoryIds } from '@/lib/queries/catalog';
import { getListings } from '@/lib/queries/listings';

export const metadata: Metadata = {
  title: 'Sahiplendirme İlanları — Kedi, Köpek, Kuş ve Diğer Dostlar',
  description:
    'Sahiplendirme ve satılık hayvan ilanları: kedi, köpek, kuş ve diğer evcil hayvanlar. Şehrinize göre inceleyin, sahibiyle doğrudan görüşün.',
  alternates: { canonical: '/sahiplendirme' },
};

// 60 saniyelik önbellek: sekiz sorguluk bir sayfayı her istekte
// yeniden çalıştırmanın pratik bir kazancı yok.
export const revalidate = 60;

export default async function Page() {
  const sidebar = await getSidebarData();

  // Güvercin bu listede yok: kendi sayfası, kendi ırk menüsü ve kendi
  // terminolojisi var. Kedi ve köpeklerin arasında görünmesi güvercin
  // arayana da diğerlerine de yaramıyor.
  // Güvercin kendi dikeyinde, pet malzemeleri hayvan bile değil.
  const disaridakiler = nonAnimalCategoryIds(sidebar.categories);

  // Tür filtresi yok: bu sayfa hayvan ilanlarının tamamı. Sahiplendirme
  // ilanlarını ayrı bir dünya gibi kurmak yanlıştı — bir çiftlik hem
  // sahiplendirme hem satış yapabiliyor, ziyaretçi de ikisine birden bakıyor.
  const { listings, total } = await getListings({
    excludeCategoryIds: disaridakiler.length ? disaridakiler : undefined,
    perPage: 24 });

  return (
    <KindBrowser
      createHref="/ilan-ver/sahiplendirme"
      title="Sahiplendirme İlanları"
      lead="Kedi, köpek, kuş ve diğer dostlar için sahiplendirme ve satılık ilanlar."
      listings={listings}
      total={total}
      sidebar={{ ...sidebar, categories: animalCategories(sidebar.categories) }}
      emptyMessage="Şu an yayında hayvan ilanı yok."
      seo={{
        heading: 'Sahiplendirme İlanları Hakkında',
        paragraphs: [
          'Bu sayfada kedi, köpek, kuş ve diğer evcil hayvan ilanlarının tamamı yer alır: ücretsiz sahiplendirme ilanları da, yetiştirici ve çiftliklerin satılık ilanları da. İlan kartındaki rozetten hangisi olduğunu görebilirsiniz.',
          'Sahiplenmeden önce hayvanın yaşını, aşı durumunu ve varsa sağlık geçmişini sorun. Bir hayvanı üstlenmek uzun süreli bir sorumluluktur: beslenme, veteriner masrafı, günlük bakım ve tatil dönemlerindeki bakım planı önceden düşünülmelidir.',
          'Görüşmeyi mümkünse hayvanın yaşadığı yerde yapın. Hayvanın ortamını görmek, ilan metninden çok daha fazlasını anlatır. Kapora veya ön ödeme talep eden hiçbir sahiplendirme ilanına itibar etmeyin.',
        ],
      }}
    />
  );
}
