'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  Eye,
  Landmark,
  List,
  Loader2,
  Receipt,
  Settings,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

/**
 * Yönetim özeti.
 *
 * Sayımlar head:true ile alınıyor: satırların kendisi gerekmiyor, yalnızca
 * kaç tane olduğu. Binlerce ilanı çekip uzunluğuna bakmak, panelin
 * açılışını ilan sayısıyla birlikte yavaşlatırdı.
 *
 * Bekleyen işler ayrı bir blokta ve en üstte: panele girilmesinin başlıca
 * sebebi "onay bekleyen bir şey var mı" sorusu.
 */

type Stats = {
  listings: number;
  published: number;
  pendingListings: number;
  users: number;
  admins: number;
  providers: number;
  pendingProviders: number;
  pendingOrders: number;
  pendingIdentity: number;
  pendingMessages: number;
  monetization: boolean;
  autoApprove: boolean;
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    // Tablo adı şemadaki isimlerle sınırlı: serbest metin, tipli istemcinin
    // yakalayabileceği bir yazım hatasını çalışma zamanına bırakırdı.
    type Countable = 'listings' | 'profiles' | 'service_providers' | 'orders' | 'identity_requests' | 'contact_messages';

    const count = (table: Countable, apply?: (q: any) => any): Promise<number> => {
      const q = supabase.from(table).select('*', { count: 'exact', head: true });
      return (apply ? apply(q) : q).then((r: any) => r.count ?? 0);
    };

    (async () => {
      const counts = await Promise.all([
        count('listings'),
        count('listings', (q: any) => q.eq('status', 'yayinda')),
        count('listings', (q: any) => q.eq('status', 'onay_bekliyor')),
        count('profiles'),
        count('profiles', (q: any) => q.eq('role', 'admin')),
        count('service_providers'),
        count('service_providers', (q: any) => q.eq('status', 'onay_bekliyor')),
        count('orders', (q: any) => q.eq('status', 'odeme_bekleniyor')),
        // Kimlik doğrulama elle onaylanıyor; bekleyen başvuru gözden kaçmamalı.
        count('identity_requests', (q: any) => q.eq('status', 'inceleniyor')),
        // E-posta sağlayıcısı yok; mesajlar yalnızca panelde görülüyor.
        count('contact_messages', (q: any) => q.eq('status', 'yeni')),
      ]);
      const [
        listings, published, pendingListings, users, admins,
        providers, pendingProviders, pendingOrders, pendingIdentity, pendingMessages,
      ] = counts as number[];

      const settings = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['monetization', 'listing']);

      const byKey = new Map(
        ((settings.data as { key: string; value: any }[]) ?? []).map((r) => [r.key, r.value])
      );

      setStats({
        listings, published, pendingListings, users, admins,
        providers, pendingProviders, pendingOrders, pendingIdentity, pendingMessages,
        monetization: Boolean(byKey.get('monetization')?.enabled),
        autoApprove: byKey.get('listing')?.auto_approve !== false,
      });
    })();
  }, []);

  if (!stats) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingTotal =
    stats.pendingListings +
    stats.pendingProviders +
    stats.pendingOrders +
    stats.pendingIdentity +
    stats.pendingMessages;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Yönetim Paneli</h1>

      {pendingTotal > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 font-semibold text-amber-900">
            <AlertTriangle className="h-5 w-5" />
            Bekleyen {pendingTotal} iş var
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {stats.pendingListings > 0 && (
              <Button asChild size="sm" variant="outline" className="bg-white">
                <Link href="/admin/ilanlar?durum=onay_bekliyor">
                  {stats.pendingListings} ilan onay bekliyor
                </Link>
              </Button>
            )}
            {stats.pendingProviders > 0 && (
              <Button asChild size="sm" variant="outline" className="bg-white">
                <Link href="/admin/isletmeler?durum=onay_bekliyor">
                  {stats.pendingProviders} işletme onay bekliyor
                </Link>
              </Button>
            )}
            {stats.pendingIdentity > 0 && (
              <Button asChild size="sm" variant="outline" className="bg-white">
                <Link href="/admin/dogrulamalar">
                  {stats.pendingIdentity} kimlik doğrulaması bekliyor
                </Link>
              </Button>
            )}
            {stats.pendingMessages > 0 && (
              <Button asChild size="sm" variant="outline" className="bg-white">
                <Link href="/admin/mesajlar">{stats.pendingMessages} yeni mesaj</Link>
              </Button>
            )}
            {stats.pendingOrders > 0 && (
              <Button asChild size="sm" variant="outline" className="bg-white">
                <Link href="/admin/siparisler">{stats.pendingOrders} ödeme bekliyor</Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-white p-4 text-sm text-muted-foreground">
          Bekleyen iş yok. Onay bekleyen ilan, işletme kaydı ve ödeme bulunmuyor.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={List} label="Toplam İlan" value={stats.listings} href="/admin/ilanlar" />
        <Stat icon={Eye} label="Yayında" value={stats.published} href="/admin/ilanlar?durum=yayinda" />
        <Stat icon={Users} label="Kullanıcı" value={stats.users} href="/admin/kullanicilar" />
        <Stat icon={Building2} label="İşletme" value={stats.providers} href="/admin/isletmeler" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SettingCard
          icon={Settings}
          title="İlan Onayı"
          state={stats.autoApprove ? 'Otomatik' : 'Elle onay'}
          note={
            stats.autoApprove
              ? 'İlanlar verildiği anda yayına giriyor.'
              : 'Her ilan yönetici onayından geçiyor.'
          }
          good={stats.autoApprove}
        />
        <SettingCard
          icon={Landmark}
          title="Ücretlendirme"
          state={stats.monetization ? 'Açık' : 'Kapalı'}
          note={
            stats.monetization
              ? 'Öne çıkarma ve paket satışı aktif.'
              : 'Tüm ilanlar ücretsiz; satış ekranı gizli.'
          }
          good={stats.monetization}
        />
      </div>

      <div className="rounded-xl border bg-white p-4 text-sm">
        <p className="font-medium">Hızlı erişim</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/kullanicilar">Kullanıcı Ara</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/ayarlar">Site Ayarları</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin/siparisler">
              <Receipt className="mr-1.5 h-3.5 w-3.5" />
              Siparişler
            </Link>
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Sistemde {stats.admins} yönetici hesabı var.
        </p>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: any;
  label: string;
  value: number;
  href: string;
}) {
  return (
    <Link href={href} className="rounded-xl border bg-white p-4 transition-colors hover:border-primary/40">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <p className="mt-2 text-2xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </Link>
  );
}

function SettingCard({
  icon: Icon,
  title,
  state,
  note,
  good,
}: {
  icon: any;
  title: string;
  state: string;
  note: string;
  good: boolean;
}) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-medium">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </span>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-semibold',
            good ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
          )}
        >
          {state}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{note}</p>
      <Link
        href="/admin/ayarlar"
        className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
      >
        Ayarlardan değiştir
      </Link>
    </div>
  );
}
