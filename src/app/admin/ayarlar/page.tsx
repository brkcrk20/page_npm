'use client';

import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

/**
 * Site ayarları.
 *
 * Ayarlar app_settings tablosunda JSON olarak duruyor ve veritabanı
 * tarafından okunuyor (ör. listings_guard ilan onayına, monetization_enabled
 * satış ekranına bakıyor). Burada değiştirilen değer anında etkili — ayrı bir
 * dağıtım gerekmiyor.
 *
 * Ürün fiyatları da bu sayfada: ücretlendirme açılmadan önce fiyatların
 * girilmiş olması gerekiyor ve ikisini ayrı ekranlara bölmek, sıfır fiyatla
 * satışa açma hatasını kolaylaştırırdı.
 */

type Product = {
  id: number;
  code: string;
  kind: string;
  name: string;
  price_minor: number;
  is_active: boolean;
  position: number;
};

export default function AdminSettingsPage() {
  const { toast } = useToast();

  const [listing, setListing] = useState<any>(null);
  const [monetization, setMonetization] = useState<any>(null);
  const [bank, setBank] = useState<Record<string, string>>({});
  const [contact, setContact] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    (async () => {
      const [settings, productRows] = await Promise.all([
        supabase.from('app_settings').select('key, value'),
        supabase.from('products').select('id, code, kind, name, price_minor, is_active, position').order('position'),
      ]);

      const byKey = new Map(
        ((settings.data as { key: string; value: any }[]) ?? []).map((r) => [r.key, r.value])
      );
      setListing(byKey.get('listing') ?? {});
      setMonetization(byKey.get('monetization') ?? {});
      setBank((byKey.get('payment_manual') as Record<string, string>) ?? {});
      setContact((byKey.get('contact') as Record<string, string>) ?? {});
      setProducts((productRows.data as Product[]) ?? []);
      setIsLoading(false);
    })();
  }, []);

  async function save(key: string, value: any) {
    setSavingKey(key);
    const { error } = await getSupabaseBrowserClient()
      .from('app_settings')
      .update({ value })
      .eq('key', key);
    setSavingKey(null);

    if (error) {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: error.message });
      return;
    }
    toast({ title: 'Ayar kaydedildi' });
  }

  async function toggleProduct(product: Product) {
    const { error } = await getSupabaseBrowserClient()
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Güncellenemedi', description: error.message });
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, is_active: !p.is_active } : p))
    );
  }

  async function savePrice(product: Product, lira: number) {
    const minor = Math.max(0, Math.round(lira * 100));
    const { error } = await getSupabaseBrowserClient()
      .from('products')
      .update({ price_minor: minor })
      .eq('id', product.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Fiyat kaydedilemedi', description: error.message });
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, price_minor: minor } : p))
    );
    toast({ title: 'Fiyat güncellendi' });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const zeroPriced = products.filter((p) => p.is_active && p.price_minor === 0).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Site Ayarları</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">İlan Ayarları</CardTitle>
          <CardDescription>
            Bu değerler veritabanı tarafından okunuyor; değişiklik anında etkili olur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            label="İlanlar otomatik yayınlansın"
            note="Kapatırsanız her ilan onayınızdan geçer ve İlanlar sayfasında birikir."
            checked={listing?.auto_approve !== false}
            onChange={(v) => setListing({ ...listing, auto_approve: v })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="İlan süresi (gün)"
              value={listing?.default_duration_days ?? 60}
              onChange={(v) => setListing({ ...listing, default_duration_days: v })}
            />
            <Field
              label="İlan başına en fazla fotoğraf"
              value={listing?.max_photos ?? 12}
              onChange={(v) => setListing({ ...listing, max_photos: v })}
            />
          </div>
          <Button onClick={() => save('listing', listing)} disabled={savingKey === 'listing'}>
            {savingKey === 'listing' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Kaydet
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ücretlendirme</CardTitle>
          <CardDescription>
            Kapalıyken tüm ilanlar ücretsiz ve satış ekranı gizli. Açmadan önce fiyatların
            girildiğinden emin olun.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {monetization?.enabled !== true && zeroPriced > 0 && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Aktif ürünlerden {zeroPriced} tanesinin fiyatı 0 TL. Ücretlendirmeyi açarsanız
              bunlar bedava satılır.
            </p>
          )}
          <Toggle
            label="Ücretlendirme açık"
            note="Öne çıkarma, abonelik ve ilan paketi satışını açar."
            checked={monetization?.enabled === true}
            onChange={(v) => setMonetization({ ...monetization, enabled: v })}
          />
          <Toggle
            label="Öne çıkarma paketleri"
            note="Vitrin, üst sırada, acil rozeti."
            checked={monetization?.promotions_enabled === true}
            onChange={(v) => setMonetization({ ...monetization, promotions_enabled: v })}
          />
          <Toggle
            label="Kurumsal abonelikler"
            note="Aylık/yıllık üyelik paketleri."
            checked={monetization?.subscriptions_enabled === true}
            onChange={(v) => setMonetization({ ...monetization, subscriptions_enabled: v })}
          />
          <Button
            onClick={() => save('monetization', monetization)}
            disabled={savingKey === 'monetization'}
          >
            {savingKey === 'monetization' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Kaydet
          </Button>
        </CardContent>
      </Card>

      {/* İletişim bilgileri en üstte: alt bilgide ve iletişim sayfasında
          boş kaldıkları sürece hiçbir kanal gösterilmiyor. Daha önce burada
          koda gömülü yer tutucular (0555 555 55 55) yayındaydı. */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">İletişim ve Künye</CardTitle>
          <CardDescription>
            Alt bilgide, iletişim ve hakkımızda sayfalarında gösterilir. Boş bıraktığınız
            alan hiç gösterilmez.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Telefon" value={contact.phone ?? ''} onChange={(v) => setContact({ ...contact, phone: v })} />
            <TextField label="E-posta" value={contact.email ?? ''} onChange={(v) => setContact({ ...contact, email: v })} />
            <TextField label="WhatsApp (ülke kodlu)" value={contact.whatsapp ?? ''} onChange={(v) => setContact({ ...contact, whatsapp: v })} />
            <TextField label="Ticari Unvan" value={contact.legal_name ?? ''} onChange={(v) => setContact({ ...contact, legal_name: v })} />
            <div className="sm:col-span-2">
              <TextField label="Adres" value={contact.address ?? ''} onChange={(v) => setContact({ ...contact, address: v })} />
            </div>
            <TextField label="MERSİS No" value={contact.mersis ?? ''} onChange={(v) => setContact({ ...contact, mersis: v })} />
            <TextField label="Instagram adresi" value={contact.instagram ?? ''} onChange={(v) => setContact({ ...contact, instagram: v })} />
            <TextField label="Facebook adresi" value={contact.facebook ?? ''} onChange={(v) => setContact({ ...contact, facebook: v })} />
            <TextField label="X adresi" value={contact.x ?? ''} onChange={(v) => setContact({ ...contact, x: v })} />
            <TextField label="YouTube adresi" value={contact.youtube ?? ''} onChange={(v) => setContact({ ...contact, youtube: v })} />
          </div>
          <Button onClick={() => save('contact', contact)} disabled={savingKey === 'contact'}>
            {savingKey === 'contact' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Kaydet
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Havale / EFT Bilgileri</CardTitle>
          <CardDescription>
            Ödeme sağlayıcısı seçilene kadar kullanıcıya gösterilen hesap bilgisi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Banka" value={bank.bank_name ?? ''} onChange={(v) => setBank({ ...bank, bank_name: v })} />
            <TextField label="Hesap Adı" value={bank.account_name ?? ''} onChange={(v) => setBank({ ...bank, account_name: v })} />
            <div className="sm:col-span-2">
              <TextField label="IBAN" value={bank.iban ?? ''} onChange={(v) => setBank({ ...bank, iban: v })} />
            </div>
            <div className="sm:col-span-2">
              <TextField
                label="Açıklama Notu"
                value={bank.note ?? ''}
                onChange={(v) => setBank({ ...bank, note: v })}
              />
            </div>
          </div>
          <Button onClick={() => save('payment_manual', bank)} disabled={savingKey === 'payment_manual'}>
            {savingKey === 'payment_manual' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Kaydet
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ürünler ve Fiyatlar</CardTitle>
          <CardDescription>
            Fiyat kutusundan çıkınca kaydedilir. Pasif ürünler satış ekranında görünmez.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {products.map((product) => (
              <li
                key={product.id}
                className={cn(
                  'flex flex-wrap items-center gap-3 rounded-lg border p-3',
                  !product.is_active && 'opacity-60'
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.kind} · {product.code}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    min={0}
                    defaultValue={product.price_minor / 100}
                    onBlur={(e) => {
                      const v = Number(e.target.value);
                      if (!Number.isNaN(v) && v * 100 !== product.price_minor) savePrice(product, v);
                    }}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">TL</span>
                </div>
                <Switch
                  checked={product.is_active}
                  onCheckedChange={() => toggleProduct(product)}
                  aria-label={`${product.name} aktif`}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Toggle({
  label,
  note,
  checked,
  onChange,
}: {
  label: string;
  note: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
      <div className="min-w-0">
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{note}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
