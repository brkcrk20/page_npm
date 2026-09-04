'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Loader2, Plus, Save, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { SERVICE_CONFIGS } from '@/lib/services-config';

/**
 * Sayfa içerikleri.
 *
 * Kategori, cins, şehir, ilçe ve hizmet rehberi sayfalarının özgün metinleri
 * buradan yazılıyor. Metni koda gömmek her cümle değişikliğinde yayın
 * gerektirirdi; 220 cins ve 81 il düşünülünce bu sürdürülebilir değil.
 *
 * SSS ayrı bir alan: sayfada görünüyor ve arama motoruna FAQPage olarak
 * veriliyor. Görünmeyen içeriği işaretlemek kural ihlali olurdu, o yüzden
 * ikisi aynı veriden besleniyor.
 */

type Icerik = {
  id: number;
  category_id: number | null;
  breed_id: number | null;
  city_id: number | null;
  district_id: number | null;
  service_type: string | null;
  seo_title: string | null;
  seo_description: string | null;
  intro: string | null;
  body: string | null;
  faq: { soru: string; cevap: string }[];
};

type Secenek = { id: number; name: string; slug: string };

const BOS: Omit<Icerik, 'id'> = {
  category_id: null,
  breed_id: null,
  city_id: null,
  district_id: null,
  service_type: null,
  seo_title: '',
  seo_description: '',
  intro: '',
  body: '',
  faq: [],
};

export default function AdminContentPage() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const [kategoriler, setKategoriler] = useState<Secenek[]>([]);
  const [cinsler, setCinsler] = useState<(Secenek & { category_id: number })[]>([]);
  const [sehirler, setSehirler] = useState<Secenek[]>([]);
  const [kayitlar, setKayitlar] = useState<Icerik[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  const [taslak, setTaslak] = useState<Omit<Icerik, 'id'> & { id?: number }>({ ...BOS });
  const [kaydediliyor, setKaydediliyor] = useState(false);

  const yukle = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const [kat, cins, seh, ic] = await Promise.all([
      supabase.from('categories').select('id, name, slug').order('id'),
      supabase.from('breeds').select('id, name, slug, category_id').eq('is_active', true).order('name'),
      supabase.from('cities').select('id, name, slug').order('name'),
      supabase
        .from('page_content')
        .select('id, category_id, breed_id, city_id, district_id, service_type, seo_title, seo_description, intro, body, faq')
        .order('id', { ascending: false }),
    ]);
    setKategoriler((kat.data ?? []) as Secenek[]);
    setCinsler((cins.data ?? []) as (Secenek & { category_id: number })[]);
    setSehirler((seh.data ?? []) as Secenek[]);
    setKayitlar((ic.data ?? []) as unknown as Icerik[]);
    setYukleniyor(false);
  }, []);

  useEffect(() => {
    if (user) void yukle();
  }, [user, yukle]);

  const seciliCinsler = useMemo(
    () => cinsler.filter((c) => !taslak.category_id || c.category_id === taslak.category_id),
    [cinsler, taslak.category_id]
  );

  function hedefAdi(k: Icerik): string {
    if (k.service_type) {
      const svc = SERVICE_CONFIGS.find((s) => s.type === k.service_type);
      const sehir = sehirler.find((s) => s.id === k.city_id);
      return [svc?.label ?? k.service_type, sehir?.name].filter(Boolean).join(' — ');
    }
    const kat = kategoriler.find((c) => c.id === k.category_id);
    const cins = cinsler.find((c) => c.id === k.breed_id);
    const sehir = sehirler.find((c) => c.id === k.city_id);
    return [kat?.name, cins?.name, sehir?.name].filter(Boolean).join(' — ') || 'Hedefsiz';
  }

  async function kaydet() {
    const hedefVar =
      taslak.category_id || taslak.breed_id || taslak.city_id || taslak.service_type;
    if (!hedefVar) {
      toast({ title: 'Hedef seçin', description: 'En az bir kategori, cins, şehir veya hizmet seçmelisiniz.', variant: 'destructive' });
      return;
    }

    setKaydediliyor(true);
    const supabase = getSupabaseBrowserClient();
    const satir = {
      category_id: taslak.category_id,
      breed_id: taslak.breed_id,
      city_id: taslak.city_id,
      district_id: taslak.district_id,
      service_type: taslak.service_type,
      seo_title: taslak.seo_title?.trim() || null,
      seo_description: taslak.seo_description?.trim() || null,
      intro: taslak.intro?.trim() || null,
      body: taslak.body?.trim() || null,
      faq: taslak.faq.filter((s) => s.soru.trim() && s.cevap.trim()),
    };

    const { error } = taslak.id
      ? await supabase.from('page_content').update(satir as never).eq('id', taslak.id)
      : await supabase.from('page_content').insert(satir as never);

    setKaydediliyor(false);
    if (error) {
      // (hedef) tekil: aynı sayfaya ikinci içerik açmak yerine mevcudu düzenlemeli.
      toast({
        title: 'Kaydedilemedi',
        description:
          error.code === '23505'
            ? 'Bu sayfanın içeriği zaten var; listeden seçip düzenleyin.'
            : error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({ title: taslak.id ? 'İçerik güncellendi' : 'İçerik eklendi' });
    setTaslak({ ...BOS });
    void yukle();
  }

  async function sil(id: number) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from('page_content').delete().eq('id', id);
    if (error) {
      toast({ title: 'Silinemedi', description: error.message, variant: 'destructive' });
      return;
    }
    setKayitlar((p) => p.filter((x) => x.id !== id));
    toast({ title: 'İçerik silindi' });
  }

  if (yukleniyor) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <FileText className="h-5 w-5 text-primary" />
          Sayfa İçerikleri
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kategori, cins, şehir ve hizmet rehberi sayfalarının özgün metinleri. Metin
          yazılmayan sayfada hiçbir şey görünmez — birbirinin kopyası doldurma metni
          yazmayın.
        </p>
      </header>

      <section className="space-y-4 rounded-xl border bg-white p-5">
        <h2 className="font-bold">{taslak.id ? 'İçeriği düzenle' : 'Yeni içerik'}</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Alan label="Kategori">
            <Secim
              value={taslak.category_id}
              onChange={(v) => setTaslak((t) => ({ ...t, category_id: v, breed_id: null }))}
              options={kategoriler}
            />
          </Alan>
          <Alan label="Cins (isteğe bağlı)">
            <Secim
              value={taslak.breed_id}
              onChange={(v) => setTaslak((t) => ({ ...t, breed_id: v }))}
              options={seciliCinsler}
              disabled={!taslak.category_id}
            />
          </Alan>
          <Alan label="Şehir (isteğe bağlı)">
            <Secim
              value={taslak.city_id}
              onChange={(v) => setTaslak((t) => ({ ...t, city_id: v }))}
              options={sehirler}
            />
          </Alan>
          <Alan label="Hizmet rehberi">
            <Select
              value={taslak.service_type ?? 'yok'}
              onValueChange={(v) =>
                setTaslak((t) => ({
                  ...t,
                  service_type: v === 'yok' ? null : v,
                  // Hizmet rehberi kategori/cins ile birlikte anlamsız.
                  category_id: v === 'yok' ? t.category_id : null,
                  breed_id: null,
                }))
              }
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yok">—</SelectItem>
                {SERVICE_CONFIGS.map((s) => (
                  <SelectItem key={s.type} value={s.type}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Alan>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Alan label="Arama başlığı (title)">
            <Input
              value={taslak.seo_title ?? ''}
              maxLength={120}
              onChange={(e) => setTaslak((t) => ({ ...t, seo_title: e.target.value }))}
              placeholder="Boş bırakılırsa varsayılan başlık kullanılır"
            />
          </Alan>
          <Alan label="Arama açıklaması (description)">
            <Input
              value={taslak.seo_description ?? ''}
              maxLength={300}
              onChange={(e) => setTaslak((t) => ({ ...t, seo_description: e.target.value }))}
            />
          </Alan>
        </div>

        <Alan label="Giriş — listenin üstünde, iki üç cümle">
          <Textarea
            rows={3}
            value={taslak.intro ?? ''}
            onChange={(e) => setTaslak((t) => ({ ...t, intro: e.target.value }))}
          />
        </Alan>

        <Alan label="Metin — listenin altında. Paragrafları boş satırla ayırın">
          <Textarea
            rows={8}
            value={taslak.body ?? ''}
            onChange={(e) => setTaslak((t) => ({ ...t, body: e.target.value }))}
          />
        </Alan>

        <div className="space-y-2">
          <Label>Sık sorulan sorular</Label>
          {taslak.faq.map((s, i) => (
            <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_2fr_auto]">
              <Input
                value={s.soru}
                placeholder="Soru"
                onChange={(e) =>
                  setTaslak((t) => {
                    const faq = [...t.faq];
                    faq[i] = { ...faq[i]!, soru: e.target.value };
                    return { ...t, faq };
                  })
                }
              />
              <Textarea
                rows={2}
                value={s.cevap}
                placeholder="Cevap"
                onChange={(e) =>
                  setTaslak((t) => {
                    const faq = [...t.faq];
                    faq[i] = { ...faq[i]!, cevap: e.target.value };
                    return { ...t, faq };
                  })
                }
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Soruyu sil"
                onClick={() => setTaslak((t) => ({ ...t, faq: t.faq.filter((_, j) => j !== i) }))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTaslak((t) => ({ ...t, faq: [...t.faq, { soru: '', cevap: '' }] }))}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Soru ekle
          </Button>
        </div>

        <div className="flex gap-2">
          <Button onClick={kaydet} disabled={kaydediliyor}>
            {kaydediliyor ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Kaydet
          </Button>
          {taslak.id && (
            <Button variant="ghost" onClick={() => setTaslak({ ...BOS })}>
              Vazgeç
            </Button>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-bold">Yazılmış içerikler ({kayitlar.length})</h2>
        {kayitlar.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-white py-12 text-center text-sm text-muted-foreground">
            Henüz içerik yazılmamış.
          </p>
        ) : (
          <ul className="space-y-2">
            {kayitlar.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{hedefAdi(k)}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                    {k.intro || k.body || '—'}
                  </p>
                  {k.faq.length > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{k.faq.length} soru</p>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => setTaslak({ ...k })}>
                  Düzenle
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => sil(k.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="İçeriği sil"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground">
        Metinler <Link href="/" className="text-primary hover:underline">ilgili sayfalarda</Link>{' '}
        en geç bir dakika içinde görünür.
      </p>
    </div>
  );
}

function Alan({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Secim({
  value,
  onChange,
  options,
  disabled,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  options: Secenek[];
  disabled?: boolean;
}) {
  return (
    <Select
      value={value ? String(value) : 'yok'}
      onValueChange={(v) => onChange(v === 'yok' ? null : Number(v))}
      disabled={disabled}
    >
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent className="max-h-72">
        <SelectItem value="yok">—</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
