'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BadgeCheck, Ban, Loader2, ShieldCheck } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getServiceConfig } from '@/lib/services-config';
import { formatTrPhone } from '@/lib/phone';
import { cn } from '@/lib/utils';

/**
 * Kullanıcı detayı.
 *
 * Liste ad, e-posta, telefon ve ilan sayısını gösteriyordu. Bir hesap
 * hakkında karar vermek (şikayet incelemek, doğrulamayı onaylamak,
 * yasaklamak) için bunlar yetmiyordu: hesap ne zaman açıldı, en son ne
 * zaman girdi, ilanlarının kaçı yayında, kaç şikayet aldı, işletme kaydı
 * var mı?
 *
 * Bunları listeye eklemek her satır için beş alt sorgu demekti; detay
 * yalnızca açıldığında ve tek kullanıcı için çalışıyor (admin_user_detail).
 */

type Detay = Record<string, any>;

const DURUM_ETIKET: Record<string, string> = {
  yayinda: 'Yayında',
  onay_bekliyor: 'Onay bekliyor',
  pasif: 'Pasif',
  satildi: 'Sonuçlandı',
  suresi_doldu: 'Süresi doldu',
  reddedildi: 'Reddedildi',
  taslak: 'Taslak',
};

const KIMLIK_ETIKET: Record<string, string> = {
  yok: 'Başvurmamış',
  inceleniyor: 'İnceleniyor',
  dogrulandi: 'Doğrulandı',
  reddedildi: 'Reddedildi',
};

export function UserDetailDialog({
  userId,
  onClose,
}: {
  userId: string | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [detay, setDetay] = useState<Detay | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  useEffect(() => {
    if (!userId) {
      setDetay(null);
      return;
    }
    let iptal = false;
    setYukleniyor(true);
    (async () => {
      const { data, error } = await getSupabaseBrowserClient().rpc('admin_user_detail', {
        p_user_id: userId,
      });
      if (iptal) return;
      setYukleniyor(false);
      if (error) {
        toast({ title: 'Detay alınamadı', description: error.message, variant: 'destructive' });
        return;
      }
      setDetay(data as Detay);
    })();
    return () => {
      iptal = true;
    };
  }, [userId, toast]);

  const tarih = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  const ilanlar = (detay?.listings ?? {}) as Record<string, number>;
  const isletmeler = (detay?.businesses ?? []) as {
    id: number;
    name: string;
    service_type: string;
    status: string;
    is_verified: boolean;
  }[];

  return (
    <Dialog open={Boolean(userId)} onOpenChange={(a) => !a && onClose()}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {detay?.full_name || detay?.username || 'Kullanıcı'}
            {detay?.is_verified && <BadgeCheck className="h-4 w-4 text-emerald-600" />}
            {detay?.is_banned && (
              <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                <Ban className="h-3 w-3" /> Yasaklı
              </span>
            )}
            {detay?.role === 'admin' && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Yönetici
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {yukleniyor || !detay ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-5 text-sm">
            <Bolum baslik="Hesap">
              <Satir ad="E-posta" deger={detay.email} />
              <Satir ad="Kullanıcı adı" deger={detay.username ? `@${detay.username}` : null} />
              <Satir ad="Telefon" deger={detay.phone ? formatTrPhone(detay.phone) : null} />
              <Satir ad="Hesap türü" deger={detay.account_type === 'kurumsal' ? 'Kurumsal' : 'Bireysel'} />
              <Satir ad="Konum" deger={[detay.city, detay.district].filter(Boolean).join(' / ')} />
              <Satir ad="Kayıt" deger={tarih(detay.created_at)} />
              <Satir ad="Son giriş" deger={tarih(detay.last_sign_in_at)} />
              <Satir ad="Son görülme" deger={tarih(detay.last_seen_at)} />
              <Satir
                ad="E-posta doğrulaması"
                deger={detay.email_confirmed_at ? tarih(detay.email_confirmed_at) : 'Doğrulanmamış'}
              />
            </Bolum>

            <Bolum baslik="Kimlik Doğrulama">
              <Satir
                ad="Durum"
                deger={KIMLIK_ETIKET[detay.identity_status] ?? detay.identity_status}
              />
              <Satir
                ad="Tür"
                deger={detay.identity_kind === 'tc' ? 'TC kimlik' : detay.identity_kind === 'vergi' ? 'Vergi no' : null}
              />
              <Satir ad="Doğrulanma" deger={detay.identity_verified_at ? tarih(detay.identity_verified_at) : null} />
              <Satir ad="Telefon doğrulaması" deger={detay.phone_verified_at ? tarih(detay.phone_verified_at) : 'Yok'} />
            </Bolum>

            {detay.account_type === 'kurumsal' && (
              <Bolum baslik="Kurumsal Bilgiler">
                <Satir ad="Ünvan" deger={detay.company_title} />
                <Satir ad="Vergi no" deger={detay.tax_number} />
                <Satir ad="Vergi dairesi" deger={detay.tax_office} />
              </Bolum>
            )}

            <Bolum baslik="Etkinlik">
              <Satir ad="Toplam ilan" deger={String(detay.listing_total ?? 0)} />
              <Satir
                ad="İlan durumları"
                deger={
                  Object.keys(ilanlar).length
                    ? Object.entries(ilanlar)
                        .map(([k, v]) => `${DURUM_ETIKET[k] ?? k}: ${v}`)
                        .join(' · ')
                    : 'İlanı yok'
                }
              />
              <Satir ad="Aldığı şikayet" deger={String(detay.reports_received ?? 0)} />
              <Satir ad="Yaptığı şikayet" deger={String(detay.reports_made ?? 0)} />
              <Satir ad="Konuşma" deger={String(detay.conversations ?? 0)} />
              <Satir ad="Favori" deger={String(detay.favorites ?? 0)} />
            </Bolum>

            {isletmeler.length > 0 && (
              <Bolum baslik={`İşletmeler (${isletmeler.length})`}>
                <ul className="space-y-2">
                  {isletmeler.map((i) => {
                    const cfg = getServiceConfig(i.service_type as never);
                    return (
                      <li key={i.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-2.5">
                        <ShieldCheck
                          className={cn(
                            'h-4 w-4 shrink-0',
                            i.is_verified ? 'text-emerald-600' : 'text-muted-foreground'
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate font-medium">{i.name}</span>
                        <span className="text-xs text-muted-foreground">{cfg?.label}</span>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                          {DURUM_ETIKET[i.status] ?? i.status}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Bolum>
            )}

            {detay.banned_reason && (
              <Bolum baslik="Yasak Sebebi">
                <p className="text-red-700">{detay.banned_reason}</p>
              </Bolum>
            )}

            {detay.bio && (
              <Bolum baslik="Hakkında">
                <p className="whitespace-pre-line text-muted-foreground">{detay.bio}</p>
              </Bolum>
            )}

            {detay.username && (
              <Link
                href={`/satici/${detay.username}`}
                target="_blank"
                className="inline-block text-primary hover:underline"
              >
                Herkese açık profilini gör →
              </Link>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {baslik}
      </h3>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function Satir({ ad, deger }: { ad: string; deger: string | null | undefined }) {
  if (!deger) return null;
  return (
    <div className="flex flex-wrap gap-x-2">
      <span className="text-muted-foreground">{ad}:</span>
      <span className="font-medium">{deger}</span>
    </div>
  );
}
