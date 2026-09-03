import Link from 'next/link';

/**
 * Pet malzemesi türleri menüsü.
 *
 * İlk sürümde bu liste sayfanın ana alanındaydı ve dokuz kartla ekranın
 * tamamını kaplıyordu; ilanlar katlamanın çok altında kalıyordu. Bir
 * pazaryerinde önce ilanlar görünmeli, kategori bir SÜZGEÇ — yeri kenar
 * menüsü. Site genelinde ırk menüsü de aynı yerde duruyor.
 */

type SupplyType = { slug: string; name: string; count: number };

export function SupplyTypeSidebar({
  groups,
  activeSlug,
}: {
  groups: [string, SupplyType[]][];
  activeSlug?: string;
}) {
  const total = groups.reduce((sum, [, items]) => sum + items.length, 0);

  return (
    <nav className="overflow-hidden rounded-xl border bg-white" aria-label="Malzeme türleri">
      <div className="border-b bg-secondary/50 px-4 py-3">
        <h2 className="font-bold">Malzeme Türleri</h2>
        <p className="text-xs text-muted-foreground">{total} kategori</p>
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        {groups.map(([group, items]) => (
          <section key={group}>
            <div className="sticky top-0 z-10 border-b bg-white/95 px-4 py-2 backdrop-blur">
              <h3 className="text-sm font-bold">{group}</h3>
            </div>
            <ul>
              {items.map((item) => {
                const active = item.slug === activeSlug;
                return (
                  <li key={item.slug}>
                    <Link
                      href={`/pet-malzemeleri/${item.slug}`}
                      aria-current={active ? 'page' : undefined}
                      className={
                        'flex items-center gap-2 border-b px-4 py-2 text-sm transition-colors last:border-b-0 ' +
                        (active
                          ? 'bg-primary/10 font-semibold text-primary'
                          : 'hover:bg-secondary')
                      }
                    >
                      <span className="min-w-0 flex-1 truncate">{item.name}</span>
                      {item.count > 0 && (
                        <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                          {item.count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  );
}
