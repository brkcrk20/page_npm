import Link from 'next/link';

import { BreedAvatar } from '@/components/BreedAvatar';
import type { SidebarData } from '@/lib/queries/catalog';

/**
 * Güvercin ırkları menüsü.
 *
 * Genel CategorySidebar kullanılamıyordu: o, altı kategoriyi yan yana
 * gösteriyor ve her birinin ırklarını kısaltılmış bir liste hâlinde veriyor.
 * Güvercin sayfasında kategori seçimi diye bir şey yok — ziyaretçi zaten
 * güvercinde; ihtiyacı olan tek şey 59 ırk arasında gezinmek.
 *
 * Irklar KULLANIM AMACINA göre gruplu: Türkiye'de güvercinciler ırkları böyle
 * ayırıyor ve taklacı arayan biri süs güvercinleri arasında gezinmiyor.
 * Bölgesel taklacılar (Adana, Mardin, Urfa...) ayrı ırk olarak duruyor çünkü
 * alıcı doğrudan bölge adıyla arıyor.
 *
 * Grup içinde sıra: önce ilan sayısı, sonra tanımlı sıra. Boş ırkların üstte
 * durması menüyü ölü bağlantılarla dolduruyordu.
 */

/** Grupların ekrandaki sırası; en çok aranan dal en üstte. */
const GROUP_ORDER = ['Taklacı', 'Oyun', 'Posta ve Yarış', 'Süs', 'Yerli'] as const;

const GROUP_NOTE: Record<string, string> = {
  'Taklacı': 'Havada takla atan uçucu ırklar',
  'Oyun': 'Uçuş tavrı ve oyunuyla beslenen ırklar',
  'Posta ve Yarış': 'Mesafe uçuşu için seçilmiş hatlar',
  'Süs': 'Görünüş için yetiştirilen ırklar',
  'Yerli': 'Yerli hatlar ve renk adıyla anılanlar',
};

type Breed = SidebarData['categories'][number]['breeds'][number];

export function PigeonBreedSidebar({
  breeds,
  categorySlug,
  categoryName,
  activeBreedSlug,
}: {
  breeds: Breed[];
  categorySlug: string;
  categoryName: string;
  activeBreedSlug?: string;
}) {
  const grouped = new Map<string, Breed[]>();
  for (const breed of breeds) {
    const key = breed.group ?? 'Diğer';
    const list = grouped.get(key) ?? [];
    list.push(breed);
    grouped.set(key, list);
  }

  const orderedGroups = [
    ...GROUP_ORDER.filter((g) => grouped.has(g)),
    ...[...grouped.keys()].filter((g) => !GROUP_ORDER.includes(g as any)),
  ];

  return (
    <nav className="overflow-hidden rounded-xl border bg-white" aria-label="Güvercin ırkları">
      <div className="border-b bg-secondary/50 px-4 py-3">
        <h2 className="font-bold">Güvercin Irkları</h2>
        <p className="text-xs text-muted-foreground">{breeds.length} ırk</p>
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        {orderedGroups.map((group) => {
          const items = grouped.get(group) ?? [];
          return (
            <section key={group}>
              <div className="sticky top-0 z-10 border-b bg-white/95 px-4 py-2 backdrop-blur">
                <h3 className="text-sm font-bold">{group}</h3>
                {GROUP_NOTE[group] && (
                  <p className="text-[11px] leading-tight text-muted-foreground">
                    {GROUP_NOTE[group]}
                  </p>
                )}
              </div>

              <ul>
                {items.map((breed) => {
                  const active = breed.slug === activeBreedSlug;
                  return (
                    <li key={breed.id}>
                      <Link
                        href={`/${categorySlug}/${breed.slug}`}
                        aria-current={active ? 'page' : undefined}
                        className={
                          'flex items-center gap-2.5 border-b px-4 py-2 text-sm transition-colors last:border-b-0 ' +
                          (active
                            ? 'bg-primary/10 font-semibold text-primary'
                            : 'hover:bg-secondary')
                        }
                      >
                        <BreedAvatar
                          breedName={breed.name}
                          breedSlug={breed.slug}
                          categorySlug={categorySlug}
                          categoryCode="Pigeon"
                          categoryName={categoryName}
                          size={32}
                        />
                        <span className="min-w-0 flex-1 truncate">{breed.name}</span>
                        {breed.count > 0 && (
                          <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            {breed.count}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </nav>
  );
}
