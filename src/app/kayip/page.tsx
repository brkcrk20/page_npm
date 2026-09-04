import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { getListings } from '@/lib/queries/listings';
import { getCities } from '@/lib/queries/catalog';
import { cn } from '@/lib/utils';

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
  title: 'Kayıp ve Bulunan Hayvan İlanları | PetSemti',
  description:
    'Kaybolan kedi, köpek ve kuşlar için kayıp ilanı verin; bulduğunuz hayvanı sahibine ulaştırın. Şehre göre kayıp ve bulundu ilanları.',
  alternates: { canonical: '/kayip' },
};

export const revalidate = 60;

type SP = Promise<{ tip?: string; sehir?: string }>;

export default async function LostFoundPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const tip = sp.tip === 'bulundu' ? 'bulundu' : 'kayip';

  const cities = await getCities();
  const city = sp.sehir ? cities.find((c) => c.slug === sp.sehir) : undefined;

  const [current, other] = await Promise.all([
    getListings({ kind: tip, cityId: city?.id, sort: 'yeni', perPage: 48 }),
    getListings({ kind: tip === 'kayip' ? 'bulundu' : 'kayip', perPage: 1 }),
  ]);

  const query = (next: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { tip, sehir: sp.sehir, ...next };
    if (merged.tip && merged.tip !== 'kayip') params.set('tip', merged.tip);
    if (merged.sehir) params.set('sehir', merged.sehir);
    const q = params.toString();
    return q ? `/kayip?${q}` : '/kayip';
  };

  const tabs = [
    { key: 'kayip', label: 'Kayıp İlanları', count: tip === 'kayip' ? current.total : other.total },
    { key: 'bulundu', label: 'Bulunanlar', count: tip === 'bulundu' ? current.total : other.total },
  ];

  return (
    <div className="bg-secondary/30">
      <div className="mx-auto w-full max-w-7xl px-5 py-6">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Kayıp ve Bulunanlar</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kaybolan dostunuzu duyurun, bulduğunuz hayvanı sahibine ulaştırın.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/ilan-ver/bulundu">Hayvan Buldum</Link>
            </Button>
            <Button asChild>
              <Link href="/ilan-ver/kayip">Kayıp İlanı Ver</Link>
            </Button>
          </div>
        </header>

        <div className="mb-5 flex gap-1 border-b">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={query({ tip: t.key })}
              className={cn(
                '-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition',
                tip === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
              <span className="ml-1.5 text-xs opacity-70">({t.count})</span>
            </Link>
          ))}
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Link
            href={query({ sehir: undefined })}
            className={cn(
              'rounded-full border px-3 py-1 text-xs transition hover:border-primary',
              !city ? 'border-primary bg-primary text-primary-foreground' : 'bg-white'
            )}
          >
            Tüm Türkiye
          </Link>
          {cities.slice(0, 12).map((c) => (
            <Link
              key={c.id}
              href={query({ sehir: c.slug })}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition hover:border-primary',
                city?.id === c.id ? 'border-primary bg-primary text-primary-foreground' : 'bg-white'
              )}
            >
              {c.name}
            </Link>
          ))}
        </div>

        <ListingGrid
          listings={current.listings}
          emptyMessage={
            tip === 'kayip'
              ? `${city ? city.name + ' için ' : ''}yayında kayıp ilanı yok.`
              : `${city ? city.name + ' için ' : ''}yayında bulundu ilanı yok.`
          }
        />

        <section className="mt-10 rounded-xl border bg-white p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <Search className="h-4 w-4 text-primary" />
            Hayvanınız kaybolduysa ilk 24 saat
          </h2>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <li>• Kaybolduğu noktanın çevresini genişleyen halkalar hâlinde tarayın; kediler çoğunlukla 200 metre içinde saklanır.</li>
            <li>• Mikroçip kaydınızdaki telefon güncel değilse hemen veteriner hekiminize güncelletin.</li>
            <li>• Çevredeki veteriner kliniklerine ve belediye barınağına fotoğraflı bilgi bırakın.</li>
            <li>• İlanınıza tasma, renk, çip numarası gibi ayırt edici ayrıntı yazın; sahiplik iddialarını bu ayrıntıyla doğrulayın.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
