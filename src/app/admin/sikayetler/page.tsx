'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Flag, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { cn } from '@/lib/utils';

/**
 * Şikayetler.
 *
 * Şikayet düğmesi daha önce hiçbir yere kaydetmiyordu; artık kaydediyor ve
 * bu ekran onları gösteriyor. Şikayeti sonuçlandırmakla ilanı yayından
 * kaldırmak ayrı işlemler: her şikayet haklı çıkmıyor ve haksız bir
 * bildirimin ilanı düşürmemesi gerekiyor.
 */

type Report = {
  id: number;
  listing_id: number;
  reason: string;
  note: string | null;
  status: string;
  created_at: string;
  listings: { slug: string; title: string; status: string } | null;
  profiles: { username: string | null } | null;
};

const REASON_LABELS: Record<string, string> = {
  dolandiricilik: 'Dolandırıcılık şüphesi',
  yaniltici: 'Yanıltıcı bilgi/fotoğraf',
  yasakli_tur: 'Yasaklı ırk veya yabani hayvan',
  kotu_muamele: 'Hayvana kötü muamele',
  yanlis_kategori: 'Yanlış kategori',
  tekrar_ilan: 'Tekrar ilan',
  diger: 'Diğer',
};

const STATUS_STYLE: Record<string, string> = {
  acik: 'bg-amber-100 text-amber-800',
  inceleniyor: 'bg-blue-100 text-blue-800',
  kapatildi: 'bg-emerald-100 text-emerald-800',
  reddedildi: 'bg-slate-100 text-slate-700',
};

const TABS = [
  { key: 'acik', label: 'Açık' },
  { key: 'inceleniyor', label: 'İnceleniyor' },
  { key: 'kapatildi', label: 'Kapatıldı' },
  { key: 'reddedildi', label: 'Reddedildi' },
  { key: 'hepsi', label: 'Tümü' },
] as const;

export default function AdminReportsPage() {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const [tab, setTab] = useState<string>('acik');
  const [rows, setRows] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    let q = getSupabaseBrowserClient()
      .from('listing_reports')
      .select('id, listing_id, reason, note, status, created_at, listings(slug, title, status), profiles!listing_reports_reporter_id_fkey(username)')
      .order('created_at', { ascending: false })
      .limit(200);

    if (tab !== 'hepsi') q = q.eq('status', tab as any);

    const { data, error } = await q;
    if (error) {
      toast({ variant: 'destructive', title: 'Şikayetler yüklenemedi', description: error.message });
    }
    setRows((data as unknown as Report[]) ?? []);
    setIsLoading(false);
  }, [tab, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(row: Report, status: string) {
    setBusyId(row.id);
    const { error } = await getSupabaseBrowserClient()
      .from('listing_reports')
      .update({
        status: status as any,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id ?? null,
      })
      .eq('id', row.id);
    setBusyId(null);

    if (error) {
      toast({ variant: 'destructive', title: 'Güncellenemedi', description: error.message });
      return;
    }
    setRows((prev) => (tab === 'hepsi' ? prev.map((r) => (r.id === row.id ? { ...r, status } : r)) : prev.filter((r) => r.id !== row.id)));
    toast({ title: 'Şikayet güncellendi' });
  }

  /** Şikayeti kapatmakla ilanı düşürmek ayrı: haksız bildirim ilanı düşürmemeli. */
  async function unpublish(row: Report) {
    setBusyId(row.id);
    const { error } = await getSupabaseBrowserClient()
      .from('listings')
      .update({
        status: 'reddedildi',
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id ?? null,
        rejection_reason: `Şikayet üzerine kaldırıldı: ${REASON_LABELS[row.reason] ?? row.reason}`,
      })
      .eq('id', row.listing_id);
    setBusyId(null);

    if (error) {
      toast({ variant: 'destructive', title: 'İlan kaldırılamadı', description: error.message });
      return;
    }
    toast({ title: 'İlan yayından kaldırıldı' });
    setStatus(row, 'kapatildi');
  }

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Flag className="h-6 w-6 text-primary" />
        Şikayetler
      </h1>

      <div className="-mx-5 flex gap-1 overflow-x-auto px-5 pb-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/70'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-white py-16 text-center text-muted-foreground">
          {tab === 'acik' ? 'Bekleyen şikayet yok.' : 'Bu durumda şikayet yok.'}
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id} className={cn('rounded-xl border bg-white p-3', busyId === row.id && 'opacity-50')}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{REASON_LABELS[row.reason] ?? row.reason}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    İlan #{row.listing_id} ·{' '}
                    {row.profiles?.username ? `@${row.profiles.username}` : 'silinmiş kullanıcı'} ·{' '}
                    {new Date(row.created_at).toLocaleDateString('tr-TR')}
                  </p>
                  {row.listings && (
                    <Link
                      href={`/${row.listings.slug}-${row.listing_id}`}
                      target="_blank"
                      className="mt-1 inline-block text-sm font-medium text-primary hover:underline"
                    >
                      {row.listings.title}
                    </Link>
                  )}
                  {row.note && (
                    <p className="mt-1.5 rounded bg-secondary/60 px-2.5 py-1.5 text-sm">{row.note}</p>
                  )}
                </div>
                <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', STATUS_STYLE[row.status])}>
                  {TABS.find((t) => t.key === row.status)?.label ?? row.status}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {row.status === 'acik' && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStatus(row, 'inceleniyor')}>
                    İncelemeye Al
                  </Button>
                )}
                {row.listings?.status === 'yayinda' && (
                  <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => unpublish(row)}>
                    <X className="mr-1 h-3 w-3" />
                    İlanı Kaldır
                  </Button>
                )}
                {row.status !== 'kapatildi' && (
                  <Button size="sm" className="h-7 text-xs" onClick={() => setStatus(row, 'kapatildi')}>
                    <Check className="mr-1 h-3 w-3" />
                    Çözüldü
                  </Button>
                )}
                {row.status !== 'reddedildi' && (
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setStatus(row, 'reddedildi')}>
                    Haksız Bildirim
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
