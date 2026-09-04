'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Loader2, Plus, Save, Trash2 } from 'lucide-react';

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
import { cn } from '@/lib/utils';

/**
 * Rehber yazıları.
 *
 * Yazılar veritabanına elle eklenmişti; yönetimden ekleme yolu yoktu.
 * İçerik üretimi süreklilik isteyen bir iş, her yazı için geliştirici
 * gerekmemeli.
 *
 * İlişkili alanlar rastgele değil: rehberin varlık sebebi aramadan gelen
 * kişiyi doğru ilan listesine ya da hizmet rehberine götürmek. Kategori,
 * cins ve hizmet seçilince yazının altında o bağlantılar çıkıyor.
 */

type Yazi = {
  id: number;
  slug: string;
  topic_id: number | null;
  title: string;
  excerpt: string | null;
  body: string;
  status: string;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  related_category_id: number | null;
  related_breed_id: number | null;
  related_service: string | null;
};

type Secenek = { id: number; name: string; slug?: string };

const BOS: Omit<Yazi, 'id'> = {
  slug: '',
  topic_id: null,
  title: '',
  excerpt: '',
  body: '',
  status: 'taslak',
  published_at: null,
  seo_title: '',
  seo_description: '',
  related_category_id: null,
  related_breed_id: null,
  related_service: null,
};

/** Başlıktan adres üretir: "Köpeklerde Aşı" -> "kopeklerde-asi" */
function slugla(metin: string): string {
  const tr: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };
  return metin
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (c) => tr[c] ?? c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 110);
}

export default function AdminGuidesPage() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const [konular, setKonular] = useState<(Secenek & { parent_id: number | null })[]>([]);
  const [kategoriler, setKategoriler] = useState<Secenek[]>([]);
  const [cinsler, setCinsler] = useState<(Secenek & { category_id: number })[]>([]);
  const [yazilar, setYazilar] = useState<Yazi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [taslak, setTaslak] = useState<Omit<Yazi, 'id'> & { id?: number }>({ ...BOS });

  const yukle = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const [k, kat, cins, y] = await Promise.all([
      supabase.from('guide_topics').select('id, name, slug, parent_id').order('position'),
      supabase.from('categories').select('id, name, slug').order('id'),
      supabase.from('breeds').select('id, name, slug, category_id').eq('is_active', true).order('name'),
      supabase
        .from('guides')
        .select('id, slug, topic_id, title, excerpt, body, status, published_at, seo_title, seo_description, related_category_id, related_breed_id, related_service')
        .order('id', { ascending: false }),
    ]);
    setKonular((k.data ?? []) as never);
    setKategoriler((kat.data ?? []) as Secenek[]);
    setCinsler((cins.data ?? []) as never);
    setYazilar((y.data ?? []) as unknown as Yazi[]);
    setYukleniyor(false);
  }, []);

  useEffect(() => {
    if (user) void yukle();
  }, [user, yukle]);

  async function kaydet() {
    if (taslak.title.trim().length < 5 || taslak.body.trim().length < 20) {
      toast({ title: 'Eksik alan', description: 'Başlık ve metin gerekli.', variant: 'destructive' });
      return;
    }
    setKaydediliyor(true);
    const supabase = getSupabaseBrowserClient();
    const satir = {
      slug: taslak.slug.trim() || slugla(taslak.title),
      topic_id: taslak.topic_id,
      title: taslak.title.trim(),
      excerpt: taslak.excerpt?.trim() || null,
      body: taslak.body.trim(),
      status: taslak.status,
      seo_title: taslak.seo_title?.trim() || null,
      seo_description: taslak.seo_description?.trim() || null,
      related_category_id: taslak.related_category_id,
      related_breed_id: taslak.related_breed_id,
      related_service: taslak.related_service,
      author_id: user?.id ?? null,
    };

    const { error } = taslak.id
      ? await supabase.from('guides').update(satir as never).eq('id', taslak.id)
      : await supabase.from('guides').insert(satir as never);
    setKaydediliyor(false);

    if (error) {
      toast({
        title: 'Kaydedilemedi',
        description: error.code === '23505' ? 'Bu adres zaten kullanılıyor.' : error.message,
        variant: 'destructive',
      });
      return;
    }
    toast({ title: taslak.id ? 'Yazı güncellendi' : 'Yazı eklendi' });
    setTaslak({ ...BOS });
    void yukle();
  }

  async function sil(id: number) {
    const { error } = await getSupabaseBrowserClient().from('guides').delete().eq('id', id);
    if (error) {
      toast({ title: 'Silinemedi', description: error.message, variant: 'destructive' });
      return;
    }
    setYazilar((p) => p.filter((y) => y.id !== id));
    toast({ title: 'Yazı silindi' });
  }

  const seciliCinsler = cinsler.filter(
    (c) => !taslak.related_category_id || c.category_id === taslak.related_category_id
  );

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
          <BookOpen className="h-5 w-5 text-primary" />
          Rehber Yazıları
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Yazıyı ilgili kategoriye, cinse ya da hizmete bağlayın; okuyan kişi yazının
          altındaki bağlantıdan doğrudan o listeye geçsin.
        </p>
      </header>

      <section className="space-y-4 rounded-xl border bg-card p-5">
        <h2 className="font-bold">{taslak.id ? 'Yazıyı düzenle' : 'Yeni yazı'}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Alan label="Başlık">
            <Input
              value={taslak.title}
              maxLength={160}
              onChange={(e) => setTaslak((t) => ({ ...t, title: e.target.value }))}
              placeholder="Köpeklerde aşı takvimi"
            />
          </Alan>
          <Alan label="Adres (boşsa başlıktan üretilir)">
            <Input
              value={taslak.slug}
              maxLength={120}
              onChange={(e) => setTaslak((t) => ({ ...t, slug: e.target.value }))}
              placeholder={taslak.title ? slugla(taslak.title) : 'kopeklerde-asi-takvimi'}
            />
          </Alan>
        </div>

        <Alan label="Özet — kartta ve arama sonucunda görünür">
          <Textarea
            rows={2}
            maxLength={300}
            value={taslak.excerpt ?? ''}
            onChange={(e) => setTaslak((t) => ({ ...t, excerpt: e.target.value }))}
          />
        </Alan>

        <Alan label='Metin — paragrafları boş satırla ayırın, "## " ile başlayan satır ara başlık olur'>
          <Textarea
            rows={14}
            value={taslak.body}
            onChange={(e) => setTaslak((t) => ({ ...t, body: e.target.value }))}
          />
        </Alan>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Alan label="Konu">
            <Secim
              value={taslak.topic_id}
              onChange={(v) => setTaslak((t) => ({ ...t, topic_id: v }))}
              options={konular.map((k) => ({
                id: k.id,
                name: k.parent_id ? `— ${k.name}` : k.name,
              }))}
            />
          </Alan>
          <Alan label="İlgili kategori">
            <Secim
              value={taslak.related_category_id}
              onChange={(v) =>
                setTaslak((t) => ({ ...t, related_category_id: v, related_breed_id: null }))
              }
              options={kategoriler}
            />
          </Alan>
          <Alan label="İlgili cins">
            <Secim
              value={taslak.related_breed_id}
              onChange={(v) => setTaslak((t) => ({ ...t, related_breed_id: v }))}
              options={seciliCinsler}
              disabled={!taslak.related_category_id}
            />
          </Alan>
          <Alan label="İlgili hizmet">
            <Select
              value={taslak.related_service ?? 'yok'}
              onValueChange={(v) =>
                setTaslak((t) => ({ ...t, related_service: v === 'yok' ? null : v }))
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
          <Alan label="Arama başlığı (boşsa başlık kullanılır)">
            <Input
              value={taslak.seo_title ?? ''}
              maxLength={120}
              onChange={(e) => setTaslak((t) => ({ ...t, seo_title: e.target.value }))}
            />
          </Alan>
          <Alan label="Arama açıklaması (boşsa özet kullanılır)">
            <Input
              value={taslak.seo_description ?? ''}
              maxLength={300}
              onChange={(e) => setTaslak((t) => ({ ...t, seo_description: e.target.value }))}
            />
          </Alan>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Alan label="Durum">
            <Select
              value={taslak.status}
              onValueChange={(v) => setTaslak((t) => ({ ...t, status: v }))}
            >
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="taslak">Taslak</SelectItem>
                <SelectItem value="yayinda">Yayında</SelectItem>
                <SelectItem value="arsiv">Arşiv</SelectItem>
              </SelectContent>
            </Select>
          </Alan>

          <Button onClick={kaydet} disabled={kaydediliyor}>
            {kaydediliyor ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Kaydet
          </Button>
          {taslak.id && (
            <Button variant="ghost" onClick={() => setTaslak({ ...BOS })}>Vazgeç</Button>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-bold">Yazılar ({yazilar.length})</h2>
        {yazilar.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-card py-12 text-center text-sm text-muted-foreground">
            Henüz yazı yok.
          </p>
        ) : (
          <ul className="space-y-2">
            {yazilar.map((y) => (
              <li key={y.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {y.title}
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs',
                        y.status === 'yayinda'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      )}
                    >
                      {y.status === 'yayinda' ? 'Yayında' : y.status === 'arsiv' ? 'Arşiv' : 'Taslak'}
                    </span>
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                    /rehber/{y.slug}
                  </p>
                </div>
                {y.status === 'yayinda' && (
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/rehber/${y.slug}`} target="_blank">Gör</Link>
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => setTaslak({ ...y })}>
                  Düzenle
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => sil(y.id)}
                  aria-label="Yazıyı sil"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
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
