import { LoginForm } from './LoginForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const loginImage = PlaceHolderImages.find((img) => img.id === 'login-hero');

  return (
    <div className="w-full lg:grid lg:min-h-[calc(100vh-4rem)] lg:grid-cols-2 xl:min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md mx-4 border-0 shadow-none sm:border sm:shadow-sm">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-headline">Giriş Yap</CardTitle>
            <CardDescription>Patisemti'ne tekrar hoş geldiniz</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoginForm />
             <div className="mt-4 text-center text-sm">
              Hesabın yok mu?{' '}
              <Link href="/kayit" className="underline font-semibold text-primary">
                Kayıt Ol
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
       <div className="hidden bg-muted lg:block relative">
        {loginImage && (
          <Image
            src={loginImage.imageUrl}
            alt={loginImage.description}
            data-ai-hint={loginImage.imageHint}
            fill
            className="object-cover"
          />
        )}
      </div>
    </div>
  );
}
