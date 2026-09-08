'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Loader2, Package, Pencil, Plus, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { isletmeOnbelleginiTazele } from '@/lib/onbellek-tazele';
import { prepareImages } from '@/lib/image-pipeline';
import { BUSINESS_IMAGE_BUCKET, businessImageUrl } from '@/lib/supabase/storage';
import { URUN_GRUPLARI, type KatalogSatiri } from '@/lib/katalog';
import type { KatalogAyari } from '@/lib/services-config';

/**
 * İşletme sahibinin katalog ekranı.
 *
 * Aynı bileşen iki iş yapıyor: petshopta stoklu ÜRÜN, diğer bölümlerde
 * fiyatlı HİZMET. Hangi alanların çıkacağını services-config'teki katalog
 * ayarı belirliyor — pet taksi ekranında "stok" ve "marka" kutusu yok,
 * çünkü orada mağaza değil tarife var.
 *
 * Satırlar doğrudan tarayıcıdan yazılıyor; yetkiyi RLS veriyor (yalnızca
 * işletmenin sahibi kendi satırlarına dokunabiliyor, bkz. 0066).
 */

type Taslak = {
  id?: number;
  name: string;
  brand: string;
  description: string;
  category: string;
  price: string;
  unit: string;
  stock: string;
  photo_path: string | null;
};

const BOS: Taslak = {
  name: '',
  brand: '',
  description: '',
  category: '',
  price: '',
  unit: '',
  stock: '',
  photo_path: null,
};

export function KatalogYonetimi({
  providerId,
  userId,
  ayar,
}: {
  providerId: number;
  userId: string;
  ayar: KatalogAyari;
}) {
  const { toast } = useToast();
  const [satirlar, setSatirlar] = useState<KatalogSatiri[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [taslak, setTaslak] = useState<Taslak | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [gorselYukleniyor, setGorselYukleniyor] = useState(false);

  const urun = ayar.tur === 'urun';

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase
      .from('service_items')
      .select('*')
      .eq('provider_id', providerId)
      .order('position', { ascending: true })
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          toast({ variant: 'destructive', title: 'Katalog yüklenemedi', description: error.message });
        }
        setSatirlar((data as KatalogSatiri[]) ?? []);
        setYukleniyor(false);
      });
  }, [providerId, toast]);

  async function kaydet() {
    if (!taslak) return;
    if (taslak.name.trim().length < 2) {
      toast({ variant: 'destructive', title: 'Ad en az iki karakter olmalı' });
      return;
    }

    setKaydediliyor(true);
    const supabase = getSupabaseBrowserClient();

    // Boş metin yerine null: veritabanındaki kısıtlar "hizmet satırında marka
    // olmaz" diyor ve boş dize de bir değer sayılıyor.
    const bosuNull = (v: string) => (v.trim() === '' ? null : v.trim());
    const sayi = (v: string) => {
      const n = Number(v.replace(',', '.'));
      return v.trim() === '' || !Number.isFinite(n) ? null : n;
    };

    const alanlar = {
      provider_id: providerId,
      kind: ayar.tur,
      name: taslak.name.trim(),
      description: bosuNull(taslak.description),
      price: sayi(taslak.price),
      unit: bosuNull(taslak.unit),
      photo_path: taslak.photo_path,
      // Marka, grup ve stok yalnızca üründe; hizmette null kalmak zorunda.
      brand: urun ? bosuNull(taslak.brand) : null,
      category: urun ? bosuNull(taslak.category) : null,
      stock: urun ? (taslak.stock.trim() === '' ? null : Math.max(0, Number(taslak.stock) || 0)) : null,
      position: taslak.id ? undefined : satirlar.length,
    };

    const { data, error } = taslak.id
      ? await supabase
          .from('service_items')
          .update(alanlar as never)
          .eq('id', taslak.id)
          .select('*')
          .single()
      : await supabase
          .from('service_items')
          .insert(alanlar as never)
          .select('*')
          .single();

    setKaydediliyor(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: error.message });
      return;
    }

    const yeni = data as KatalogSatiri;
    setSatirlar((prev) =>
      taslak.id ? prev.map((s) => (s.id === yeni.id ? yeni : s)) : [...prev, yeni]
    );
    setTaslak(null);
    await isletmeOnbelleginiTazele(providerId);
    toast({ title: taslak.id ? 'Güncellendi' : `${ayar.satirAdi} eklendi` });
  }

  async function sil(satir: KatalogSatiri) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from('service_items').delete().eq('id', satir.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Silinemedi', description: error.message });
      return;
    }
    setSatirlar((prev) => prev.filter((s) => s.id !== satir.id));
    await isletmeOnbelleginiTazele(providerId);
    if (satir.photo_path) {
      await supabase.storage.from(BUSINESS_IMAGE_BUCKET).remove([satir.photo_path]);
    }
  }

  async function gorselYukle(dosya: File) {
    setGorselYukleniyor(true);
    try {
      const [hazir] = await prepareImages([dosya], {
        title: 'urun',
        context: String(providerId),
      });
      const yol = `${userId}/${providerId}-urun-${Date.now()}.webp`;
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.storage
        .from(BUSINESS_IMAGE_BUCKET)
        .upload(yol, hazir.file, {
          contentType: hazir.file.type,
          // Supabase varsayılanı no-cache; bkz. CreateListingForm.
          cacheControl: '2592000',
        });
      if (error) throw new Error(error.message);
      setTaslak((t) => (t ? { ...t, photo_path: yol } : t));
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Görsel yüklenemedi', description: e?.message });
    } finally {
      setGorselYukleniyor(false);
    }
  }

  return (
    <div className="rounded-xl border bg-secondary/30 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Package className="h-4 w-4 text-primary" />
          {ayar.baslik}
          {satirlar.length > 0 && (
            <span className="text-muted-foreground">({satirlar.length})</span>
          )}
        </p>
        {!taslak && (
          <Button size="sm" variant="outline" onClick={() => setTaslak({ ...BOS })}>
            <Plus className="mr-1 h-4 w-4" />
            {ayar.satirAdi.charAt(0).toLocaleUpperCase('tr') + ayar.satirAdi.slice(1)} Ekle
          </Button>
        )}
      </div>

      {yukleniyor ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : satirlar.length === 0 && !taslak ? (
        <p className="text-sm text-muted-foreground">{ayar.bosMetin}</p>
      ) : (
        <ul className="mb-3 divide-y rounded-lg border bg-white">
          {satirlar.map((satir) => (
            <li key={satir.id} className="flex items-center gap-3 p-3">
              {urun && (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-muted">
                  {businessImageUrl(satir.photo_path) ? (
                    <Image
                      src={businessImageUrl(satir.photo_path)!}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <Package className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {satir.brand && <span className="text-primary">{satir.brand} </span>}
                  {satir.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[
                    satir.price !== null ? `₺${satir.price}` : 'Fiyat yok',
                    satir.unit,
                    satir.stock !== null ? `Stok: ${satir.stock}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>

              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setTaslak({
                    id: satir.id,
                    name: satir.name,
                    brand: satir.brand ?? '',
                    description: satir.description ?? '',
                    category: satir.category ?? '',
                    price: satir.price !== null ? String(satir.price) : '',
                    unit: satir.unit ?? '',
                    stock: satir.stock !== null ? String(satir.stock) : '',
                    photo_path: satir.photo_path,
                  })
                }
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Düzenle</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => sil(satir)}>
                <Trash2 className="h-4 w-4 text-destructive" />
                <span className="sr-only">Sil</span>
              </Button>
            </li>
          ))}
        </ul>
      )}

      {taslak && (
        <div className="space-y-3 rounded-lg border bg-white p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {urun && (
              <div>
                <Label htmlFor="katalog-marka">Marka</Label>
                <Input
                  id="katalog-marka"
                  value={taslak.brand}
                  onChange={(e) => setTaslak({ ...taslak, brand: e.target.value })}
                  placeholder="Örn. Royal Canin"
                />
              </div>
            )}

            <div className={urun ? '' : 'sm:col-span-2'}>
              <Label htmlFor="katalog-ad">
                {urun ? 'Ürün adı' : 'Ad'} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="katalog-ad"
                value={taslak.name}
                onChange={(e) => setTaslak({ ...taslak, name: e.target.value })}
                placeholder={urun ? 'Örn. Medium Adult Kuru Mama' : 'Örn. Kısırlaştırma'}
              />
            </div>

            {urun && (
              <div>
                <Label htmlFor="katalog-grup">Ürün grubu</Label>
                <select
                  id="katalog-grup"
                  value={taslak.category}
                  onChange={(e) => setTaslak({ ...taslak, category: e.target.value })}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Seçilmedi</option>
                  {URUN_GRUPLARI.map((g) => (
                    <option key={g.slug} value={g.slug}>
                      {g.ad}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Label htmlFor="katalog-fiyat">Fiyat (₺)</Label>
              <Input
                id="katalog-fiyat"
                inputMode="decimal"
                value={taslak.price}
                onChange={(e) => setTaslak({ ...taslak, price: e.target.value })}
                placeholder="Boş bırakılabilir"
              />
            </div>

            <div>
              <Label htmlFor="katalog-birim">Birim</Label>
              <Input
                id="katalog-birim"
                value={taslak.unit}
                onChange={(e) => setTaslak({ ...taslak, unit: e.target.value })}
                placeholder={ayar.birimIpucu}
              />
            </div>

            {urun && (
              <div>
                <Label htmlFor="katalog-stok">Stok adedi</Label>
                <Input
                  id="katalog-stok"
                  inputMode="numeric"
                  value={taslak.stock}
                  onChange={(e) => setTaslak({ ...taslak, stock: e.target.value })}
                  placeholder="Takip etmiyorsanız boş bırakın"
                />
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="katalog-aciklama">Açıklama</Label>
            <Textarea
              id="katalog-aciklama"
              value={taslak.description}
              onChange={(e) => setTaslak({ ...taslak, description: e.target.value })}
              rows={2}
              maxLength={600}
            />
          </div>

          {urun && (
            <div className="flex items-center gap-3">
              {taslak.photo_path && businessImageUrl(taslak.photo_path) && (
                <div className="relative h-16 w-16 overflow-hidden rounded border">
                  <Image
                    src={businessImageUrl(taslak.photo_path)!}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
              )}
              <label className="cursor-pointer text-sm font-medium text-primary hover:underline">
                {gorselYukleniyor ? 'Yükleniyor…' : taslak.photo_path ? 'Görseli değiştir' : 'Görsel ekle'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={gorselYukleniyor}
                  onChange={(e) => {
                    const d = e.target.files?.[0];
                    if (d) void gorselYukle(d);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={kaydet} disabled={kaydediliyor}>
              {kaydediliyor && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setTaslak(null)}>
              <X className="mr-1 h-4 w-4" />
              Vazgeç
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
