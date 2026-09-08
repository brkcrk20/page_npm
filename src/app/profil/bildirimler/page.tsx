'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * Bildirim geçmişi.
 *
 * Zil yalnızca son on beş satırı gösteriyor; kaçırılan bir duyuruya ya da
 * eski bir ilan uyarısına dönmek için tam liste gerekiyor. Okundu bilgisi
 * burada da korunuyor: okunmamışlar renkli zeminde.
 */

type Bildirim = {
  id: number;
  kind: string;
  level: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

const TUR_ADI: Record<string, string> = {
  duyuru: 'Duyuru',
  mesaj: 'Mesaj',
  ilan_durumu: 'İlan',
  dogrulama: 'Doğrulama',
  yorum: 'Değerlendirme',
};

export default function BildirimlerSayfasi() {
  const { user, isUserLoading } = useSupabaseAuth();
  const { toast } = useToast();
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    if (!user) {
      setYukleniyor(false);
      return;
    }
    getSupabaseBrowserClient()
      .from('user_notifications')
      .select('id, kind, level, title, body, link, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) {
          toast({ variant: 'destructive', title: 'Bildirimler alınamadı', description: error.message });
        }
        setBildirimler((data as Bildirim[]) ?? []);
        setYukleniyor(false);
      });
  }, [user, toast]);

  async function hepsiniOkunduYap() {
    await getSupabaseBrowserClient().rpc('bildirimleri_okundu_isaretle');
    setBildirimler((prev) => prev.map((b) => ({ ...b, is_read: true })));
  }

  const okunmamis = bildirimler.filter((b) => !b.is_read).length;

  if (isUserLoading) return <p className="p-6 text-sm text-muted-foreground">Yükleniyor…</p>;

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Bildirimlerinizi görmek için giriş yapın.</p>
        <Button asChild className="mt-3">
          <Link href="/login?donus=/profil/bildirimler">Giriş Yap</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Bell className="h-5 w-5 text-primary" />
          Bildirimler
        </h1>
        {okunmamis > 0 && (
          <Button size="sm" variant="outline" onClick={() => void hepsiniOkunduYap()}>
            <Check className="mr-1 h-4 w-4" />
            Tümünü okundu işaretle
          </Button>
        )}
      </div>

      {yukleniyor ? (
        <p className="text-sm text-muted-foreground">Yükleniyor…</p>
      ) : bildirimler.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-white py-16 text-center">
          <p className="text-muted-foreground">Henüz bildiriminiz yok.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            İlanınız onaylandığında, mesaj geldiğinde ve duyurularda burada görünür.
          </p>
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-white">
          {bildirimler.map((b) => {
            const icerik = (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-[11px] font-semibold ' +
                      (b.level === 'uyari'
                        ? 'bg-amber-100 text-amber-800'
                        : b.level === 'duyuru'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-slate-100 text-slate-700')
                    }
                  >
                    {TUR_ADI[b.kind] ?? 'Bildirim'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(b.created_at).toLocaleString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="mt-1 font-medium">{b.title}</p>
                <p className="mt-0.5 whitespace-pre-line text-sm text-muted-foreground">{b.body}</p>
              </>
            );

            return (
              <li key={b.id} className={b.is_read ? '' : 'bg-primary/5'}>
                {b.link ? (
                  <Link href={b.link} className="block p-4 hover:bg-secondary/50" prefetch={false}>
                    {icerik}
                  </Link>
                ) : (
                  <div className="p-4">{icerik}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
