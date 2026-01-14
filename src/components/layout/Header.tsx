
'use client';

import Link from 'next/link';
import {
  Menu,
  Heart,
  LogOut,
  Stethoscope,
  Building,
  Award,
  Scissors,
  Car,
  PersonStanding,
  ShoppingCart,
  HeartHandshake,
  UserPlus,
  User,
  LifeBuoy,
  Shield,
  Bell,
  MessageSquare,
  ChevronDown,
  Package,
  Store,
  ShoppingBag,
  Star,
  CreditCard,
  FileText,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/firebase/firestore/use-user-profile';
import { signOut, getAuth } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SearchFilters } from '../SearchFilters';
import { VetSearchFilters } from '../VetSearchFilters';
import { Skeleton } from '../ui/skeleton';

const navLinks = [
  { href: '/', label: 'İlanlar' },
  { href: '/blog', label: 'Blog' },
  { href: '/guvenlik', label: 'Güvenlik' },
];

const serviceCategories = [
  { icon: Heart, label: 'Sahiplendirme', href: '/' },
  { icon: HeartHandshake, label: 'Eş Arayanlar', href: '/es-arayanlar' },
  { icon: Stethoscope, label: 'Veteriner', href: '/veteriner' },
  { icon: Building, label: 'Pet Oteli', href: '/pet-oteli' },
  { icon: Award, label: 'Eğitmen', href: '/egitmen' },
  { icon: Scissors, label: 'Pet Kuaför', href: '/pet_kuafor' },
  { icon: ShoppingCart, label: 'Petshop', href: '/petshop' },
  { icon: Car, label: 'Pet Taksi', href: '/pet_taksi' },
  { icon: PersonStanding, label: 'Gezdirici', href: '/gezdirici' },
];

const mainCategories = ['Köpek', 'Kedi', 'Kuş', 'Akvaryum', 'Diğer'];

const slugify = (text: string) => {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};


export function Header() {
  const pathname = usePathname();
  const [isSheetOpen, setSheetOpen] = React.useState(false);
  const { user, isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const auth = getAuth();
  
  const isAdmin = user && user.email === 'admin@petsemti.com';
  const isPremium = userProfile?.userStatus === 'premium';

  const handleLogout = () => {
    signOut(auth);
  };

  const getInitials = (email?: string | null) => {
    if (!email) return 'U';
    return email.charAt(0).toUpperCase();
  };

  const isLoading = !isMounted || isUserLoading || isProfileLoading;
  
  const renderFilters = () => {
    if (pathname === '/veteriner') {
      return <VetSearchFilters pageType="vet" />;
    }
    if (pathname === '/pet-oteli') {
      return <VetSearchFilters pageType="hotel" />;
    }
    if (pathname === '/egitmen') {
      return <VetSearchFilters pageType="trainer" />;
    }
    if (pathname === '/pet_kuafor') {
      return <VetSearchFilters pageType="groomer" />;
    }
    if (pathname === '/petshop') {
      return <VetSearchFilters pageType="petshop" />;
    }
    if (pathname === '/pet_taksi') {
      return <VetSearchFilters pageType="pet_taksi" />;
    }
    if (pathname === '/gezdirici') {
      return <VetSearchFilters pageType="walker" />;
    }
    if (pathname === '/es-arayanlar') {
      return <SearchFilters />;
    }
    // Default filters for home page and others
    return <SearchFilters />;
  };

  const showCategoriesAndFilters = pathname !== '/login' && pathname !== '/kayit' && pathname !== '/profil';

  const renderAuthContent = () => {
    if (isLoading) {
      // Show a single skeleton that roughly matches the final size of the auth section
      return <Skeleton className="h-10 w-64" />;
    }
    
    if (!user) {
      return (
        <div className="hidden md:flex items-center space-x-2">
          <Button variant="ghost" asChild className="hover:bg-white/20 hover:text-white">
            <Link href="/login" className="text-sm font-medium">Giriş Yap</Link>
          </Button>
          <Button variant="outline" asChild className="border-primary-foreground/50 bg-transparent text-primary-foreground hover:bg-white/20 hover:text-white">
            <Link href="/kayit">
              <UserPlus className="mr-2 h-4 w-4" />
              Kayıt Ol
            </Link>
          </Button>
        </div>
      );
    }
  
    return (
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 hover:bg-white/20 hover:text-white px-3">
              <span className="font-medium">{userProfile?.name ?? user.email}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userProfile?.name ?? 'Kullanıcı'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profil">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profilim</span>
                </Link>
              </DropdownMenuItem>
               <DropdownMenuItem asChild>
                <Link href="/profil#update">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil Güncelle</span>
                </Link>
              </DropdownMenuItem>
               <DropdownMenuItem asChild>
                <Link href="/paketler">
                  <Package className="mr-2 h-4 w-4" />
                  <span>Paket Satın Al</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
             <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link href="/mesajlarim">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>Mesajlarım</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/profil/favoriler">
                        <Heart className="mr-2 h-4 w-4" />
                        <span>Favori İlanlarım</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/profil/ilanlarim">
                       <FileText className="mr-2 h-4 w-4" />
                       <span>İlanlarım</span>
                    </Link>
                </DropdownMenuItem>
             </DropdownMenuGroup>
             <DropdownMenuSeparator />
             <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link href="/magazalarim">
                        <Store className="mr-2 h-4 w-4" />
                        <span>Mağazalarım</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/magaza-olustur">
                        <Store className="mr-2 h-4 w-4" />
                        <span>Mağaza Oluştur</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/siparislerim">
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        <span>Siparişlerim</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/yorumlar">
                       <MessageCircle className="mr-2 h-4 w-4" />
                       <span>Yorumlar</span>
                    </Link>
                </DropdownMenuItem>
             </DropdownMenuGroup>
             <DropdownMenuSeparator />
             <DropdownMenuGroup>
                <DropdownMenuItem>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Krediniz: {userProfile?.credit ?? 0}</span>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href="/kredi-hareketleri">
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Borç Hareketleri</span>
                    </Link>
                </DropdownMenuItem>
             </DropdownMenuGroup>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin Paneli</span>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Güvenli Çıkış</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="hover:bg-white/20 hover:text-white">
          <MessageSquare className="h-5 w-5" />
          <span className="sr-only">Mesajlar</span>
        </Button>
        <Button variant="ghost" size="icon" className="hover:bg-white/20 hover:text-white">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Bildirimler</span>
        </Button>
      </div>
    );
  };


  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground">
        <div className="container flex h-16 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <div className="bg-white p-1 rounded-md">
              <Heart className="h-6 w-6 text-primary fill-primary" />
            </div>
            <span className="font-bold text-xl">petsemti</span>
          </Link>
          
          <div className="flex flex-1 items-center justify-end space-x-4">
             <div className="hidden md:flex items-center space-x-4">
                {renderAuthContent()}
             </div>
            <Button asChild variant="secondary">
              <Link href={user ? '/listings/new' : '/login'}>İlan Ver</Link>
            </Button>
          </div>

          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden hover:bg-white/20">
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
                  {!isLoading && !user && (
                    <>
                      <Button variant="outline" asChild onClick={() => setSheetOpen(false)}>
                        <Link href="/login">Giriş Yap</Link>
                      </Button>
                      <Button variant="secondary" asChild onClick={() => setSheetOpen(false)}>
                        <Link href="/kayit">Kayıt Ol</Link>
                      </Button>
                    </>
                  )}
                  {user && (
                     <Button variant="outline" onClick={() => { handleLogout(); setSheetOpen(false); }}>
                      <LogOut className="mr-2" />Çıkış Yap
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      {showCategoriesAndFilters && (
        <div className="bg-white shadow-sm border-b py-2">
          <div className="container mx-auto">
            <div className="w-full">
              <div className="grid w-full grid-cols-5 md:grid-cols-9 h-auto p-1 bg-muted rounded-md text-muted-foreground">
                {serviceCategories.map((service) => {
                  const isActive = pathname === service.href;

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
            {renderFilters()}
          </div>
        </div>
      )}
    </>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"


    
