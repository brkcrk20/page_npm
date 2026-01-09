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
import { useAuth, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { UserProfile } from '@/lib/types';

const formSchema = z.object({
  loginId: z.string().min(1, { message: 'Kullanıcı adı veya e-posta gereklidir.' }),
  password: z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır.' }),
  remember: z.boolean().default(false).optional(),
});

export function LoginForm() {
  const auth = useAuth();
  const firestore = useFirestore();
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

  async function getEmailFromUsername(username: string): Promise<string | null> {
    try {
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('username', '==', username), limit(1));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0].data() as UserProfile;
        return userDoc.email;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user by username:", error);
      // This might fail due to security rules if not properly configured.
      // We'll let the main login function handle the generic error message.
      return null;
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    let emailToLogin = values.loginId;

    // Check if loginId is not an email, then assume it's a username
    if (!values.loginId.includes('@')) {
      const foundEmail = await getEmailFromUsername(values.loginId);
      if (foundEmail) {
        emailToLogin = foundEmail;
      } else {
        // If username is not found, we can fail early
        toast({
          variant: "destructive",
          title: "Giriş Başarısız",
          description: "Kullanıcı adı veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.",
        });
        setIsLoading(false);
        return;
      }
    }

    try {
      await signInWithEmailAndPassword(auth, emailToLogin, values.password);
      router.push('/');
    } catch (error: any) {
      console.error(error);
      let description = "Giriş yapılırken bir hata oluştu.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        description = "Kullanıcı adı veya şifre hatalı. Lütfen bilgilerinizi kontrol edin.";
      }
      toast({
        variant: "destructive",
        title: "Giriş Başarısız",
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
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
                <Input placeholder="kullanici_adim veya email@example.com" {...field} disabled={isLoading} />
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
