'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Loader2, Rocket, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { cn } from '@/lib/utils';

/**
 * Doping ve paket satın alma.
 *
 * Sipariş istemcide değil create_order RPC'si ile oluşturuluyor: fiyat
 * katalogdan okunuyor. İstemciden gelen tutara güvenmek ödeme akışlarındaki
 * en yaygın açık.
 *
 * Ödeme sağlayıcısı seçilene kadar çalışan yol havale/EFT — sipariş oluşuyor,
 * banka bilgisi ve sipariş numarası gösteriliyor, ödeme görüldüğünde admin
 * onaylıyor ve haklar o anda veriliyor.
 */

type Product = {
  id: number;
  code: string;
  kind: string;
  name: string;
  description: string | null;
  price_minor: number;
  duration_days: number | null;
  listing_credits: number | null;
};

type MyListing = { id: number; title: string };

const KIND_LABELS: Record<string, string> = {
  doping: 'İlan Öne Çıkarma',
  abonelik: 'Kurumsal Üyelik',
  ilan_paketi: 'İlan Hakkı Paketleri',
};

function formatPrice(minor: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

export function DopingClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isUserLoading } = useSupabaseAuth();

  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [listings, setListings] = useState<MyListing[]>([]);
  const [listingId, setListingId] = useState(searchParams.get('ilan') ?? '');
  const [bank, setBank] = useState<Record<string, string>>({});
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [orderRef, setOrderRef] = useState<string | null>(null);

  useEffect(() => {
    if (!isUserLoading && !user) router.replace('/login');
  }, [isUserLoading, user, router]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    (async () => {
      const [settings, cat, bankInfo] = await Promise.all([
        supabase.rpc('monetization_enabled'),
        supabase
          .from('products')
          .select('id, code, kind, name, description, price_minor, duration_days, listing_credits')
          .eq('is_active', true)
          .order('position'),
        supabase.from('app_settings').select('value').eq('key', 'payment_manual').maybeSingle(),
      ]);

      setEnabled(Boolean(settings.data));
      setProducts((cat.data as Product[]) ?? []);
      if (bankInfo.data?.value) setBank(bankInfo.data.value as Record<string, string>);
    })();
  }, []);

  useEffect(() => {
    if (!user) return;
    getSupabaseBrowserClient()
      .from('listings')
      .select('id, title')
      .eq('owner_id', user.id)
      .eq('status', 'yayinda')
      .order('created_at', { ascending: false })
      .then(({ data }) => setListings((data as MyListing[]) ?? []));
  }, [user]);

  async function buy(product: Product) {
    if (product.kind === 'doping' && !listingId) {
      toast({
        variant: 'destructive',
        title: 'İlan seçin',
        description: 'Öne çıkarmak istediğiniz ilanı seçmeniz gerekiyor.',
      });
      return;
    }

    setBusyCode(product.code);
    const { data, error } = await getSupabaseBrowserClient().rpc('create_order', {
      p_product_code: product.code,
      p_listing_id: product.kind === 'doping' ? Number(listingId) : undefined,
      p_quantity: 1,
    });
    setBusyCode(null);

    if (error) {
      toast({ variant: 'destructive', title: 'Sipariş oluşturulamadı', description: error.message });
      return;
    }
    setOrderRef(String(data));
  }

  if (isUserLoading || enabled === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return null;

  // Ücretlendirme kapalıyken satış ekranı göstermek yanıltıcı olurdu.
  if (!enabled || products.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-5 py-20 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Öne Çıkarma Yakında</h1>
        <p className="mt-2 text-muted-foreground">
          Şu an tüm ilanlar ücretsiz yayınlanıyor. Vitrin, üst sırada ve acil rozeti gibi
          öne çıkarma seçenekleri kısa süre içinde açılacak.
        </p>
        <Button asChild className="mt-6">
          <Link href="/ilan-ver">Ücretsiz İlan Ver</Link>
        </Button>
      </div>
    );
  }

  // Sipariş oluşturulduysa ödeme yönergesi gösteriliyor.
  if (orderRef) {
    return (
      <div className="mx-auto max-w-lg px-5 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-600" />
              Siparişiniz Alındı
            </CardTitle>
            <CardDescription>
              Ödemeniz onaylandığında ilanınız otomatik olarak öne çıkarılacak.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-xs text-muted-foreground">Sipariş Numarası</p>
              <p className="mt-1 break-all font-mono font-semibold">{orderRef}</p>
            </div>

            {bank.iban ? (
              <dl className="space-y-2">
                <Row label="Banka" value={bank.bank_name} />
                <Row label="Hesap Adı" value={bank.account_name} />
                <Row label="IBAN" value={bank.iban} />
              </dl>
            ) : (
              <p className="rounded-lg border border-dashed p-4 text-muted-foreground">
                Banka bilgileri henüz tanımlanmamış. Ödeme talimatı için bizimle iletişime
                geçin.
              </p>
            )}

            <p className="text-muted-foreground">
              {bank.note ?? 'Açıklama kısmına sipariş numaranızı yazmayı unutmayın.'}
            </p>

            <Button asChild variant="outline" className="w-full">
              <Link href="/profil">Profilime Dön</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const groups = Array.from(
    products.reduce((map, product) => {
      const list = map.get(product.kind) ?? [];
      list.push(product);
      map.set(product.kind, list);
      return map;
    }, new Map<string, Product[]>())
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Rocket className="h-6 w-6 text-primary" />
        İlanını Öne Çıkar
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Öne çıkan ilanlar belirgin şekilde daha fazla görüntüleniyor ve daha hızlı sonuç
        alıyor.
      </p>

      {listings.length > 0 && (
        <div className="mt-6 max-w-md">
          <label className="mb-1.5 block text-sm font-medium">Öne çıkarılacak ilan</label>
          <SearchableSelect
            value={listingId}
            onChange={setListingId}
            placeholder="İlan seçin"
            searchPlaceholder="İlan ara..."
            ariaLabel="İlan seçin"
            className="w-full"
            options={listings.map((l) => ({ value: String(l.id), label: l.title }))}
          />
        </div>
      )}

      {groups.map(([kind, items]) => (
        <section key={kind} className="mt-8">
          <h2 className="mb-3 text-lg font-bold">{KIND_LABELS[kind] ?? kind}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => (
              <Card key={product.id} className={cn(busyCode === product.code && 'opacity-60')}>
                <CardContent className="flex h-full flex-col p-5">
                  <h3 className="font-semibold">{product.name}</h3>
                  {product.description && (
                    <p className="mt-1 flex-1 text-sm text-muted-foreground">
                      {product.description}
                    </p>
                  )}
                  <p className="mt-4 text-2xl font-bold text-primary">
                    {formatPrice(product.price_minor)}
                  </p>
                  <Button
                    className="mt-3 w-full"
                    onClick={() => buy(product)}
                    disabled={busyCode !== null}
                  >
                    {busyCode === product.code && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Satın Al
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-b pb-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-all font-medium">{value}</dd>
    </div>
  );
}
