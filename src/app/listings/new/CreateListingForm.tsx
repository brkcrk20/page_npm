
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
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import type { PetListing } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  name: z.string().min(2, { message: 'İsim en az 2 karakter olmalıdır.' }),
  animalType: z.enum(['Dog', 'Cat', 'Bird', 'Other'], { required_error: "Hayvan türü seçmelisiniz."}),
  breed: z.string().min(2, { message: 'Cins bilgisi gereklidir.' }),
  age: z.string().min(1, { message: 'Yaş bilgisi gereklidir.' }),
  description: z.string().min(20, { message: 'Açıklama en az 20 karakter olmalıdır.' }),
  listingType: z.enum(['Adoption', 'Sale'], { required_error: "İlan tipi seçmelisiniz."}),
  price: z.string().optional(),
  location: z.string().min(2, { message: "Konum bilgisi gereklidir." }),
  photo: z.any(),
}).refine(data => {
    if (data.listingType === 'Sale') {
        return data.price !== undefined && /^\d+$/.test(data.price) && parseInt(data.price) > 0;
    }
    return true;
}, {
    message: 'Satış ilanları için geçerli bir fiyat girmelisiniz.',
    path: ['price'],
});

type FormValues = z.infer<typeof formSchema>;

export function CreateListingForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const storage = useStorage();
  
  const [listingCount, setListingCount] = useState<number | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [breedSuggestions, setBreedSuggestions] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggestingBreeds, setIsSuggestingBreeds] = useState(false);
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);

  useEffect(() => {
    if (user) {
        const listingsRef = collection(firestore, `users/${user.uid}/petListings`);
        getDocs(listingsRef).then(snapshot => {
            setListingCount(snapshot.size);
        });
    }
  }, [user, firestore]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      breed: '',
      age: '',
      description: '',
      location: userProfile?.location || '',
    },
  });

   useEffect(() => {
    if (userProfile?.location) {
      form.setValue('location', userProfile.location);
    }
  }, [userProfile, form]);

  const canPostListing = userProfile?.userStatus === 'premium' || (listingCount !== null && listingCount < 1);
  const isLoading = isUserLoading || isProfileLoading || listingCount === null;


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUri = event.target?.result as string;
        setPhotoPreview(dataUri);
        setBreedSuggestions([]); // Clear previous suggestions
      };
      reader.readAsDataURL(file);
    }
  };

  const onSuggestBreeds = async () => {
    if (!photoPreview) return;
    setIsSuggestingBreeds(true);
    try {
      const result = await handleSuggestBreeds({ photoDataUri: photoPreview });
      setBreedSuggestions(result.suggestedBreeds);
    } catch (error) {
      console.error('Error suggesting breeds:', error);
    } finally {
      setIsSuggestingBreeds(false);
    }
  };

  const onImproveDescription = async () => {
    const { name, animalType, breed, description } = form.getValues();
    if (!description || !name || !animalType || !breed) {
      form.trigger(['description', 'name', 'animalType', 'breed']);
      return;
    }

    setIsImprovingDescription(true);
    try {
      const result = await handleImproveDescription({
        description,
        animalType,
        breed,
        name,
      });
      form.setValue('description', result.improvedDescription, { shouldValidate: true });
    } catch (error) {
      console.error('Error improving description:', error);
    } finally {
      setIsImprovingDescription(false);
    }
  };

  async function onSubmit(values: FormValues) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Hata', description: 'İlan oluşturmak için giriş yapmalısınız.' });
        return;
    }
     if (!canPostListing) {
        toast({ variant: 'destructive', title: 'Limit Aşıldı', description: 'Standart üyeler yalnızca bir ilan yayınlayabilir.' });
        return;
    }
    if (!photoPreview) {
        form.setError('photo', { message: 'Lütfen bir fotoğraf yükleyin.' });
        return;
    }

    setIsSubmitting(true);
    try {
        // 1. Upload image to Storage
        const imageRef = ref(storage, `pet-listings/${user.uid}/${Date.now()}`);
        const uploadResult = await uploadString(imageRef, photoPreview, 'data_url');
        const imageUrl = await getDownloadURL(uploadResult.ref);

        // 2. Prepare data for Firestore
        const newListing: Omit<PetListing, 'id'> = {
            name: values.name,
            species: values.animalType,
            breed: values.breed,
            age: parseInt(values.age), // Assuming age is entered as a number of years
            description: values.description,
            listingType: values.listingType,
            price: values.listingType === 'Sale' ? parseInt(values.price!) : 0,
            location: values.location,
            imageUrl: imageUrl,
            userId: user.uid,
            isFeatured: userProfile?.userStatus === 'premium', // Feature premium user listings
        };

        // 3. Add document to Firestore
        const listingsRef = collection(firestore, `users/${user.uid}/petListings`);
        const docRef = await addDoc(listingsRef, newListing);
        
        toast({
            title: "İlanınız Oluşturuldu!",
            description: `${values.name} başarıyla listelendi.`,
        });

        router.push(`/listings/${docRef.id}`); // Redirect to new listing page

    } catch (error) {
        console.error("Error creating listing:", error);
        toast({
            variant: "destructive",
            title: "Bir hata oluştu",
            description: "İlan oluşturulurken bir sorunla karşılaşıldı. Lütfen tekrar deneyin.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">İlan Detayları</CardTitle>
        <CardDescription>Evcil dostunuz hakkında bilgileri doldurun.</CardDescription>
      </CardHeader>
      <CardContent>
         {!canPostListing && (
             <Alert variant="destructive" className="mb-6">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>İlan Verme Limitine Ulaştınız</AlertTitle>
                <AlertDescription>
                    Standart üyeler yalnızca bir ilan yayınlayabilir. Daha fazla ilan yayınlamak için hesabınızı Premium'a yükseltin.
                </AlertDescription>
            </Alert>
         )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1 space-y-4">
                <FormField
                  control={form.control}
                  name="photo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fotoğraf</FormLabel>
                      <FormControl>
                        <div className="w-full aspect-square border-2 border-dashed rounded-lg flex items-center justify-center relative">
                          {photoPreview ? (
                            <>
                              <Image src={photoPreview} alt="Pet preview" layout="fill" objectFit="cover" className="rounded-lg" />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                                onClick={() => {
                                  setPhotoPreview(null);
                                  field.onChange(null);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <label htmlFor="photo-upload" className="cursor-pointer text-center p-4">
                              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                              <p className="mt-2 text-sm text-muted-foreground">Fotoğraf yükle</p>
                              <Input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {photoPreview && (
                  <div className="space-y-2">
                    <Button type="button" onClick={onSuggestBreeds} disabled={isSuggestingBreeds} className="w-full">
                      {isSuggestingBreeds ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="mr-2 h-4 w-4" />
                      )}
                      AI ile Cins Önerisi Al
                    </Button>
                    {breedSuggestions.length > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Öneriler: {breedSuggestions.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>İsim</FormLabel>
                        <FormControl>
                          <Input placeholder="Örn: Max, Pamuk" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Yaş (Yıl)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Örn: 2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="animalType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Türü</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Bir tür seçin" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Dog">Köpek</SelectItem>
                            <SelectItem value="Cat">Kedi</SelectItem>
                            <SelectItem value="Bird">Kuş</SelectItem>
                            <SelectItem value="Other">Diğer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="breed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cinsi</FormLabel>
                        <FormControl>
                          <Input placeholder="Örn: Golden Retriever" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Konum</FormLabel>
                        <FormControl>
                          <Input placeholder="Örn: İstanbul, Kadıköy" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Açıklama</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Dostunuzun özelliklerini, alışkanlıklarını anlatın..." className="min-h-[150px]" {...field} />
                      </FormControl>
                      <FormMessage />
                      <FormDescription className="flex justify-between items-center pt-1">
                        <span>Açıklamanızı daha çekici hale getirin.</span>
                        <Button type="button" size="sm" variant="outline" onClick={onImproveDescription} disabled={isImprovingDescription}>
                          {isImprovingDescription ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                          AI ile İyileştir
                        </Button>
                      </FormDescription>
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="listingType"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>İlan Tipi</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="İlan tipi seçin" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Adoption">Sahiplendirme (Ücretsiz)</SelectItem>
                                <SelectItem value="Sale">Satış (Ücretli)</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fiyat (TL)</FormLabel>
                            <FormControl>
                            <Input 
                                type="number" 
                                placeholder="Sadece satış için" 
                                {...field} 
                                disabled={form.watch('listingType') !== 'Sale'}
                            />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={isSubmitting || !canPostListing || isLoading}>
                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                İlanı Oluştur
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
