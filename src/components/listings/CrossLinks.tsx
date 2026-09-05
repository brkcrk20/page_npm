import Link from 'next/link';

import type { CaprazBaglanti } from '@/lib/queries/cross-links';

/**
 * Cins × şehir çapraz bağlantı şeridi.
 *
 * Hem kullanıcı için ("İzmir'dekilere bakayım") hem arama motoru için:
 * cins × şehir sayfalarına siteden bağlantı olmadan o sayfalar keşfedilse
 * bile zayıf sayılıyordu.
 */
export function CrossLinks({
  baslik,
  baglantilar,
  href,
}: {
  baslik: string;
  baglantilar: CaprazBaglanti[];
  href: (slug: string) => string;
}) {
  if (baglantilar.length === 0) return null;

  return (
    <section className="mt-8 rounded-xl border bg-card p-4">
      <h2 className="mb-3 text-sm font-bold">{baslik}</h2>
      <ul className="flex flex-wrap gap-2">
        {baglantilar.map((b) => (
          <li key={b.slug}>
            <Link
              href={href(b.slug)}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
            >
              {b.name}
              <span className="text-xs text-muted-foreground">{b.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
