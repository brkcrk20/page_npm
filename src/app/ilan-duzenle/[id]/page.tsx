import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CreateListingForm } from '@/app/ilan-ver/CreateListingForm';

export const metadata: Metadata = {
  title: 'İlanı Düzenle',
  // Kişiye özel; arama sonuçlarında yeri yok.
  robots: { index: false, follow: false },
};

/**
 * İlan düzenleme.
 *
 * İlan verildikten sonra değiştirilemiyordu: fiyat düşürmek, yazım hatasını
 * düzeltmek, fotoğraf eklemek için tek yol ilanı silip yeniden vermekti — o
 * da ilan numarasını, görüntülenme sayısını, favorileri ve gelen mesajları
 * kaybetmek demekti.
 *
 * Form yeniden yazılmadı; ilan verme formu düzenleme kipini de üstleniyor.
 * İki ayrı form, alan eklendiğinde birinin unutulması anlamına gelirdi.
 * Sahiplik kontrolü hem formda hem RLS'te.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listingId = Number(id);

  if (!Number.isInteger(listingId) || listingId <= 0) notFound();

  return <CreateListingForm listingId={listingId} />;
}
