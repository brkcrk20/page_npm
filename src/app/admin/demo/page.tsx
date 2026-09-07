'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2, Plus, RefreshCw, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * Demo (vitrin) içeriği.
 *
 * Site yeniyken boş görünmesin diye eklenen örnek ilanlar ve işletmeler
 * buradan tek tuşla açılıp kapatılıyor. İçeriğin kendisi kodda tanımlı
 * (src/lib/demo); bu ekran yalnızca uygular ve siler.
 *
 * "Demo rozeti" anahtarı kapalıyken ziyaretçi demo ilanı gerçek sanır.
 * Varsayılan açık; kapatma kararı site sahibinin.
 */

type Durum = {
  kullanici: number;
  ilan: number;
  isletme: number;
  hedef: { kullanici: number; ilan: number; isletme: number };
};

export default function AdminDemoPage() {
  const { toast } = useToast();
  const [durum, setDurum] = useState<Durum | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [calisan, setCalisan] = useState<'ekle' | 'sil' | null>(null);
  const [rozet, setRozet] = useState(true);
  const [rozetKaydediliyor, setRozetKaydediliyor] = useState(false);

  const durumuGetir = async () => {
    const res = await fetch('/api/admin/demo');
    if (res.ok) setDurum(await res.json());
    setYukleniyor(false);
  };

  useEffect(() => {
    durumuGetir();
    (async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'demo')
        .maybeSingle();
      const deger = (data?.value ?? {}) as { badge_visible?: boolean };
      setRozet(deger.badge_visible !== false);
    })();
  }, []);

  const calistir = async (islem: 'ekle' | 'sil') => {
    if (islem === 'sil' && !confirm('Tüm demo ilanlar, işletmeler ve demo hesaplar silinecek. Onaylıyor musunuz?')) {
      return;
    }
    setCalisan(islem);
    try {
      const res = await fetch('/api/admin/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ islem }),
      });
      const govde = await res.json();
      if (!res.ok) throw new Error(govde.error ?? 'İşlem başarısız.');

      setDurum(govde.durum);
      const hatalar: string[] = [
        ...(govde.sonuc?.kullanici?.hata ?? []),
        ...(govde.sonuc?.ilan?.hata ?? []),
        ...(govde.sonuc?.isletme?.hata ?? []),
        ...(govde.sonuc?.hata ?? []),
      ];
      toast({
        title: islem === 'ekle' ? 'Demo içerik eklendi' : 'Demo içerik silindi',
        description: hatalar.length ? `${hatalar.length} kayıtta sorun: ${hatalar[0]}` : 'Tamamlandı.',
        variant: hatalar.length ? 'destructive' : undefined,
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Hata', description: (e as Error).message });
    } finally {
      setCalisan(null);
    }
  };

  const rozetiKaydet = async (acik: boolean) => {
    setRozet(acik);
    setRozetKaydediliyor(true);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'demo', value: { badge_visible: acik } } as never, { onConflict: 'key' });
    setRozetKaydediliyor(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: error.message });
      setRozet(!acik);
    }
  };

  const kutu = (etiket: string, sayi: number, hedef: number) => (
    <div className="rounded-lg border p-4">
      <p className="text-2xl font-bold">
        {sayi}
        <span className="text-base font-normal text-muted-foreground"> / {hedef}</span>
      </p>
      <p className="text-sm text-muted-foreground">{etiket}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Demo İçerik</h1>
        <p className="mt-1 text-muted-foreground">
          Site yeniyken boş görünmesin diye eklenen örnek ilanlar ve işletmeler. Gerçek
          ilanlar geldikçe tek tuşla kaldırabilirsiniz.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Durum</CardTitle>
          <CardDescription>
            Sağdaki sayı, kodda tanımlı toplam demo içerik sayısı.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {yukleniyor || !durum ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {kutu('Demo ilan', durum.ilan, durum.hedef.ilan)}
                {kutu('Demo işletme', durum.isletme, durum.hedef.isletme)}
                {kutu('Demo hesap', durum.kullanici, durum.hedef.kullanici)}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => calistir('ekle')} disabled={calisan !== null}>
                  {calisan === 'ekle' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : durum.ilan > 0 ? (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {durum.ilan > 0 ? 'Demo içeriği yenile' : 'Demo içeriği ekle'}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => calistir('sil')}
                  disabled={calisan !== null || durum.ilan + durum.isletme + durum.kullanici === 0}
                >
                  {calisan === 'sil' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Tümünü sil
                </Button>
                <Button variant="outline" onClick={durumuGetir} disabled={calisan !== null}>
                  Durumu yenile
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Demo rozeti</CardTitle>
          <CardDescription>
            Demo ilan ve işletmelerin üzerinde “Örnek ilan” etiketi gösterilsin mi?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div>
              <Label htmlFor="rozet" className="text-base">
                Rozeti göster
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">
                Açıkken ziyaretçi bu ilanların örnek olduğunu görür.
              </p>
            </div>
            <Switch
              id="rozet"
              checked={rozet}
              disabled={rozetKaydediliyor}
              onCheckedChange={rozetiKaydet}
            />
          </div>

          {!rozet && (
            <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Rozet kapalı</p>
                <p className="mt-1 text-muted-foreground">
                  Ziyaretçi bu ilanları gerçek sanacak; mesaj attığında karşılık
                  alamayacak. Demo ilanlarda telefon numarası bulunmadığı için arama
                  yapılamıyor, ancak boşa mesaj ve boşa umut ilk izlenimi zedeler.
                  Gerçek ilanlar geldikçe demo içeriği silmenizi öneririz.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">İçerik nerede tanımlı?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Demo ilan ve işletmelerin metinleri kodda: <code>src/lib/demo/ilanlar.ts</code> ve{' '}
            <code>src/lib/demo/isletmeler.ts</code>. Metni değiştirmek için oradan düzenleyip
            yayına almak, sonra bu sayfadan “yenile” demek yeterli.
          </p>
          <p>
            Fotoğraflar Wikimedia Commons’tan alınmış, ticari kullanıma açık lisanslı gerçek
            fotoğraflar. Atıflar{' '}
            <Link href="/gorsel-kaynaklari" className="text-primary hover:underline">
              Görsel Kaynakları
            </Link>{' '}
            sayfasında yayımlanıyor; lisans gereği kaldırılmamalı.
          </p>
          <p>
            Demo hesaplarda telefon numarası yok ve ilanlarda “Telefonu Göster” düğmesi
            çıkmıyor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
