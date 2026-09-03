'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { BadgeCheck, Check, Loader2, MapPin, Phone, Trash2, X } from 'lucide-react';

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
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { formatTrPhone } from '@/lib/phone';
import { getServiceConfigBySlug } from '@/lib/services-config';
import type { Database } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';

/**
 * İşletme kayıtları (veteriner, pet oteli, kuaför...).
 *
 * Kayıtlar onay_bekliyor durumunda oluşuyor ve yönetici onaylayana kadar
 * rehberde görünmüyor — bu, service_providers_guard tarafından zorlanıyor,
 * arayüzde değil.
 *
 * "Doğrulanmış işletme" rozeti ayrı bir karar: onay kaydın yayınlanması,
 * doğrulama ise belge görülmüş olması demek. İkisini tek düğmeye bağlamak
 * rozeti anlamsızlaştırırdı.
 */

type Provider = {
  id: number;
  service_type: string;
  name: string;
  slug: string;
  status: string;
  phone: string | null;
  address: string | null;
  is_verified: boolean;
  license_number: string | null;
  created_at: string;
  owner_id: string | null;
  cities: { name: string; slug: string } | null;
  districts: { name: string; slug: string } | null;
  profiles: { username: string | null; company_title: string | null } | null;
};

const STATUSES = [
  { key: 'hepsi', label: 'Tümü' },
  { key: 'onay_bekliyor', label: 'Onay Bekleyen' },
  { key: 'yayinda', label: 'Yayında' },
  { key: 'reddedildi', label: 'Reddedildi' },
  { key: 'pasif', label: 'Pasif' },
] as const;

const STATUS_STYLE: Record<string, string> = {
  onay_bekliyor: 'bg-amber-100 text-amber-800',
  yayinda: 'bg-emerald-100 text-emerald-800',
  reddedildi: 'bg-red-100 text-red-700',
  pasif: 'bg-slate-100 text-slate-700',
};

function AdminProvidersInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const filter = searchParams.get('durum') ?? 'hepsi';

  const [rows, setRows] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Provider | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    let q = getSupabaseBrowserClient()
      .from('service_providers')
      .select(
        'id, service_type, name, slug, status, phone, address, is_verified, license_number, created_at, owner_id, cities(name, slug), districts(name, slug), profiles!service_providers_owner_id_fkey(username, company_title)'
      )
      .order('created_at', { ascending: false })
      .limit(200);

    if (filter !== 'hepsi') q = q.eq('status', filter as any);

    const { data, error } = await q;
    if (error) {
      toast({ variant: 'destructive', title: 'Kayıtlar yüklenemedi', description: error.message });
    }
    setRows((data as unknown as Provider[]) ?? []);
    setIsLoading(false);
  }, [filter, toast]);

  useEffect(() => {
    load();
  }, [load]);

  type ProviderPatch = Database['public']['Tables']['service_providers']['Update'];

  async function update(row: Provider, changes: ProviderPatch, message: string) {
    setBusyId(row.id);
    const { error } = await getSupabaseBrowserClient()
      .from('service_providers')
      .update(changes)
      .eq('id', row.id);
    setBusyId(null);

    if (error) {
      toast({ variant: 'destructive', title: 'İşlem başarısız', description: error.message });
      return;
    }
    setRows((prev) =>
      filter !== 'hepsi' && changes.status && changes.status !== filter
        ? prev.filter((r) => r.id !== row.id)
        : prev.map((r) => (r.id === row.id ? ({ ...r, ...changes } as Provider) : r))
    );
    toast({ title: message });
  }

  async function remove() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    const { error } = await getSupabaseBrowserClient()
      .from('service_providers')
      .delete()
      .eq('id', target.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Silinemedi', description: error.message });
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== target.id));
    toast({ title: 'İşletme kaydı silindi' });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">İşletmeler</h1>

      <div className="-mx-5 flex gap-1 overflow-x-auto px-5 pb-1">
        {STATUSES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() =>
              router.push(
                s.key === 'hepsi' ? '/admin/isletmeler' : `/admin/isletmeler?durum=${s.key}`
              )
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

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-white py-16 text-center text-muted-foreground">
          Bu filtreye uyan işletme kaydı yok.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => {
            const config = getServiceConfigBySlug(row.service_type);
            return (
              <li
                key={row.id}
                className={cn('rounded-xl border bg-white p-3', busyId === row.id && 'opacity-50')}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-semibold">{row.name}</span>
                      {row.is_verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          <BadgeCheck className="h-3 w-3" />
                          Doğrulanmış
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {config?.label ?? row.service_type}
                      {row.cities && (
                        <>
                          {' · '}
                          <MapPin className="inline h-3 w-3" /> {row.cities.name}
                          {row.districts && ` / ${row.districts.name}`}
                        </>
                      )}
                      {row.phone && (
                        <>
                          {' · '}
                          <Phone className="inline h-3 w-3" /> {formatTrPhone(row.phone)}
                        </>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {row.profiles?.company_title ?? '—'}
                      {row.profiles?.username && ` (@${row.profiles.username})`}
                      {row.license_number && ` · Ruhsat: ${row.license_number}`}
                      {' · '}
                      {new Date(row.created_at).toLocaleDateString('tr-TR')}
                    </p>
                    {row.address && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{row.address}</p>
                    )}
                  </div>

                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      STATUS_STYLE[row.status] ?? 'bg-slate-100 text-slate-700'
                    )}
                  >
                    {STATUSES.find((s) => s.key === row.status)?.label ?? row.status}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1.5">
                  {row.status !== 'yayinda' && (
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() =>
                        update(
                          row,
                          {
                            status: 'yayinda',
                            published_at: new Date().toISOString(),
                            reviewed_at: new Date().toISOString(),
                            reviewed_by: user?.id ?? null,
                            rejection_reason: null,
                          },
                          'İşletme yayına alındı'
                        )
                      }
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Onayla
                    </Button>
                  )}
                  {row.status !== 'reddedildi' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() =>
                        update(
                          row,
                          {
                            status: 'reddedildi',
                            reviewed_at: new Date().toISOString(),
                            reviewed_by: user?.id ?? null,
                            rejection_reason: 'Bilgiler doğrulanamadı.',
                          },
                          'İşletme reddedildi'
                        )
                      }
                    >
                      <X className="mr-1 h-3 w-3" />
                      Reddet
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() =>
                      update(
                        row,
                        {
                          is_verified: !row.is_verified,
                          verified_at: row.is_verified ? null : new Date().toISOString(),
                        },
                        row.is_verified ? 'Doğrulama kaldırıldı' : 'İşletme doğrulandı'
                      )
                    }
                  >
                    <BadgeCheck className="mr-1 h-3 w-3" />
                    {row.is_verified ? 'Doğrulamayı Kaldır' : 'Doğrula'}
                  </Button>
                  {row.status === 'yayinda' && config && (
                    <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                      <Link href={`/${config.slug}`} target="_blank">
                        Rehberde Gör
                      </Link>
                    </Button>
                  )}
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
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={pendingDelete !== null} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>İşletme kaydı silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.name}” çalışma saatleri, özellikleri ve yorumlarıyla birlikte
              silinecek. Geri alınamaz.
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

export default function AdminProvidersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AdminProvidersInner />
    </Suspense>
  );
}
