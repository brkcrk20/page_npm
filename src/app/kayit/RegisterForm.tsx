'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import React, { useState } from 'react';
import { useAuth, useFirestore, errorEmitter, FirestorePermissionError } from '@/firebase';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

const formSchema = z.discriminatedUnion("userType", [individualSchema, corporateSchema]);

type FormValues = z.infer<typeof formSchema>;

export function RegisterForm() {
  const [userType, setUserType] = useState<'bireysel' | 'kurumsal'>('bireysel');
  const auth = useAuth();
  const firestore = useFirestore();
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
    form.reset(); // Reset form state on tab change
    form.setValue('userType', newUserType);
  };

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      // 1. Authentication'da kullanıcı oluştur
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      // 2. Kullanıcı profilini güncelle (displayName)
      await updateProfile(user, {
        displayName: values.name
      });

      // 3. ONLİNE KOD: Benzersiz onay kodu oluştur
      const onayKodu = Math.floor(100000 + Math.random() * 900000).toString();

      // 4. Firestore'a kullanıcı bilgilerini kaydet (TÜM ALANLARLA)
      const userProfile = {
        // Temel bilgiler
        id: user.uid,
        adSoyad: values.name,
        username: values.username,
        email: values.email,
        telefon: values.phone,
        
        // Durum bilgileri
        durum: 'aktif',
        rol: values.userType === 'kurumsal' ? 'kurumsal' : 'kullanici',
        userStatus: 'standart',
        
        // İstatistikler
        credit: 0,
        toplamIlan: 0,
        aktifIlan: 0,
        
        // Tarihler
        kayitTarihi: serverTimestamp(),
        sonGiris: serverTimestamp(),
        
        // Onay bilgileri
        emailOnay: false,
        smsOnay: false,
        onayKodu: onayKodu,
        
        // Konum bilgileri (boş, sonra doldurulacak)
        sehir: '',
        ilce: '',
        adres: '',
        
        // Kurumsal alanlar (varsa)
        ...(values.userType === 'kurumsal' && {
          tcNo: values.tcNo,
          companyType: values.companyType,
          companyTitle: values.companyTitle,
          taxNo: values.taxNo,
          taxOffice: values.taxOffice,
          companyAddress: values.companyAddress,
          isCorporate: true
        }),
        
        // Bireysel için boş kurumsal alanlar
        ...(values.userType === 'bireysel' && {
          isCorporate: false,
          tcNo: ''
        })
      };

      // 5. users koleksiyonuna kaydet
      const userDocRef = doc(firestore, "users", user.uid);
      await setDoc(userDocRef, userProfile);
      
      // 6. kullanicilar koleksiyonuna da kaydet (opsiyonel)
      const kullaniciDocRef = doc(firestore, "kullanicilar", user.uid);
      await setDoc(kullaniciDocRef, {
        adSoyad: values.name,
        email: values.email,
        telefon: values.phone,
        durum: 'aktif',
        rol: values.userType === 'kurumsal' ? 'kurumsal' : 'kullanici',
        kayitTarihi: serverTimestamp(),
        sonGiris: serverTimestamp(),
      });

      // 7. Başarılı kayıt sonrası ana sayfaya yönlendir
      router.push('/');
      toast({
        title: "Kayıt Başarılı!",
        description: "petsemti'ye hoş geldiniz.",
      });

    } catch (error: any) {
      console.error("Registration error:", error);
      let description = "Kayıt sırasında bir hata oluştu.";
      if (error.code === 'auth/email-already-in-use') {
        description = "Bu e-posta adresi zaten kullanılıyor.";
      } else if (error.code === 'permission-denied') {
        description = "Veritabanı izin hatası. Lütfen daha sonra tekrar deneyin.";
      }
      toast({
        variant: "destructive",
        title: "Kayıt Başarısız",
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const renderRobotCheck = () => (
    <FormField
        control={form.control}
        name="robotCheck"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isLoading}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Ben robot değilim <span className="text-red-500">*</span>
              </FormLabel>
            </div>
             <FormMessage />
          </FormItem>
        )}
      />
  );
  
  const renderAgreementCheckbox = () => (
     <FormField
        control={form.control}
        name="agreement"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isLoading}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                <a href="/uyelik-sozlesmesi" target="_blank" className="underline hover:text-primary">Üyelik sözleşmesini</a> okudum, kabul ediyorum. <span className="text-red-500">*</span>
              </FormLabel>
            </div>
             <FormMessage />
          </FormItem>
        )}
      />
  );

  return (
    <Tabs value={userType} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="bireysel">Bireysel</TabsTrigger>
        <TabsTrigger value="kurumsal">Kurumsal</TabsTrigger>
      </TabsList>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4" id="register-form" noValidate>
           <FormField
              control={form.control}
              name="userType"
              render={({ field }) => (
                <input type="hidden" {...field} />
              )}
            />
          <TabsContent value="bireysel" className="space-y-4 m-0">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad Soyad <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Kullanıcı Adı <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>E-posta <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Cep Telefonu <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Şifre <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {renderRobotCheck()}
            {renderAgreementCheckbox()}
          </TabsContent>

          <TabsContent value="kurumsal" className="space-y-4 m-0">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adı Soyadı (Yetkili) <span className="text-red-500">*</span></FormLabel>
                  <FormControl><Input placeholder="Adı Soyadı" {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kullanıcı Adı <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>E-posta Adresi <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Cep Telefonu <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Şifre <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>TC Kimlik Numarası <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Şirket Türü <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Firma Ünvanı <span className="text-red-500">*</span></FormLabel>
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
                    <FormLabel>Vergi No <span className="text-red-500">*</span></FormLabel>
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
                    <FormLabel>Vergi Dairesi <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Firma Adresi <span className="text-red-500">*</span></FormLabel>
                  <FormControl><Input placeholder="Firma adresi" {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {renderRobotCheck()}
            {renderAgreementCheckbox()}
          </TabsContent>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kayıt Ol
          </Button>
        </form>
      </Form>
    </Tabs>
  );
}