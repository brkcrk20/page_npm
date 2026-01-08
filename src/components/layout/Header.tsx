'use client';

import Link from 'next/link';
import { Menu, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import React from 'react';

const navLinks = [
  { href: '/listings', label: 'İlanlar' },
  { href: '/services', label: 'Hizmetler' },
  { href: '/blog', label: 'Blog' },
  { href: '/guvenlik', label: 'Güvenlik' },
];

export function Header() {
  const pathname = usePathname();
  const [isSheetOpen, setSheetOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <div className="bg-primary p-1 rounded-md">
            <Heart className="h-6 w-6 text-primary-foreground fill-white" />
          </div>
          <span className="font-bold text-xl text-primary">PatibulGlobal</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'transition-colors hover:text-primary',
                pathname === link.href ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary hidden md:inline-flex">Giriş</Link>
          <Button asChild>
            <Link href="/listings/new">İlan Ver</Link>
          </Button>
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col space-y-4 mt-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setSheetOpen(false)}
                  className={cn(
                    'text-lg font-medium transition-colors hover:text-primary',
                    pathname === link.href ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t pt-4 flex flex-col space-y-2">
                 <Button asChild onClick={() => setSheetOpen(false)}>
                    <Link href="/listings/new">İlan Ver</Link>
                  </Button>
                <Button variant="outline" asChild onClick={() => setSheetOpen(false)}>
                  <Link href="/login">Giriş Yap</Link>
                </Button>
                <Button variant="secondary" asChild onClick={() => setSheetOpen(false)}>
                  <Link href="/register">Kayıt Ol</Link>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
