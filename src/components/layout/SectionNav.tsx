'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Award,
  Banknote,
  Bird,
  Building,
  Car,
  Heart,
  HeartHandshake,
  PersonStanding,
  Scissors,
  SearchX,
  ShoppingCart,
  Stethoscope,
} from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Bölüm menüsü: üç sekme, altında hep açık duran kısayol şeridi.
 *
 * Burada on iki bağlantı düz bir şerit hâlinde, hepsi aynı ağırlıkta
 * duruyordu; ziyaretçi "burası ne" sorusunun cevabını göremiyordu. Sonra
 * açılır listelere çevrildi ama o da iki tıklama gerektiriyordu ve şeridin
 * kendisi kayboldu.
 *
 * Şimdi ikisi birlikte: sekme hangi öbeğe baktığını söylüyor, şerit o
 * öbeğin tamamını tek tıklamayla erişilebilir tutuyor. Şerit hiç
 * kapanmıyor — kapanabilen bir menüde kullanıcı her seferinde önce onu
 * açmak zorunda kalıyordu.
 */

type Baglanti = { href: string; label: string; icon: React.ElementType };

const ILANLAR: Baglanti[] = [
  { href: '/sahiplendirme', label: 'Sahiplendirme', icon: Heart },
  { href: '/al-sat', label: 'Al & Sat', icon: Banknote },
  { href: '/es-arayanlar', label: 'Eş Arayanlar', icon: HeartHandshake },
  { href: '/kayip', label: 'Kayıp & Bulundu', icon: SearchX },
];

/**
 * Güvercin kendi dikeyi ama menüde ayrı bir RENK taşımıyor.
 * Renkli rozet, o sayfada değilken bile o sayfadaymış hissi veriyordu.
 */
const GUVERCINLER: Baglanti[] = [
  { href: '/guvercin-ilanlari', label: 'Güvercin İlanları', icon: Bird },
  { href: '/ilan-ver/guvercin', label: 'Güvercin İlanı Ver', icon: Heart },
  { href: '/pet-malzemeleri', label: 'Güvercin Malzemeleri', icon: ShoppingCart },
];

const HIZMETLER: Baglanti[] = [
  { href: '/veteriner', label: 'Veteriner', icon: Stethoscope },
  { href: '/pet-oteli', label: 'Pet Oteli', icon: Building },
  { href: '/pet-kuafor', label: 'Pet Kuaför', icon: Scissors },
  { href: '/egitmen', label: 'Eğitmen', icon: Award },
  { href: '/petshop', label: 'Petshop', icon: ShoppingCart },
  { href: '/pet-taksi', label: 'Pet Taksi', icon: Car },
  { href: '/gezdirici', label: 'Gezdirici', icon: PersonStanding },
];

const OBEKLER = [
  { key: 'ilanlar', label: 'İlanlar', baglantilar: ILANLAR },
  { key: 'guvercinler', label: 'Güvercinler', baglantilar: GUVERCINLER },
  { key: 'hizmetler', label: 'Hizmetler', baglantilar: HIZMETLER },
] as const;

type ObekAnahtari = (typeof OBEKLER)[number]['key'];

function icinde(pathname: string, liste: Baglanti[]): boolean {
  return liste.some((b) => pathname === b.href || pathname.startsWith(`${b.href}/`));
}

/** Bulunulan sayfa hangi öbeğe aitse o sekme açık başlıyor. */
function baslangicObegi(pathname: string): ObekAnahtari {
  if (icinde(pathname, GUVERCINLER)) return 'guvercinler';
  if (icinde(pathname, HIZMETLER)) return 'hizmetler';
  return 'ilanlar';
}

export function SectionNav() {
  const pathname = usePathname() ?? '/';
  const [acik, setAcik] = useState<ObekAnahtari>(() => baslangicObegi(pathname));

  const secili = OBEKLER.find((o) => o.key === acik) ?? OBEKLER[0];

  return (
    <div>
      {/* Sekmeler */}
      <div className="no-scrollbar flex gap-1 overflow-x-auto border-b px-3 md:px-0">
        {OBEKLER.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setAcik(o.key)}
            aria-pressed={acik === o.key}
            className={cn(
              '-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
              acik === o.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Seçili öbeğin kısayolları — hep açık */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 py-2 md:justify-start md:gap-1 md:px-0">
        {secili.baglantilar.map((b) => {
          const Icon = b.icon;
          const aktif = pathname === b.href || pathname.startsWith(`${b.href}/`);
          return (
            <Link
              key={b.href}
              href={b.href}
              className={cn(
                'flex min-w-[74px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2 transition-colors md:min-w-0 md:px-3',
                aktif ? 'bg-primary/8 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-primary'
              )}
            >
              <span
                className={cn(
                  'rounded-full p-2 transition-colors',
                  aktif ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="whitespace-nowrap text-[11px] font-medium leading-tight">
                {b.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
