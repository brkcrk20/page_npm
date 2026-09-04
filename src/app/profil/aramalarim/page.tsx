'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BellPlus, Loader2, Search, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';

/**
 * Kayıtlı aramalarım.
 *
 * Sayaç "son baktığından beri eklenen ilan" demek. Aramaya tıklandığında
 * last_seen_at güncelleniyor; yoksa sayı hep aynı kalır ve rozet anlamsız
 * bir süse dönerdi.
 *
 * E-posta alarmı yok: sağlayıcı bağlanınca aynı satırlar ona da kaynaklık
 * edecek. Özelliğin asıl değeri (aramayı bir daha kurmamak, yokken ne
 * eklendiğini görmek) e-postasız da çalışıyor.
 */

type Arama = {
  id: number;
  name: string;
  path: string;
  params: Record<string, string>;
  last_seen_at: string;
  created_at: string;
};

const ETIKET: Record<string, string> = {
  kategori: 'Kategori',
  sehir: 'Şehir',
  cins: 'Cins',
  kimden: 'Kimden',
  min: 'En az',
  max: 'En çok',
};

function adres(a: Arama): string {
  const qs = new URLSearchParams();
  for (const anahtar of ['kimden', 'min', 'max']) {
    if (a.params[anahtar]) qs.set(anahtar, a.params[anahtar]!);
  }
  const q = qs.toString();
  return q ? `${a.path}?${q}` : a.path;
}

export default function Page() {
  const { user, isUserLoading } = useSupabaseAuth();
  const { toast } = useToast();

  const [aramalar, setAramalar] = useState<Arama[]>([]);
  const [sayilar, setSayilar] = useState<Record<number, number>>({});
  const [yukleniyor, setYukleniyor] = useState(true);

  const yukle = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    const [liste, sayim] = await Promise.all([
      supabase
        .from('saved_searches')
        .select('id, name, path, params, last_seen_at, created_at')
        .order('created_at', { ascending: false }),
      supabase.rpc('saved_search_counts'),
    ]);

    setYukleniyor(false);
    if (liste.error) {
      toast({ title: 'Aramalar alınamadı', description: liste.error.message, variant: 'destructive' });
      return;
    }
    setAramalar((liste.data ?? []) as unknown as Arama[]);
    setSayilar(
      Object.fromEntries(
        ((sayim.data as { id: number; yeni_ilan: number }[]) ?? []).map((r) => [r.id, r.yeni_ilan])
      )
    );
  }, [toast]);

  useEffect(() => {
    if (user) void yukle();
    else if (!isUserLoading) setYukleniyor(false);
  }, [user, isUserLoading, yukle]);

  async function sil(id: number) {
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.from('saved_searches').delete().eq('id', id);
    if (error) {
      toast({ title: 'Silinemedi', description: error.message, variant: 'destructive' });
      return;
    }
    setAramalar((prev) => prev.filter((a) => a.id !== id));
    toast({ title: 'Arama silindi' });
  }

  /** Aramaya gidildiğinde sayaç sıfırlanmalı; yoksa rozet hep aynı kalır. */
  async function gorulduIsaretle(id: number) {
    const supabase = getSupabaseBrowserClient();
    await supabase
      .from('saved_searches')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', id);
  }

  if (isUserLoading || yukleniyor) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <BellPlus className="h-5 w-5 text-primary" />
          Kayıtlı Aramalarım
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sık kullandığınız filtreleri kaydedin; son bakışınızdan sonra eklenen ilan
          sayısını burada görün.
        </p>
      </header>

      {aramalar.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white py-16 text-center">
          <Search className="mx-auto h-10 w-10 text-muted-foreground" />
          <h2 className="mt-3 font-bold">Henüz kayıtlı aramanız yok</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            İlan listelerinde filtrelerinizi ayarlayıp &quot;Aramayı Kaydet&quot; düğmesine
            basın.
          </p>
          <Button asChild className="mt-5">
            <Link href="/sahiplendirme">İlanlara Göz At</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {aramalar.map((a) => {
            const yeni = sayilar[a.id] ?? 0;
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-semibold capitalize">
                    {a.name}
                    {yeni > 0 && (
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        {yeni} yeni
                      </span>
                    )}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    {Object.entries(a.params).map(([k, v]) => (
                      <span key={k}>
                        {ETIKET[k] ?? k}: <span className="capitalize">{String(v).replace(/-/g, ' ')}</span>
                      </span>
                    ))}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Button asChild size="sm" onClick={() => void gorulduIsaretle(a.id)}>
                    <Link href={adres(a)}>İlanları Gör</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => sil(a.id)}
                    aria-label="Aramayı sil"
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
