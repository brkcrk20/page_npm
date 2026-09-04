'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  Heart,
  LayoutGrid,
  List,
  LogOut,
  MessageSquare,
  Plus,
  Rocket,
  ShieldCheck,
  User,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UnreadBadge } from '@/components/layout/UnreadBadge';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { avatarUrl } from '@/lib/supabase/storage';
import { cn } from '@/lib/utils';

/**
 * Hesap panelinin gezinmesi.
 *
 * MASAÜSTÜ: solda sabit duran menü. İçerikle yan yana, her sayfada görünür.
 *
 * MOBİL: aynı menüyü daracık ekrana sıkıştırmak işe yaramıyordu. Önce yatay
 * kaydırılabilir bir şerit denendi; sekiz öğenin altısı ekranın dışında
 * kalıyor ve orada bir şey olduğu belli olmuyordu. Şimdi telefonlarda alışıldık
 * olan içeri girme düzeni var:
 *
 *   /profil            -> kimlik kartı + tam menü listesi (merkez)
 *   /profil/<bölüm>    -> yalnızca geri bağlantısı, menü yok
 *
 * Böylece mobilde her ekran tek bir işe ayrılıyor ve içerik ilk bakışta
 * görünüyor — menü, içeriği ekranın dışına itmiyor.
 */

const ITEMS = [
  { href: '/profil', label: 'Özet', icon: LayoutGrid, exact: true },
  { href: '/profil/ilanlarim', label: 'İlanlarım', icon: List },
  { href: '/mesajlarim', label: 'Mesajlarım', icon: MessageSquare, badge: true },
  { href: '/profil/favoriler', label: 'Favorilerim', icon: Heart },
  { href: '/doping', label: 'Öne Çıkar', icon: Rocket },
  { href: '/profil/isletmem', label: 'İşletmem', icon: Building2 },
  { href: '/profil/siparislerim', label: 'Siparişlerim', icon: CreditCard },
  { href: '/profil/hesap', label: 'Hesap Bilgilerim', icon: User },
  { href: '/profil/fatura', label: 'Fatura Bilgileri', icon: FileText },
] as const;

/**
 * Mobilde sıralama masaüstündekiyle aynı önceliği izliyor: önce kim olduğun,
 * sonra ilanlarının durumu, en sonda menü. Menüyü içeriğin üstüne koymak,
 * telefonda "Merhaba X" ve sayaçları ekranın dışına itiyordu.
 */
function useProfileNavState() {
  const pathname = usePathname();
  const { user, profile } = useSupabaseAuth();

  const isHub = pathname === '/profil';
  const isCorporate = profile?.account_type === 'kurumsal';
  const photo = avatarUrl(profile?.avatar_url);

  const displayName =
    (isCorporate ? profile?.company_title : null) ??
    profile?.full_name ??
    profile?.username ??
    'Üyelik';

  return { pathname, isHub, isCorporate, photo, displayName, profile, user };
}

/** Mobilde alt sayfalarda merkeze dönüş. Masaüstünde menü zaten görünür. */
export function ProfileBackLink() {
  const { isHub } = useProfileNavState();
  if (isHub) return null;

  return (
    <Link
      href="/profil"
      className="-ml-1 flex items-center gap-1 py-1 text-sm font-medium text-muted-foreground hover:text-foreground md:hidden"
    >
      <ChevronLeft className="h-4 w-4" />
      Hesabım
    </Link>
  );
}

export function ProfileIdentity() {
  const { isHub, isCorporate, photo, displayName, profile, user } = useProfileNavState();

  return (
    <div className={cn('rounded-xl border bg-white p-4', !isHub && 'hidden md:block')}>
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-primary/10">
            {photo ? (
              <Image src={photo} alt={displayName} fill sizes="48px" className="object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center text-primary">
                {isCorporate ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold leading-tight">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {profile?.username ? `@${profile.username}` : user?.email}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant={isCorporate ? 'default' : 'secondary'}>
            {isCorporate ? 'Kurumsal Üye' : 'Bireysel Üye'}
          </Badge>
          {profile?.is_verified && (
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              Onaylı
            </Badge>
          )}
          {profile?.role === 'admin' && <Badge variant="destructive">Yönetici</Badge>}
        </div>

        {/* Mobilde bu düğme gizli: sayfanın kendi çağrısı ve alt menüdeki
            büyük "+" ile birlikte aynı ekranda üç kez tekrarlanıyordu. */}
        <Button asChild size="sm" className="mt-3 hidden w-full md:inline-flex">
          <Link href="/ilan-ver">
            <Plus className="mr-1.5 h-4 w-4" />
            Ücretsiz İlan Ver
          </Link>
        </Button>
      </div>
  );
}

export function ProfileMenu() {
  const { pathname, isHub, profile } = useProfileNavState();
  const router = useRouter();
  const { signOut } = useSupabaseAuth();

  async function logout() {
    await signOut();
    router.push('/');
    router.refresh();
  }

  return (
      <nav
        className={cn(
          'overflow-hidden rounded-xl border bg-white md:p-2',
          !isHub && 'hidden md:block'
        )}
        aria-label="Hesap menüsü"
      >
        {ITEMS.map((item) => {
          const active =
            'exact' in item && item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 border-b px-4 py-3 text-sm font-medium transition-colors last:border-b-0',
                // Masaüstünde ayraç yok, öğeler yuvarlatılmış satırlar.
                'md:gap-2 md:rounded-lg md:border-b-0 md:px-3 md:py-2',
                // Merkezdeyken "Özet" satırı mobilde gizli: zaten o sayfadayız,
                // tıklanınca hiçbir şey olmuyordu.
                'exact' in item && item.exact && 'hidden md:flex',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {'badge' in item && item.badge && (
                <span className="relative">
                  <UnreadBadge />
                </span>
              )}
              <ChevronRight
                className={cn(
                  'h-4 w-4 shrink-0 md:hidden',
                  active ? 'opacity-70' : 'text-muted-foreground'
                )}
              />
            </Link>
          );
        })}

        {profile?.role === 'admin' && (
          <Link
            href="/admin"
            className="flex items-center gap-3 border-b px-4 py-3 text-sm font-medium hover:bg-secondary last:border-b-0 md:gap-2 md:rounded-lg md:border-b-0 md:px-3 md:py-2"
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span className="flex-1">Yönetim Paneli</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground md:hidden" />
          </Link>
        )}

        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/5 md:gap-2 md:rounded-lg md:px-3 md:py-2"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">Çıkış Yap</span>
        </button>
      </nav>
  );
}
