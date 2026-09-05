'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Ban,
  Building2,
  Eye,
  Loader2,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  User,
} from 'lucide-react';

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
import { UserDetailDialog } from './UserDetailDialog';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { formatTrPhone } from '@/lib/phone';
import type { Database } from '@/lib/supabase/database.types';
import { cn } from '@/lib/utils';

/**
 * Kullanıcı yönetimi.
 *
 * Liste admin_list_users RPC'sinden geliyor, doğrudan profiles'tan değil:
 * e-posta auth.users'da ve oraya REST üzerinden erişilemiyor. E-posta
 * görünmeden destek yapmak imkânsız — gelen her talep "şu adresle kaydolan
 * kişi" diye başlıyor.
 *
 * Arama sunucuda: yüzlerce kullanıcıyı çekip tarayıcıda filtrelemek, liste
 * büyüdükçe hem yavaşlar hem gereksiz veri taşırdı.
 */

type AdminUser = {
  id: string;
  email: string | null;
  full_name: string | null;
  username: string | null;
  phone: string | null;
  role: string;
  account_type: string;
  company_title: string | null;
  is_verified: boolean;
  is_banned: boolean;
  banned_reason: string | null;
  listing_count: number;
  created_at: string;
  last_sign_in_at: string | null;
  listings_total: number;
};

function AdminUsersInner() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [term, setTerm] = useState(searchParams.get('q') ?? '');
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  /** Detayı açık olan kullanıcı. */
  const [detayId, setDetayId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await getSupabaseBrowserClient().rpc('admin_list_users', {
      p_search: term || undefined,
      p_limit: 200,
      p_offset: 0,
    });

    if (error) {
      toast({ variant: 'destructive', title: 'Kullanıcılar yüklenemedi', description: error.message });
    }
    setRows((data as unknown as AdminUser[]) ?? []);
    setIsLoading(false);
  }, [term, toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function setRole(row: AdminUser, role: string) {
    setBusyId(row.id);
    const { error } = await getSupabaseBrowserClient().rpc('admin_set_user_role', {
      p_user_id: row.id,
      p_role: role,
    });
    setBusyId(null);

    if (error) {
      toast({ variant: 'destructive', title: 'Rol değiştirilemedi', description: error.message });
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, role } : r)));
    toast({ title: role === 'admin' ? 'Yönetici yapıldı' : 'Yönetici yetkisi kaldırıldı' });
  }

  type ProfilePatch = Database['public']['Tables']['profiles']['Update'];

  async function patch(row: AdminUser, changes: ProfilePatch, message: string) {
    setBusyId(row.id);
    const { error } = await getSupabaseBrowserClient()
      .from('profiles')
      .update(changes)
      .eq('id', row.id);
    setBusyId(null);

    if (error) {
      toast({ variant: 'destructive', title: 'Güncellenemedi', description: error.message });
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...changes } as AdminUser : r)));
    toast({ title: message });
  }

  async function remove() {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    const { error } = await getSupabaseBrowserClient().rpc('admin_delete_user', {
      p_user_id: target.id,
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Silinemedi', description: error.message });
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== target.id));
    toast({ title: 'Hesap silindi' });
  }

  return (
    <>
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Kullanıcılar</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setTerm(query);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ad, kullanıcı adı, e-posta, telefon veya firma ara..."
            className="pl-9"
          />
        </div>
        <Button type="submit">Ara</Button>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-white py-16 text-center text-muted-foreground">
          {term ? 'Aramaya uyan kullanıcı yok.' : 'Kayıtlı kullanıcı yok.'}
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{rows.length} kullanıcı</p>
          <ul className="space-y-2">
            {rows.map((row) => {
              const isSelf = row.id === user?.id;
              const isCorporate = row.account_type === 'kurumsal';

              return (
                <li
                  key={row.id}
                  className={cn(
                    'rounded-xl border bg-white p-3',
                    busyId === row.id && 'opacity-50',
                    row.is_banned && 'border-red-200 bg-red-50/50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {isCorporate ? <Building2 className="h-5 w-5" /> : <User className="h-5 w-5" />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold">
                          {(isCorporate ? row.company_title : null) ?? row.full_name ?? 'İsimsiz'}
                        </span>
                        {row.username && (
                          <span className="text-xs text-muted-foreground">@{row.username}</span>
                        )}
                        {row.role === 'admin' && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                            Yönetici
                          </span>
                        )}
                        {isCorporate && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-800">
                            Kurumsal
                          </span>
                        )}
                        {/* Rozet artık yalnızca kimlik doğrulamasından geliyor. */}
                        {row.is_verified && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                            Onaylı
                          </span>
                        )}
                        {row.is_banned && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                            Yasaklı
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 break-all text-xs text-muted-foreground">
                        {row.email ?? '—'}
                        {row.phone && ` · ${formatTrPhone(row.phone)}`}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {row.listings_total} ilan · Kayıt:{' '}
                        {new Date(row.created_at).toLocaleDateString('tr-TR')}
                        {row.last_sign_in_at &&
                          ` · Son giriş: ${new Date(row.last_sign_in_at).toLocaleDateString('tr-TR')}`}
                      </p>
                      {row.is_banned && row.banned_reason && (
                        <p className="mt-1 rounded bg-red-100 px-2 py-1 text-xs text-red-800">
                          Yasak sebebi: {row.banned_reason}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {row.listings_total > 0 && (
                          <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                            <Link href={`/admin/ilanlar?q=${row.username ?? ''}`}>İlanları</Link>
                          </Button>
                        )}
                        {row.username && (
                          <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                            <Link href={`/satici/${row.username}`} target="_blank">
                              Profili
                            </Link>
                          </Button>
                        )}

                        {/* Detay: liste alanları bir hesap hakkında karar
                            vermeye yetmiyordu. */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setDetayId(row.id)}
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Detay
                        </Button>

                        {/* "Onayla" düğmesi KALDIRILDI.
                            Rozet hiçbir kontrol yapılmadan verilebiliyordu;
                            kullanıcı "Doğrulanmış" yazısını görüp güveniyordu.
                            Artık tek kaynak kimlik doğrulaması: yönetici
                            birini doğrulanmış yapmak istiyorsa
                            /admin/dogrulamalar'daki başvurusunu onaylıyor —
                            yani bakıp karar verdiği bir şey oluyor. */}

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={isSelf}
                          onClick={() =>
                            patch(
                              row,
                              {
                                is_banned: !row.is_banned,
                                banned_reason: row.is_banned ? null : 'Yayın kurallarının ihlali.',
                              },
                              row.is_banned ? 'Yasak kaldırıldı' : 'Hesap yasaklandı'
                            )
                          }
                        >
                          <Ban className="mr-1 h-3 w-3" />
                          {row.is_banned ? 'Yasağı Kaldır' : 'Yasakla'}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={isSelf}
                          onClick={() => setRole(row, row.role === 'admin' ? 'user' : 'admin')}
                        >
                          {row.role === 'admin' ? (
                            <>
                              <ShieldOff className="mr-1 h-3 w-3" />
                              Yetkiyi Al
                            </>
                          ) : (
                            <>
                              <Shield className="mr-1 h-3 w-3" />
                              Yönetici Yap
                            </>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          disabled={isSelf}
                          onClick={() => setPendingDelete(row)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          Sil
                        </Button>
                      </div>
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
            <AlertDialogTitle>Hesap kalıcı olarak silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.email} hesabı, ilanları, fotoğrafları, mesajları ve
              favorileriyle birlikte silinecek. Geri alınamaz. Siparişleri fatura kaydı
              olarak saklanır.
              <br />
              <br />
              Hesabı yalnızca engellemek istiyorsanız “Yasakla” seçeneğini kullanın.
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

      <UserDetailDialog userId={detayId} onClose={() => setDetayId(null)} />
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AdminUsersInner />
    </Suspense>
  );
}
