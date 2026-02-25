'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Wand2, Loader2, Upload, X, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { handleImproveDescription, handleSuggestBreeds } from './actions';
import { useUser, useFirestore, useStorage } from '@/firebase';
import { useUserProfile } from '@/firebase/firestore/use-user-profile';
import { collection, addDoc, getDocs, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Yazıyı Link Dostu (Slug) Yapan Yardımcı Fonksiyon
const slugify = (text: string) => {
  const trMap: any = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'C', 'Ğ': 'G', 'İ': 'I', 'Ö': 'O', 'Ş': 'S', 'Ü': 'U' };
  return text.toString().toLowerCase()
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (m) => trMap[m])
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const formSchema = z.object({
  baslik: z.string().min(5, { message: 'Başlık en az 5 karakter olmalıdır.' }),
  kategori_id: z.string({ required_error: "Hayvan türü seçmelisiniz." }),
  cins: z.string().min(2, { message: 'Cins bilgisi gereklidir.' }),
  yas: z.string().min(1, { message: 'Yaş bilgisi gereklidir.' }),
  aciklama: z.string().min(20, { message: 'Açıklama en az 20 karakter olmalıdır.' }),
  ilan_tipi: z.enum(['Sahiplendirme', 'Satilik'], { required_error: "İlan tipi seçmelisiniz." }),
  fiyat: z.string().optional(),
  sehir: z.string().min(2, { message: "Şehir bilgisi gereklidir." }),
});

export function CreateListingForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const { data: userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const storage = useStorage();
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      baslik: '',
      cins: '',
      yas: '',
      aciklama: '',
      sehir: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setPhotoPreview(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return;
    if (!photoPreview) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Fotoğraf yüklemelisiniz.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. İlan Numarasını Al (Transaction ile)
      const sayacRef = doc(firestore, 'ayarlar', 'ilan_sayaci');
      const yeniIlanNo = await runTransaction(firestore, async (transaction) => {
        const sayacDoc = await transaction.get(sayacRef);
        if (!sayacDoc.exists()) throw "Sayaç bulunamadı!";
        const yeniNo = sayacDoc.data().son_numara + 1;
        transaction.update(sayacRef, { son_numara: yeniNo });
        return yeniNo;
      });

      // 2. Fotoğrafı Yükle
      const imageRef = ref(storage, `ilanlar/${user.uid}/${Date.now()}`);
      const uploadResult = await uploadString(imageRef, photoPreview, 'data_url');
      const imageUrl = await getDownloadURL(uploadResult.ref);

      // 3. Patibul Tarzı Slug Oluştur (baslik-ilan-no)
      const slug = `${slugify(values.baslik)}-${yeniIlanNo}`;

      // 4. Veritabanına Kaydet (Türkçe Alanlar)
      const yeniIlan = {
        ilan_no: yeniIlanNo,
        baslik: values.baslik,
        baslik_slug: slug,
        aciklama: values.aciklama,
        fiyat: values.ilan_tipi === 'Satilik' ? parseInt(values.fiyat || '0') : 0,
        kategori_id: values.kategori_id,
        kategori_slug: values.kategori_id === '1' ? 'kopek-ilanlari' : 'kedi-ilanlari',
        cins: values.cins,
        yas: values.yas,
        sehir: values.sehir,
        resimler: [imageUrl],
        kullanici_id: user.uid,
        olusturma_tarihi: serverTimestamp(),
        durum: 'aktif'
      };

      await addDoc(collection(firestore, 'ilanlar'), yeniIlan);
      
      toast({ title: "Başarılı!", description: "İlanınız yayına alındı." });
      router.push(`/${yeniIlan.kategori_id}/${yeniIlan.kategori_slug}`);

    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Hata", description: "İlan eklenemedi." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yeni İlan Ver</CardTitle>
        <CardDescription>Bilgileri Türkçe ve eksiksiz doldurun.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Fotoğraf Alanı */}
            <div className="flex flex-col items-center justify-center border-2 border-dashed p-4 rounded-lg">
              {photoPreview ? (
                <div className="relative w-40 h-40">
                  <Image src={photoPreview} alt="Önizleme" fill className="object-cover rounded-md" />
                  <Button size="icon" variant="destructive" className="absolute -top-2 -right-2" onClick={() => setPhotoPreview(null)}><X /></Button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <span>Fotoğraf Seç</span>
                  <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="baslik" render={({ field }) => (
                <FormItem><FormLabel>İlan Başlığı</FormLabel><Input placeholder="Örn: Çok oyuncu yavru kedi" {...field} /></FormItem>
              )} />

              <FormField control={form.control} name="kategori_id" render={({ field }) => (
                <FormItem><FormLabel>Kategori</FormLabel>
                  <Select onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Tür Seçin" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="1">Köpek İlanları</SelectItem>
                      <SelectItem value="2">Kedi İlanları</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="cins" render={({ field }) => (
                <FormItem><FormLabel>Cinsi</FormLabel><Input placeholder="Örn: British Shorthair" {...field} /></FormItem>
              )} />
              <FormField control={form.control} name="yas" render={({ field }) => (
                <FormItem><FormLabel>Yaşı</FormLabel><Input placeholder="Örn: 3 Aylık" {...field} /></FormItem>
              )} />
              <FormField control={form.control} name="sehir" render={({ field }) => (
                <FormItem><FormLabel>Şehir</FormLabel><Input placeholder="Örn: İstanbul" {...field} /></FormItem>
              )} />
            </div>

            <FormField control={form.control} name="aciklama" render={({ field }) => (
              <FormItem><FormLabel>Açıklama</FormLabel><Textarea placeholder="Dostunuzu anlatın..." {...field} /></FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="ilan_tipi" render={({ field }) => (
                <FormItem><FormLabel>İlan Tipi</FormLabel>
                  <Select onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="Sahiplendirme">Sahiplendirme (Ücretsiz)</SelectItem>
                      <SelectItem value="Satilik">Satılık (Ücretli)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="fiyat" render={({ field }) => (
                <FormItem><FormLabel>Fiyat (TL)</FormLabel><Input type="number" disabled={form.watch('ilan_tipi') !== 'Satilik'} {...field} /></FormItem>
              )} />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              İlanı Patibul Tarzı Yayınla
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}