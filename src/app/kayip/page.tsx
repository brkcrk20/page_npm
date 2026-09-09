import type { Metadata } from 'next';

import { KayipListesi } from '@/components/pages/KayipSayfasi';

/**
 * Kayıp ve bulunan hayvan ilanları.
 *
 * `kayip` ve `bulundu` ilan türleri şemada ilk günden beri vardı ama hiç
 * arayüzü yoktu: kimse kayıp ilanı veremiyordu. Bu iki tür normal listelerde
 * de görünmüyor (getListings varsayılan olarak dışarıda tutuyor) — satılık
 * kedi arayana kaybolmuş kedi göstermek kimsenin işine yaramaz.
 *
 * İki tür tek sayfada sekmeyle duruyor: kaybını arayan kişi "acaba biri
 * bulmuş mu" diye öbür sekmeye de bakar, ayrı adreslere bölmek bunu zorlaştırır.
 */

export const metadata: Metadata = {
  title: 'Kayıp ve Bulunan Hayvan İlanları',
  description:
    'Kaybolan kedi, köpek ve kuşlar için kayıp ilanı verin; bulduğunuz hayvanı sahibine ulaştırın. Şehre göre kayıp ve bulundu ilanları.',
  alternates: { canonical: '/kayip' },
};

export const revalidate = 60;

export default async function LostFoundPage() {
  // Süzgeç okunmuyor: sayfa böylece önbelleğe girebiliyor. Sekme ya da
  // şehir seçilince istek /kayip-filtre'ye yeniden yazılıyor.
  return <KayipListesi sp={{}} />;
}
