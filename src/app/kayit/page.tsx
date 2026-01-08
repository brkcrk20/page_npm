import { RegisterForm } from './RegisterForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function RegisterPage() {
   const registerImage = PlaceHolderImages.find((img) => img.id === 'register-hero');

  return (
     <div className="w-full lg:grid lg:min-h-[calc(100vh-4rem)] lg:grid-cols-2 xl:min-h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md mx-4 border-0 shadow-none sm:border sm:shadow-sm">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-3xl font-headline">Hesap Oluştur</CardTitle>
            <CardDescription>Ciraks ailesine katılın</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RegisterForm />
            <div className="mt-4 text-center text-sm">
              Zaten hesabın var mı?{' '}
              <Link href="/login" className="underline font-semibold text-primary">
                Giriş Yap
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
       <div className="hidden bg-muted lg:block relative">
        {registerImage && (
          <Image
            src={registerImage.imageUrl}
            alt={registerImage.description}
            data-ai-hint={registerImage.imageHint}
            fill
            className="object-cover"
          />
        )}
      </div>
    </div>
  );
}
