'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Mail } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * E-posta bildirimlerinin durumu.
 *
 * Kuyruk sessizce çalışıyor; bir şey ters gittiğinde (anahtar yok,
 * sağlayıcı reddediyor, alan adı doğrulanmamış) bunun tek görünür yeri
 * burası olmalı. Aksi hâlde "bildirim gitmiyor" şikâyeti ancak kullanıcı
 * söylediğinde fark edilir.
 */

type Durum = {
  yapilandirildi: boolean;
  saglayici: string | null;
  bekleyen: number;
  gonderildi: number;
  hata: number;
  iptal: number;
  sonHatalar: { id: number; subject: string; last_error: string | null; attempts: number }[];
};

export function BildirimDurumu() {
  const [durum, setDurum] = useState<Durum | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/admin/bildirim');
      if (res.ok) setDurum(await res.json());
      setYukleniyor(false);
    })();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="h-5 w-5" />
          E-posta Bildirimleri
        </CardTitle>
        <CardDescription>
          İlana mesaj geldiğinde ve ilan süresi dolmak üzereyken kullanıcılara e-posta
          gönderiliyor.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {yukleniyor || !durum ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor…
          </div>
        ) : (
          <>
            {durum.yapilandirildi ? (
              <p className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Gönderim açık — sağlayıcı: <strong>{durum.saglayici}</strong>
              </p>
            ) : (
              <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="text-amber-900">
                  <p className="font-medium">E-posta sağlayıcısı tanımlı değil</p>
                  <p className="mt-1">
                    Bildirimler üretiliyor ve kuyrukta bekliyor ama gönderilmiyor. Yayın
                    ortamına <code>RESEND_API_KEY</code> ya da <code>SMTP_HOST</code>,{' '}
                    <code>SMTP_USER</code>, <code>SMTP_PASS</code> değişkenlerini
                    ekleyin. Üç günden eski bildirimler gönderilmeden iptal ediliyor.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Bekleyen', durum.bekleyen],
                ['Gönderildi', durum.gonderildi],
                ['Hata', durum.hata],
                ['İptal', durum.iptal],
              ].map(([etiket, sayi]) => (
                <div key={etiket as string} className="rounded-lg border p-3">
                  <p className="text-xl font-bold">{sayi as number}</p>
                  <p className="text-xs text-muted-foreground">{etiket as string}</p>
                </div>
              ))}
            </div>

            {durum.sonHatalar.length > 0 && (
              <div className="space-y-1.5 rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Son hatalar
                </p>
                {durum.sonHatalar.map((h) => (
                  <p key={h.id} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{h.subject}</span> —{' '}
                    {h.last_error} ({h.attempts} deneme)
                  </p>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
