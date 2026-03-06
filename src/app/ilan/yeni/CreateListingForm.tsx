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
import { initializeFirebase } from '@/firebase';
import { useUserProfile } from '@/firebase/firestore/use-user-profile';
import { collection, addDoc, doc, runTransaction, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { citiesData, cityNames } from '@/lib/turkiye-data';

// Yazıyı Link Dostu (Slug) Yapan Yardımcı Fonksiyon
const slugify = (text: string) => {
  const trMap: Record<string, string> = { 
    'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
    'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
  };
  
  return text
    .toString()
    .toLowerCase()
    .replace(/[çğıöşüÇĞİÖŞÜ]/g, (m) => trMap[m] || m)
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// FOTOĞRAF BOYUTLANDIRMA FONKSİYONU
const resizeImage = (file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.8): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(resizedDataUrl);
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const formSchema = z.object({
  baslik: z.string().min(5, { message: 'Başlık en az 5 karakter olmalıdır.' }),
  kategori_id: z.string({ required_error: "Hayvan türü seçmelisiniz." }),
  cins: z.string({ required_error: "Cins seçmelisiniz." }),
  yas: z.string().min(1, { message: 'Yaş bilgisi gereklidir.' }),
  aciklama: z.string().min(20, { message: 'Açıklama en az 20 karakter olmalıdır.' }),
  ilan_tipi: z.enum(['Sahiplendirme', 'Satilik'], { required_error: "İlan tipi seçmelisiniz." }),
  fiyat: z.string().optional(),
  sehir: z.string({ required_error: "Şehir seçmelisiniz." }),
  ilce: z.string({ required_error: "İlçe seçmelisiniz." }),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateListingForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [firestore, setFirestore] = useState<any>(null);
  const [storage, setStorage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Cins listesi için state
  const [cinsler, setCinsler] = useState<any[]>([]);
  const [selectedKategori, setSelectedKategori] = useState<string>('');
  
  const { data: userProfile } = useUserProfile(user?.uid);
  
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const { auth, firestore: fs, storage: st } = initializeFirebase();
    setFirestore(fs);
    setStorage(st);
    
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Kategori değiştiğinde cinsleri getir
  useEffect(() => {
    const fetchCinsler = async () => {
      if (!firestore || !selectedKategori) return;
      
      try {
        const hayvanTuru = selectedKategori === '1' ? 'kopek' : 'kedi';
        const q = query(
          collection(firestore, 'cinsler'),
          where('hayvanTuru', '==', hayvanTuru)
        );
        const querySnapshot = await getDocs(q);
        const cinsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCinsler(cinsData);
      } catch (error) {
        console.error("Cinsler yüklenirken hata:", error);
      }
    };
    
    fetchCinsler();
  }, [firestore, selectedKategori]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      baslik: '',
      cins: '',
      yas: '',
      aciklama: '',
      sehir: '',
      ilce: '',
    },
  });

  // Şehir seçildiğinde ilçeyi sıfırla
  const selectedCity = form.watch('sehir');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsResizing(true);
    
    try {
      const maxPhotos = 5;
      const newPreviews: string[] = [];
      
      for (let i = 0; i < Math.min(files.length, maxPhotos); i++) {
        const file = files[i];
        const resizedDataUrl = await resizeImage(file, 1024, 1024, 0.8);
        newPreviews.push(resizedDataUrl);
      }
      
      setPhotoPreviews(prev => [...prev, ...newPreviews].slice(0, maxPhotos));
      
      toast({
        title: "Başarılı",
        description: `${newPreviews.length} fotoğraf yüklendi ve optimize edildi.`,
      });
    } catch (error: any) {
      console.error("Fotoğraf işleme hatası:", error);
      toast({
        variant: "destructive",
        title: "Hata",
        description: "Fotoğraf yüklenirken bir sorun oluştu.",
      });
    } finally {
      setIsResizing(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  async function onSubmit(values: FormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Giriş yapmalısınız.' });
      return;
    }
    
    if (!firestore || !storage) {
      toast({ variant: 'destructive', title: 'Hata', description: 'Firebase bağlantısı kurulamadı.' });
      return;
    }
    
    if (photoPreviews.length === 0) {
      toast({ variant: 'destructive', title: 'Hata', description: 'En az 1 fotoğraf yüklemelisiniz.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. İlan Numarasını Al (Transaction ile)
      const sayacRef = doc(firestore, 'ayarlar', 'ilan_sayaci');
      const yeniIlanNo = await runTransaction(firestore, async (transaction) => {
        const sayacDoc = await transaction.get(sayacRef);
        if (!sayacDoc.exists()) throw new Error("Sayaç bulunamadı!");
        const yeniNo = sayacDoc.data().son_numara + 1;
        transaction.update(sayacRef, { son_numara: yeniNo });
        return yeniNo;
      });

      // 2. Tüm Fotoğrafları Yükle
      const imageUrls: string[] = [];
      
      for (let i = 0; i < photoPreviews.length; i++) {
        const preview = photoPreviews[i];
        const imageRef = ref(storage, `ilanlar/${user.uid}/${Date.now()}_${i}.jpg`);
        const uploadResult = await uploadString(imageRef, preview, 'data_url');
        const imageUrl = await getDownloadURL(uploadResult.ref);
        imageUrls.push(imageUrl);
      }

      // 3. Patibul Tarzı Slug Oluştur (baslik-ilan-no)
      const slug = `${slugify(values.baslik)}-${yeniIlanNo}`;

      // 4. Veritabanına Kaydet (Türkçe Alanlar)
      const yeniIlan = {
        ilan_no: yeniIlanNo,
        baslik: values.baslik,
        baslik_slug: slug,
        aciklama: values.aciklama,
        fiyat: values.ilan_tipi === 'Satilik' ? parseInt(values.fiyat || '0') : 0,
        hayvanTuru: values.kategori_id === '1' ? 'kopek' : 'kedi',
        kategori_id: values.kategori_id,
        kategori_slug: values.kategori_id === '1' ? 'kopek-ilanlari' : 'kedi-ilanlari',
        cins: values.cins,
        yas: values.yas,
        sehir: values.sehir,
        ilce: values.ilce,
        resimler: imageUrls,
        kullanici_id: user.uid,
        olusturma_tarihi: serverTimestamp(),
        durum: 'aktif',
        onayDurumu: 'onaylandi' // Admin değilse bile direkt onaylı olsun
      };

      await addDoc(collection(firestore, 'ilanlar'), yeniIlan);
      
      toast({ title: "Başarılı!", description: "İlanınız yayına alındı." });
      router.push(`/ilan/${slugify(values.baslik)}-${yeniIlanNo}`);
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Hata", description: "İlan eklenemedi: " + error.message });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Yükleniyor...</div>;
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
            
            {/* Fotoğraf Alanı - Çoklu Yükleme */}
            <div className="space-y-4">
              <FormLabel>Fotoğraflar (En fazla 5 adet)</FormLabel>
              
              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                  {photoPreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square">
                      <Image 
                        src={preview} 
                        alt={`Fotoğraf ${index + 1}`} 
                        fill 
                        className="object-cover rounded-md border"
                      />
                      <Button 
                        size="icon" 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={() => removePhoto(index)}
                        type="button"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              {photoPreviews.length < 5 && (
                <div className="flex flex-col items-center justify-center border-2 border-dashed p-6 rounded-lg">
                  <label className="cursor-pointer text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-muted-foreground">
                      {isResizing ? 'Fotoğraflar işleniyor...' : 'Fotoğraf Seç'}
                    </span>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileChange} 
                      accept="image/*"
                      multiple
                      disabled={isResizing || isSubmitting}
                    />
                    {isResizing && <Loader2 className="mx-auto mt-2 h-4 w-4 animate-spin" />}
                  </label>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="baslik" render={({ field }) => (
                <FormItem><FormLabel>İlan Başlığı</FormLabel><Input placeholder="Örn: Çok oyuncu yavru kedi" {...field} /></FormItem>
              )} />

              <FormField control={form.control} name="kategori_id" render={({ field }) => (
                <FormItem><FormLabel>Kategori</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    setSelectedKategori(value);
                    form.setValue('cins', ''); // Cins seçimini sıfırla
                  }} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Tür Seçin" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="1">Köpek</SelectItem>
                      <SelectItem value="2">Kedi</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cins Seçimi - Dinamik */}
              <FormField control={form.control} name="cins" render={({ field }) => (
                <FormItem><FormLabel>Cins</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedKategori}>
                    <FormControl><SelectTrigger><SelectValue placeholder={selectedKategori ? "Cins Seçin" : "Önce Kategori Seçin"} /></SelectTrigger></FormControl>
                    <SelectContent>
                      {cinsler.map((cins) => (
                        <SelectItem key={cins.id} value={cins.cinsAdi}>{cins.cinsAdi}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              
              <FormField control={form.control} name="yas" render={({ field }) => (
                <FormItem><FormLabel>Yaşı</FormLabel><Input placeholder="Örn: 3 Aylık" {...field} /></FormItem>
              )} />
              
              {/* Şehir Seçimi */}
              <FormField control={form.control} name="sehir" render={({ field }) => (
                <FormItem><FormLabel>Şehir</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue('ilce', ''); // İlçeyi sıfırla
                  }} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Şehir Seçin" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {cityNames.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            {/* İlçe Seçimi - Şehre göre dinamik */}
            <div className="grid grid-cols-1 gap-4">
              <FormField control={form.control} name="ilce" render={({ field }) => (
                <FormItem><FormLabel>İlçe</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedCity}>
                    <FormControl><SelectTrigger><SelectValue placeholder={selectedCity ? "İlçe Seçin" : "Önce Şehir Seçin"} /></SelectTrigger></FormControl>
                    <SelectContent>
                      {selectedCity && citiesData[selectedCity]?.map((district) => (
                        <SelectItem key={district} value={district}>{district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="aciklama" render={({ field }) => (
              <FormItem><FormLabel>Açıklama</FormLabel><Textarea placeholder="Dostunuzu anlatın..." {...field} /></FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="ilan_tipi" render={({ field }) => (
                <FormItem><FormLabel>İlan Tipi</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger></FormControl>
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

            <Button type="submit" className="w-full" disabled={isSubmitting || isResizing}>
              {(isSubmitting || isResizing) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              İlanı Yayınla
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}