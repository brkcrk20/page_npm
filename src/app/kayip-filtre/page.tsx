import type { Metadata } from 'next';

import { KayipListesi } from '@/components/pages/KayipSayfasi';

/**
 * Süzgeçli kayıp & bulundu listesi.
 *
 * Kullanıcıya görünmeyen adres: /kayip?tip=bulundu ya da /kayip?sehir=izmir
 * istekleri next.config'teki rewrite ile buraya geliyor. Gerekçesi
 * KayipSayfasi.tsx'in başında.
 *
 * Sekme ve şehir seçimi aynı listenin daraltılmışı; arama motorunun her
 * kombinasyonu ayrı sayfa sanmaması için noindex ve kanonik /kayip.
 */
type SP = Promise<{ tip?: string; sehir?: string }>;

export const metadata: Metadata = {
  title: 'Kayıp ve Bulunan Hayvan İlanları',
  robots: { index: false, follow: true },
  alternates: { canonical: '/kayip' },
};

export default async function Page({ searchParams }: { searchParams: SP }) {
  return <KayipListesi sp={await searchParams} />;
}
