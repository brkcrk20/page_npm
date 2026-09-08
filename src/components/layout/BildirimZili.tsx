'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useState } from 'react';
import { Bell, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';

/**
 * Üst banttaki bildirim zili.
 *
 * Kaynağı user_notifications: yönetimden gönderilen duyurular ve yeni mesaj
 * uyarıları. E-posta kuyruğundan ayrı — e-posta sağlayıcısı tanımlı olmasa
 * bile buradaki bildirimler görünüyor (bkz. 0067).
 *
 * Oturumsuz ziyaretçide hiç çizilmiyor: zil, kişiye ait bir kutu.
 *
 * KANAL ADI BİLEŞENE ÖZEL — bkz. UnreadBadge'deki açıklama: aynı isimli
 * kanal ikinci kez kullanıldığında Supabase patlıyor.
 */

type Bildirim = {
  id: number;
  title: string;
  body: string;
  link: string | null;
  level: string;
  is_read: boolean;
  created_at: string;
};

/** "3 dk önce", "dün", "12 Ocak" */
function ne_zaman(tarih: string): string {
  const fark = Date.now() - new Date(tarih).getTime();
  const dakika = Math.floor(fark / 60_000);
  if (dakika < 1) return 'az önce';
  if (dakika < 60) return `${dakika} dk önce`;
  const saat = Math.floor(dakika / 60);
  if (saat < 24) return `${saat} saat önce`;
  const gun = Math.floor(saat / 24);
  if (gun === 1) return 'dün';
  if (gun < 7) return `${gun} gün önce`;
  return new Date(tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
}

export function BildirimZili() {
  const { user } = useSupabaseAuth();
  const [bildirimler, setBildirimler] = useState<Bildirim[]>([]);
  const [acik, setAcik] = useState(false);
  const kanalId = useId();

  const okunmamis = bildirimler.filter((b) => !b.is_read).length;

  const getir = useCallback(async () => {
    // Dinamik içe aktarma: zil her sayfada, ama Supabase paketi yalnızca
    // oturum açmış kullanıcıya insin (bkz. UnreadBadge).
    const { getSupabaseBrowserClientOrNull } = await import('@/lib/supabase/client');
    const supabase = getSupabaseBrowserClientOrNull();
    if (!supabase) return;

    const { data } = await supabase
      .from('user_notifications')
      .select('id, title, body, link, level, is_read, created_at')
      .order('created_at', { ascending: false })
      .limit(15);

    setBildirimler((data as Bildirim[]) ?? []);
  }, []);

  useEffect(() => {
    if (!user) {
      setBildirimler([]);
      return;
    }

    let temizle: (() => void) | null = null;
    void getir();

    (async () => {
      const { getSupabaseBrowserClientOrNull } = await import('@/lib/supabase/client');
      const supabase = getSupabaseBrowserClientOrNull();
      if (!supabase) return;

      const kanal = supabase
        .channel(`bildirim-${kanalId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'user_notifications' },
          () => void getir()
        )
        .subscribe();

      temizle = () => {
        supabase.removeChannel(kanal);
      };
    })();

    return () => temizle?.();
  }, [user, getir, kanalId]);

  async function hepsiniOkunduYap() {
    const { getSupabaseBrowserClientOrNull } = await import('@/lib/supabase/client');
    const supabase = getSupabaseBrowserClientOrNull();
    if (!supabase) return;
    await supabase.rpc('bildirimleri_okundu_isaretle');
    setBildirimler((prev) => prev.map((b) => ({ ...b, is_read: true })));
  }

  if (!user) return null;

  return (
    <DropdownMenu
      open={acik}
      onOpenChange={(v) => {
        setAcik(v);
        // Açılınca okundu sayılıyor: kullanıcı listeyi görmüş oluyor,
        // ayrıca "okundu" düğmesine basmasını beklemek rozeti kalıcı
        // kırmızı bir lekeye çevirirdi.
        if (v && okunmamis > 0) void hepsiniOkunduYap();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-white/15 hover:text-white"
          aria-label={okunmamis > 0 ? `${okunmamis} okunmamış bildirim` : 'Bildirimler'}
        >
          <Bell className="h-5 w-5" />
          {okunmamis > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-primary">
              {okunmamis > 9 ? '9+' : okunmamis}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-semibold">Bildirimler</p>
          {bildirimler.length > 0 && okunmamis > 0 && (
            <button
              type="button"
              onClick={() => void hepsiniOkunduYap()}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Check className="h-3 w-3" />
              Okundu işaretle
            </button>
          )}
        </div>

        {bildirimler.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Henüz bildiriminiz yok.
          </p>
        ) : (
          <ul className="max-h-96 divide-y overflow-y-auto">
            {bildirimler.map((b) => {
              const icerik = (
                <>
                  <p className="text-sm font-medium leading-snug">{b.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{b.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{ne_zaman(b.created_at)}</p>
                </>
              );
              return (
                <li key={b.id} className={b.is_read ? '' : 'bg-primary/5'}>
                  {b.link ? (
                    <Link
                      href={b.link}
                      onClick={() => setAcik(false)}
                      className="block px-3 py-2.5 hover:bg-secondary/60"
                      prefetch={false}
                    >
                      {icerik}
                    </Link>
                  ) : (
                    <div className="px-3 py-2.5">{icerik}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
