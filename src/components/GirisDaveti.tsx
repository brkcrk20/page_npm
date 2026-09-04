import Link from 'next/link';
import { LogIn, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Giriş yapmamış kullanıcıya gösterilen davet.
 *
 * "İlan Ver" ve işletme kayıt sayfaları oturum yoksa doğrudan /login'e
 * yönlendirip ekrana null basıyordu. Kullanıcı bir düğmeye basıyor,
 * anlamadığı bir sayfaya düşüyor ya da (yönlendirme gecikirse) boş bir
 * gövde görüyordu — "site çalışmıyor mu?" hissi tam olarak buradan
 * çıkıyor. Arama motoru da o sayfalarda yalnızca alt bilgiyi görüyordu.
 *
 * Şimdi ne olduğu, ne gerektiği ve nereye gidileceği tek ekranda yazıyor.
 */
export function GirisDaveti({
  baslik,
  aciklama,
  girisEtiketi = 'Giriş Yap',
  kayitEtiketi = 'Ücretsiz Kayıt Ol',
  donusYolu,
  icon: Icon = LogIn,
  altNot,
}: {
  baslik: string;
  aciklama: string;
  girisEtiketi?: string;
  kayitEtiketi?: string;
  /** Girişten sonra kullanıcının döneceği adres. */
  donusYolu?: string;
  icon?: React.ElementType;
  altNot?: React.ReactNode;
}) {
  const q = donusYolu ? `?donus=${encodeURIComponent(donusYolu)}` : '';

  return (
    <div className="mx-auto max-w-lg px-5 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>

      <h1 className="mt-4 text-2xl font-bold">{baslik}</h1>
      <p className="mt-2 text-muted-foreground">{aciklama}</p>

      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <Button asChild>
          <Link href={`/login${q}`}>
            <LogIn className="mr-2 h-4 w-4" />
            {girisEtiketi}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/kayit${q}`}>
            <UserPlus className="mr-2 h-4 w-4" />
            {kayitEtiketi}
          </Link>
        </Button>
      </div>

      {altNot && <div className="mt-6 text-sm text-muted-foreground">{altNot}</div>}
    </div>
  );
}
