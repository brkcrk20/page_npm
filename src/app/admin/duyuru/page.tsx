'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, Send, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * Kullanıcılara duyuru gönderme ekranı.
 *
 * İki yol: bir kitleye toplu ("bütün üyeler", "onaylı üyeler", "kurumsal
 * hesaplar") ya da listeden tek tek işaretleyerek. İkisi bir arada olmak
 * zorunda — "beş kişiye yazacağım" ile "herkese duyuru" farklı işler ve
 * ikincisini elle işaretleyerek yapmak mümkün değil.
 *
 * Gönderim doğrudan yapılmıyor: satırlar bildirim kuyruğuna yazılıyor,
 * gönderme işçisi (/api/bildirim/gonder) sırayla gönderiyor. Gerekçesi
 * uçtaki açıklamada.
 */

type Kullanici = {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  account_type: string | null;
  is_verified: boolean;
  is_banned: boolean;
};

type Hedef = 'secili' | 'tumu' | 'dogrulanmis' | 'kurumsal';

const HEDEFLER: { deger: Hedef; etiket: string; aciklama: string }[] = [
  { deger: 'secili', etiket: 'Seçtiklerim', aciklama: 'Aşağıdan işaretlediğiniz kişiler' },
  { deger: 'tumu', etiket: 'Bütün üyeler', aciklama: 'Bildirim izni açık olan herkes' },
  { deger: 'dogrulanmis', etiket: 'Onaylı üyeler', aciklama: 'Kimliği doğrulanmış hesaplar' },
  { deger: 'kurumsal', etiket: 'Kurumsal hesaplar', aciklama: 'İşletme hesapları' },
];

export default function DuyuruSayfasi() {
  const { toast } = useToast();
  const [kullanicilar, setKullanicilar] = useState<Kullanici[]>([]);
  const [arama, setArama] = useState('');
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secili, setSecili] = useState<Set<string>>(new Set());
  const [hedef, setHedef] = useState<Hedef>('secili');
  const [konu, setKonu] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);

  useEffect(() => {
    const zamanlayici = setTimeout(() => {
      setYukleniyor(true);
      getSupabaseBrowserClient()
        .rpc('admin_list_users', { p_search: arama || undefined, p_limit: 100, p_offset: 0 })
        .then(({ data, error }) => {
          if (error) {
            toast({ variant: 'destructive', title: 'Kullanıcılar alınamadı', description: error.message });
          }
          setKullanicilar((data as Kullanici[]) ?? []);
          setYukleniyor(false);
        });
    }, 300);
    return () => clearTimeout(zamanlayici);
  }, [arama, toast]);

  const gonderilebilir = useMemo(
    () => kullanicilar.filter((k) => !k.is_banned),
    [kullanicilar]
  );

  function tersCevir(id: string) {
    setSecili((prev) => {
      const yeni = new Set(prev);
      if (yeni.has(id)) yeni.delete(id);
      else yeni.add(id);
      return yeni;
    });
  }

  async function gonder() {
    setGonderiliyor(true);
    const cevap = await fetch('/api/admin/bildirim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ konu, mesaj, hedef, userIds: [...secili] }),
    });
    const sonuc = await cevap.json().catch(() => ({}));
    setGonderiliyor(false);

    if (!cevap.ok) {
      toast({ variant: 'destructive', title: 'Gönderilemedi', description: sonuc?.error });
      return;
    }

    toast({
      title: `${sonuc.kuyruga_alinan} kişiye kuyruğa alındı`,
      description: sonuc.eposta_yapilandirildi
        ? 'Gönderim birkaç dakika içinde tamamlanır.'
        : 'E-posta sağlayıcısı tanımlı değil; ayarlanınca kuyruktakiler gidecek.',
    });
    setKonu('');
    setMesaj('');
    setSecili(new Set());
  }

  const hedefAdedi =
    hedef === 'secili' ? secili.size : null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Kullanıcılara Duyuru</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bildirim e-postası olarak gidiyor. E-posta bildirimini kapatmış ve engellenmiş
          hesaplara gönderilmiyor.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="space-y-3">
          <div>
            <Label htmlFor="duyuru-konu">Konu</Label>
            <Input
              id="duyuru-konu"
              value={konu}
              onChange={(e) => setKonu(e.target.value)}
              placeholder="Örn. Yeni bölüm: Kayıp & Bulundu"
              maxLength={120}
            />
          </div>
          <div>
            <Label htmlFor="duyuru-mesaj">Mesaj</Label>
            <Textarea
              id="duyuru-mesaj"
              value={mesaj}
              onChange={(e) => setMesaj(e.target.value)}
              rows={6}
              placeholder="Kullanıcılara iletilecek metin."
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <p className="mb-3 flex items-center gap-2 font-medium">
          <Users className="h-4 w-4 text-primary" />
          Kime gidecek?
        </p>

        <div className="grid gap-2 sm:grid-cols-2">
          {HEDEFLER.map((h) => (
            <label
              key={h.deger}
              className={
                'flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ' +
                (hedef === h.deger ? 'border-primary bg-primary/5' : 'hover:bg-secondary/60')
              }
            >
              <input
                type="radio"
                name="hedef"
                checked={hedef === h.deger}
                onChange={() => setHedef(h.deger)}
                className="mt-0.5"
              />
              <span>
                <span className="block font-medium">{h.etiket}</span>
                <span className="block text-xs text-muted-foreground">{h.aciklama}</span>
              </span>
            </label>
          ))}
        </div>

        {hedef === 'secili' && (
          <div className="mt-4">
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={arama}
                onChange={(e) => setArama(e.target.value)}
                placeholder="İsim, kullanıcı adı veya e-posta ara"
                className="pl-8"
              />
            </div>

            <div className="max-h-80 overflow-y-auto rounded-lg border">
              {yukleniyor ? (
                <p className="p-4 text-sm text-muted-foreground">Yükleniyor…</p>
              ) : gonderilebilir.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Kullanıcı bulunamadı.</p>
              ) : (
                <ul className="divide-y">
                  {gonderilebilir.map((k) => (
                    <li key={k.id}>
                      <label className="flex cursor-pointer items-center gap-3 p-3 text-sm hover:bg-secondary/50">
                        <Checkbox
                          checked={secili.has(k.id)}
                          onCheckedChange={() => tersCevir(k.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {k.full_name || k.username || 'İsimsiz üye'}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground">
                            {k.email ?? '—'}
                            {k.account_type === 'kurumsal' && ' · Kurumsal'}
                            {k.is_verified && ' · Onaylı'}
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {gonderilebilir.length > 0 && (
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSecili(new Set(gonderilebilir.map((k) => k.id)))}
                >
                  Listedekilerin hepsini seç
                </Button>
                {secili.size > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => setSecili(new Set())}>
                    Seçimi temizle ({secili.size})
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={gonder}
          disabled={
            gonderiliyor ||
            konu.trim().length < 3 ||
            mesaj.trim().length < 10 ||
            (hedef === 'secili' && secili.size === 0)
          }
        >
          {gonderiliyor ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Duyuruyu Gönder
        </Button>
        <p className="text-sm text-muted-foreground">
          {hedefAdedi !== null
            ? `${hedefAdedi} kişi seçili`
            : HEDEFLER.find((h) => h.deger === hedef)?.aciklama}
        </p>
      </div>
    </div>
  );
}
