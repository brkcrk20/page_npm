'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, Receipt } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

/**
 * Siparişler ve ödeme onayı.
 *
 * Ödeme sağlayıcısı seçilene kadar çalışan yol havale/EFT: kullanıcı sipariş
 * oluşturuyor, parayı gönderiyor, yönetici hesabında görünce onaylıyor.
 * Onay anında satın alınan haklar confirm_order_payment içinde tanımlanıyor
 * — hakları burada elle vermek, iki yerde birden mantık tutmak olurdu.
 */

type Order = {
  id: number;
  public_ref: string;
  status: string;
  amount_minor: number;
  provider: string;
  created_at: string;
  billing_snapshot: Record<string, any> | null;
  order_items: { quantity: number; products: { name: string } | null }[];
};

const STATUSES = [
  { key: 'odeme_bekleniyor', label: 'Ödeme Bekleyen' },
  { key: 'odendi', label: 'Ödendi' },
  { key: 'iptal', label: 'İptal' },
  { key: 'hepsi', label: 'Tümü' },
] as const;

const STATUS_STYLE: Record<string, string> = {
  odeme_bekleniyor: 'bg-amber-100 text-amber-800',
  odendi: 'bg-emerald-100 text-emerald-800',
  iptal: 'bg-slate-100 text-slate-700',
  basarisiz: 'bg-red-100 text-red-700',
  iade: 'bg-blue-100 text-blue-800',
};

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>('odeme_bekleniyor');
  const [rows, setRows] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    let q = getSupabaseBrowserClient()
      .from('orders')
      .select(
        'id, public_ref, status, amount_minor, provider, created_at, billing_snapshot, order_items(quantity, products(name))'
      )
      .order('created_at', { ascending: false })
      .limit(200);

    if (filter !== 'hepsi') q = q.eq('status', filter as any);

    const { data, error } = await q;
    if (error) {
      toast({ variant: 'destructive', title: 'Siparişler yüklenemedi', description: error.message });
    }
    setRows((data as unknown as Order[]) ?? []);
    setIsLoading(false);
  }, [filter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function confirm(ref: string) {
    setBusy(ref);
    const { error } = await getSupabaseBrowserClient().rpc('confirm_order_payment', {
      p_public_ref: ref,
      p_provider_ref: undefined,
    });
    setBusy(null);

    if (error) {
      toast({ variant: 'destructive', title: 'Onaylanamadı', description: error.message });
      return;
    }
    toast({ title: 'Ödeme onaylandı', description: 'Satın alınan haklar tanımlandı.' });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Siparişler</h1>

      <div className="-mx-5 flex gap-1 overflow-x-auto px-5 pb-1">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setFilter(s.key)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              filter === s.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-secondary/70'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white py-16 text-center">
          <Receipt className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Bu filtreye uyan sipariş yok.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((order) => (
            <li
              key={order.id}
              className={cn(
                'flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3',
                busy === order.public_ref && 'opacity-50'
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {order.order_items
                    .map((i) => `${i.products?.name ?? 'Ürün'} × ${i.quantity}`)
                    .join(', ') || 'Sipariş'}
                </p>
                <p className="mt-0.5 break-all text-xs text-muted-foreground">
                  {order.public_ref} ·{' '}
                  {order.billing_snapshot?.company_title ??
                    order.billing_snapshot?.full_name ??
                    'İsimsiz'}{' '}
                  · {order.provider === 'manual' ? 'Havale/EFT' : order.provider} ·{' '}
                  {new Date(order.created_at).toLocaleDateString('tr-TR')}
                </p>
              </div>

              <span className="font-bold text-primary">
                {new Intl.NumberFormat('tr-TR', {
                  style: 'currency',
                  currency: 'TRY',
                  maximumFractionDigits: 0,
                }).format(order.amount_minor / 100)}
              </span>

              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  STATUS_STYLE[order.status] ?? 'bg-slate-100 text-slate-700'
                )}
              >
                {STATUSES.find((s) => s.key === order.status)?.label ?? order.status}
              </span>

              {order.status === 'odeme_bekleniyor' && (
                <Button size="sm" onClick={() => confirm(order.public_ref)}>
                  <Check className="mr-1 h-4 w-4" />
                  Ödemeyi Onayla
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
