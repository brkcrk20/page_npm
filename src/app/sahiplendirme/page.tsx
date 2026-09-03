import type { Metadata } from 'next';

import { KindBrowser } from '@/components/listings/KindBrowser';
import { animalCategories, getSidebarData, nonAnimalCategoryIds } from '@/lib/queries/catalog';
import { getListings } from '@/lib/queries/listings';

export const metadata: Metadata = {
  title: 'Ücretsiz Sahiplendirme İlanları — Kedi, Köpek ve Diğer Dostlar',
  description:
    'Ücretsiz sahiplendirme ilanları: yuva arayan kedi, köpek, kuş ve diğer evcil hayvanlar. Şehrinize göre inceleyin, sahibiyle doğrudan görüşün.',
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

  const { listings, total } = await getListings({
    excludeCategoryIds: disaridakiler.length ? disaridakiler : undefined,
    kind: 'sahiplendirme', perPage: 24 });

  return (
    <KindBrowser
      title="Ücretsiz Sahiplendirme İlanları"
      lead="Yuva arayan dostlar. Bu sayfadaki ilanlarda ücret talep edilmez."
      listings={listings}
      total={total}
      sidebar={{ ...sidebar, categories: animalCategories(sidebar.categories) }}
      emptyMessage="Şu an yayında sahiplendirme ilanı yok."
      seo={{
        heading: 'Sahiplendirme İlanları Hakkında',
        paragraphs: [
          'Sahiplendirme ilanları, hayvanını ücret almadan yeni bir yuvaya vermek isteyen kişiler tarafından açılır. Bu sayfadaki ilanlarda fiyat alanı bulunmaz; ücret istendiğini fark ederseniz ilanı bize bildirebilirsiniz.',
          'Sahiplenmeden önce hayvanın yaşını, aşı durumunu ve varsa sağlık geçmişini sorun. Bir hayvanı üstlenmek uzun süreli bir sorumluluktur: beslenme, veteriner masrafı, günlük bakım ve tatil dönemlerindeki bakım planı önceden düşünülmelidir.',
          'Görüşmeyi mümkünse hayvanın yaşadığı yerde yapın. Hayvanın ortamını görmek, ilan metninden çok daha fazlasını anlatır. Kapora veya ön ödeme talep eden hiçbir sahiplendirme ilanına itibar etmeyin.',
        ],
      }}
    />
  );
}
