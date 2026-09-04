'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Award,
  Banknote,
  Bird,
  Building,
  Car,
  ChevronDown,
  Heart,
  HeartHandshake,
  PersonStanding,
  Scissors,
  SearchX,
  ShoppingCart,
  Stethoscope,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * Bölüm menüsü.
 *
 * Burada on iki bağlantı düz bir şerit hâlinde, hepsi aynı ağırlıkta
 * duruyordu. Ziyaretçi siteye girdiğinde "burası tam olarak nedir"
 * sorusunun cevabını göremiyordu: sahiplendirme ile pet taksi yan yana,
 * aynı boyutta. Mobilde ise şeridin yarısı ekranın dışında kalıyor ve
 * hizmet rehberlerinin çoğuna oradan hiç ulaşılamıyordu.
 *
 * Üç öbek var ve ikisi açılır liste:
 *   İlanlar          — kullanıcının bir şey aradığı ya da verdiği yer
 *   Güvercin Dünyası — kendi ırk kataloğu, kendi terminolojisi olan dikey
 *   Hizmetler        — ilan değil, işletme rehberi
 *
 * GÜVERCİN NEDEN AÇILIR LİSTEDE DEĞİL
 * Kendi ırk kataloğu (59 ırk), kendi ilan formu ve kendi giriş sayfası olan
 * ayrı bir dikey. Yedi hizmetin arasına üçüncü sıraya gömmek, sitenin en
 * ayrışan tarafını görünmez kılardı.
 */

type Baglanti = { href: string; label: string; icon: React.ElementType };

const ILANLAR: Baglanti[] = [
  { href: '/sahiplendirme', label: 'Sahiplendirme', icon: Heart },
  { href: '/al-sat', label: 'Al & Sat', icon: Banknote },
  { href: '/es-arayanlar', label: 'Eş Arayanlar', icon: HeartHandshake },
  { href: '/kayip', label: 'Kayıp & Bulundu', icon: SearchX },
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

const GUVERCIN = '/guvercin-ilanlari';

function icinde(pathname: string, liste: Baglanti[]): boolean {
  return liste.some((b) => pathname === b.href || pathname.startsWith(`${b.href}/`));
}

function Obek({
  baslik,
  icon: Icon,
  baglantilar,
  aktif,
}: {
  baslik: string;
  icon: React.ElementType;
  baglantilar: Baglanti[];
  aktif: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
            aktif
              ? 'bg-primary/10 text-primary ring-1 ring-primary/25'
              : 'text-foreground/70 hover:bg-secondary hover:text-primary'
          )}
        >
          <Icon className="h-4 w-4" />
          {baslik}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {baglantilar.map((b) => {
          const BIcon = b.icon;
          return (
            <DropdownMenuItem key={b.href} asChild>
              <Link href={b.href}>
                <BIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                {b.label}
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SectionNav() {
  const pathname = usePathname() ?? '/';
  const guvercinAktif = pathname === GUVERCIN || pathname.startsWith(`${GUVERCIN}/`);

  return (
    <nav
      aria-label="Bölümler"
      className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-3 py-1.5 sm:gap-2 sm:px-4 md:px-0"
    >
      <Obek
        baslik="İlanlar"
        icon={Heart}
        baglantilar={ILANLAR}
        aktif={icinde(pathname, ILANLAR)}
      />

      {/* Kendi dikeyine ayrı bir görsel ağırlık: kuş ikonu ve renkli çerçeve. */}
      <Link
        href={GUVERCIN}
        className={cn(
          'flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
          guvercinAktif
            ? 'border-indigo-600 bg-indigo-600 text-white'
            : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
        )}
      >
        <Bird className="h-4 w-4" />
        {/* Dar ekranda üç öbek yan yana sığmıyordu ve "Hizmetler" kayarak
            ekran dışında kalıyordu — yani gruplama mobilde işe yaramıyordu.
            Kısa ad yalnızca orada. */}
        <span className="sm:hidden">Güvercin</span>
        <span className="hidden sm:inline">Güvercin Dünyası</span>
      </Link>

      <Obek
        baslik="Hizmetler"
        icon={Stethoscope}
        baglantilar={HIZMETLER}
        aktif={icinde(pathname, HIZMETLER)}
      />
    </nav>
  );
}
