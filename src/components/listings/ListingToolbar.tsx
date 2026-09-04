'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpDown, Store, X } from 'lucide-react';

import { SaveSearchButton } from '@/components/listings/SaveSearchButton';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/**
 * İlan listesi araç çubuğu: sıralama ve fiyat aralığı.
 *
 * İncelediğim Türk emsal sitelerinin tamamı yalnızca tarihe göre
 * sıralıyor; fiyat filtresi ve fiyata göre sıralama hiçbirinde yok. Oysa
 * alıcının en sık yaptığı şey bütçesine uyanı bulmak — özellikle ikinci
 * el malzemede.
 *
 * Değerler adres çubuğunda tutuluyor: sonuç paylaşılabiliyor, tarayıcı
 * geçmişinde anlamlı ve sunucu tarafında filtreleniyor (istemcide
 * filtrelemek yalnızca o sayfadaki 24 ilanı süzerdi).
 */

const SIRALAMA = [
  { value: 'yeni', label: 'En yeni' },
  { value: 'eski', label: 'En eski' },
  { value: 'ucuz', label: 'Fiyat: düşükten yükseğe' },
  { value: 'pahali', label: 'Fiyat: yüksekten düşüğe' },
];

/**
 * Kimden: alıcının en çok sorduğu ayrım.
 *
 * Sahiplendirme arayan kurumsal ilanları elemek, toplu alım yapan tam
 * tersini yapmak istiyor. Değer ilan satırında tutuluyor (göç 0043),
 * bu yüzden süzme tek kolon karşılaştırması.
 */
const KIMDEN = [
  { value: 'hepsi', label: 'Herkesten' },
  { value: 'sahibinden', label: 'Sahibinden' },
  { value: 'magazadan', label: 'Mağazadan' },
];

export function ListingToolbar({
  showPrice = true,
  context,
  aramaAdi,
}: {
  showPrice?: boolean;
  /**
   * Aramanın neyi daralttığı.
   *
   * Bu sitede kategori, şehir ve cins adres YOLUNDA duruyor, sorgu
   * parametresinde değil. Kayıtlı aramanın yeni ilan sayabilmesi için bu
   * bilginin de saklanması gerekiyor; yalnızca sorgu dizesini kaydetmek
   * "köpek ilanları" ile "tüm ilanlar"ı aynı arama yapardı.
   */
  context?: { kategori?: string; sehir?: string; cins?: string };
  /** Kayıtlı aramanın görünen adı. Verilmezse yoldan üretiliyor. */
  aramaAdi?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [min, setMin] = useState(params.get('min') ?? '');
  const [max, setMax] = useState(params.get('max') ?? '');
  const sort = params.get('sirala') ?? 'yeni';
  const kimden = params.get('kimden') ?? 'hepsi';

  function push(next: URLSearchParams) {
    const q = next.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  }

  function setSort(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === 'yeni') next.delete('sirala');
    else next.set('sirala', value);
    push(next);
  }

  function setKimden(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === 'hepsi') next.delete('kimden');
    else next.set('kimden', value);
    push(next);
  }

  function applyPrice() {
    const next = new URLSearchParams(params.toString());
    min.trim() ? next.set('min', min.trim()) : next.delete('min');
    max.trim() ? next.set('max', max.trim()) : next.delete('max');
    push(next);
  }

  function clearPrice() {
    setMin('');
    setMax('');
    const next = new URLSearchParams(params.toString());
    next.delete('min');
    next.delete('max');
    push(next);
  }

  const priceActive = Boolean(params.get('min') || params.get('max'));

  /**
   * Kayıtlı aramanın adı.
   *
   * Sayfa başlığı kullanılıyor ("Köpek İlanları", "Golden Retriever").
   * Adres parçalarından üretmek "kopek ilanlari" gibi Türkçe karakteri
   * düşmüş adlar veriyordu — kullanıcı listede aramasını bundan tanıyacak.
   */
  const aramaBasligi =
    aramaAdi ??
    ([context?.cins, context?.sehir, context?.kategori]
      .filter(Boolean)
      .map((p) => p!.replace(/-/g, ' '))
      .join(' · ') ||
      'Tüm ilanlar');

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-white p-2.5">
      <div className="flex items-center gap-2">
        <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-9 w-[190px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SIRALAMA.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Select value={kimden} onValueChange={setKimden}>
          <SelectTrigger className="h-9 w-[140px]" aria-label="Kimden">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KIMDEN.map((k) => (
              <SelectItem key={k.value} value={k.value}>
                {k.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {context !== undefined && (
        <div className="ml-auto">
          <SaveSearchButton baslik={aramaBasligi} context={context} />
        </div>
      )}

      {showPrice && (
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Fiyat</span>
          <Input
            value={min}
            onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
            inputMode="numeric"
            placeholder="en az"
            className="h-9 w-24"
            aria-label="En az fiyat"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            value={max}
            onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && applyPrice()}
            inputMode="numeric"
            placeholder="en çok"
            className="h-9 w-24"
            aria-label="En çok fiyat"
          />
          <Button size="sm" variant="outline" className="h-9" onClick={applyPrice}>
            Uygula
          </Button>
          {priceActive && (
            <Button size="sm" variant="ghost" className="h-9 gap-1 text-muted-foreground" onClick={clearPrice}>
              <X className="h-3.5 w-3.5" />
              Temizle
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
