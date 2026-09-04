'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ilanVerHref } from '@/lib/ilan-ver-href';

/**
 * Bulunduğu bölümün ilan formuna giden "İlan Ver" bağlantısı.
 * Hedefi adres çubuğundan hesaplıyor; bkz. lib/ilan-ver-href.ts
 */
export function IlanVerLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '/';
  return (
    <Link href={ilanVerHref(pathname)} className={className}>
      {children}
    </Link>
  );
}
