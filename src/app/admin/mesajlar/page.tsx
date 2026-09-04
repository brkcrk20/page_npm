'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Inbox, Loader2, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { cn } from '@/lib/utils';

/**
 * İletişim mesajları.
 *
 * Form herkese açık ve e-posta sağlayıcısı henüz yok; mesajlar yalnızca
 * burada görülüyor. Bu yüzden yönetim özetinde de sayacı var — okunmayan
 * bir gelen kutusu, formu hiç koymamakla aynı kapıya çıkar.
 */

type Mesaj = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  user_id: string | null;
};

const DURUM_ETIKET: Record<string, string> = {
  yeni: 'Yeni',
  okundu: 'Okundu',
  yanitlandi: 'Yanıtlandı',
  kapatildi: 'Kapatıldı',
};

const DURUM_STIL: Record<string, string> = {
  yeni: 'bg-amber-100 text-amber-800',
  okundu: 'bg-blue-100 text-blue-800',
  yanitlandi: 'bg-emerald-100 text-emerald-800',
  kapatildi: 'bg-slate-100 text-slate-700',
};

const SEKMELER = [
  { key: 'yeni', label: 'Yeni' },
  { key: 'okundu', label: 'Okundu' },
  { key: 'yanitlandi', label: 'Yanıtlandı' },
  { key: 'kapatildi', label: 'Kapatıldı' },
  { key: 'hepsi', label: 'Tümü' },
] as const;

export default function AdminContactPage() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [filtre, setFiltre] = useState<string>('yeni');
  const [mesajlar, setMesajlar] = useState<Mesaj[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [mesgul, setMesgul] = useState<number | null>(null);

  const yukle = useCallback(async () => {
    setYukleniyor(true);
    const supabase = getSupabaseBrowserClient();
    let q = supabase
      .from('contact_messages')
      .select('id, name, email, subject, message, status, admin_note, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(200);

    if (filtre !== 'hepsi') q = q.eq('status', filtre as never);

    const { data, error } = await q;
    setYukleniyor(false);
    if (error) {
      toast({ title: 'Mesajlar alınamadı', description: error.message, variant: 'destructive' });
      return;
    }
    setMesajlar((data ?? []) as unknown as Mesaj[]);
  }, [filtre, toast]);

  useEffect(() => {
    if (user) void yukle();
  }, [user, yukle]);

  async function durumDegistir(m: Mesaj, durum: string) {
    setMesgul(m.id);
    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from('contact_messages')
      .update({ status: durum as never })
      .eq('id', m.id);
    setMesgul(null);

    if (error) {
      toast({ title: 'Güncellenemedi', description: error.message, variant: 'destructive' });
      return;
    }
    // Süzgeç dışına çıkan mesaj listede kalmasın.
    if (filtre !== 'hepsi' && durum !== filtre) {
      setMesajlar((prev) => prev.filter((x) => x.id !== m.id));
    } else {
      setMesajlar((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: durum } : x)));
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Inbox className="h-5 w-5 text-primary" />
          İletişim Mesajları
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          İletişim sayfasından gönderilen mesajlar. E-posta sağlayıcısı bağlanana kadar
          yanıtları kendiniz göndermeniz gerekiyor.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {SEKMELER.map((s) => (
          <button
            key={s.key}
            onClick={() => setFiltre(s.key)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm transition',
              filtre === s.key
                ? 'border-primary bg-primary text-primary-foreground'
                : 'bg-white hover:border-primary'
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {yukleniyor ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : mesajlar.length === 0 ? (
        <p className="rounded-xl border border-dashed bg-white py-16 text-center text-sm text-muted-foreground">
          Bu durumda mesaj yok.
        </p>
      ) : (
        <ul className="space-y-3">
          {mesajlar.map((m) => (
            <li key={m.id} className="rounded-xl border bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{m.subject}</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        DURUM_STIL[m.status] ?? 'bg-slate-100'
                      )}
                    >
                      {DURUM_ETIKET[m.status] ?? m.status}
                    </span>
                    {m.user_id && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                        Üye
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {m.name} ·{' '}
                    <a href={`mailto:${m.email}`} className="text-primary hover:underline">
                      {m.email}
                    </a>{' '}
                    · {new Date(m.created_at).toLocaleString('tr-TR')}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{m.message}</p>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <Button size="sm" asChild>
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + m.subject)}`}>
                      <Mail className="mr-1.5 h-4 w-4" />
                      Yanıtla
                    </a>
                  </Button>
                  {m.status !== 'yanitlandi' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={mesgul === m.id}
                      onClick={() => durumDegistir(m, 'yanitlandi')}
                    >
                      Yanıtlandı
                    </Button>
                  )}
                  {m.status !== 'kapatildi' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={mesgul === m.id}
                      onClick={() => durumDegistir(m, 'kapatildi')}
                      className="text-muted-foreground"
                    >
                      Kapat
                    </Button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-center text-xs text-muted-foreground">
        İletişim bilgilerini{' '}
        <Link href="/admin/ayarlar" className="text-primary hover:underline">
          Ayarlar
        </Link>{' '}
        sayfasından doldurabilirsiniz.
      </p>
    </div>
  );
}
