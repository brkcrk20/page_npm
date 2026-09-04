'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  Eye,
  Loader2,
  MapPin,
  Pause,
  Phone,
  Play,
  Plus,
  Star,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { BusinessImageUploader } from '@/components/services/BusinessImageUploader';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { formatTrPhone } from '@/lib/phone';
import { SERVICE_CONFIGS, getServiceConfigBySlug } from '@/lib/services-config';
import { cn } from '@/lib/utils';

/**
 * İşletmem.
 *
 * İşletme sahibi kaydını açıyor, yönetici onaylıyor ve sonrası boşluktu:
 * kaydının hangi durumda olduğunu göremiyor, bilgilerini değiştiremiyor,
 * kaç kez görüntülendiğini bilmiyor, geçici olarak kapatamıyordu. Rehbere
 * kaydolan bir veteriner için sitenin geri kalanı işlevsizdi.
 *
 * Bu ekran işletme sahibinin kendi kaydını yönettiği yer.
 */

type Provider = {
  id: number;
  service_type: string;
  name: string;
  slug: string;
  status: string;
  phone: string | null;
  address: string | null;
  description: string | null;
  is_verified: boolean;
  view_count: number;
  phone_count: number;
  rating_average: number | null;
  rating_count: number;
  rejection_reason: string | null;
  created_at: string;
  cities: { name: string } | null;
  districts: { name: string } | null;
  logo_url: string | null;
  service_provider_photos: { id: number; storage_path: string; position: number }[];
};

const STATUS: Record<string, { label: string; className: string; note: string }> = {
  onay_bekliyor: {
    label: 'Onay Bekliyor',
    className: 'bg-amber-100 text-amber-800',
    note: 'Kaydınız inceleniyor. Onaylandığında rehberde görünmeye başlayacak.',
  },
  yayinda: {
    label: 'Yayında',
    className: 'bg-emerald-100 text-emerald-800',
    note: 'İşletmeniz rehberde görünüyor.',
  },
  pasif: {
    label: 'Yayında Değil',
    className: 'bg-slate-100 text-slate-700',
    note: 'Kaydınız şu an rehberde görünmüyor.',
  },
  reddedildi: {
    label: 'Reddedildi',
    className: 'bg-red-100 text-red-700',
    note: 'Kaydınız yayına alınmadı.',
  },
};

export default function MyBusinessPage() {
  const { toast } = useToast();
  const { user, profile, isProfileLoading } = useSupabaseAuth();

  const [rows, setRows] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await getSupabaseBrowserClient()
      .from('service_providers')
      .select(
        'id, service_type, name, slug, status, phone, address, description, is_verified, view_count, phone_count, rating_average, rating_count, rejection_reason, created_at, logo_url, cities(name), districts(name), service_provider_photos(id, storage_path, position)'
      )
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Kayıtlar yüklenemedi', description: error.message });
    }
    setRows((data as unknown as Provider[]) ?? []);
    setIsLoading(false);
  }, [user, toast]);

  useEffect(() => {
    load();
  }, [load]);

  /** Sahibi yalnızca yayından kaldırıp geri alabiliyor; onay kararı yöneticide. */
  async function toggle(row: Provider) {
    const next = row.status === 'yayinda' ? 'pasif' : 'onay_bekliyor';
    setBusyId(row.id);

    const { data, error } = await getSupabaseBrowserClient()
      .from('service_providers')
      .update({ status: next as any })
      .eq('id', row.id)
      .select('status')
      .single();
    setBusyId(null);

    if (error) {
      toast({ variant: 'destructive', title: 'İşlem başarısız', description: error.message });
      return;
    }

    // Muhafız izin vermeyen geçişi sessizce geri alıyor; dönen satıra
    // bakmadan "başarılı" demek olmayan bir değişikliği bildirmek olurdu.
    const applied = (data as { status: string }).status;
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: applied } : r)));
    toast({
      title: applied === next ? 'Kayıt güncellendi' : 'Bu değişiklik yapılamıyor',
      description: STATUS[applied]?.note,
      variant: applied === next ? 'default' : 'destructive',
    });
  }

  if (isLoading || isProfileLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isCorporate = profile?.account_type === 'kurumsal';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">İşletmem</h1>

      {!isCorporate && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Kurumsal hesap gerekiyor</AlertTitle>
          <AlertDescription>
            İşletme kaydı yalnızca kurumsal hesaplarla açılabilir.{' '}
            <Link href="/profil/hesap" className="font-medium underline">
              Hesap bilgilerinizden kurumsal hesaba geçebilirsiniz.
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white py-14 text-center">
          <Building2 className="mx-auto h-9 w-9 text-muted-foreground" />
          <h2 className="mt-3 font-bold">Henüz işletme kaydınız yok</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Veteriner kliniği, pet oteli, kuaför, eğitmen, petshop, pet taksi veya
            gezdirici hizmeti veriyorsanız işletmenizi rehbere ekleyin.
          </p>
          {isCorporate && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SERVICE_CONFIGS.map((s) => (
                <Button key={s.slug} asChild size="sm" variant="outline">
                  <Link href={`/${s.slug}/kayit`}>{s.label}</Link>
                </Button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const config = getServiceConfigBySlug(row.service_type);
            const st = STATUS[row.status] ?? { label: row.status, className: 'bg-slate-100', note: '' };

            return (
              <li
                key={row.id}
                className={cn('rounded-xl border bg-white p-4', busyId === row.id && 'opacity-50')}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h2 className="font-bold">{row.name}</h2>
                      {row.is_verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          <BadgeCheck className="h-3 w-3" />
                          Doğrulanmış
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {config?.label ?? row.service_type}
                      {row.cities && ` · ${row.cities.name}`}
                      {row.districts && ` / ${row.districts.name}`}
                    </p>
                  </div>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold', st.className)}>
                    {st.label}
                  </span>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">{st.note}</p>
                {row.status === 'reddedildi' && row.rejection_reason && (
                  <p className="mt-1.5 rounded bg-red-50 px-2.5 py-1.5 text-sm text-red-700">
                    {row.rejection_reason}
                  </p>
                )}

                {/* İşletmenin en çok merak ettiği şey: kaç kişi gördü, kaç
                    kişi aradı. Veri zaten tutuluyordu, hiçbir yerde
                    gösterilmiyordu. */}
                <dl className="mt-3 grid grid-cols-3 gap-2 rounded-lg bg-secondary/60 p-2.5 text-center">
                  <div>
                    <dt className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                      <Eye className="h-3 w-3" /> Görüntülenme
                    </dt>
                    <dd className="text-sm font-semibold">{row.view_count}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                      <Phone className="h-3 w-3" /> Arama
                    </dt>
                    <dd className="text-sm font-semibold">{row.phone_count}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
                      <Star className="h-3 w-3" /> Puan
                    </dt>
                    <dd className="text-sm font-semibold">
                      {row.rating_count > 0 ? `${row.rating_average?.toFixed(1)} (${row.rating_count})` : '—'}
                    </dd>
                  </div>
                </dl>

                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {row.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> {formatTrPhone(row.phone)}
                    </p>
                  )}
                  {row.address && (
                    <p className="flex items-start gap-1.5">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {row.address}
                    </p>
                  )}
                </div>

                {/* Logo ve fotoğraflar.
                    Rehberdeki kartlar birbirinin aynıydı çünkü işletmenin
                    kendini gösterecek hiçbir alanı yoktu. */}
                {user && (
                  <div className="mt-4 space-y-4 rounded-xl border bg-secondary/30 p-4">
                    <div>
                      <p className="mb-2 text-sm font-medium">İşletme Logosu</p>
                      <BusinessImageUploader
                        providerId={row.id}
                        userId={user.id}
                        mod="logo"
                        logoPath={row.logo_url}
                        onLogoChange={(yol) =>
                          setRows((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, logo_url: yol } : r))
                          )
                        }
                      />
                    </div>

                    <div>
                      <p className="mb-2 text-sm font-medium">İşletme Fotoğrafları</p>
                      <BusinessImageUploader
                        providerId={row.id}
                        userId={user.id}
                        mod="galeri"
                        photos={[...(row.service_provider_photos ?? [])].sort(
                          (a, b) => a.position - b.position
                        )}
                        onPhotosChange={(fotolar) =>
                          setRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id
                                ? { ...r, service_provider_photos: fotolar as typeof r.service_provider_photos }
                                : r
                            )
                          )
                        }
                      />
                    </div>
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  {row.status === 'yayinda' && config && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/${config.slug}/${row.slug}-${row.id}`} target="_blank">
                        Sayfamı Gör
                      </Link>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => toggle(row)}>
                    {row.status === 'yayinda' ? (
                      <>
                        <Pause className="mr-1.5 h-3.5 w-3.5" />
                        Geçici Olarak Kapat
                      </>
                    ) : (
                      <>
                        <Play className="mr-1.5 h-3.5 w-3.5" />
                        Yayına Al
                      </>
                    )}
                  </Button>
                </div>
              </li>
            );
          })}

          {isCorporate && (
            <li className="rounded-xl border border-dashed bg-white p-4 text-center text-sm text-muted-foreground">
              Başka bir hizmet için de kayıt açabilirsiniz.
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {SERVICE_CONFIGS.filter((s) => !rows.some((r) => r.service_type === s.slug)).map((s) => (
                  <Button key={s.slug} asChild size="sm" variant="ghost">
                    <Link href={`/${s.slug}/kayit`}>
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      {s.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
