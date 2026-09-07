'use client';

import { useEffect, useState } from 'react';
import { KeyRound, Loader2, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * Yöneticinin bir hesabın bütün alanlarını düzenlemesi.
 *
 * Panelde daha önce yalnızca üç düğme vardı: doğrula, yasakla, yönetici
 * yap. Bir kullanıcının adını düzeltmek, yanlış girilmiş vergi numarasını
 * değiştirmek ya da kurumsal hesaba geçirmek için veritabanına elle
 * girmek gerekiyordu.
 *
 * Alanlar doğrudan profiles tablosuna yazılıyor; muhafız yöneticiyi muaf
 * tuttuğu için ek bir uç noktaya gerek yok. E-posta ve parola auth
 * şemasında olduğu için onlar /api/admin/kullanici üzerinden gidiyor.
 */

type Profil = Record<string, any>;

export function UserEditForm({
  userId,
  detay,
  onSaved,
}: {
  userId: string;
  detay: Profil;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<Profil>({});
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const [sehirler, setSehirler] = useState<{ id: number; name: string }[]>([]);
  const [ilceler, setIlceler] = useState<{ id: number; name: string }[]>([]);

  const [email, setEmail] = useState('');
  const [parola, setParola] = useState('');
  const [kimlikKaydediliyor, setKimlikKaydediliyor] = useState(false);

  useEffect(() => {
    setForm({
      full_name: detay.full_name ?? '',
      username: detay.username ?? '',
      bio: detay.bio ?? '',
      phone: detay.phone ?? '',
      account_type: detay.account_type ?? 'bireysel',
      company_title: detay.company_title ?? '',
      company_type: detay.company_type ?? '',
      tax_office: detay.tax_office ?? '',
      tax_number: detay.tax_number ?? '',
      company_address: detay.company_address ?? '',
      city_id: detay.city_id ?? null,
      district_id: detay.district_id ?? null,
      role: detay.role ?? 'user',
      is_verified: Boolean(detay.is_verified),
      is_banned: Boolean(detay.is_banned),
      banned_reason: detay.banned_reason ?? '',
    });
    setEmail(detay.email ?? '');
    setParola('');
  }, [detay]);

  useEffect(() => {
    (async () => {
      const { data } = await getSupabaseBrowserClient()
        .from('cities')
        .select('id, name')
        .order('name');
      setSehirler(data ?? []);
    })();
  }, []);

  useEffect(() => {
    if (!form.city_id) {
      setIlceler([]);
      return;
    }
    (async () => {
      const { data } = await getSupabaseBrowserClient()
        .from('districts')
        .select('id, name')
        .eq('city_id', form.city_id)
        .order('name');
      setIlceler(data ?? []);
    })();
  }, [form.city_id]);

  const alan = (ad: string, deger: unknown) => setForm((f) => ({ ...f, [ad]: deger }));

  async function kaydet() {
    setKaydediliyor(true);
    const { error } = await getSupabaseBrowserClient()
      .from('profiles')
      .update({
        full_name: form.full_name || null,
        username: form.username || null,
        bio: form.bio || null,
        phone: form.phone || null,
        account_type: form.account_type,
        company_title: form.company_title || null,
        company_type: form.company_type || null,
        tax_office: form.tax_office || null,
        tax_number: form.tax_number || null,
        company_address: form.company_address || null,
        city_id: form.city_id,
        district_id: form.district_id,
        role: form.role,
        is_verified: form.is_verified,
        verified_at: form.is_verified ? (detay.verified_at ?? new Date().toISOString()) : null,
        is_banned: form.is_banned,
        banned_reason: form.is_banned ? form.banned_reason || null : null,
      } as never)
      .eq('id', userId);
    setKaydediliyor(false);

    if (error) {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: error.message });
      return;
    }
    toast({ title: 'Kullanıcı güncellendi' });
    onSaved();
  }

  async function kimlikKaydet() {
    if (!email && !parola) return;
    setKimlikKaydediliyor(true);
    try {
      const res = await fetch('/api/admin/kullanici', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          email: email !== detay.email ? email : undefined,
          password: parola || undefined,
        }),
      });
      const govde = await res.json();
      if (!res.ok) throw new Error(govde.error ?? 'İşlem başarısız.');
      toast({
        title: 'Giriş bilgileri güncellendi',
        description: parola ? 'Yeni parolayı kullanıcıya iletmeniz gerekiyor.' : undefined,
      });
      setParola('');
      onSaved();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Hata', description: (e as Error).message });
    } finally {
      setKimlikKaydediliyor(false);
    }
  }

  const kurumsal = form.account_type === 'kurumsal';

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Kutu etiket="Ad soyad">
          <Input value={form.full_name ?? ''} onChange={(e) => alan('full_name', e.target.value)} />
        </Kutu>
        <Kutu etiket="Kullanıcı adı">
          <Input value={form.username ?? ''} onChange={(e) => alan('username', e.target.value)} />
        </Kutu>
        <Kutu etiket="Telefon">
          <Input
            value={form.phone ?? ''}
            onChange={(e) => alan('phone', e.target.value)}
            placeholder="5xx xxx xx xx"
          />
        </Kutu>
        <Kutu etiket="Hesap türü">
          <select
            value={form.account_type ?? 'bireysel'}
            onChange={(e) => alan('account_type', e.target.value)}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="bireysel">Bireysel</option>
            <option value="kurumsal">Kurumsal</option>
          </select>
        </Kutu>
        <Kutu etiket="Şehir">
          <select
            value={form.city_id ?? ''}
            onChange={(e) => {
              alan('city_id', e.target.value ? Number(e.target.value) : null);
              alan('district_id', null);
            }}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">—</option>
            {sehirler.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Kutu>
        <Kutu etiket="İlçe">
          <select
            value={form.district_id ?? ''}
            onChange={(e) => alan('district_id', e.target.value ? Number(e.target.value) : null)}
            disabled={!form.city_id}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm disabled:opacity-50"
          >
            <option value="">—</option>
            {ilceler.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Kutu>
      </div>

      <Kutu etiket="Hakkında">
        <Textarea rows={3} value={form.bio ?? ''} onChange={(e) => alan('bio', e.target.value)} />
      </Kutu>

      {kurumsal && (
        <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
          <p className="col-span-full text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Kurumsal bilgiler
          </p>
          <Kutu etiket="Firma unvanı">
            <Input
              value={form.company_title ?? ''}
              onChange={(e) => alan('company_title', e.target.value)}
            />
          </Kutu>
          <Kutu etiket="Firma türü">
            <Input
              value={form.company_type ?? ''}
              onChange={(e) => alan('company_type', e.target.value)}
              placeholder="Ltd. Şti., A.Ş., şahıs…"
            />
          </Kutu>
          <Kutu etiket="Vergi dairesi">
            <Input
              value={form.tax_office ?? ''}
              onChange={(e) => alan('tax_office', e.target.value)}
            />
          </Kutu>
          <Kutu etiket="Vergi numarası">
            <Input
              value={form.tax_number ?? ''}
              onChange={(e) => alan('tax_number', e.target.value)}
            />
          </Kutu>
          <Kutu etiket="Firma adresi">
            <Textarea
              rows={2}
              value={form.company_address ?? ''}
              onChange={(e) => alan('company_address', e.target.value)}
            />
          </Kutu>
        </div>
      )}

      <div className="space-y-3 rounded-lg border p-3">
        <Anahtar
          etiket="Onaylı kullanıcı"
          aciklama="Profilde onaylı rozeti görünür."
          acik={Boolean(form.is_verified)}
          degistir={(v) => alan('is_verified', v)}
        />
        <Anahtar
          etiket="Yönetici"
          aciklama="Yönetim paneline tam erişim."
          acik={form.role === 'admin'}
          degistir={(v) => alan('role', v ? 'admin' : 'user')}
        />
        <Anahtar
          etiket="Yasaklı"
          aciklama="Giriş yapabilir ama ilan veremez ve mesajlaşamaz."
          acik={Boolean(form.is_banned)}
          degistir={(v) => alan('is_banned', v)}
        />
        {form.is_banned && (
          <Kutu etiket="Yasak sebebi">
            <Input
              value={form.banned_reason ?? ''}
              onChange={(e) => alan('banned_reason', e.target.value)}
              placeholder="Kullanıcıya gösterilmiyor; kayıt için."
            />
          </Kutu>
        )}
      </div>

      <Button onClick={kaydet} disabled={kaydediliyor} className="w-full sm:w-auto">
        {kaydediliyor ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Profili kaydet
      </Button>

      <div className="space-y-3 rounded-lg border border-amber-300 bg-amber-50/50 p-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800">
          <KeyRound className="h-3.5 w-3.5" />
          Giriş bilgileri
        </p>
        <p className="text-xs text-muted-foreground">
          E-posta ve parola auth kaydında tutuluyor, profille birlikte kaydedilmiyor.
          Parolayı değiştirirseniz kullanıcı eski parolasıyla giremez; yenisini ona
          iletmek size kalıyor.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Kutu etiket="E-posta">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </Kutu>
          <Kutu etiket="Yeni parola">
            <Input
              value={parola}
              onChange={(e) => setParola(e.target.value)}
              type="text"
              placeholder="Boş bırakırsanız değişmez"
            />
          </Kutu>
        </div>
        <Button
          variant="outline"
          onClick={kimlikKaydet}
          disabled={kimlikKaydediliyor || (email === detay.email && !parola)}
        >
          {kimlikKaydediliyor && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Giriş bilgilerini güncelle
        </Button>
      </div>
    </div>
  );
}

function Kutu({ etiket, children }: { etiket: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{etiket}</Label>
      {children}
    </div>
  );
}

function Anahtar({
  etiket,
  aciklama,
  acik,
  degistir,
}: {
  etiket: string;
  aciklama: string;
  acik: boolean;
  degistir: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{etiket}</p>
        <p className="text-xs text-muted-foreground">{aciklama}</p>
      </div>
      <Switch checked={acik} onCheckedChange={degistir} />
    </div>
  );
}
