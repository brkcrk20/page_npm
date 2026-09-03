'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, Loader2, Receipt, Rocket, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { cn } from '@/lib/utils';

/**
 * Siparişlerim.
 *
 * Ücretlendirme şu an kapalı (ürünler pasif, fiyatlar sıfır) ama sipariş
 * altyapısı çalışıyor. Sayfa boş sipariş listesi için "yakında" demiyor:
 * kullanıcının halihazırda ilan hakkı veya aboneliği olabilir ve bunları
 * göreceği başka bir yer yok.
 */

type Order = {
  id: number;
  public_ref: string;
  status: string;
  amount_minor: number;
  provider: string;
  created_at: string;
  order_items: { quantity: number; products: { name: string } | null }[];
};

type Subscription = {
  id: number;
  ends_at: string;
  is_active: boolean;
  products: { name: string } | null;
};

const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  odeme_bekleniyor: { label: 'Ödeme Bekleniyor', className: 'bg-amber-100 text-amber-800' },
  odendi:           { label: 'Ödendi',           className: 'bg-emerald-100 text-emerald-800' },
  iptal:            { label: 'İptal Edildi',     className: 'bg-slate-100 text-slate-700' },
  basarisiz:        { label: 'Başarısız',        className: 'bg-red-100 text-red-700' },
  iade:             { label: 'İade Edildi',      className: 'bg-blue-100 text-blue-800' },
};

function formatPrice(minor: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

export default function OrdersPage() {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [credits, setCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseBrowserClient();

    (async () => {
      const [orderRows, subRows, creditRows] = await Promise.all([
        supabase
          .from('orders')
          .select('id, public_ref, status, amount_minor, provider, created_at, order_items(quantity, products(name))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('subscriptions')
          .select('id, ends_at, is_active, products(name)')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('ends_at', { ascending: false })
          .limit(1),
        supabase.from('listing_credits').select('delta').eq('user_id', user.id),
      ]);

      if (orderRows.error) {
        toast({
          variant: 'destructive',
          title: 'Siparişler yüklenemedi',
          description: orderRows.error.message,
        });
      }

      setOrders((orderRows.data as unknown as Order[]) ?? []);
      setSubscription(((subRows.data as unknown as Subscription[]) ?? [])[0] ?? null);
      setCredits(((creditRows.data as { delta: number }[]) ?? []).reduce((s, c) => s + c.delta, 0));
      setIsLoading(false);
    })();
  }, [user, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Siparişlerim</h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <CreditCard className="h-6 w-6 shrink-0 text-primary" />
            <div>
              <p className="text-2xl font-bold leading-none">{credits}</p>
              <p className="mt-1 text-xs text-muted-foreground">Kalan İlan Hakkı</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <Sparkles className="h-6 w-6 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="truncate font-bold leading-tight">
                {subscription?.products?.name ?? 'Aboneliğiniz yok'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {subscription
                  ? `Bitiş: ${new Date(subscription.ends_at).toLocaleDateString('tr-TR')}`
                  : 'Kurumsal üyelik paketleri'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5" />
            Sipariş Geçmişi
          </CardTitle>
          <CardDescription>
            Öne çıkarma, abonelik ve ilan hakkı satın alımlarınız.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-muted-foreground">Henüz siparişiniz yok.</p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/doping">
                  <Rocket className="mr-1.5 h-4 w-4" />
                  Öne Çıkarma Paketlerine Bak
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => {
                const status = ORDER_STATUS[order.status] ?? {
                  label: order.status,
                  className: 'bg-slate-100 text-slate-700',
                };

                return (
                  <li key={order.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {order.order_items
                            .map((i) => `${i.products?.name ?? 'Ürün'} × ${i.quantity}`)
                            .join(', ') || 'Sipariş'}
                        </p>
                        <p className="mt-0.5 break-all text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('tr-TR')} ·{' '}
                          {order.provider === 'manual' ? 'Havale/EFT' : order.provider} ·{' '}
                          {order.public_ref}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-bold text-primary">
                          {formatPrice(order.amount_minor)}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                            status.className
                          )}
                        >
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {order.status === 'odeme_bekleniyor' && (
                      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                        Havale/EFT açıklamasına sipariş numaranızı yazmayı unutmayın. Ödeme
                        görüldüğünde satın aldığınız haklar otomatik tanımlanır.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
