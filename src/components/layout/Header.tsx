'use client';

import Link from 'next/link';
import {
  Menu,
  Heart,
  LogOut,
  Stethoscope,
  Building,
  Medal,
  Scissors,
  Car,
  PersonStanding,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { usePathname, useSearchParams } from 'next/navigation';
import React from 'react';
import { useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { SearchFilters } from '../SearchFilters';

const navLinks = [
  { href: '/', label: 'İlanlar' },
  { href: '/services', label: 'Hizmetler' },
  { href: '/blog', label: 'Blog' },
  { href: '/guvenlik', label: 'Güvenlik' },
];

const serviceCategories = [
  { icon: Heart, label: 'Sahiplendirme', href: '/' },
  { icon: Stethoscope, label: 'Veteriner', href: '/veteriner' },
  { icon: Building, label: 'Pet Oteli', href: '/services?category=Pet%20Hotel' },
  { icon: Medal, label: 'Eğitmen', href: '/services?category=Trainer' },
  { icon: Scissors, label: 'Pet Kuaför', href: '/services?category=Groomer' },
  { icon: ShoppingCart, label: 'Petshop', href: '/services?category=Petshop' },
  { icon: Car, label: 'Pet Taksi', href: '/services?category=Pet%20Taxi' },
  { icon: PersonStanding, label: 'Gezdirici', href: '/services?category=Walker' },
];

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSheetOpen, setSheetOpen] = React.useState(false);
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  
  const currentCategory = searchParams.get('category');

  const handleLogout = () => {
    signOut(auth);
  };

  const getInitials = (email?: string | null) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  return (
    <>
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
            {!isUserLoading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
                          <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.displayName ?? 'Kullanıcı'}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Çıkış Yap</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-primary hidden md:inline-flex">Giriş</Link>
                )}
              </>
            )}

            <Button asChild>
              <Link href={user ? '/listings/new' : '/login'}>İlan Ver</Link>
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
                    <Link href={user ? '/listings/new' : '/login'}>İlan Ver</Link>
                  </Button>
                  {user ? (
                    <Button variant="outline" onClick={() => { handleLogout(); setSheetOpen(false); }}>
                      Çıkış Yap
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" asChild onClick={() => setSheetOpen(false)}>
                        <Link href="/login">Giriş Yap</Link>
                      </Button>
                      <Button variant="secondary" asChild onClick={() => setSheetOpen(false)}>
                        <Link href="/register">Kayıt Ol</Link>
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto">
          <div className="w-full pt-4">
            <div className="grid w-full grid-cols-4 md:grid-cols-8 h-auto p-1 bg-muted rounded-md text-muted-foreground">
              {serviceCategories.map((service) => {
                const serviceCategoryValue = service.href.split('?category=')[1] ?? '';
                const isActive = (pathname === '/' && service.href === '/') ||
                                 (pathname === service.href) ||
                                 (pathname.startsWith('/services') && service.href.startsWith('/services') && currentCategory && decodeURIComponent(serviceCategoryValue) === currentCategory);

                return (
                  <Link
                    href={service.href}
                    key={service.label}
                    className={cn(
                      'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-col gap-1 h-auto text-center hover:text-primary',
                      isActive
                        ? 'bg-background text-primary shadow-sm [box-shadow:0_0_8px_hsl(var(--primary))]'
                        : ''
                    )}
                  >
                    <service.icon className="w-5 h-5 transition-colors" />
                    <span className="text-xs font-medium hidden sm:block">{service.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <SearchFilters />
        </div>
      </div>
    </>
  );
}
