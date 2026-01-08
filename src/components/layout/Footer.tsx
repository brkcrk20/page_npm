import Link from 'next/link';
import { PawPrint, Twitter, Instagram, Facebook } from 'lucide-react';

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
          <div className="text-center md:text-left text-sm text-muted-foreground mb-4 md:mb-0">
            &copy; {year} Ciraks. Tüm hakları saklıdır.
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
      </div>
    </footer>
  );
}
