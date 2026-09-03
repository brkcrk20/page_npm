'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
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
import { cn } from '@/lib/utils';

/**
 * Hesap panelinin sol menüsü.
 *
 * Panel sayfaları eskiden birbirinden kopuktu: ilanlar /profil'de, favoriler
 * /profil/favoriler'de, mesajlar /mesajlarim'da, fatura bilgileri bambaşka bir
 * adreste duruyordu ve aralarında hiçbir bağ yoktu. Kullanıcı bir bölüme
 * gittiğinde diğerlerine dönmek için tarayıcının geri düğmesine mecburdu.
 *
 * Menü mobilde yatay kaydırılabilir bir şeride dönüşüyor: dar ekranda 8
 * satırlık dikey menü, asıl içeriği ekranın tamamen dışına itiyordu.
 */

const ITEMS = [
  { href: '/profil', label: 'Özet', icon: LayoutGrid, exact: true },
  { href: '/profil/ilanlarim', label: 'İlanlarım', icon: List },
  { href: '/mesajlarim', label: 'Mesajlarım', icon: MessageSquare, badge: true },
  { href: '/profil/favoriler', label: 'Favorilerim', icon: Heart },
  { href: '/doping', label: 'Öne Çıkar', icon: Rocket },
  { href: '/profil/siparislerim', label: 'Siparişlerim', icon: CreditCard },
  { href: '/profil/hesap', label: 'Hesap Bilgilerim', icon: User },
  { href: '/profil/fatura', label: 'Fatura Bilgileri', icon: FileText },
] as const;

export function ProfileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useSupabaseAuth();

  const isCorporate = profile?.account_type === 'kurumsal';
  const displayName =
    (isCorporate ? profile?.company_title : null) ??
    profile?.full_name ??
    profile?.username ??
    'Üyelik';

  return (
    <div className="space-y-4">
      {/* Kimlik kartı: hangi hesapla giriş yapıldığı her sayfada görünür
          olmalı — kurumsal ve bireysel hesabı olan kullanıcılar karıştırıyordu. */}
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            {isCorporate ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
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

        <Button asChild className="mt-3 w-full" size="sm">
          <Link href="/ilan-ver">
            <Plus className="mr-1.5 h-4 w-4" />
            Ücretsiz İlan Ver
          </Link>
        </Button>
      </div>

      <nav
        className="-mx-5 flex gap-1 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-col md:overflow-visible md:rounded-xl md:border md:bg-white md:p-2"
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
                'flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-medium transition-colors md:w-full md:border-0',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-transparent bg-secondary text-foreground hover:bg-secondary/70 md:bg-transparent md:hover:bg-secondary'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
              {'badge' in item && item.badge && (
                <span className="relative ml-auto hidden md:inline">
                  <UnreadBadge />
                </span>
              )}
            </Link>
          );
        })}

        {profile?.role === 'admin' && (
          <Link
            href="/admin"
            className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-secondary px-3 py-2 text-sm font-medium hover:bg-secondary/70 md:w-full md:border-0 md:bg-transparent md:hover:bg-secondary"
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Yönetim Paneli</span>
          </Link>
        )}

        <button
          type="button"
          onClick={async () => {
            await signOut();
            router.push('/');
            router.refresh();
          }}
          className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-secondary px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 md:w-full md:border-0 md:bg-transparent"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Çıkış Yap</span>
        </button>
      </nav>
    </div>
  );
}
