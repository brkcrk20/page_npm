import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { getListings } from '@/lib/queries/listings';

/**
 * Eş arayan ilanları.
 *
 * Ayrı bir veri kaynağı yok: ilan şemasında `es_arayan` bir ilan tipi, bu
 * sayfa da o tipe göre filtrelenmiş liste. Kendi tablosunu tutmak, kategori
 * sayfalarında düzelttiğimiz kopyalama hatasının aynısı olurdu.
 */

export const metadata: Metadata = {
  title: 'Eş Arayan İlanları — Çiftleştirme',
  description:
    'Kedi ve köpekler için eş arayan ilanları. Cins, yaş ve şehre göre uygun eşi bulun.',
};

// 60 saniyelik önbellek: sekiz sorguluk bir sayfayı her istekte
// yeniden çalıştırmanın pratik bir kazancı yok.
export const revalidate = 60;

export default async function MatingListingsPage() {
  const { listings, total } = await getListings({ kind: 'es_arayan' });

  return (
    <div className="bg-secondary/30">
      <div className="mx-auto w-full max-w-7xl px-5 py-6">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Eş Arayanlar</h1>
            <p className="mt-1 text-sm text-muted-foreground">{total} ilan bulundu</p>
          </div>
          <Button asChild>
            <Link href="/ilan-ver/es-arayan">Eş Arayan İlanı Ver</Link>
          </Button>
        </header>

        <ListingGrid
          listings={listings}
          emptyMessage="Şu an yayında eş arayan ilanı yok. İlk ilanı sen ver!"
        />
      </div>
    </div>
  );
}
