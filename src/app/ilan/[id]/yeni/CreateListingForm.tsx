'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Loader2, Upload, X } from 'lucide-react';
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
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import type { PetListing } from '@/lib/types';
// YENİ EKLENEN DATA DOSYASI BAĞLANTISI
import { citiesData, cityNames } from '@/lib/turkiye-data';

const formSchema = z.object({
  name: z.string().min(2, { message: 'İsim en az 2 karakter olmalıdır.' }),
  animalType: z.enum(['Dog', 'Cat', 'Bird', 'Other']),
  breed: z.string().min(2, { message: 'Cins bilgisi gereklidir.' }),
  age: z.string().min(1, { message: 'Yaş gereklidir.' }),
  description: z.string().min(20, { message: 'Açıklama en az 20 karakter olmalıdır.' }),
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
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', breed: '', age: '', description: '', location: '' },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new (window as any).Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;
          const scaleSize = MAX_WIDTH / img.width;
          let newWidth = img.width;
          let newHeight = img.height;
          if (img.width > MAX_WIDTH) { newWidth = MAX_WIDTH; newHeight = img.height * scaleSize; }
          canvas.width = newWidth; canvas.height = newHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
             ctx.drawImage(img, 0, 0, newWidth, newHeight);
             const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
             setPhotoPreview(compressedDataUrl);
             setIsCompressing(false);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !photoPreview) {
        toast({ title: "Hata", description: "Lütfen bir fotoğraf yükleyin.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
        const imageRef = ref(storage, `pet-listings/${user.uid}/${Date.now()}.jpg`);
        const uploadResult = await uploadString(imageRef, photoPreview, 'data_url');
        const imageUrl = await getDownloadURL(uploadResult.ref);

        const newListing: Omit<PetListing, 'id'> = {
            name: values.name,
            species: values.animalType,
            breed: values.breed,
            age: parseInt(values.age), 
            description: values.description,
            listingType: values.listingType,
            price: values.listingType === 'Sale' ? parseInt(values.price!) : 0,
            location: values.location, // Veritabanına "İl / İlçe" olarak kaydeder
            imageUrl: imageUrl,
            userId: user.uid,
            isFeatured: userProfile?.userStatus === 'premium', 
        };

        const docRef = await addDoc(collection(firestore, `users/${user.uid}/petListings`), newListing);
        
        toast({ title: "Başarılı", description: "İlanınız başarıyla yayınlandı!" });
        router.push(`/ilan/${docRef.id}`); 

    } catch (error) {
        console.error(error);
        toast({ title: "Hata", description: "İlan yüklenirken bir sorun oluştu.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-none shadow-xl rounded-2xl overflow-hidden">
      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* SOL TARAFTAKİ FOTOĞRAF YÜKLEME ALANI */}
              <div className="md:col-span-1">
                <div className="aspect-square border-2 border-dashed rounded-2xl flex items-center justify-center relative bg-gray-50 group hover:bg-gray-100 transition-colors">
                  {isCompressing ? (
                     <div className="flex flex-col items-center text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin mb-2" /><span className="text-xs">Optimize ediliyor...</span></div>
                  ) : photoPreview ? (
                    <>
                      <Image src={photoPreview} alt="Preview" fill className="rounded-2xl object-cover" />
                      <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 rounded-full" onClick={() => setPhotoPreview(null)}><X className="h-4 w-4" /></Button>
                    </>
                  ) : (
                    <label className="cursor-pointer text-center p-6 w-full h-full flex flex-col items-center justify-center">
                      <Upload className="h-12 w-12 text-gray-400 group-hover:text-[#f05a28] transition-colors" />
                      <p className="mt-2 text-sm font-bold text-gray-500">Fotoğraf Seç</p>
                      <Input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
              </div>

              {/* SAĞ TARAFTAKİ FORM ALANLARI */}
              <div className="md:col-span-2 space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel className="font-bold">Dostunuzun Adı</FormLabel><FormControl><Input placeholder="Örn: Pamuk" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="animalType" render={({ field }) => (<FormItem><FormLabel className="font-bold">Tür</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Tür seç" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Dog">Köpek</SelectItem><SelectItem value="Cat">Kedi</SelectItem><SelectItem value="Bird">Kuş</SelectItem><SelectItem value="Other">Diğer</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="breed" render={({ field }) => (<FormItem><FormLabel className="font-bold">Cins</FormLabel><FormControl><Input placeholder="Örn: Scottish Fold" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
                </div>
                
                <FormField control={form.control} name="age" render={({ field }) => (<FormItem><FormLabel className="font-bold">Yaş</FormLabel><FormControl><Input type="number" {...field} className="rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel className="font-bold">Açıklama</FormLabel><FormControl><Textarea placeholder="Özelliklerini anlatın..." {...field} className="rounded-xl min-h-[120px]" /></FormControl><FormMessage /></FormItem>)} />
                
                {/* --- YENİ EKLENEN İL / İLÇE SEÇİMİ --- */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => {
                    // Mevcut değerden İl ve İlçeyi ayıkla
                    const [currentCity, currentDistrict] = field.value?.split(' / ') || ["", ""];

                    return (
                      <div className="grid grid-cols-2 gap-4">
                        <FormItem>
                          <FormLabel className="font-bold">İl</FormLabel>
                          <Select
                            value={currentCity}
                            onValueChange={(selectedCity) => {
                                // İl değişince ilçeyi sıfırla, sadece ili kaydet
                                field.onChange(selectedCity); 
                            }}
                          >
                            <FormControl>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="İl Seçiniz" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px]">
                              {cityNames.map((city) => (
                                <SelectItem key={city} value={city}>
                                  {city}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>

                        <FormItem>
                          <FormLabel className="font-bold">İlçe</FormLabel>
                          <Select
                            value={currentDistrict}
                            // İl seçilmediyse ilçe kutusunu kilitle
                            disabled={!currentCity || !citiesData[currentCity]}
                            onValueChange={(selectedDistrict) => {
                                // İlçe seçilince "İl / İlçe" formatında kaydet
                                field.onChange(`${currentCity} / ${selectedDistrict}`);
                            }}
                          >
                            <FormControl>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="İlçe Seçiniz" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[300px]">
                              {currentCity && citiesData[currentCity]?.map((district) => (
                                <SelectItem key={district} value={district}>
                                  {district}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      </div>
                    );
                  }}
                />
                {/* --- İL/İLÇE BİTİŞ --- */}

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="listingType" render={({ field }) => (<FormItem><FormLabel className="font-bold">İlan Tipi</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger className="rounded-xl"><SelectValue placeholder="Seçiniz" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Adoption">Sahiplendirme</SelectItem><SelectItem value="Sale">Satılık</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="price" render={({ field }) => (<FormItem><FormLabel className="font-bold">Fiyat (TL)</FormLabel><FormControl><Input type="number" {...field} disabled={form.watch('listingType') !== 'Sale'} className="rounded-xl" /></FormControl><FormMessage /></FormItem>)} />
                </div>
              </div>
            </div>
            <Button type="submit" disabled={isSubmitting || isCompressing} className="w-full bg-[#f05a28] hover:bg-[#d44d21] text-white py-8 text-xl font-bold rounded-2xl shadow-lg transition-all hover:scale-[1.01]">
              {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "Hemen İlanı Yayınla"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}