'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import React, { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  loginId: z.string().min(1, { message: 'Kullanıcı adı veya e-posta gereklidir.' }),
  password: z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır.' }),
  remember: z.boolean().default(false).optional(),
});

export function LoginForm() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loginId: '',
      password: '',
      remember: false,
    },
  });

  /**
   * Supabase Auth yalnızca e-posta ile giriş kabul ediyor. Kullanıcı adı
   * girildiyse önce karşılığı olan e-postayı buluyoruz.
   *
   * Bunu doğrudan profiles tablosuna sorgu atarak yapamayız: RLS giriş
   * yapmamış kullanıcıya hiçbir profil satırı göstermiyor. Bu yüzden yalnızca
   * e-posta döndüren kontrollü bir RPC kullanılıyor
   * (bkz. supabase/migrations/0007_auth_helpers.sql).
   */
  async function getEmailFromUsername(username: string): Promise<string | null> {
    const { data, error } = await supabase.rpc('email_for_username', {
      p_username: username,
    });
    if (error) {
      console.error('Kullanıcı adı çözümlenemedi:', error.message);
      return null;
    }
    return (data as string | null) ?? null;
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    let emailToLogin = values.loginId.trim();

    if (!emailToLogin.includes('@')) {
      const foundEmail = await getEmailFromUsername(emailToLogin);
      if (!foundEmail) {
        // Kullanıcı adı bulunamadı. Mesajı bilerek genel tutuyoruz: "böyle bir
        // kullanıcı yok" demek, hangi kullanıcı adlarının kayıtlı olduğunu
        // dışarıdan taranabilir hale getirirdi.
        toast({
          variant: 'destructive',
          title: 'Giriş Başarısız',
          description: 'Kullanıcı adı veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.',
        });
        setIsLoading(false);
        return;
      }
      emailToLogin = foundEmail;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToLogin,
      password: values.password,
    });

    if (error) {
      // Supabase'in hata metinleri İngilizce ve teknik; kullanıcıya ne
      // yapması gerektiğini söyleyen karşılıklara çeviriyoruz. Bilinmeyen
      // hatalarda ham mesajı gizlemiyoruz — destek istendiğinde kullanıcının
      // söyleyebileceği tek ipucu o.
      const m = error.message.toLowerCase();
      let title = 'Giriş yapılamadı';
      let description = error.message;

      if (m.includes('invalid login credentials')) {
        description = 'Kullanıcı adı veya şifre hatalı. Bilgilerinizi kontrol edin.';
      } else if (m.includes('email not confirmed')) {
        title = 'E-posta doğrulanmamış';
        description = 'Kayıt olurken gelen doğrulama bağlantısına tıklamanız gerekiyor.';
      } else if (m.includes('email logins are disabled') || m.includes('provider is not enabled')) {
        title = 'Giriş geçici olarak kapalı';
        description = 'E-posta ile giriş şu an devre dışı. Kısa süre içinde tekrar deneyin.';
      } else if (m.includes('rate limit') || m.includes('too many')) {
        title = 'Çok fazla deneme';
        description = 'Güvenlik için bir süre beklemeniz gerekiyor.';
      }

      toast({ variant: 'destructive', title, description });
      setIsLoading(false);
      return;
    }

    // refresh(): sunucu component'leri yeni oturum çerezini görsün.
    router.push('/');
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" id="login-form" noValidate>
        <FormField
          control={form.control}
          name="loginId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kullanıcı Adı veya E-posta</FormLabel>
              <FormControl>
                <Input placeholder="Kullanıcı Adı veya Mail Adresi" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Şifre</FormLabel>
                <Link href="#" className="text-sm font-medium text-primary hover:underline">
                  Şifremi Unuttum
                </Link>
              </div>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="remember"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Beni Hatırla
                </FormLabel>
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Giriş Yap
        </Button>
      </form>
    </Form>
  );
}
