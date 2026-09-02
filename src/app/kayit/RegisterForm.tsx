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
import React, { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Bireysel üyelik şeması
const individualSchema = z.object({
  userType: z.literal('bireysel'),
  name: z.string().min(2, { message: 'Ad soyad en az 2 karakter olmalıdır.' }),
  username: z.string().min(3, { message: 'Kullanıcı adı en az 3 karakter olmalıdır.' }).regex(/^[a-zA-Z0-9_]+$/, { message: 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir.' }),
  email: z.string().email({ message: 'Geçerli bir e-posta adresi girin.' }),
  phone: z.string().min(10, { message: 'Geçerli bir telefon numarası girin.' }),
  password: z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır.' }),
  robotCheck: z.boolean().refine(val => val === true, { message: "Lütfen robot olmadığınızı doğrulayın." }),
  agreement: z.boolean().refine(val => val === true, { message: "Üyelik sözleşmesini kabul etmelisiniz." }),
});

// Kurumsal üyelik şeması
const corporateSchema = z.object({
  userType: z.literal('kurumsal'),
  name: z.string().min(2, { message: 'Ad soyad en az 2 karakter olmalıdır.' }),
  username: z.string().min(3, { message: 'Kullanıcı adı en az 3 karakter olmalıdır.' }).regex(/^[a-zA-Z0-9_]+$/, { message: 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir.' }),
  email: z.string().email({ message: 'Geçerli bir e-posta adresi girin.' }),
  phone: z.string().min(10, { message: 'Geçerli bir telefon numarası girin.' }),
  password: z.string().min(6, { message: 'Şifre en az 6 karakter olmalıdır.' }),
  tcNo: z.string().length(11, { message: 'TC Kimlik Numarası 11 haneli olmalıdır.' }),
  companyType: z.enum(['Sahis', 'Limited', 'Anonim'], { required_error: "Şirket türü seçmelisiniz." }),
  companyTitle: z.string().min(2, { message: 'Firma ünvanı gereklidir.' }),
  taxNo: z.string().min(10, { message: 'Vergi numarası 10 veya 11 haneli olmalıdır.' }),
  taxOffice: z.string().min(2, { message: 'Vergi dairesi gereklidir.' }),
  companyAddress: z.string().min(10, { message: 'Firma adresi gereklidir.' }),
  robotCheck: z.boolean().refine(val => val === true, { message: "Lütfen robot olmadığınızı doğrulayın." }),
  agreement: z.boolean().refine(val => val === true, { message: "Üyelik sözleşmesini kabul etmelisiniz." }),
});

// Birleşik şema
const formSchema = z.discriminatedUnion("userType", [individualSchema, corporateSchema]);

// Tip çıkarımı
type FormValues = z.infer<typeof formSchema>;

export function RegisterForm() {
  const [userType, setUserType] = useState<'bireysel' | 'kurumsal'>('bireysel');
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userType: 'bireysel',
      name: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      robotCheck: false,
      agreement: false,
    },
  });

  const handleTabChange = (value: string) => {
    const newUserType = value as 'bireysel' | 'kurumsal';
    setUserType(newUserType);
    form.reset();
    form.setValue('userType', newUserType);
  };

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    const supabase = getSupabaseBrowserClient();

    try {
      const username = values.username.trim().toLowerCase();

      // Kullanıcı adını önden kontrol et. Veritabanında zaten unique kısıt var
      // ama o kısıt profil trigger'ı içinde patlarsa kullanıcı çoktan Auth'a
      // kaydolmuş ama profilsiz kalmış olur; önden bakmak bu durumu önlüyor.
      const { data: available, error: checkError } = await supabase.rpc('username_available', {
        p_username: username,
      });

      if (checkError) {
        throw new Error('Kullanıcı adı kontrol edilemedi: ' + checkError.message);
      }
      if (available === false) {
        form.setError('username', { message: 'Bu kullanıcı adı zaten alınmış.' });
        setIsLoading(false);
        return;
      }

      // Profil alanları raw_user_meta_data içinde taşınıyor; auth.users'a kayıt
      // düştüğü anda handle_new_user() trigger'ı bunları public.profiles'a
      // yazıyor (bkz. 0007_auth_helpers.sql). Böylece profil oluşturma için
      // ayrı bir istemci yazması gerekmiyor ve yarım kayıt kalmıyor.
      const metadata: Record<string, string> = {
        full_name: values.name,
        username,
        phone: values.phone,
        account_type: values.userType,
      };

      if (values.userType === 'kurumsal') {
        metadata.national_id = values.tcNo;
        metadata.company_type = values.companyType;
        metadata.company_title = values.companyTitle;
        metadata.tax_number = values.taxNo;
        metadata.tax_office = values.taxOffice;
        metadata.company_address = values.companyAddress;
      }

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { data: metadata },
      });

      if (error) {
        let description = 'Kayıt sırasında bir hata oluştu.';
        if (error.message.includes('already registered')) {
          description = 'Bu e-posta adresi zaten kullanılıyor.';
        } else if (error.message.includes('Password')) {
          description = 'Şifre yeterince güçlü değil. En az 6 karakter olmalı.';
        }
        toast({ variant: 'destructive', title: 'Kayıt Başarısız', description });
        setIsLoading(false);
        return;
      }

      // E-posta doğrulaması açıksa oturum gelmez; kullanıcıyı ana sayfaya
      // atmak yerine ne yapması gerektiğini söylüyoruz.
      if (!data.session) {
        toast({
          title: 'Kayıt Alındı',
          description: 'E-posta adresinize gönderilen doğrulama bağlantısına tıklayın.',
        });
        router.push('/login');
        return;
      }

      toast({ title: 'Kayıt Başarılı!', description: "petsemti'ye hoş geldiniz." });
      router.push('/');
      router.refresh();
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Kayıt Başarısız',
        description: error?.message ?? 'Kayıt sırasında bir hata oluştu.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Tabs value={userType} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="bireysel">Bireysel</TabsTrigger>
        <TabsTrigger value="kurumsal">Kurumsal</TabsTrigger>
      </TabsList>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <FormField
            control={form.control}
            name="userType"
            render={({ field }) => (
              <input type="hidden" {...field} value={userType} />
            )}
          />
          
          <TabsContent value="bireysel" className="space-y-4 m-0">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad Soyad *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ad Soyad" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kullanıcı Adı *</FormLabel>
                  <FormControl>
                    <Input placeholder="Kullanıcı Adı" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-posta *</FormLabel>
                  <FormControl>
                    <Input placeholder="Mail Adresi" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cep Telefonu *</FormLabel>
                  <FormControl>
                    <Input placeholder="555 123 4567" {...field} disabled={isLoading} />
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
                  <FormLabel>Şifre *</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="kurumsal" className="space-y-4 m-0">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad Soyad (Yetkili) *</FormLabel>
                  <FormControl><Input placeholder="Ad Soyad" {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kullanıcı Adı *</FormLabel>
                  <FormControl><Input placeholder="Kullanıcı Adı" {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-posta *</FormLabel>
                  <FormControl><Input placeholder="Mail Adresi" {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cep Telefonu *</FormLabel>
                  <FormControl><Input placeholder="555 123 4567" {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şifre *</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••" {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tcNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TC Kimlik No *</FormLabel>
                  <FormControl><Input placeholder="11111111111" {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Şirket Türü *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Şirket türü seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Sahis">Şahıs Şirketi</SelectItem>
                      <SelectItem value="Limited">Limited Şirket</SelectItem>
                      <SelectItem value="Anonim">Anonim Şirket</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firma Ünvanı *</FormLabel>
                  <FormControl><Input placeholder="petsemti A.Ş." {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="taxNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vergi No *</FormLabel>
                    <FormControl><Input placeholder="1234567890" {...field} disabled={isLoading} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxOffice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vergi Dairesi *</FormLabel>
                    <FormControl><Input placeholder="Örn: Maslak" {...field} disabled={isLoading} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="companyAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Firma Adresi *</FormLabel>
                  <FormControl><Input placeholder="Firma adresi" {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          
          <FormField
            control={form.control}
            name="robotCheck"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Ben robot değilim *</FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="agreement"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    <a href="/uyelik-sozlesmesi" target="_blank" className="underline hover:text-primary">Üyelik sözleşmesini</a> okudum, kabul ediyorum. *
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kayıt Ol
          </Button>
        </form>
      </Form>
    </Tabs>
  );
}