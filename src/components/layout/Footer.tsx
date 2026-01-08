'use client';

import Link from 'next/link';
import { PawPrint, Twitter, Instagram, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-secondary">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <PawPrint className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">Ciraks</span>
          </div>
          <div className="text-center md:text-left text-sm text-muted-foreground mb-4 md:mb-0 space-x-4">
            <span>&copy; {year} Ciraks. Tüm hakları saklıdır.</span>
            <Link href="/admin" className="hover:text-primary underline">Admin</Link>
          </div>
          <div className="flex space-x-4">
            <Link href="#" className="text-muted-foreground hover:text-primary">
              <Twitter />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary">
              <Instagram />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary">
              <Facebook />
            </Link>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border/50 flex flex-col items-center justify-center space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <p className="text-sm text-muted-foreground">Geliştirme Amaçlı Girişler:</p>
            <Button variant="outline" size="sm" onClick={() => alert('Admin olarak giriş yapılıyor...')}>
                Admin Girişi
            </Button>
            <Button variant="outline" size="sm" onClick={() => alert('Premium üye olarak giriş yapılıyor...')}>
                Premium Üye Girişi
            </Button>
            <Button variant="outline" size="sm" onClick={() => alert('Normal üye olarak giriş yapılıyor...')}>
                Normal Üye Girişi
            </Button>
        </div>
      </div>
    </footer>
  );
}
