'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Eye, Loader2, Search, Trash2, X } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { listingPhotoUrl } from '@/lib/supabase/storage';
import type { Database } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';

/**
 * Tüm ilanlar.
 *
 * Yöneticinin ilan üzerinde yaptığı işlem, sahibininkinden farklı: sahibi
 * yalnızca tanımlı geçişleri yapabiliyor (listings_guard), yönetici ise
 * muhafızdan muaf ve her duruma geçebiliyor. Bu yüzden burada geçiş tablosu
 * değil, düz bir durum listesi var.
 *
 * Durum filtresi adres çubuğunda: özetten "3 ilan onay bekliyor" bağlantısı
 * doğrudan o filtreye düşüyor ve yönetici bağlantıyı paylaşabiliyor.
 */

type ListingStatus = Database['public']['Enums']['listing_status'];

type Row = {
  id: number;
  slug: string;
  title: string;
  status: ListingStatus;
  price: number | null;
  created_at: string;
  view_count: number;
  owner_id: string;
  listing_photos: { storage_path: string; position: number }[];
  profiles: { full_name: string | null; username: string | null } | null;
};

const STATUSES: { key: ListingStatus | 'hepsi'; label: string }[] = [
  { key: 'hepsi', label: 'Tümü' },
  { key: 'onay_bekliyor', label: 'Onay Bekleyen' },
  { key: 'yayinda', label: 'Yayında' },
  { key: 'pasif', label: 'Yayında Değil' },
  { key: 'reddedildi', label: 'Reddedildi' },
  { key: 'satildi', label: 'Satıldı' },
  { key: 'suresi_doldu', label: 'Süresi Dolmuş' },
  { key: 'taslak', label: 'Taslak' },
];

const STATUS_STYLE: Record<string, string> = {
  taslak: 'bg-slate-100 text-slate-700',
  onay_bekliyor: 'bg-amber-100 text-amber-800',
  yayinda: 'bg-emerald-100 text-emerald-800',
  reddedildi: 'bg-red-100 text-red-700',
  pasif: 'bg-slate-100 text-slate-700',
  suresi_doldu: 'bg-orange-100 text-orange-800',
  satildi: 'bg-blue-100 text-blue-800',
};

function AdminListingsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const filter = searchParams.get('durum') ?? 'hepsi';

  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const supabase = getSupabaseBrowserClient();

    let q = supabase
      .from('listings')
      .select(
        'id, slug, title, status, price, created_at, view_count, owner_id, listing_photos(storage_path, position), profiles!listings_owner_id_fkey(full_name, username)'
      )
      .order('created_at', { ascending: false })
      .limit(200);

    if (filter !== 'hepsi') q = q.eq('status', filter as ListingStatus);

    const { data, error } = await q;
    if (error) {
      toast({ variant: 'destructive', title: 'İlanlar yüklenemedi', description: error.message });
    }
    setRows((data as unknown as Row[]) ?? []);
    setIsLoading(false);
  }, [filter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('tr-TR');
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.title.toLocaleLowerCase('tr-TR').includes(term) ||
        String(r.id).includes(term) ||
        (r.profiles?.username ?? '').toLocaleLowerCase('tr-TR').includes(term)
    );
  }, [rows, query]);

  async function moderate(row: Row, status: ListingStatus, reason?: string) {
    setBusyId(row.id);
    const { error } = await getSupabaseBrowserClient()
      .from('listings')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id ?? null,
        rejection_reason: reason ?? null,
      })
      .eq('id', row.id);
    setBusyId(null);

    if (error) {
      toast({ variant: 'destructive', title: 'İşlem başarısız', description: error.message });
      return;
    }
    setRows((prev) =>
      filter === 'hepsi'
        ? prev.map((r) => (r.id === row.id ? { ...r, status } : r))
        : prev.filter((r) => r.id !== row.id)
    );
    toast({ title: 'İlan güncellendi' });
  }

  async function remove() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    const { error } = await getSupabaseBrowserClient().from('listings').delete().eq('id', target.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Silinemedi', description: error.message });
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== target.id));
    toast({ title: 'İlan silindi' });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">İlanlar</h1>

      <div className="-mx-5 flex gap-1 overflow-x-auto px-5 pb-1">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() =>
              router.push(s.key === 'hepsi' ? '/admin/ilanlar' : `/admin/ilanlar?durum=${s.key}`)
            }
            className={cn(
              'shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              filter === s.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary hover:bg-secondary/70'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Başlık, ilan no veya kullanıcı adı ara..."
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-white py-16 text-center text-muted-foreground">
          Bu filtreye uyan ilan yok.
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {visible.length} ilan gösteriliyor{rows.length >= 200 && ' (en yeni 200 kayıt)'}
          </p>
          <ul className="space-y-2">
            {visible.map((row) => {
              const cover = [...(row.listing_photos ?? [])].sort(
                (a, b) => a.position - b.position
              )[0];
              const image = cover ? listingPhotoUrl(cover.storage_path) : null;

              return (
                <li
                  key={row.id}
                  className={cn(
                    'flex gap-3 rounded-xl border bg-white p-3',
                    busyId === row.id && 'opacity-50'
                  )}
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {image ? (
                      <Image src={image} alt={row.title} fill sizes="64px" className="object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                        Foto yok
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <Link
                        href={`/${row.slug}-${row.id}`}
                        target="_blank"
                        className="line-clamp-1 font-semibold hover:text-primary"
                      >
                        {row.title}
                      </Link>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          STATUS_STYLE[row.status] ?? 'bg-slate-100 text-slate-700'
                        )}
                      >
                        {STATUSES.find((s) => s.key === row.status)?.label ?? row.status}
                      </span>
                    </div>

                    <p className="mt-0.5 text-xs text-muted-foreground">
                      #{row.id} ·{' '}
                      {row.profiles?.username ? (
                        <Link
                          href={`/admin/kullanicilar?q=${row.profiles.username}`}
                          className="hover:text-primary hover:underline"
                        >
                          @{row.profiles.username}
                        </Link>
                      ) : (
                        'sahibi silinmiş'
                      )}{' '}
                      · {row.view_count} görüntülenme ·{' '}
                      {new Date(row.created_at).toLocaleDateString('tr-TR')}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {row.status !== 'yayinda' && (
                        <Button size="sm" className="h-7 text-xs" onClick={() => moderate(row, 'yayinda')}>
                          <Check className="mr-1 h-3 w-3" />
                          Yayına Al
                        </Button>
                      )}
                      {row.status !== 'reddedildi' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => moderate(row, 'reddedildi', 'Yayın kurallarına uymuyor.')}
                        >
                          <X className="mr-1 h-3 w-3" />
                          Reddet
                        </Button>
                      )}
                      {row.status !== 'pasif' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => moderate(row, 'pasif')}
                        >
                          Yayından Kaldır
                        </Button>
                      )}
                      <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                        <Link href={`/${row.slug}-${row.id}`} target="_blank">
                          <Eye className="mr-1 h-3 w-3" />
                          Gör
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-destructive hover:text-destructive"
                        onClick={() => setPendingDelete(row)}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Sil
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İlan kalıcı olarak silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.title}” fotoğrafları, mesajları ve istatistikleriyle birlikte
              silinecek. Geri alınamaz. Yalnızca gizlemek istiyorsanız “Yayından Kaldır”
              kullanın.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={remove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Evet, Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AdminListingsPage() {
  // useSearchParams Suspense sınırı gerektiriyor (durum filtresi adreste).
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AdminListingsInner />
    </Suspense>
  );
}
