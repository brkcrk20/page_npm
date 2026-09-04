'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Building2, Loader2, ShieldCheck, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * Kimlik doğrulama başvurusu.
 *
 * Bireysel hesap TC kimlik numarası, kurumsal hesap vergi kimlik numarası
 * veriyor. Doğrulamanın kendisi sunucuda: buradan gönderilen hiçbir alan
 * "doğrulandı" sonucunu belirlemiyor, yalnızca başvuruyu oluşturuyor.
 */

type Durum = 'yok' | 'inceleniyor' | 'dogrulandi' | 'reddedildi';

export function DogrulamaForm({
  durum,
  redSebebi,
  hesapTuru,
  adSoyad,
}: {
  durum: Durum;
  redSebebi: string | null;
  hesapTuru: string;
  adSoyad: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [tur, setTur] = useState<'tc' | 'vergi'>(hesapTuru === 'kurumsal' ? 'vergi' : 'tc');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  const parcalar = (adSoyad ?? '').trim().split(/\s+/);
  const [ad, setAd] = useState(parcalar.slice(0, -1).join(' ') || parcalar[0] || '');
  const [soyad, setSoyad] = useState(parcalar.length > 1 ? parcalar[parcalar.length - 1]! : '');
  const [tckn, setTckn] = useState('');
  const [dogumYili, setDogumYili] = useState('');

  const [vkn, setVkn] = useState('');
  const [unvan, setUnvan] = useState('');
  const [daire, setDaire] = useState('');

  if (durum === 'dogrulandi') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <BadgeCheck className="mx-auto h-10 w-10 text-emerald-600" />
        <h2 className="mt-3 text-lg font-bold text-emerald-900">Profiliniz doğrulandı</h2>
        <p className="mt-1 text-sm text-emerald-800">
          İlan verebilirsiniz. İlanlarınızda ve profilinizde &quot;Güvenli Üye&quot; rozeti görünür.
        </p>
      </div>
    );
  }

  if (durum === 'inceleniyor') {
    return (
      <div className="rounded-xl border bg-white p-6 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
        <h2 className="mt-3 text-lg font-bold">Başvurunuz inceleniyor</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Bilgilerinizi aldık. İnceleme genellikle bir iş günü içinde sonuçlanır; sonucu
          burada göreceksiniz.
        </p>
      </div>
    );
  }

  async function gonder() {
    setGonderiliyor(true);
    const cevap = await fetch('/api/dogrulama/kimlik', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        tur === 'tc'
          ? { kind: 'tc', nationalId: tckn, firstName: ad, lastName: soyad, birthYear: dogumYili }
          : { kind: 'vergi', taxNumber: vkn, companyTitle: unvan, taxOffice: daire }
      ),
    });
    const sonuc = await cevap.json().catch(() => ({}));
    setGonderiliyor(false);

    if (!cevap.ok) {
      toast({ title: 'Doğrulama yapılamadı', description: sonuc.error, variant: 'destructive' });
      return;
    }

    toast({
      title: sonuc.status === 'dogrulandi' ? 'Profiliniz doğrulandı' : 'Başvurunuz alındı',
      description:
        sonuc.status === 'dogrulandi'
          ? 'Artık ilan verebilirsiniz.'
          : 'İnceleme sonuçlandığında bu sayfada görünecek.',
    });
    router.refresh();
  }

  const tamam =
    tur === 'tc'
      ? tckn.length === 11 && ad.length > 1 && soyad.length > 1 && dogumYili.length === 4
      : vkn.length === 10 && unvan.length > 2 && daire.length > 1;

  return (
    <div className="space-y-5">
      {durum === 'reddedildi' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">Önceki başvurunuz reddedildi.</p>
          {redSebebi && <p className="mt-1">{redSebebi}</p>}
          <p className="mt-1">Bilgilerinizi kontrol edip yeniden başvurabilirsiniz.</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {(
          [
            { key: 'tc', icon: User, baslik: 'Bireysel', metin: 'TC kimlik numarası ile' },
            { key: 'vergi', icon: Building2, baslik: 'Kurumsal', metin: 'Vergi kimlik numarası ile' },
          ] as const
        ).map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setTur(s.key)}
              className={cn(
                'flex items-center gap-3 rounded-xl border bg-white p-4 text-left transition',
                tur === s.key ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'
              )}
            >
              <Icon className={cn('h-5 w-5', tur === s.key ? 'text-primary' : 'text-muted-foreground')} />
              <span>
                <span className="block font-semibold">{s.baslik}</span>
                <span className="block text-xs text-muted-foreground">{s.metin}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-4 rounded-xl border bg-white p-5">
        {tur === 'tc' ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ad">Ad</Label>
                <Input id="ad" value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Kimliğinizdeki gibi" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="soyad">Soyad</Label>
                <Input id="soyad" value={soyad} onChange={(e) => setSoyad(e.target.value)} placeholder="Kimliğinizdeki gibi" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tckn">TC Kimlik Numarası</Label>
                <Input
                  id="tckn"
                  inputMode="numeric"
                  maxLength={11}
                  value={tckn}
                  onChange={(e) => setTckn(e.target.value.replace(/\D/g, ''))}
                  placeholder="11 hane"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dy">Doğum Yılı</Label>
                <Input
                  id="dy"
                  inputMode="numeric"
                  maxLength={4}
                  value={dogumYili}
                  onChange={(e) => setDogumYili(e.target.value.replace(/\D/g, ''))}
                  placeholder="1990"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="unvan">Firma Ünvanı</Label>
              <Input id="unvan" value={unvan} onChange={(e) => setUnvan(e.target.value)} placeholder="Ticaret sicilindeki tam ünvan" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="vkn">Vergi Kimlik Numarası</Label>
                <Input
                  id="vkn"
                  inputMode="numeric"
                  maxLength={10}
                  value={vkn}
                  onChange={(e) => setVkn(e.target.value.replace(/\D/g, ''))}
                  placeholder="10 hane"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="daire">Vergi Dairesi</Label>
                <Input id="daire" value={daire} onChange={(e) => setDaire(e.target.value)} placeholder="Örn: Kadıköy" />
              </div>
            </div>
          </>
        )}

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          Bu bilgiler yalnızca doğrulama ve fatura için kullanılır; ilanınızda veya
          profilinizde görünmez. Diğer kullanıcılar yalnızca &quot;Güvenli Üye&quot; rozetini görür.
        </p>

        <Button onClick={gonder} disabled={!tamam || gonderiliyor} className="w-full sm:w-auto">
          {gonderiliyor && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Doğrula
        </Button>
      </div>
    </div>
  );
}
