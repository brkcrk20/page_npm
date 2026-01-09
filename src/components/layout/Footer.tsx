'use client';

import Link from 'next/link';
import { PawPrint, Twitter, Instagram, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

export function Footer() {
  const year = new Date().getFullYear();
  const auth = useAuth();
  const { toast } = useToast();

  const handleLogin = async (userType: 'admin' | 'premium' | 'user') => {
    const credentials = {
      admin: { email: 'admin@patisemti.com', password: 'password' },
      premium: { email: 'premium@patisemti.com', password: 'password' },
      user: { email: 'user@patisemti.com', password: 'password' },
    };

    const { email, password } = credentials[userType];

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Giriş Başarılı',
        description: `${email} olarak giriş yapıldı.`,
      });
    } catch (error: any) {
      console.error(`${userType} login failed`, error);
      let description = 'Giriş sırasında bilinmeyen bir hata oluştu.';
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        description = `Test kullanıcısı (${email}) bulunamadı. Lütfen Firebase Authentication panelinden oluşturun. Şifre: "password"`;
      }
      toast({
        variant: 'destructive',
        title: 'Giriş Başarısız',
        description: description,
      });
    }
  };

  return (
    <footer className="bg-secondary">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <PawPrint className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline">Patisemti</span>
          </div>
          <div className="text-center md:text-left text-sm text-muted-foreground mb-4 md:mb-0 space-x-4">
            <span>&copy; {year} Patisemti. Tüm hakları saklıdır.</span>
            <Link href="/admin" className="hover:text-primary underline">Admin</Link>
          </div>
          <div className="flex space-x-4">
            <Link href="#" className="text-muted-foreground hover:text-primary">
              <Twitter />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary">
              <Instagram />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary">
              <Facebook />
            </Link>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border/50 flex flex-col items-center justify-center space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <p className="text-sm text-muted-foreground">Geliştirme Amaçlı Girişler:</p>
            <Button variant="outline" size="sm" onClick={() => handleLogin('admin')}>
                Admin Girişi
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleLogin('premium')}>
                Premium Üye Girişi
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleLogin('user')}>
                Normal Üye Girişi
            </Button>
        </div>
      </div>
    </footer>
  );
}
