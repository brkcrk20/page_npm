import type { Metadata } from 'next';

import { KindBrowser } from '@/components/listings/KindBrowser';
import { getSidebarData, pigeonCategoryId, withoutPigeons } from '@/lib/queries/catalog';
import { getListings } from '@/lib/queries/listings';

export const metadata: Metadata = {
  title: 'Satılık Evcil Hayvan İlanları — Al & Sat',
  description:
    'Satılık kedi, köpek, kuş, akvaryum ve güvercin ilanları. Irka, şehre ve fiyata göre inceleyin, satıcıyla doğrudan görüşün.',
  alternates: { canonical: '/al-sat' },
};

// 60 saniyelik önbellek: sekiz sorguluk bir sayfayı her istekte
// yeniden çalıştırmanın pratik bir kazancı yok.
export const revalidate = 60;

export default async function Page() {
  const sidebar = await getSidebarData();

  // Güvercin bu listede yok: kendi sayfası, kendi ırk menüsü ve kendi
  // terminolojisi var. Kedi ve köpeklerin arasında görünmesi güvercin
  // arayana da diğerlerine de yaramıyor.
  const pigeonId = pigeonCategoryId(sidebar.categories);

  const { listings, total } = await getListings({
    excludeCategoryIds: pigeonId ? [pigeonId] : undefined,
    kind: 'satilik', perPage: 24 });

  return (
    <KindBrowser
      title="Satılık İlanlar"
      lead="Fiyat belirtilmiş tüm ilanlar. Irk, şehir ve fiyat aralığına göre daraltabilirsiniz."
      listings={listings}
      total={total}
      sidebar={{ ...sidebar, categories: withoutPigeons(sidebar.categories) }}
      emptyMessage="Şu an yayında satılık ilan yok."
      seo={{
        heading: 'Satın Alırken Nelere Dikkat Etmeli?',
        paragraphs: [
          'İlan fiyatı tek başına bir gösterge değildir. Aynı ırkta fiyat farkı genellikle yaş, şecere kaydı, aşı durumu ve yetiştiricinin koşullarından kaynaklanır. Alışılmışın belirgin şekilde altındaki fiyatlar dikkatle değerlendirilmelidir.',
          'Hayvanı görmeden ödeme yapmayın. Kapora, rezervasyon ücreti veya kargo bedeli adı altında önceden para isteyen ilanlar bu sektördeki en yaygın dolandırıcılık yöntemidir. Görüşmeyi hayvanın bulunduğu yerde yapın.',
          'Aşı karnesi, varsa şecere belgesi ve sağlık raporunu satın almadan önce isteyin. Yavru alıyorsanız anneyi görmek, hem yaş hem de yetiştirme koşulları hakkında fikir verir.',
          'Ödemeyi teslim anında yapın ve satıcıyla iletişimi ilan üzerinden sürdürün. Site dışına yönlendiren, aceleye getiren taleplere karşı temkinli olun.',
        ],
      }}
    />
  );
}
