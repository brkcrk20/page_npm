'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, KeyRound, Loader2 } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

/**
 * Yeni şifre belirleme.
 *
 * E-postadaki bağlantı Supabase tarafından geçici bir oturumla açılıyor;
 * updateUser o oturumla çalışıyor. Bu yüzden sayfa "oturum var mı" diye
 * bekliyor: bağlantı süresi dolmuşsa ya da adres doğrudan yazılmışsa oturum
 * oluşmuyor ve form gösterilmemeli — aksi hâlde kullanıcı şifresini yazıp
 * gönderiyor ve anlamsız bir hata alıyordu.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // Bağlantıdan gelen oturum anında hazır olmayabiliyor; olay dinleniyor.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      setReady((prev) => prev ?? Boolean(data.session));
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      return;
    }
    if (password !== again) {
      setError('İki alana da aynı şifreyi yazın.');
      return;
    }

    setIsSaving(true);
    const { error: updateError } = await getSupabaseBrowserClient().auth.updateUser({
      password,
    });
    setIsSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    toast({ title: 'Şifreniz yenilendi', description: 'Artık yeni şifrenizle giriş yapabilirsiniz.' });
    router.push('/profil');
    router.refresh();
  }

  if (ready === null) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Bağlantı geçersiz veya süresi dolmuş</h1>
        <p className="mt-2 text-muted-foreground">
          Şifre sıfırlama bağlantıları kısa süre geçerlidir. Yeni bir bağlantı
          isteyebilirsiniz.
        </p>
        <Button asChild className="mt-6">
          <Link href="/sifremi-unuttum">Yeni Bağlantı İste</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-12">
      <div className="rounded-xl border bg-white p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <KeyRound className="h-5 w-5 text-primary" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Yeni Şifre Belirleyin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Yeni şifreniz kaydedildiği anda geçerli olur.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="pw">Yeni Şifre</Label>
            <Input
              id="pw"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="En az 6 karakter"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pw2">Yeni Şifre (Tekrar)</Label>
            <Input
              id="pw2"
              name="passwordAgain"
              type="password"
              autoComplete="new-password"
              value={again}
              onChange={(e) => setAgain(e.target.value)}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Şifre değiştirilemedi</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Şifreyi Kaydet
          </Button>
        </form>
      </div>
    </div>
  );
}
