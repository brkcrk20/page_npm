import Image from 'next/image';
import { Package, PackageX } from 'lucide-react';

import { businessImageUrl } from '@/lib/supabase/storage';
import { urunGrubuAdi, type KatalogSatiri } from '@/lib/katalog';
import type { KatalogAyari } from '@/lib/services-config';

/** "1250" -> "₺1.250". Kuruş gösterilmiyor: katalogda kimse 12,50 yazmıyor. */
function fiyatYaz(tutar: number, birim: string): string {
  const simge = birim === 'TRY' ? '₺' : `${birim} `;
  return `${simge}${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(tutar)}`;
}

/**
 * İşletmenin kataloğu.
 *
 * İki görünüm, tek bileşen: petshopta stoklu ÜRÜN kartları (fotoğraf, marka,
 * stok durumu), diğer bölümlerde FİYAT LİSTESİ satırları. Farkın gerekçesi
 * services-config'teki katalog alanında yazıyor — otelde "stokta 3 adet"
 * demek anlamsız, petshopta ise müşterinin ilk sorusu bu.
 */
export function Katalog({
  satirlar,
  ayar,
  vurgu,
}: {
  satirlar: KatalogSatiri[];
  ayar: KatalogAyari;
  /** Aramadan gelindiyse eşleşen satırın adı; kartta işaretleniyor. */
  vurgu?: string;
}) {
  if (satirlar.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-lg border bg-white">
      <h2 className="flex items-center gap-2 border-l-4 border-primary px-4 py-3 font-bold">
        <Package className="h-4 w-4 text-primary" />
        {ayar.baslik}
        <span className="text-sm font-normal text-muted-foreground">({satirlar.length})</span>
      </h2>

      {ayar.tur === 'urun' ? (
        <ul className="grid grid-cols-2 gap-px border-t bg-border sm:grid-cols-3">
          {satirlar.map((satir) => (
            <UrunKarti key={satir.id} satir={satir} vurgulu={eslesiyorMu(satir, vurgu)} />
          ))}
        </ul>
      ) : (
        <ul className="divide-y border-t">
          {satirlar.map((satir) => (
            <HizmetSatiri key={satir.id} satir={satir} vurgulu={eslesiyorMu(satir, vurgu)} />
          ))}
        </ul>
      )}
    </section>
  );
}

function eslesiyorMu(satir: KatalogSatiri, vurgu?: string): boolean {
  if (!vurgu) return false;
  const metin = `${satir.brand ?? ''} ${satir.name}`.toLocaleLowerCase('tr');
  return metin.includes(vurgu.toLocaleLowerCase('tr'));
}

function UrunKarti({ satir, vurgulu }: { satir: KatalogSatiri; vurgulu: boolean }) {
  const gorsel = businessImageUrl(satir.photo_path);
  const grup = urunGrubuAdi(satir.category);

  return (
    <li className={vurgulu ? 'bg-amber-50 p-3' : 'bg-white p-3'}>
      <div className="relative mb-2 aspect-square overflow-hidden rounded-md bg-muted">
        {gorsel ? (
          <Image
            src={gorsel}
            alt={satir.name}
            fill
            sizes="(max-width: 640px) 45vw, 200px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Package className="h-8 w-8" />
          </div>
        )}
      </div>

      {satir.brand && (
        <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
          {satir.brand}
        </p>
      )}
      <p className="line-clamp-2 text-sm font-medium leading-snug">{satir.name}</p>
      {(grup || satir.unit) && (
        <p className="mt-0.5 text-xs text-muted-foreground">
          {[grup, satir.unit].filter(Boolean).join(' · ')}
        </p>
      )}

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        {satir.price !== null && (
          <span className="text-sm font-bold text-primary">
            {fiyatYaz(satir.price, satir.currency)}
          </span>
        )}
        <StokRozeti stock={satir.stock} />
      </div>
    </li>
  );
}

function HizmetSatiri({ satir, vurgulu }: { satir: KatalogSatiri; vurgulu: boolean }) {
  return (
    <li className={vurgulu ? 'flex items-start gap-4 bg-amber-50 p-4' : 'flex items-start gap-4 p-4'}>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{satir.name}</p>
        {satir.description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{satir.description}</p>
        )}
        {satir.unit && <p className="mt-0.5 text-xs text-muted-foreground">{satir.unit}</p>}
      </div>
      <div className="shrink-0 text-right">
        {satir.price !== null ? (
          <span className="font-bold text-primary">{fiyatYaz(satir.price, satir.currency)}</span>
        ) : (
          // Fiyatını yazmak istemeyen işletme var; satırı gizlemek yerine
          // sebebini söylüyoruz, kullanıcı arayıp sorabilsin.
          <span className="text-xs text-muted-foreground">Fiyat için arayın</span>
        )}
      </div>
    </li>
  );
}

/**
 * Stok durumu.
 *
 * null = işletme stok takip etmiyor; sayı vermek yerine hiçbir şey demiyoruz.
 * Uydurma bir "stokta var" rozeti, gidip ürünü bulamayan müşteriye yalan
 * söylemek olurdu.
 */
function StokRozeti({ stock }: { stock: number | null }) {
  if (stock === null) return null;

  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
        <PackageX className="h-3 w-3" />
        Tükendi
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
      Stokta {stock > 20 ? 'var' : `${stock} adet`}
    </span>
  );
}
