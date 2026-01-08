'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Wand2, Loader2, Upload, X } from 'lucide-react';

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

const formSchema = z.object({
  name: z.string().min(2, { message: 'İsim en az 2 karakter olmalıdır.' }),
  animalType: z.enum(['Dog', 'Cat', 'Bird', 'Other']),
  breed: z.string().min(2, { message: 'Cins bilgisi gereklidir.' }),
  age: z.string().min(1, { message: 'Yaş bilgisi gereklidir.' }),
  description: z.string().min(20, { message: 'Açıklama en az 20 karakter olmalıdır.' }),
  photo: z.any(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateListingForm() {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [breedSuggestions, setBreedSuggestions] = useState<string[]>([]);
  const [isSuggestingBreeds, setIsSuggestingBreeds] = useState(false);
  const [isImprovingDescription, setIsImprovingDescription] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      breed: '',
      age: '',
      description: '',
    },
  });

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
      // Optionally, show a toast notification
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

  function onSubmit(values: FormValues) {
    console.log({ ...values, photo: photoPreview ? 'has_photo' : 'no_photo' });
    // TODO: Implement listing creation logic
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">İlan Detayları</CardTitle>
        <CardDescription>Evcil dostunuz hakkında bilgileri doldurun.</CardDescription>
      </CardHeader>
      <CardContent>
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
                        <FormLabel>Yaş</FormLabel>
                        <FormControl>
                          <Input placeholder="Örn: 2 yıl, 6 ay" {...field} />
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
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="lg">İlanı Oluştur</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
