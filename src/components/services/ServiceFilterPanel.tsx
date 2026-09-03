'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ServiceFeature } from '@/lib/queries/services';

/**
 * Rehber filtre paneli.
 *
 * Filtreler URL'de tutuluyor, bileşen durumunda değil: filtrelenmiş sonuç
 * paylaşılabilir ve yer imine eklenebilir olmalı, geri tuşu da çalışmalı.
 * Ayrıca sayfa server component olarak kalabiliyor — filtreleme sunucuda
 * yapıldığı için arama motoru filtreli sayfaları da görüyor.
 */
export function ServiceFilterPanel({
  groups,
  activeFeatures,
  activeSearch,
  verifiedOnly,
}: {
  groups: { group: string; features: ServiceFeature[] }[];
  activeFeatures: string[];
  activeSearch: string;
  verifiedOnly: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [term, setTerm] = useState(activeSearch);

  const active = useMemo(() => new Set(activeFeatures), [activeFeatures]);
  const hasFilters = active.size > 0 || activeSearch.length > 0 || verifiedOnly;

  function apply(next: URLSearchParams) {
    // Filtre değişince sayfa numarasını sıfırlıyoruz; 5. sayfadayken filtre
    // daraltıldığında boş sonuç görünmesin.
    next.delete('sayfa');
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function toggleFeature(slug: string) {
    const next = new URLSearchParams(searchParams.toString());
    const current = next.getAll('ozellik');
    next.delete('ozellik');
    const updated = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    for (const value of updated) next.append('ozellik', value);
    apply(next);
  }

  function toggleVerified() {
    const next = new URLSearchParams(searchParams.toString());
    if (verifiedOnly) next.delete('dogrulanmis');
    else next.set('dogrulanmis', '1');
    apply(next);
  }

  function submitSearch() {
    const next = new URLSearchParams(searchParams.toString());
    if (term.trim()) next.set('q', term.trim());
    else next.delete('q');
    apply(next);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <h2 className="mb-3 font-bold">Klinik Ara</h2>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitSearch()}
            onBlur={submitSearch}
            placeholder="Klinik adı veya adres"
            className="pl-8"
            aria-label="Klinik ara"
          />
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox checked={verifiedOnly} onCheckedChange={toggleVerified} />
          Yalnızca doğrulanmış klinikler
        </label>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full text-destructive hover:text-destructive"
            onClick={() => router.push(pathname)}
          >
            <X className="mr-1 h-4 w-4" />
            Filtreleri Temizle
          </Button>
        )}
      </div>

      {groups.map(({ group, features }) => (
        <fieldset key={group} className="rounded-xl border bg-white p-4">
          <legend className="px-1 text-sm font-bold">{group}</legend>
          <div className="mt-2 space-y-2">
            {features.map((feature) => (
              <label
                key={feature.id}
                className="flex cursor-pointer items-center gap-2 text-sm"
                htmlFor={`ozellik-${feature.slug}`}
              >
                <Checkbox
                  id={`ozellik-${feature.slug}`}
                  checked={active.has(feature.slug)}
                  onCheckedChange={() => toggleFeature(feature.slug)}
                />
                <Label htmlFor={`ozellik-${feature.slug}`} className="cursor-pointer font-normal">
                  {feature.name}
                </Label>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
