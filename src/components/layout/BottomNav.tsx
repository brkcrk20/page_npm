'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Heart, Plus, MessageSquare, User } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      href: '/listings/new', // İlan Ver butonu (Ortadaki)
      label: 'İlan Ver',
      icon: Plus,
      isMain: true, // Bunu özel tasarlayacağız
    },
    {
      href: '/mesajlarim',
      label: 'Mesajlar',
      icon: MessageSquare,
    },
    {
      href: '/profil', // Giriş yapılmamışsa login'e yönlendirir (middleware varsa)
      label: 'Profil',
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:hidden">
      <div className="grid h-full grid-cols-5 mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          // Eğer ortadaki "İlan Ver" butonuysa farklı tasarım
          if (item.isMain) {
            return (
              <div key={item.href} className="relative flex items-center justify-center group">
                <Link
                  href={item.href}
                  className="absolute -top-5 flex items-center justify-center w-14 h-14 bg-primary rounded-full shadow-lg shadow-primary/30 transition-transform active:scale-95"
                >
                  <item.icon className="w-7 h-7 text-white" />
                </Link>
                <span className="absolute bottom-1 text-[10px] font-medium text-gray-500">
                  {item.label}
                </span>
              </div>
            );
          }

          // Diğer standart butonlar
          return (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 transition-colors group"
            >
              <item.icon
                className={cn(
                  "w-6 h-6 mb-1 transition-colors",
                  isActive ? "text-primary fill-current" : "text-gray-500 group-hover:text-primary"
                )}
                // Sadece Home ve Heart için 'fill' özelliği mantıklı olabilir, diğerleri stroke kalabilir
                fill={isActive && (item.label === 'Favoriler' || item.label === 'Ana Sayfa') ? "currentColor" : "none"}
              />
              <span className={cn(
                "text-[10px] font-medium transition-colors",
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