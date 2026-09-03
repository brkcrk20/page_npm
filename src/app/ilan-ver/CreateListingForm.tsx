'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Upload, X } from 'lucide-react';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { LISTING_PHOTO_BUCKET } from '@/lib/supabase/storage';
import { prepareImages, formatBytes } from '@/lib/image-pipeline';
import { prepareVideo } from '@/lib/video-pipeline';
import { VideoUploader, type SelectedVideo } from '@/components/listings/VideoUploader';
import { LISTING_VIDEO_BUCKET } from '@/lib/supabase/storage';

const MAX_PHOTOS = 12;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const schema = z
  .object({
    kind: z.enum(['satilik', 'sahiplendirme']),
    categoryId: z.string().min(1, 'Kategori seçin.'),
    breedId: z.string().min(1, 'Cins seçin.'),
    title: z.string().trim().min(5, 'Başlık en az 5 karakter olmalı.').max(120, 'Başlık en fazla 120 karakter olabilir.'),
    description: z
      .string()
      .trim()
      .min(20, 'Açıklama en az 20 karakter olmalı.')
      .max(5000, 'Açıklama en fazla 5000 karakter olabilir.'),
    price: z.string().optional(),
    isNegotiable: z.boolean().default(false),
    ageMonths: z.string().optional(),
    gender: z.enum(['erkek', 'disi', 'belirtilmemis']).default('belirtilmemis'),
    cityId: z.string().min(1, 'İl seçin.'),
    districtId: z.string().optional(),
    contactPhone: z.string().optional(),
    isVaccinated: z.boolean().default(false),
    isDewormedInternal: z.boolean().default(false),
    isDewormedExternal: z.boolean().default(false),
    hasPedigree: z.boolean().default(false),
    hasHealthReport: z.boolean().default(false),
    acceptsCreditCard: z.boolean().default(false),
    shipsIntercity: z.boolean().default(false),
  })
  // Veritabanındaki listings_price_matches_kind kısıtının aynısı. Aynı kuralı
  // burada da tutuyoruz ki kullanıcı sunucudan dönen ham kısıt hatası yerine
  // alanın altında anlaşılır bir mesaj görsün.
  .refine((v) => v.kind !== 'satilik' || (v.price && Number(v.price) > 0), {
    message: 'Satılık ilanlarda fiyat zorunludur.',
    path: ['price'],
  });

type FormValues = z.infer<typeof schema>;

type Option = { id: number; name: string; slug: string };

export function CreateListingForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isUserLoading } = useSupabaseAuth();

  const [categories, setCategories] = useState<Option[]>([]);
  const [breeds, setBreeds] = useState<(Option & { category_id: number })[]>([]);
  const [cities, setCities] = useState<Option[]>([]);
  const [districts, setDistricts] = useState<Option[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [videos, setVideos] = useState<SelectedVideo[]>([]);
  const [videoProgress, setVideoProgress] = useState<{ stage: string; ratio: number } | null>(null);
  // Video kuralları app_settings'ten geliyor; ücretlendirme açıldığında kota
  // buradan kısılacak ve kod değişikliği gerekmeyecek.
  const [videoConfig, setVideoConfig] = useState({
    enabled: true,
    maxVideos: 5,
    maxDurationSeconds: 180,
    maxSizeMb: 120,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      kind: 'satilik',
      categoryId: '',
      breedId: '',
      title: '',
      description: '',
      price: '',
      isNegotiable: false,
      ageMonths: '',
      gender: 'belirtilmemis',
      cityId: '',
      districtId: '',
      contactPhone: '',
      isVaccinated: false,
      isDewormedInternal: false,
      isDewormedExternal: false,
      hasPedigree: false,
      hasHealthReport: false,
      acceptsCreditCard: false,
      shipsIntercity: false,
    },
  });

  const kind = form.watch('kind');
  const categoryId = form.watch('categoryId');
  const cityId = form.watch('cityId');

  // Giriş yapmamış kullanıcıyı giriş sayfasına gönder.
  useEffect(() => {
    if (!isUserLoading && !user) router.replace('/login');
  }, [isUserLoading, user, router]);

  // Katalog verisi. Kategori ve cins listeleri artık koda gömülü değil,
  // veritabanından geliyor — admin panelinden cins eklendiğinde form
  // kendiliğinden güncelleniyor.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    (async () => {
      const [cats, brs, cits] = await Promise.all([
        supabase.from('categories').select('id, name, slug').eq('is_active', true).order('position'),
        supabase.from('breeds').select('id, name, slug, category_id').eq('is_active', true).order('position'),
        supabase.from('cities').select('id, name, slug').order('name'),
      ]);
      const settings = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'video')
        .maybeSingle();

      if (settings.data?.value) {
        const v = settings.data.value as Record<string, any>;
        setVideoConfig({
          enabled: v.enabled !== false,
          maxVideos: Number(v.max_videos_per_listing ?? 5),
          maxDurationSeconds: Number(v.max_duration_seconds ?? 180),
          maxSizeMb: Number(v.max_size_mb ?? 120),
        });
      }

      if (cats.data) setCategories(cats.data as Option[]);
      if (brs.data) setBreeds(brs.data as (Option & { category_id: number })[]);
      if (cits.data) setCities(cits.data as Option[]);
    })();
  }, []);

  // İlçeler yalnızca il seçilince yükleniyor: 973 ilçeyi baştan çekmek gereksiz.
  useEffect(() => {
    if (!cityId) {
      setDistricts([]);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    supabase
      .from('districts')
      .select('id, name, slug')
      .eq('city_id', Number(cityId))
      .order('name')
      .then(({ data }) => setDistricts((data as Option[]) ?? []));
    form.setValue('districtId', '');
  }, [cityId]);

  const filteredBreeds = useMemo(
    () => breeds.filter((b) => !categoryId || b.category_id === Number(categoryId)),
    [breeds, categoryId]
  );

  // Kategori değişince eski cins seçimi geçersiz kalır.
  useEffect(() => {
    form.setValue('breedId', '');
  }, [categoryId]);

  function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    const accepted: File[] = [];
    for (const file of files) {
      if (photos.length + accepted.length >= MAX_PHOTOS) {
        toast({ variant: 'destructive', title: 'Fotoğraf sınırı', description: `En fazla ${MAX_PHOTOS} fotoğraf ekleyebilirsiniz.` });
        break;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        toast({ variant: 'destructive', title: 'Dosya çok büyük', description: `${file.name} 5 MB sınırını aşıyor.` });
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length === 0) return;
    setPhotos((prev) => [...prev, ...accepted]);
    setPreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSubmit(values: FormValues) {
    if (!user) return;

    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    const uploadedPaths: string[] = [];

    try {
      // 1) İlan satırını önce oluştur.
      //    Fotoğrafları önce yükleyip sonra ilan eklemek, ilan eklemesi
      //    başarısız olduğunda kovada sahipsiz dosya bırakırdı.
      setProgress('İlan kaydediliyor...');

      const { data: listing, error: insertError } = await supabase
        .from('listings')
        .insert({
          owner_id: user.id,
          kind: values.kind,
          category_id: Number(values.categoryId),
          breed_id: Number(values.breedId),
          title: values.title.trim(),
          description: values.description.trim(),
          price: values.kind === 'satilik' ? Number(values.price) : null,
          is_negotiable: values.isNegotiable,
          age_months: values.ageMonths ? Number(values.ageMonths) : null,
          gender: values.gender,
          city_id: Number(values.cityId),
          district_id: values.districtId ? Number(values.districtId) : null,
          contact_phone: values.contactPhone?.trim() || null,
          is_vaccinated: values.isVaccinated,
          is_dewormed_internal: values.isDewormedInternal,
          is_dewormed_external: values.isDewormedExternal,
          has_pedigree: values.hasPedigree,
          has_health_report: values.hasHealthReport,
          accepts_credit_card: values.acceptsCreditCard,
          ships_intercity: values.shipsIntercity,
          // slug, durum ve yayın tarihi sunucudaki trigger tarafından belirlenir
          slug: 'placeholder',
        })
        .select('id, slug, status')
        .single();

      if (insertError) throw new Error(insertError.message);

      // 2) Fotoğrafları hazırla: küçült, WebP'ye çevir, SEO uyumlu ad ver.
      //    Bu adım gönderim anında yapılıyor çünkü dosya adı ilan başlığından
      //    türetiliyor ve başlık seçim anından sonra değişmiş olabilir.
      let prepared: Awaited<ReturnType<typeof prepareImages>> = [];

      if (photos.length > 0) {
        setProgress('Fotoğraflar hazırlanıyor...');
        const cityName = cities.find((c) => String(c.id) === values.cityId)?.name;
        const districtName = districts.find((d) => String(d.id) === values.districtId)?.name;
        const breedName = filteredBreeds.find((b) => String(b.id) === values.breedId)?.name;
        const categoryName = categories.find((c) => String(c.id) === values.categoryId)?.name;

        prepared = await prepareImages(photos, {
          title: values.title,
          context: [breedName, categoryName?.replace(/ İlanları$/, '') , 'ilanı']
            .filter(Boolean)
            .join(' '),
          city: cityName,
          district: districtName,
        });

        const before = prepared.reduce((sum, p) => sum + p.originalBytes, 0);
        const after = prepared.reduce((sum, p) => sum + p.file.size, 0);
        console.info(
          `[görsel] ${prepared.length} fotoğraf: ${formatBytes(before)} -> ${formatBytes(after)}`
        );
      }

      // 3) Yükle. Yol düzeni: <kullanici_id>/<ilan>-<seo-adi>
      //    İlk parçanın kullanıcı kimliği olması Storage RLS'inin şartı.
      for (let i = 0; i < prepared.length; i++) {
        setProgress(`Fotoğraf yükleniyor (${i + 1}/${prepared.length})...`);
        const item = prepared[i];
        const path = `${user.id}/${listing.id}-${item.file.name}`;

        const { error: uploadError } = await supabase.storage
          .from(LISTING_PHOTO_BUCKET)
          .upload(path, item.file, { contentType: item.file.type, upsert: false });

        if (uploadError) throw new Error(`Fotoğraf yüklenemedi: ${uploadError.message}`);
        uploadedPaths.push(path);
      }

      // 4) Videolar: sıkıştır ve yükle.
      if (videos.length > 0) {
        const cityName = cities.find((c) => String(c.id) === values.cityId)?.name;
        const breedName = filteredBreeds.find((b) => String(b.id) === values.breedId)?.name;

        for (let i = 0; i < videos.length; i++) {
          setProgress(`Video hazırlanıyor (${i + 1}/${videos.length})`);

          const preparedVideo = await prepareVideo(
            videos[i].file,
            { title: values.title, context: breedName, city: cityName },
            i,
            (stage, ratio) => setVideoProgress({ stage: `${stage} (${i + 1}/${videos.length})`, ratio })
          );

          setVideoProgress(null);
          setProgress(`Video yükleniyor (${i + 1}/${videos.length})`);

          const videoPath = `${user.id}/${listing.id}-${preparedVideo.file.name}`;
          const { error: videoUploadError } = await supabase.storage
            .from(LISTING_VIDEO_BUCKET)
            .upload(videoPath, preparedVideo.file, {
              contentType: preparedVideo.file.type,
              upsert: false,
            });

          if (videoUploadError) {
            // Video ilanın tamamını düşürmemeli: fotoğraflar ve ilan zaten
            // kaydedildi, kullanıcıya bilgi verip devam ediyoruz.
            console.error('Video yüklenemedi:', videoUploadError.message);
            toast({
              variant: 'destructive',
              title: 'Video yüklenemedi',
              description: `${i + 1}. video eklenemedi, ilanınız videosuz yayınlandı.`,
            });
            continue;
          }

          const { error: videoRowError } = await supabase.from('listing_videos').insert({
            listing_id: listing.id,
            provider: 'supabase',
            storage_path: videoPath,
            status: 'hazir',
            duration_seconds: preparedVideo.meta.durationSeconds,
            size_bytes: preparedVideo.file.size,
            width: preparedVideo.meta.width,
            height: preparedVideo.meta.height,
            position: i,
            title: `${values.title} — video ${i + 1}`,
          });
          if (videoRowError) console.error('Video kaydedilemedi:', videoRowError.message);
        }
      }

      if (uploadedPaths.length > 0) {
        setProgress('Fotoğraflar ilana bağlanıyor...');
        const { error: photoError } = await supabase.from('listing_photos').insert(
          uploadedPaths.map((storage_path, position) => ({
            listing_id: listing.id,
            storage_path,
            position,
          }))
        );
        if (photoError) throw new Error(`Fotoğraflar kaydedilemedi: ${photoError.message}`);
      }

      toast({
        title: 'İlanınız oluşturuldu',
        description:
          listing.status === 'yayinda'
            ? 'İlanınız yayına alındı.'
            : 'İlanınız onay bekliyor, kısa sürede yayınlanacak.',
      });

      router.push(`/${listing.slug}-${listing.id}`);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'İlan oluşturulamadı',
        description: error?.message ?? 'Beklenmeyen bir hata oluştu.',
      });
    } finally {
      setIsSubmitting(false);
      setProgress(null);
      setVideoProgress(null);
    }
  }

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <Card className="mx-auto my-6 max-w-3xl">
      <CardHeader>
        <CardTitle>Yeni İlan Ver</CardTitle>
        <CardDescription>
          Sahiplendirme ilanları ücretsizdir. Bilgileri eksiksiz doldurmanız ilanınızın daha
          hızlı ilgi görmesini sağlar.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <FormField
              control={form.control}
              name="kind"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İlan Türü</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="satilik">Satılık</SelectItem>
                      <SelectItem value="sahiplendirme">Ücretsiz Sahiplendirme</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField control={form.control} name="categoryId" label="Kategori" options={categories} placeholder="Kategori seçin" searchPlaceholder="Kategori ara..." />
              <SelectField
                control={form.control}
                name="breedId"
                label="Cins"
                options={filteredBreeds}
                searchPlaceholder="Cins ara..."
                placeholder={categoryId ? 'Cins seçin' : 'Önce kategori seçin'}
                disabled={!categoryId}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İlan Başlığı</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: Sevimli Toy Poodle Yavrularımız" {...field} />
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
                    <Textarea rows={6} placeholder="Yaşı, karakteri, sağlık durumu ve teslim koşulları hakkında bilgi verin." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {kind === 'satilik' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fiyat (TL)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} placeholder="25000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <CheckboxField control={form.control} name="isNegotiable" label="Pazarlık payı var" />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="ageMonths"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yaş (ay)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} max={360} placeholder="3" {...field} />
                    </FormControl>
                    <FormDescription>2 aylık için 2, 1 yaşında için 12 yazın.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cinsiyet</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="belirtilmemis">Belirtilmemiş</SelectItem>
                        <SelectItem value="erkek">Erkek</SelectItem>
                        <SelectItem value="disi">Dişi</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField control={form.control} name="cityId" label="İl" options={cities} placeholder="İl seçin" searchPlaceholder="İl ara..." />
              <SelectField
                control={form.control}
                name="districtId"
                label="İlçe"
                options={districts}
                searchPlaceholder="İlçe ara..."
                placeholder={cityId ? 'İlçe seçin' : 'Önce il seçin'}
                disabled={!cityId}
              />
            </div>

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İletişim Telefonu</FormLabel>
                  <FormControl>
                    <Input placeholder="5551112233" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <fieldset className="space-y-3 rounded-lg border p-4">
              <legend className="px-1 text-sm font-semibold">Sağlık ve Teslimat</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <CheckboxField control={form.control} name="isVaccinated" label="Aşıları tam" />
                <CheckboxField control={form.control} name="isDewormedInternal" label="İç parazit yapıldı" />
                <CheckboxField control={form.control} name="isDewormedExternal" label="Dış parazit yapıldı" />
                <CheckboxField control={form.control} name="hasPedigree" label="Pedigrili" />
                <CheckboxField control={form.control} name="hasHealthReport" label="Sağlık raporu var" />
                <CheckboxField control={form.control} name="acceptsCreditCard" label="Kredi kartı kabul ediliyor" />
                <CheckboxField control={form.control} name="shipsIntercity" label="Şehir dışına gönderim" />
              </div>
            </fieldset>

            <div className="space-y-3">
              <FormLabel>Fotoğraflar</FormLabel>
              <div className="flex flex-wrap gap-3">
                {previews.map((src, i) => (
                  <div key={src} className="relative h-24 w-24 overflow-hidden rounded-md border">
                    <Image src={src} alt={`Fotoğraf ${i + 1}`} fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                      aria-label={`${i + 1}. fotoğrafı kaldır`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-0 w-full bg-black/60 text-center text-[10px] text-white">
                        Kapak
                      </span>
                    )}
                  </div>
                ))}

                {photos.length < MAX_PHOTOS && (
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs text-muted-foreground hover:border-primary hover:text-primary">
                    <Upload className="h-5 w-5" />
                    Ekle
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handlePhotoChange} />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                En fazla {MAX_PHOTOS} fotoğraf. Yüklenirken otomatik küçültülüp WebP'ye çevrilir; ilk fotoğraf kapak olur.
              </p>
            </div>

            {videoConfig.enabled && (
              <div className="space-y-3">
                <FormLabel>Videolar</FormLabel>
                <VideoUploader
                  videos={videos}
                  onChange={setVideos}
                  maxVideos={videoConfig.maxVideos}
                  maxDurationSeconds={videoConfig.maxDurationSeconds}
                  maxSizeMb={videoConfig.maxSizeMb}
                  progress={videoProgress}
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {progress ?? 'Kaydediliyor...'}
                </>
              ) : (
                'İlanı Yayınla'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function SelectField({
  control,
  name,
  label,
  options,
  placeholder,
  searchPlaceholder = 'Ara...',
  disabled,
}: {
  control: any;
  name: keyof FormValues;
  label: string;
  options: Option[];
  placeholder: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {/* Aramali liste: 102 cins, 81 il ve 973 ilce arasindan kaydirarak
                secim yapmak kullanilabilir degildi. */}
            <SearchableSelect
              value={(field.value as string) ?? ''}
              onChange={field.onChange}
              placeholder={placeholder}
              searchPlaceholder={searchPlaceholder}
              disabled={disabled}
              ariaLabel={label}
              className="w-full"
              options={options.map((option) => ({
                value: String(option.id),
                label: option.name,
              }))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function CheckboxField({
  control,
  name,
  label,
}: {
  control: any;
  name: keyof FormValues;
  label: string;
}) {
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center gap-2 space-y-0">
          <FormControl>
            <Checkbox checked={field.value as boolean} onCheckedChange={field.onChange} />
          </FormControl>
          <FormLabel className="font-normal">{label}</FormLabel>
        </FormItem>
      )}
    />
  );
}
