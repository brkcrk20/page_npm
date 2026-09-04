'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Check, Loader2, ShieldCheck, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { cn } from '@/lib/utils';

/**
 * Kimlik doğrulama başvuruları.
 *
 * TCKN başvurusu NVI'ya sorulabildiyse burada hiç görünmüyor: sonuç anında
 * kesin. Buraya düşenler iki grup — NVI'ya ulaşılamayan bireysel başvurular
 * ve kurumsal başvurular (vergi numarası için herkese açık bir sorgulama
 * servisi yok).
 *
 * Karar profildeki durumu da değiştiriyor; ikisini ayrı ayrı güncellemek
 * ikisinin ayrışmasına yol açardı, o yüzden tek bir RPC yapıyor.
 */

type Basvuru = {
  id: number;
  user_id: string;
  kind: 'tc' | 'vergi';
  national_id: string | null;
  first_name: string | null;
  last_name: string | null;
  birth_year: number | null;
  tax_number: string | null;
  tax_office: string | null;
  company_title: string | null;
  status: string;
  nvi_result: boolean | null;
  created_at: string;
  profiles: { username: string | null; full_name: string | null; phone: string | null } | null;
};

const STATUS_STYLE: Record<string, string> = {
  inceleniyor: 'bg-amber-100 text-amber-800',
  dogrulandi: 'bg-emerald-100 text-emerald-800',
  reddedildi: 'bg-red-100 text-red-800',
};

const STATUS_LABEL: Record<string, string> = {
  inceleniyor: 'İnceleniyor',
  dogrulandi: 'Doğrulandı',
  reddedildi: 'Reddedildi',
};

const TABS = [
  { key: 'inceleniyor', label: 'Bekleyen' },
  { key: 'dogrulandi', label: 'Doğrulanan' },
  { key: 'reddedildi', label: 'Reddedilen' },
  { key: 'hepsi', label: 'Tümü' },
] as const;

export default function AdminIdentityPage() {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const [filter, setFilter] = useState<string>('inceleniyor');
  const [rows, setRows] = useState<Basvuru[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    let q = supabase
      .from('identity_requests')
      .select(
        'id, user_id, kind, national_id, first_name, last_name, birth_year, tax_number, tax_office, company_title, status, nvi_result, created_at, profiles!identity_requests_user_id_fkey(username, full_name, phone)'
      )
      .order('created_at', { ascending: false })
      .limit(200);

    if (filter !== 'hepsi') q = q.eq('status', filter as never);

    const { data, error } = await q;
    setLoading(false);
    if (error) {
      toast({ title: 'Başvurular alınamadı', description: error.message, variant: 'destructive' });
      return;
    }
    setRows((data ?? []) as unknown as Basvuru[]);
  }, [filter, toast]);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  async function karar(row: Basvuru, onayla: boolean) {
    let sebep: string | null = null;
    if (!onayla) {
      sebep = window.prompt('Red sebebi (kullanıcı görecek):', 'Bilgiler kimlik belgesiyle eşleşmiyor.');
      if (sebep === null) return;
    }

    setBusy(row.id);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.rpc('admin_review_identity', {
      p_request_id: row.id,
      p_approve: onayla,
      p_reason: sebep ?? undefined,
    });
    setBusy(null);

    if (error) {
      toast({ title: 'İşlem yapılamadı', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: onayla ? 'Doğrulandı' : 'Reddedildi' });
    void load();
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <ShieldCheck className="h-5 w-5 text-primary" />
          Kimlik Doğrulama
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          NVI sorgusu yapılabilen bireysel başvurular anında sonuçlanır ve buraya
          düşmez. Burada elle incelenmesi gerekenler var.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm transition',
              filter === t.key ? 'border-primary bg-primary text-primary-foreground' : 'bg-white hover:border-primary'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-white py-16 text-center text-sm text-muted-foreground">
          Bu durumda başvuru yok.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id} className="rounded-xl border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {row.kind === 'tc' ? 'Bireysel' : 'Kurumsal'}
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLE[row.status])}>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </span>
                    {row.nvi_result === null && row.kind === 'tc' && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                        NVI&apos;ya sorulamadı
                      </span>
                    )}
                    {row.nvi_result === true && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                        <BadgeCheck className="h-3 w-3" /> NVI eşleşti
                      </span>
                    )}
                  </p>

                  <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    {row.kind === 'tc' ? (
                      <>
                        <Alan ad="Ad Soyad" deger={[row.first_name, row.last_name].filter(Boolean).join(' ')} />
                        <Alan ad="TC Kimlik No" deger={row.national_id} />
                        <Alan ad="Doğum Yılı" deger={row.birth_year} />
                      </>
                    ) : (
                      <>
                        <Alan ad="Ünvan" deger={row.company_title} />
                        <Alan ad="Vergi No" deger={row.tax_number} />
                        <Alan ad="Vergi Dairesi" deger={row.tax_office} />
                      </>
                    )}
                    <Alan ad="Telefon" deger={row.profiles?.phone} />
                    <Alan ad="Başvuru" deger={new Date(row.created_at).toLocaleString('tr-TR')} />
                  </dl>

                  {row.profiles?.username && (
                    <Link
                      href={`/satici/${row.profiles.username}`}
                      className="mt-2 inline-block text-sm text-primary hover:underline"
                    >
                      @{row.profiles.username} profilini gör →
                    </Link>
                  )}
                </div>

                {row.status === 'inceleniyor' && (
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" onClick={() => karar(row, true)} disabled={busy === row.id}>
                      {busy === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      <span className="ml-1.5">Onayla</span>
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => karar(row, false)} disabled={busy === row.id}>
                      <X className="h-4 w-4" />
                      <span className="ml-1.5">Reddet</span>
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Alan({ ad, deger }: { ad: string; deger: string | number | null | undefined }) {
  if (deger === null || deger === undefined || deger === '') return null;
  return (
    <div className="flex gap-2">
      <dt className="text-muted-foreground">{ad}:</dt>
      <dd className="font-medium">{deger}</dd>
    </div>
  );
}
