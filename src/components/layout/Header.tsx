'use client';

import Link from 'next/link';
import {
  ChevronRight,
  Menu,
  Heart,
  LogOut,
  Stethoscope,
  Building,
  Award,
  Scissors,
  SearchX,
  Car,
  PersonStanding,
  ShoppingCart,
  HeartHandshake,
  UserPlus,
  User,
  Shield,
  Bell,
  MessageSquare,
  ChevronDown,
  Package,
  Store,
  ShoppingBag,
  CreditCard,
  FileText,
  MessageCircle,
  Bird,      
  Banknote,  
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { UnreadBadge } from './UnreadBadge';
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
  NavigationMenuLink,
} from "@/components/ui/navigation-menu"
import { SearchFilters } from '../SearchFilters';
import { Logo } from '@/components/Logo';
import { SERVICE_CONFIGS } from '@/lib/services-config';
import { Skeleton } from '../ui/skeleton';

// /blog ve /guvenlik buradan KALDIRILDI: ikisi de mevcut değildi ve mobil
// menüden tıklayan herkes 404'e düşüyordu.

const serviceCategories = [
  { icon: Heart, label: 'Sahiplendirme', href: '/sahiplendirme' },
  { icon: Bird, label: 'Güvercinler', href: '/guvercin-ilanlari' },
  { icon: Banknote, label: 'Al & Sat', href: '/al-sat' },
  { icon: HeartHandshake, label: 'Eş Arayanlar', href: '/es-arayanlar' },
  { icon: SearchX, label: 'Kayıp & Bulundu', href: '/kayip' },
  { icon: Stethoscope, label: 'Veteriner', href: '/veteriner' },
  { icon: Building, label: 'Pet Oteli', href: '/pet-oteli' },
  { icon: Award, label: 'Eğitmen', href: '/egitmen' },
  { icon: Scissors, label: 'Pet Kuaför', href: '/pet-kuafor' },
  { icon: ShoppingCart, label: 'Petshop', href: '/petshop' },
  { icon: Car, label: 'Pet Taksi', href: '/pet-taksi' },
  { icon: PersonStanding, label: 'Gezdirici', href: '/gezdirici' },
];

/** Menüdeki ilan bağlantıları. Şeritteki ile aynı hedefler; burada
 *  hepsi görünür, orada yarısı ekran dışında kalıyor. */
const LISTING_LINKS = [
  { href: '/', label: 'Tüm İlanlar' },
  { href: '/sahiplendirme', label: 'Ücretsiz Sahiplendirme' },
  { href: '/al-sat', label: 'Satılık İlanlar' },
  { href: '/guvercin-ilanlari', label: 'Güvercin İlanları' },
  { href: '/es-arayanlar', label: 'Eş Arayanlar' },
  { href: '/kayip', label: 'Kayıp ve Bulunanlar' },
];

/** Şeritteki hizmet rehberleri; ilan bağlantıları menüde ayrı bölümde. */
const SERVICE_HREFS = new Set([
  '/veteriner',
  '/pet-oteli',
  '/egitmen',
  '/pet-kuafor',
  '/petshop',
  '/pet-taksi',
  '/gezdirici',
]);

function MobileGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="overflow-hidden rounded-lg border">{children}</div>
    </div>
  );
}

function MobileLink({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex items-center justify-between border-b px-3 py-2.5 text-sm font-medium last:border-b-0 hover:bg-secondary"
    >
      {label}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [isSheetOpen, setSheetOpen] = React.useState(false);
  const router = useRouter();
  const { user, profile, isUserLoading, isProfileLoading, signOut } = useSupabaseAuth();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  
  const isAdmin = user && user.email === 'admin@petsemti.com';

  const handleLogout = async () => {
    await signOut();
    // Sunucu component'leri eski oturum çerezini önbellekte tutmasın.
    router.refresh();
  };

  const isLoading = !isMounted || isUserLoading || isProfileLoading;
  
  // Dört dalı da aynı şeyi döndüren bir fonksiyondu ve dallardan biri artık
  // var olmayan bir adresi (/guvercinler) kontrol ediyordu.
  const renderFilters = () => <SearchFilters />;

  /**
   * Kategori şeridi ve arama filtreleri yalnızca ilan gezinen sayfalarda
   * anlamlı. Hesap panelinde ve form sayfalarında mobilde ilk ekranın
   * tamamını kaplayıp asıl içeriği ekranın dışına itiyorlardı — kullanıcı
   * "İlanlarım"a girdiğinde önce dört tane açılır liste görüyordu.
   */
  const CHROME_FREE = ['/login', '/kayit', '/profil', '/mesajlarim', '/ilan-ver', '/doping', '/admin'];
  const showCategoriesAndFilters = !CHROME_FREE.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  /**
   * İlan arama çubuğu yalnızca İLAN sayfalarında anlamlı.
   *
   * Hizmet rehberlerinde (veteriner, pet oteli, kuaför...) aranan şey ilan
   * değil işletme; o sayfaların kendi arama kutusu ve kendi süzgeçleri var.
   * "Tüm Türler / Tüm Cinsler" açılır listelerini veteriner rehberinde
   * göstermek, alakasız bir filtreyi sayfanın en üstüne koymak demekti.
   *
   * Kategori şeridi duruyor: o bölümler arası gezinmenin yolu.
   */
  const isServiceDirectory = SERVICE_CONFIGS.some(
    (svc) => pathname === `/${svc.slug}` || pathname.startsWith(`/${svc.slug}/`)
  );
  const showListingSearch = showCategoriesAndFilters && !isServiceDirectory;

  const renderAuthContent = () => {
    if (isLoading) {
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
              <span className="font-medium">{profile?.full_name ?? user.email}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile?.full_name ?? 'Kullanıcı'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {/* Menü artık yalnızca var olan sayfalara gidiyor. Eskiden burada
                /paketler, /magazalarim, /magaza-olustur, /siparislerim,
                /yorumlar ve /kredi-hareketleri vardı; hiçbiri mevcut değildi
                ve tıklayan herkes 404 sayfasına düşüyordu. */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild><Link href="/profil"><User className="mr-2 h-4 w-4" /><span>Hesabım</span></Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/profil/ilanlarim"><FileText className="mr-2 h-4 w-4" /><span>İlanlarım</span></Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/mesajlarim"><MessageSquare className="mr-2 h-4 w-4" /><span>Mesajlarım</span><span className="relative ml-2"><UnreadBadge /></span></Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/profil/favoriler"><Heart className="mr-2 h-4 w-4" /><span>Favori İlanlarım</span></Link></DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild><Link href="/doping"><Package className="mr-2 h-4 w-4" /><span>İlanımı Öne Çıkar</span></Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/profil/siparislerim"><ShoppingBag className="mr-2 h-4 w-4" /><span>Siparişlerim</span></Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link href="/profil/fatura"><CreditCard className="mr-2 h-4 w-4" /><span>Fatura Bilgileri</span></Link></DropdownMenuItem>
            </DropdownMenuGroup>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/admin"><Shield className="mr-2 h-4 w-4" /><span>Admin Paneli</span></Link></DropdownMenuItem>
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
        <div className="container flex h-16 items-center px-5">
          {/* Turuncu zeminde tek renk amblem: iki renkli sürümdeki turuncu
              kedi arka planda kayboluyordu. */}
          <Link href="/" className="mr-6 flex items-center" aria-label="PetSemti ana sayfa">
            <Logo variant="mono" size={36} />
          </Link>
          
          <div className="flex flex-1 items-center justify-end space-x-4">
              <div className="hidden md:flex items-center space-x-4">
                {renderAuthContent()}
              </div>
            <Button asChild variant="secondary">
              <Link href={user ? '/ilan-ver' : '/login'}>İlan Ver</Link>
            </Button>
          </div>

          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden hover:bg-white/20">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            {/* MOBİL MENÜ
                Eskiden burada üç bağlantı vardı ve ikisi (/blog, /guvenlik)
                mevcut olmayan sayfalara gidiyordu.

                Menü silinmedi çünkü mobilde gerçek bir işi var: üstteki
                kategori şeridi yatay kaydırılabilir ve on bir öğenin yarısı
                ekran dışında kalıyor — yedi hizmet rehberinin çoğuna oradan
                ulaşılamıyor. Alt menü ise yalnızca beş temel eylemi taşıyor.
                Bu çekmece, geri kalan her şeyin tek düzenli listesi. */}
            <SheetContent side="right" className="w-[320px] overflow-y-auto p-0 sm:w-[380px]">
              <div className="border-b p-4">
                <p className="font-bold">Menü</p>
              </div>

              <nav className="p-4" aria-label="Mobil menü">
                <MobileGroup title="İlanlar">
                  {LISTING_LINKS.map((item) => (
                    <MobileLink key={item.href} {...item} onNavigate={() => setSheetOpen(false)} />
                  ))}
                </MobileGroup>

                <MobileGroup title="Hizmetler">
                  {serviceCategories
                    .filter((c) => SERVICE_HREFS.has(c.href))
                    .map((item) => (
                      <MobileLink
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        onNavigate={() => setSheetOpen(false)}
                      />
                    ))}
                </MobileGroup>

                {user ? (
                  <MobileGroup title="Hesabım">
                    <MobileLink href="/profil" label="Hesabım" onNavigate={() => setSheetOpen(false)} />
                    <MobileLink href="/profil/ilanlarim" label="İlanlarım" onNavigate={() => setSheetOpen(false)} />
                    <MobileLink href="/mesajlarim" label="Mesajlarım" onNavigate={() => setSheetOpen(false)} />
                    <MobileLink href="/profil/favoriler" label="Favorilerim" onNavigate={() => setSheetOpen(false)} />
                    {profile?.role === 'admin' && (
                      <MobileLink href="/admin" label="Yönetim Paneli" onNavigate={() => setSheetOpen(false)} />
                    )}
                  </MobileGroup>
                ) : null}

                <MobileGroup title="Kurumsal">
                  <MobileLink href="/hakkimizda" label="Hakkımızda" onNavigate={() => setSheetOpen(false)} />
                  <MobileLink href="/iletisim" label="İletişim" onNavigate={() => setSheetOpen(false)} />
                  <MobileLink href="/kullanim-sartlari" label="Kullanım Şartları" onNavigate={() => setSheetOpen(false)} />
                  <MobileLink href="/gizlilik-politikasi" label="Gizlilik Politikası" onNavigate={() => setSheetOpen(false)} />
                </MobileGroup>

                <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                  <Button asChild onClick={() => setSheetOpen(false)}>
                    <Link href={user ? '/ilan-ver' : '/login'}>Ücretsiz İlan Ver</Link>
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
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleLogout();
                        setSheetOpen(false);
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Çıkış Yap
                    </Button>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* KATEGORİ VE FİLTRE ALANI - MASAÜSTÜ İÇİN TEK SATIR AYARI */}
      {showCategoriesAndFilters && (
        <div className="bg-white shadow-sm border-b py-2">
          <div className="w-full md:container md:mx-auto">
            
            <div className="w-full">
              {/* ÖNEMLİ DEĞİŞİKLİK BURADA:
                  md:flex-nowrap -> Asla alt satıra geçme
                  md:justify-between -> Ekrana eşit yay
                  md:gap-1 -> Araları sıkı tut
              */}
              <div className="flex w-full overflow-x-auto py-2 px-4 gap-3 md:flex md:justify-between md:flex-nowrap md:gap-1 md:overflow-visible no-scrollbar">
                {serviceCategories.map((service) => {
                  const isActive = pathname === service.href;

                  return (
                    <Link
                      href={service.href}
                      key={service.label}
                      className={cn(
                        'flex flex-col items-center justify-center transition-all duration-200 rounded-xl',
                        'min-w-[72px] py-2 gap-1.5',
                        // Masaüstünde paddingleri biraz azalttık (px-2) ki 11 tane sığsın
                        'md:min-w-0 md:w-auto md:px-2 md:py-2 md:gap-2',
                        isActive
                          ? 'bg-orange-50 text-primary ring-1 ring-primary/20 shadow-sm'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-primary'
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-full transition-colors",
                        isActive ? "bg-white text-primary shadow-sm" : "bg-gray-100/50 text-gray-500 group-hover:bg-white"
                      )}>
                        <service.icon className="w-5 h-5 md:w-5 md:h-5" />
                      </div>
                      
                      <span className={cn(
                        "text-[10px] md:text-[11px] font-medium text-center leading-tight px-1",
                        "whitespace-nowrap md:whitespace-nowrap" 
                      )}>
                        {service.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
            
            {/* Hizmet rehberlerinde gösterilmiyor: orada aranan ilan değil
                işletme ve sayfanın kendi süzgeçleri var. */}
            {showListingSearch && (
              <div className="px-4 md:px-0 mt-2">
                {renderFilters()}
              </div>
            )}
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