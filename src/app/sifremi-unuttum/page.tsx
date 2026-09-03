'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, KeyRound, Loader2, MailCheck } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * Şifre sıfırlama isteği.
 *
 * Giriş sayfasındaki "Şifremi Unuttum" bağlantısı hiçbir yere gitmiyordu
 * (href="#"). Şifresini unutan kullanıcının hesabına dönmesinin HİÇBİR yolu
 * yoktu; e-posta doğrulaması kapalı olduğu için destek de doğrulama yapamazdı.
 *
 * Sonuç bilerek her durumda aynı: "adres kayıtlıysa gönderdik". Aksi hâlde bu
 * sayfa, hangi e-postaların kayıtlı olduğunu dışarıdan taranabilir hâle
 * getiren bir araca dönüşürdü.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.includes('@')) {
      setError('Geçerli bir e-posta adresi girin.');
      return;
    }

    setIsSending(true);
    const { error: sendError } = await getSupabaseBrowserClient().auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/sifre-yenile` }
    );
    setIsSending(false);

    // Gönderim hatası yalnızca hız sınırı gibi teknik durumlarda gösteriliyor;
    // "böyle bir kullanıcı yok" bilgisi asla sızdırılmıyor.
    if (sendError && /rate|too many|limit/i.test(sendError.message)) {
      setError('Çok fazla deneme yapıldı. Bir süre bekleyip tekrar deneyin.');
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <MailCheck className="h-6 w-6 text-emerald-700" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">E-postanızı kontrol edin</h1>
        <p className="mt-2 text-muted-foreground">
          <strong>{email}</strong> adresi kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.
          Bağlantı kısa süre geçerlidir.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          E-posta birkaç dakika içinde gelmezse gereksiz (spam) klasörünü kontrol edin.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild variant="outline">
            <Link href="/login">Giriş Sayfasına Dön</Link>
          </Button>
          <Button variant="ghost" onClick={() => setSent(false)}>
            Başka adres dene
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-12">
      <div className="rounded-xl border bg-white p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="h-5 w-5 text-primary" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Şifremi Unuttum</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hesabınızın e-posta adresini girin; şifrenizi yenilemeniz için bir bağlantı
          gönderelim.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">E-posta</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@eposta.com"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Gönderilemedi</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isSending}>
            {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sıfırlama Bağlantısı Gönder
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Şifrenizi hatırladınız mı?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Giriş yapın
          </Link>
        </p>
      </div>
    </div>
  );
}
