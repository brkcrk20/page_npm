'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Loader2, Upload, X, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useUser, useFirestore, useStorage } from '@/firebase';
import { useUserProfile } from '@/firebase/firestore/use-user-profile';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { citiesData, cityNames } from '@/lib/turkiye-data';

// Form Doğrulama Şeması
const formSchema = z.object({
  name: z.string().min(2, { message: 'İsim en az 2 karakter olmalıdır.' }),
  animalType: z.enum(['Dog', 'Cat', 'Bird', 'Fish', 'Other']), // Fish eklendi
  breed: z.string().min(2, { message: 'Cins bilgisi gereklidir.' }),
  age: z.string().min(1, { message: 'Yaş gereklidir.' }),
  description: z.string().min(10, { message: 'Açıklama en az 10 karakter olmalıdır.' }),
  listingType: z.enum(['Adoption', 'Sale']),
  price: z.string().optional(),
  location: z.string().min(2, { message: 'Lütfen il ve ilçe seçiniz.' }),
});

export function CreateListingForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const { data: userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const storage = useStorage();
  
  // Resim State'leri
  const [photoFile, setPhotoFile] = useState<File | null>(null); // Gerçek dosya (Blob)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null); // Gösterim için URL
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', breed: '', age: '', description: '', location: '' },
  });

  // --- 1. RESİM SIKIŞTIRMA VE ÖNİZLEME ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);

    try {
      // Resmi Canvas ile Sıkıştır
      const compressedFile = await compressImage(file);
      setPhotoFile(compressedFile);
      setPhotoPreview(URL.createObjectURL(compressedFile)); // Önizleme oluştur
    } catch (error) {
      console.error("Sıkıştırma hatası:", error);
      toast({ title: "Hata", description: "Resim işlenirken hata oluştu.", variant: "destructive" });
    } finally {
      setIsCompressing(false);
    }
  };

  // Canvas tabanlı Resim Sıkıştırma Fonksiyonu
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new (window as any).Image(); // TypeScript hatası olmaması için
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200; // Maksimum genişlik
          const scaleSize = MAX_WIDTH / img.width;
          
          let newWidth = img.width;
          let newHeight = img.height;

          // Sadece büyükse küçült
          if (img.width > MAX_WIDTH) {
            newWidth = MAX_WIDTH;
            newHeight = img.height * scaleSize;
          }

          canvas.width = newWidth;
          canvas.height = newHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, newWidth, newHeight);
            canvas.toBlob((blob) => {
              if (blob) {
                // Blob'u File objesine çevir
                const newFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                });
                resolve(newFile);
              } else {
                reject(new Error("Canvas blob dönüşümü başarısız."));
              }
            }, 'image/jpeg', 0.8); // 0.8 kalite (jpeg)
          } else {
             reject(new Error("Canvas context oluşturulamadı."));
          }
        };
        img.onerror = (err: any) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  // --- 2. FORM GÖNDERME VE YÜKLEME ---
  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
        toast({ title: "Hata", description: "Oturum açmanız gerekiyor.", variant: "destructive" });
        return;
    }
    if (!photoFile) {
        toast({ title: "Uyarı", description: "Lütfen bir fotoğraf seçin.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
        // A. Resmi Firebase Storage'a Yükle
        const storageRef = ref(storage, `pet-listings/${user.uid}/${Date.now()}_${photoFile.name}`);
        const uploadResult = await uploadBytes(storageRef, photoFile);
        const imageUrl = await getDownloadURL(uploadResult.ref);

        // İL / İLÇE Ayrıştırma
        const [city, district] = values.location.split(' / ');

        // B. Verileri Firestore'a Kaydet
        const newListing = {
            name: values.name,
            species: values.animalType, // Seçilen tür (Dog, Cat vb.)
            type: values.animalType,    // Listing sayfasında uyumluluk için
            breed: values.breed,
            age: values.age, 
            description: values.description,
            listingType: values.listingType,
            price: values.listingType === 'Sale' ? parseInt(values.price || '0') : 0,
            location: values.location, // Tam string "İstanbul / Kadıköy"
            city: city?.trim(),        // Filtreleme için ayrı
            district: district?.trim(),// Filtreleme için ayrı
            imageUrl: imageUrl,        // Sadece linki kaydediyoruz
            userId: user.uid,
            isFeatured: userProfile?.userStatus === 'premium',
            createdAt: serverTimestamp(),
            status: 'active'
        };

        const docRef = await addDoc(collection(firestore, `petListings`), newListing);
        
        toast({ 
            title: "Tebrikler! 🎉", 
            description: "İlanınız başarıyla oluşturuldu.",
            className: "bg-green-500 text-white border-none"
        });

        // Listings (İlan Detay) sayfasına yönlendir
        router.push(`/ilanlar/${docRef.id}`); 

    } catch (error) {
        console.error("Yükleme hatası:", error);
        toast({ title: "Hata", description: "İlan yüklenirken bir sorun oluştu.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white">
      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* --- FOTOĞRAF ALANI --- */}
              <div className="md:col-span-1">
                <div className={`aspect-square border-2 border-dashed rounded-2xl flex items-center justify-center relative transition-all ${photoPreview ? 'border-[#f05a28]' : 'border-gray-300 hover:bg-orange-50'}`}>
                  
                  {isCompressing ? (
                      <div className="flex flex-col items-center text-muted-foreground animate-pulse">
                        <Loader2 className="h-8 w-8 animate-spin mb-2 text-[#f05a28]" />
                        <span className="text-xs font-medium">Fotoğraf hazırlanıyor...</span>
                      </div>
                  ) : photoPreview ? (
                    <>
                      <Image src={photoPreview} alt="Preview" fill className="rounded-2xl object-cover p-1" />
                      <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button type="button" variant="destructive" size="icon" className="rounded-full h-10 w-10" onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}>
                             <X className="h-5 w-5" />
                          </Button>
                      </div>
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center shadow-sm">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Hazır
                      </div>
                    </>
                  ) : (
                    <label className="cursor-pointer text-center p-6 w-full h-full flex flex-col items-center justify-center">
                      <div className="bg-orange-100 p-4 rounded-full mb-3">
                         <Upload className="h-8 w-8 text-[#f05a28]" />
                      </div>
                      <p className="text-sm font-bold text-gray-700">Fotoğraf Yükle</p>
                      <p className="text-xs text-gray-400 mt-1">Sistemi yormamak için otomatik küçültülür.</p>
                      <Input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              </div>

              {/* --- FORM ALANLARI --- */}
              <div className="md:col-span-2 space-y-5">
                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-bold text-gray-700">Dostunuzun Adı</FormLabel>
                        <FormControl><Input placeholder="Örn: Pamuk" {...field} className="h-12 rounded-xl bg-gray-50 border-gray-200 focus:bg-white transition-colors" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="animalType" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-bold text-gray-700">Tür</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="h-12 rounded-xl bg-gray-50 border-gray-200"><SelectValue placeholder="Seçiniz" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Dog">Köpek</SelectItem>
                                <SelectItem value="Cat">Kedi</SelectItem>
                                <SelectItem value="Bird">Kuş</SelectItem>
                                <SelectItem value="Fish">Akvaryum</SelectItem>
                                <SelectItem value="Other">Diğer</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="breed" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-bold text-gray-700">Cins</FormLabel>
                        <FormControl><Input placeholder="Örn: Golden" {...field} className="h-12 rounded-xl bg-gray-50 border-gray-200" /></FormControl>
                        <FormMessage />
                    </FormItem>
                  )} />
                </div>
                
                {/* --- İL / İLÇE SEÇİMİ --- */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => {
                    const [currentCity, currentDistrict] = field.value?.split(' / ') || ["", ""];
                    return (
                      <div className="grid grid-cols-2 gap-4">
                        <FormItem>
                          <FormLabel className="font-bold text-gray-700">İl</FormLabel>
                          <Select
                            value={currentCity}
                            onValueChange={(selectedCity) => field.onChange(selectedCity)}
                          >
                            <FormControl><SelectTrigger className="h-12 rounded-xl bg-gray-50 border-gray-200"><SelectValue placeholder="İl Seçiniz" /></SelectTrigger></FormControl>
                            <SelectContent className="max-h-[300px]">
                              {cityNames.map((city) => (<SelectItem key={city} value={city}>{city}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </FormItem>

                        <FormItem>
                          <FormLabel className="font-bold text-gray-700">İlçe</FormLabel>
                          <Select
                            value={currentDistrict}
                            disabled={!currentCity || !citiesData[currentCity]}
                            onValueChange={(selectedDistrict) => field.onChange(`${currentCity} / ${selectedDistrict}`)}
                          >
                            <FormControl><SelectTrigger className="h-12 rounded-xl bg-gray-50 border-gray-200"><SelectValue placeholder="İlçe Seçiniz" /></SelectTrigger></FormControl>
                            <SelectContent className="max-h-[300px]">
                              {currentCity && citiesData[currentCity]?.map((district) => (<SelectItem key={district} value={district}>{district}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      </div>
                    );
                  }}
                />

                <div className="grid grid-cols-2 gap-4">
                   <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-bold text-gray-700">Yaş</FormLabel>
                        <FormControl><Input type="text" placeholder="Örn: 2" {...field} className="h-12 rounded-xl bg-gray-50 border-gray-200" /></FormControl>
                        <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="listingType" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-bold text-gray-700">İlan Tipi</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="h-12 rounded-xl bg-gray-50 border-gray-200"><SelectValue placeholder="Seçiniz" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Adoption">Sahiplendirme</SelectItem>
                                <SelectItem value="Sale">Satılık</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                  )} />
                </div>
                
                {form.watch('listingType') === 'Sale' && (
                    <FormField control={form.control} name="price" render={({ field }) => (
                        <FormItem className="animate-in fade-in slide-in-from-top-2">
                            <FormLabel className="font-bold text-gray-700">Fiyat (TL)</FormLabel>
                            <FormControl><Input type="number" placeholder="0.00" {...field} className="h-12 rounded-xl bg-gray-50 border-gray-200 font-bold text-lg" /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                )}

                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-bold text-gray-700">Açıklama</FormLabel>
                        <FormControl><Textarea placeholder="Dostunuzun özelliklerini, aşı durumunu ve karakterini anlatın..." {...field} className="rounded-xl min-h-[120px] bg-gray-50 border-gray-200" /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

              </div>
            </div>

            <Button type="submit" disabled={isSubmitting || isCompressing || !photoFile} className="w-full bg-[#f05a28] hover:bg-[#d44d21] text-white h-14 text-xl font-bold rounded-2xl shadow-lg transition-all hover:scale-[1.01] active:scale-95">
              {isSubmitting ? (
                  <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin h-6 w-6" />
                      <span>İlan Yayınlanıyor...</span>
                  </div>
              ) : (
                  "Hemen İlanı Yayınla"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
