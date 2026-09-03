'use client';

import { useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * İçinde arama kutusu olan açılır liste.
 *
 * Radix Select yerine Popover üzerine kuruldu: Select'in kendi klavye
 * yönetimi her tuşa basışta seçeneklere atlıyor ve içine metin kutusu
 * koyulduğunda yazmayı imkânsız hale getiriyor. Popover'da böyle bir çakışma
 * yok.
 *
 * 81 il, 973 ilçe ve 100+ cins arasından seçim yapılıyor; arama kutusu olmadan
 * listeyi kaydırarak bulmak kullanılabilir değildi.
 */

export type SearchableOption = {
  value: string;
  label: string;
  /** Sağda gösterilen ikincil bilgi (ör. ilan sayısı). */
  hint?: string | number;
};

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder = 'Ara...',
  emptyMessage = 'Sonuç bulunamadı.',
  disabled,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  placeholder: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr');
    if (!q) return options;
    // Baştan eşleşme değil, İÇİNDE geçme aranıyor: kullanıcı "de" yazdığında
    // Denizli, Bingöl, Kırklareli gibi içinde "de" geçen her ili görmeli.
    return options.filter((o) => o.label.toLocaleLowerCase('tr').includes(q));
  }, [options, query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          aria-label={ariaLabel ?? placeholder}
          className={cn(
            'flex h-11 items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-sm ring-offset-background',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
        >
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] min-w-52 p-0"
        onOpenAutoFocus={(event) => {
          // Odağı listeye değil arama kutusuna veriyoruz: açılır açılmaz
          // yazmaya başlanabilsin.
          event.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <div className="border-b p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 pl-8"
              onKeyDown={(event) => {
                // Enter: tek sonuç kaldıysa doğrudan seç.
                if (event.key === 'Enter' && filtered.length > 0) {
                  event.preventDefault();
                  onChange(filtered[0].value);
                  setOpen(false);
                }
              }}
            />
          </div>
        </div>

        <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </li>
          ) : (
            filtered.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-secondary',
                    option.value === value && 'bg-secondary/60 font-medium'
                  )}
                >
                  <Check
                    className={cn(
                      'h-4 w-4 shrink-0',
                      option.value === value ? 'opacity-100 text-primary' : 'opacity-0'
                    )}
                  />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {option.hint !== undefined && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {option.hint}
                    </span>
                  )}
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
