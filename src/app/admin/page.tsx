'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Loader2, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';

/**
 * Yönetim paneli.
 *
 * Yetki kontrolü profiles.role = 'admin' üzerinden. Eski sürüm bunu sabit bir
 * e-posta adresine ("admin@petsemti.com") bakarak yapıyordu; o kontrol sadece
 * arayüzü gizliyor, veriye erişimi engellemiyordu. Artık asıl koruma
 * veritabanındaki RLS politikalarında (public.is_admin()); buradaki kontrol
 * yalnızca gereksiz bir ekran göstermemek için.
 *
 * Admin yetkisi vermek için Supabase SQL editöründen:
 *   update public.profiles set role = 'admin' where id = '<kullanici-uuid>';
 */

type PendingListing = {
  id: number;
  slug: string;
  title: string;
  created_at: string;
  status: string;
  profiles: { full_name: string | null; username: string | null } | null;
};

type Stats = {
  listings: number;
  published: number;
  pending: number;
  users: number;
  pendingOrders: number;
};

type PendingOrder = {
  id: number;
  public_ref: string;
  amount_minor: number;
  created_at: string;
  provider: string;
  billing_snapshot: Record<string, any> | null;
  order_items: { quantity: number; products: { name: string } | null }[];
};

export default function AdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, isUserLoading, isProfileLoading } = useSupabaseAuth();

  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<PendingListing[]>([]);
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    if (!isUserLoading && !user) router.replace('/login');
  }, [isUserLoading, user, router]);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    const supabase = getSupabaseBrowserClient();

    const [all, published, pendingCount, users, pendingRows, orderRows] = await Promise.all([
      supabase.from('listings').select('*', { count: 'exact', head: true }),
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'yayinda'),
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'onay_bekliyor'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase
        .from('listings')
        .select('id, slug, title, created_at, status, profiles!listings_owner_id_fkey(full_name, username)')
        .eq('status', 'onay_bekliyor')
        .order('created_at')
        .limit(50),
      supabase
        .from('orders')
        .select(
          `id, public_ref, amount_minor, created_at, provider, billing_snapshot,
           order_items ( quantity, products ( name ) )`
        )
        .eq('status', 'odeme_bekleniyor')
        .order('created_at')
        .limit(50),
    ]);

    setStats({
      listings: all.count ?? 0,
      published: published.count ?? 0,
      pending: pendingCount.count ?? 0,
      users: users.count ?? 0,
      pendingOrders: (orderRows.data ?? []).length,
    });
    setOrders((orderRows.data as unknown as PendingOrder[]) ?? []);
    setPending((pendingRows.data as unknown as PendingListing[]) ?? []);
    setIsLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) load();
    else if (!isProfileLoading) setIsLoading(false);
  }, [isAdmin, isProfileLoading, load]);

  async function confirmPayment(publicRef: string) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.rpc('confirm_order_payment', {
      p_public_ref: publicRef,
      p_provider_ref: undefined,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Onaylanamadı', description: error.message });
      return;
    }
    setOrders((prev) => prev.filter((o) => o.public_ref !== publicRef));
    toast({ title: 'Ödeme onaylandı', description: 'Satın alınan haklar tanımlandı.' });
    load();
  }

  async function moderate(id: number, approve: boolean) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('listings')
      .update({
        status: approve ? 'yayinda' : 'reddedildi',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id ?? null,
        rejection_reason: approve ? null : 'Yayın kurallarına uymuyor.',
      })
      .eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'İşlem başarısız', description: error.message });
      return;
    }
    setPending((prev) => prev.filter((l) => l.id !== id));
    toast({ title: approve ? 'İlan yayına alındı' : 'İlan reddedildi' });
    load();
  }

  if (isUserLoading || isProfileLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <h1 className="text-xl font-bold">Bu sayfaya erişim yetkiniz yok</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Yönetim paneli yalnızca admin rolüne sahip hesaplara açıktır.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Ana Sayfaya Dön</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full px-5 py-6 md:container md:mx-auto">
      <h1 className="mb-6 text-2xl font-bold">Yönetim Paneli</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Toplam İlan" value={stats?.listings ?? 0} />
        <StatCard label="Yayında" value={stats?.published ?? 0} />
        <StatCard label="Onay Bekleyen" value={stats?.pending ?? 0} />
        <StatCard label="Kullanıcı" value={stats?.users ?? 0} />
        <StatCard label="Bekleyen Ödeme" value={stats?.pendingOrders ?? 0} />
      </div>

      <Tabs defaultValue="moderation">
        <TabsList>
          <TabsTrigger value="moderation">Moderasyon</TabsTrigger>
          <TabsTrigger value="orders">Ödemeler</TabsTrigger>
        </TabsList>

        <TabsContent value="moderation" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Onay Bekleyen İlanlar</CardTitle>
              <CardDescription>
                Otomatik onay açıkken bu liste boş kalır. Kapatmak için app_settings
                tablosunda listing.auto_approve değerini false yapın.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pending.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  Onay bekleyen ilan yok.
                </p>
              ) : (
                <ul className="space-y-3">
                  {pending.map((listing) => (
                    <li
                      key={listing.id}
                      className="flex items-center gap-4 rounded-lg border p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/${listing.slug}-${listing.id}`}
                          className="line-clamp-1 font-medium hover:text-primary"
                        >
                          {listing.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          #{listing.id} ·{' '}
                          {listing.profiles?.full_name ?? listing.profiles?.username ?? 'Bilinmeyen'} ·{' '}
                          {new Date(listing.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <Badge variant="secondary">Onay Bekliyor</Badge>
                      <Button size="sm" onClick={() => moderate(listing.id, true)}>
                        <Check className="mr-1 h-4 w-4" />
                        Onayla
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => moderate(listing.id, false)}>
                        <X className="mr-1 h-4 w-4" />
                        Reddet
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ödeme Bekleyen Siparişler</CardTitle>
              <CardDescription>
                Havale/EFT geldiğini gördüğünüzde onaylayın. Onay anında doping,
                abonelik veya ilan hakkı otomatik olarak tanımlanır.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  Ödeme bekleyen sipariş yok.
                </p>
              ) : (
                <ul className="space-y-3">
                  {orders.map((order) => (
                    <li key={order.id} className="flex flex-wrap items-center gap-4 rounded-lg border p-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {order.order_items
                            .map((i) => `${i.products?.name ?? 'Ürün'} × ${i.quantity}`)
                            .join(', ')}
                        </p>
                        <p className="break-all text-xs text-muted-foreground">
                          {order.public_ref} ·{' '}
                          {order.billing_snapshot?.company_title ??
                            order.billing_snapshot?.full_name ??
                            'İsimsiz'}{' '}
                          · {new Date(order.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                      <span className="font-bold text-primary">
                        {new Intl.NumberFormat('tr-TR', {
                          style: 'currency',
                          currency: 'TRY',
                          maximumFractionDigits: 0,
                        }).format(order.amount_minor / 100)}
                      </span>
                      <Button size="sm" onClick={() => confirmPayment(order.public_ref)}>
                        <Check className="mr-1 h-4 w-4" />
                        Ödemeyi Onayla
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
