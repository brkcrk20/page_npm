'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Flag,
  Inbox,
  ChevronLeft,
  LayoutGrid,
  List,
  Loader2,
  Receipt,
  Settings,
  ShieldCheck,
  ShieldAlert,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { cn } from '@/lib/utils';

/**
 * Yönetim panelinin kabuğu.
 *
 * Yetki kontrolü tek yerde: her sayfaya ayrı ayrı koymak, yeni bir bölüm
 * eklendiğinde unutulmaya açık. Asıl koruma zaten veritabanında (RLS ve
 * is_admin()); buradaki kontrol yetkisiz kullanıcıya çalışmayan bir ekran
 * göstermemek için.
 *
 * Mobil düzen hesap panelindekiyle aynı mantıkta: /admin merkez, alt
 * sayfalarda yalnızca geri bağlantısı. Sekiz satırlık menüyü dar ekranda
 * içeriğin üstüne koymak, tabloları ekranın dışına itiyordu.
 */

const ITEMS = [
  { href: '/admin', label: 'Özet', icon: LayoutGrid, exact: true },
  { href: '/admin/ilanlar', label: 'İlanlar', icon: List },
  { href: '/admin/kullanicilar', label: 'Kullanıcılar', icon: Users },
  { href: '/admin/isletmeler', label: 'İşletmeler', icon: Building2 },
  { href: '/admin/sikayetler', label: 'Şikayetler', icon: Flag },
  { href: '/admin/dogrulamalar', label: 'Kimlik Doğrulama', icon: ShieldCheck },
  { href: '/admin/mesajlar', label: 'İletişim Mesajları', icon: Inbox },
  { href: '/admin/siparisler', label: 'Siparişler', icon: Receipt },
  { href: '/admin/ayarlar', label: 'Ayarlar', icon: Settings },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, profile, isUserLoading, isProfileLoading } = useSupabaseAuth();

  const isHub = pathname === '/admin';

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-bold">Bu sayfaya erişim yetkiniz yok</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Yönetim paneli yalnızca yönetici rolüne sahip hesaplara açıktır.
        </p>
        <Button asChild className="mt-6">
          <Link href={user ? '/profil' : '/login'}>{user ? 'Hesabıma Dön' : 'Giriş Yap'}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full px-5 py-4 md:container md:mx-auto md:py-6">
      <div className="grid gap-4 md:grid-cols-[220px_1fr] md:gap-6">
        <div className="contents md:sticky md:top-20 md:block md:self-start">
          <div className="order-1">
            {!isHub && (
              <Link
                href="/admin"
                className="-ml-1 mb-3 flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground md:hidden"
              >
                <ChevronLeft className="h-4 w-4" />
                Yönetim
              </Link>
            )}
          </div>

          <nav
            className={cn(
              'order-3 overflow-hidden rounded-xl border bg-white md:order-none md:p-2',
              !isHub && 'hidden md:block'
            )}
            aria-label="Yönetim menüsü"
          >
            {ITEMS.map((item) => {
              const active =
                'exact' in item && item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 border-b px-4 py-3 text-sm font-medium transition-colors last:border-b-0',
                    'md:gap-2 md:rounded-lg md:border-b-0 md:px-3 md:py-2',
                    'exact' in item && item.exact && 'hidden md:flex',
                    active ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}

            <Link
              href="/profil"
              className="flex items-center gap-3 border-t px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary md:gap-2 md:rounded-lg md:border-t-0 md:px-3 md:py-2"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="flex-1">Siteye Dön</span>
            </Link>
          </nav>
        </div>

        <main className="order-2 min-w-0 md:order-none">{children}</main>
      </div>
    </div>
  );
}
