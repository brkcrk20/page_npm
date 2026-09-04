'use client';

import { UnreadBadge } from './UnreadBadge';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Mobil alt menü.
 *
 * Ortadaki "+" ilan verme düğmesi kaldırıldı: nereden basılırsa basılsın
 * aynı yere gidiyordu ve bölümler birbirine karışıyordu. Artık her sayfanın
 * kendi başlığında o sayfaya özel bir ilan verme düğmesi var.
 */
export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Ana Sayfa',
      icon: Home,
    },
    {
      href: '/profil/favoriler',
      label: 'Favoriler',
      icon: Heart,
    },
    {
      href: '/mesajlarim',
      label: 'Mesajlar',
      icon: MessageSquare,
    },
    {
      href: '/profil',
      label: 'Profil',
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden">
      <div className="grid h-full grid-cols-4 mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          

          // DİĞER BUTONLAR - STANDART TASARIM
          return (
            <Link
              key={item.href}
              href={item.href}
              // DÜZELTME BURADA: px-5'i kaldırdık, w-full ve h-full verdik.
              className="inline-flex flex-col items-center justify-center w-full h-full hover:bg-gray-50 transition-colors group"
            >
              <span className="relative mb-1">
                <item.icon
                  className={cn(
                    "w-6 h-6 transition-colors",
                    isActive ? "text-primary fill-current" : "text-gray-500 group-hover:text-primary"
                  )}
                  // Sadece belirli ikonların içini doldur, diğerleri çizgi kalsın
                  fill={isActive && (item.label === 'Favoriler' || item.label === 'Ana Sayfa') ? "currentColor" : "none"}
                />
                {/* Okunmamış mesaj rozeti yalnızca mesaj sekmesinde */}
                {item.href === '/mesajlarim' && <UnreadBadge />}
              </span>
              <span className={cn(
                // DÜZELTME: whitespace-nowrap ekledik (asla alt satıra geçmez)
                "text-[10px] font-medium transition-colors whitespace-nowrap",
                isActive ? "text-primary" : "text-gray-500 group-hover:text-primary"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}