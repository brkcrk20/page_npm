'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Phone, Upload, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

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
import { LISTING_PHOTO_BUCKET, listingPhotoUrl } from '@/lib/supabase/storage';
import { prepareImages, formatBytes } from '@/lib/image-pipeline';
import { formatTrPhone } from '@/lib/phone';
import { prepareVideo } from '@/lib/video-pipeline';
import { VideoUploader, type SelectedVideo } from '@/components/listings/VideoUploader';
import { LISTING_VIDEO_BUCKET } from '@/lib/supabase/storage';

const MAX_PHOTOS = 12;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

const schema = z
  .object({
    kind: z.enum(['satilik', 'sahiplendirme', 'kayip', 'bulundu']),
    categoryId: z.string().min(1, 'Kategori seçin.'),
    breedId: z.string().min(1, 'Cins seçin.'),
    title: z.string().trim().min(5, 'Başlık en az 5 karakter olmalı.').max(120, 'Başlık en fazla 120 karakter olabilir.'),
    description: z
      .string()
      .trim()
      .min(20, 'Açıklama en az 20 karakter olmalı.')
      .max(5000, 'Açıklama en fazla 5000 karakter olabilir.'),
    price: z.string().optional(),
    eventDate: z.string().optional(),
    isNegotiable: z.boolean().default(false),
    ageMonths: z.string().optional(),
    gender: z.enum(['erkek', 'disi', 'belirtilmemis']).default('belirtilmemis'),
    cityId: z.string().min(1, 'İl seçin.'),
    districtId: z.string().optional(),
    isVaccinated: z.boolean().default(false),
    isDewormedInternal: z.boolean().default(false),
    isDewormedExternal: z.boolean().default(false),
    hasPedigree: z.boolean().default(false),
    hasHealthReport: z.boolean().default(false),
    acceptsCreditCard: z.boolean().default(false),
    shipsIntercity: z.boolean().default(false),
    // Yalnızca pet malzemesi ilanlarında kullanılıyor; hayvan ilanında
    // gösterilmiyor ve gönderilmiyor.
    condition: z.enum(['sifir', 'az_kullanilmis', 'kullanilmis']).default('kullanilmis'),
  })
  // Veritabanındaki listings_price_matches_kind kısıtının aynısı. Aynı kuralı
  // burada da tutuyoruz ki kullanıcı sunucudan dönen ham kısıt hatası yerine
  // alanın altında anlaşılır bir mesaj görsün.
  // Kayıp ilanında tarih aramanın en belirleyici bilgisi: dün kaybolan
  // hayvanı aramakla üç ay önce kaybolanı aramak aynı şey değil.
  .refine((v) => !['kayip', 'bulundu'].includes(v.kind) || !!v.eventDate, {
    message: 'Tarihi girin.',
    path: ['eventDate'],
  })
  .refine((v) => !v.eventDate || v.eventDate <= new Date().toISOString().slice(0, 10), {
    message: 'Gelecek bir tarih seçilemez.',
    path: ['eventDate'],
  })
  .refine((v) => v.kind !== 'satilik' || (v.price && Number(v.price) > 0), {
    message: 'Satılık ilanlarda fiyat zorunludur.',
    path: ['price'],
  });

type FormValues = z.infer<typeof schema>;

type Option = { id: number; name: string; slug: string };

/**
 * Var olan bir ilanın fotoğrafı. Yeni seçilen dosyalardan ayrı tutuluyor:
 * biri depoda duruyor ve silinmesi kova işlemi gerektiriyor, diğeri henüz
 * yüklenmemiş bir File.
 */
type ExistingPhoto = { id: number; storage_path: string; position: number };

/**
 * Bölüme özel ön ayar.
 *
 * "İlan Ver" düğmesi her yerde aynı boş formu açıyordu: al-sat sayfasından
 * basan kullanıcı kedi ve köpek kategorileriyle karşılaşıyor, güvercin
 * sayfasından basan da öyle. Bulunduğu bölüm zaten cevabın yarısı; formun
 * onu tekrar sorması gereksiz bir adım ve yanlış kategoriye ilan açılmasının
 * başlıca sebebi.
 *
 * Ön ayar kategoriyi (ve gerekirse ilan türünü) kilitliyor; kilitli alan
 * gösterilmiyor, değeri sabit.
 */
export type ListingPreset = {
  /** Kilitlenecek kategori adresi, ör. 'pet-malzemeleri'. */
  categorySlug?: string;
  /** Kilitlenecek ilan türü. */
  kind?: 'satilik' | 'sahiplendirme' | 'kayip' | 'bulundu';
  /** Kategori seçicide gösterilmeyecek kategoriler (kendi dikeyi olanlar). */
  hideCategorySlugs?: string[];
  /** Sayfa başlığı ve açıklaması. */
  title?: string;
  description?: string;
  /** Vazgeçince dönülecek adres. */
  backHref?: string;
  backLabel?: string;
};

export function CreateListingForm({
  listingId,
  preset,
}: { listingId?: number; preset?: ListingPreset } = {}) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, isUserLoading, isProfileLoading } = useSupabaseAuth();

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

  // --- Düzenleme kipi ---
  const isEdit = listingId !== undefined;
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<number[]>([]);
  const [isLoadingListing, setIsLoadingListing] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      kind: 'satilik',
      categoryId: '',
      breedId: '',
      title: '',
      description: '',
      price: '',
      eventDate: '',
      isNegotiable: false,
      ageMonths: '',
      gender: 'belirtilmemis',
      cityId: '',
      districtId: '',
      isVaccinated: false,
      isDewormedInternal: false,
      isDewormedExternal: false,
      hasPedigree: false,
      hasHealthReport: false,
      acceptsCreditCard: false,
      shipsIntercity: false,
      condition: 'kullanilmis',
    },
  });

  const kind = form.watch('kind');
  const categoryId = form.watch('categoryId');

  /**
   * Pet malzemesi ilanı mı?
   *
   * Malzeme ilanında yaş, cinsiyet, aşı, pedigri gibi alanların hiçbiri
   * anlamlı değil — bir kafesin yaşı yok. Onların yerine ürünün durumu
   * (sıfır / az kullanılmış / kullanılmış) soruluyor.
   */
  const isSupply = useMemo(
    () => categories.find((c) => String(c.id) === categoryId)?.slug === 'pet-malzemeleri',
    [categories, categoryId]
  );
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

  /** Ön ayarın kilitlediği kategori. */
  const lockedCategory = useMemo(
    () => (preset?.categorySlug ? categories.find((c) => c.slug === preset.categorySlug) : undefined),
    [categories, preset?.categorySlug]
  );

  /** Seçicide gösterilecek kategoriler; kendi dikeyi olanlar gizlenebiliyor. */
  const selectableCategories = useMemo(
    () =>
      preset?.hideCategorySlugs?.length
        ? categories.filter((c) => !preset.hideCategorySlugs!.includes(c.slug))
        : categories,
    [categories, preset?.hideCategorySlugs]
  );

  // Kilitli kategori yüklendiğinde forma yazılıyor; kullanıcı seçmiyor.
  useEffect(() => {
    if (lockedCategory) form.setValue('categoryId', String(lockedCategory.id));
  }, [lockedCategory, form]);

  useEffect(() => {
    if (preset?.kind) form.setValue('kind', preset.kind);
  }, [preset?.kind, form]);

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

  /**
   * Düzenleme kipinde mevcut ilanı forma yükler.
   *
   * Sahiplik kontrolü burada da yapılıyor ama asıl koruma RLS'te: başkasının
   * ilanı zaten sorguda dönmüyor. Buradaki kontrol, dönmeyen bir kayıt için
   * boş form göstermek yerine anlaşılır bir mesaj verebilmek için.
   */
  useEffect(() => {
    if (!isEdit || !user) return;

    const supabase = getSupabaseBrowserClient();
    (async () => {
      const { data, error } = await supabase
        .from('listings')
        .select(
          'id, owner_id, kind, category_id, breed_id, title, description, price, event_date, is_negotiable, age_months, gender, city_id, district_id, is_vaccinated, is_dewormed_internal, is_dewormed_external, has_pedigree, has_health_report, accepts_credit_card, ships_intercity, listing_photos(id, storage_path, position)'
        )
        .eq('id', listingId)
        .maybeSingle();

      if (error || !data) {
        setLoadError('İlan bulunamadı ya da düzenleme yetkiniz yok.');
        setIsLoadingListing(false);
        return;
      }
      if (data.owner_id !== user.id) {
        setLoadError('Bu ilan size ait değil.');
        setIsLoadingListing(false);
        return;
      }

      form.reset({
        kind: data.kind as 'satilik' | 'sahiplendirme' | 'kayip' | 'bulundu',
        categoryId: String(data.category_id),
        breedId: data.breed_id ? String(data.breed_id) : '',
        title: data.title,
        description: data.description,
        price: data.price != null ? String(data.price) : '',
        eventDate: (data as any).event_date ?? '',
        isNegotiable: data.is_negotiable,
        ageMonths: data.age_months != null ? String(data.age_months) : '',
        gender: data.gender as 'erkek' | 'disi' | 'belirtilmemis',
        cityId: String(data.city_id),
        districtId: data.district_id ? String(data.district_id) : '',
        isVaccinated: data.is_vaccinated,
        isDewormedInternal: data.is_dewormed_internal,
        isDewormedExternal: data.is_dewormed_external,
        hasPedigree: data.has_pedigree,
        hasHealthReport: data.has_health_report,
        acceptsCreditCard: data.accepts_credit_card,
        shipsIntercity: data.ships_intercity,
      });

      setExistingPhotos(
        [...((data.listing_photos as ExistingPhoto[]) ?? [])].sort(
          (a, b) => a.position - b.position
        )
      );
      setIsLoadingListing(false);
    })();
  }, [isEdit, listingId, user, form]);

  async function onSubmit(values: FormValues) {
    if (!user) return;

    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    const uploadedPaths: string[] = [];

    try {
      // 1) İlan satırını önce yaz.
      //    Fotoğrafları önce yükleyip sonra ilan eklemek, ilan eklemesi
      //    başarısız olduğunda kovada sahipsiz dosya bırakırdı.
      setProgress(isEdit ? 'Değişiklikler kaydediliyor...' : 'İlan kaydediliyor...');

      // Alan listesi iki kipte de aynı; ayrılan tek şey owner_id ve slug
      // (ikisi de yalnızca oluştururken anlamlı, sonrasında muhafız koruyor).
      const fields = {
          kind: values.kind,
          category_id: Number(values.categoryId),
          breed_id: Number(values.breedId),
          title: values.title.trim(),
          description: values.description.trim(),
          price: values.kind === 'satilik' ? Number(values.price) : null,
          event_date: values.eventDate || null,
          is_negotiable: values.isNegotiable,
          age_months: isSupply || !values.ageMonths ? null : Number(values.ageMonths),
          gender: isSupply ? 'belirtilmemis' : values.gender,
          city_id: Number(values.cityId),
          district_id: values.districtId ? Number(values.districtId) : null,
          is_vaccinated: isSupply ? false : values.isVaccinated,
          is_dewormed_internal: isSupply ? false : values.isDewormedInternal,
          is_dewormed_external: isSupply ? false : values.isDewormedExternal,
          has_pedigree: isSupply ? false : values.hasPedigree,
          has_health_report: isSupply ? false : values.hasHealthReport,
          // Türe özgü alanlar details içinde; malzemede ürünün durumu.
          details: isSupply ? { condition: values.condition } : {},
          accepts_credit_card: values.acceptsCreditCard,
          ships_intercity: values.shipsIntercity,
      };

      const { data: listing, error: writeError } = isEdit
        ? await supabase
            .from('listings')
            .update(fields)
            .eq('id', listingId!)
            .select('id, slug, status')
            .single()
        : await supabase
            .from('listings')
            .insert({
              ...fields,
              owner_id: user.id,
              // slug, durum ve yayın tarihi sunucudaki trigger tarafından belirlenir
              slug: 'placeholder',
            })
            .select('id, slug, status')
            .single();

      if (writeError) throw new Error(writeError.message);

      // 1b) Düzenlemede kaldırılan fotoğraflar: önce satır, sonra dosya.
      //     Ters sırada bir hata, ilanda gösterilecek dosyası olmayan bir
      //     satır bırakırdı.
      if (isEdit && removedPhotoIds.length > 0) {
        setProgress('Kaldırılan fotoğraflar siliniyor...');
        const removed = existingPhotos.filter((p) => removedPhotoIds.includes(p.id));

        const { error: deleteRowError } = await supabase
          .from('listing_photos')
          .delete()
          .in('id', removedPhotoIds);
        if (deleteRowError) throw new Error(deleteRowError.message);

        if (removed.length > 0) {
          await supabase.storage
            .from(LISTING_PHOTO_BUCKET)
            .remove(removed.map((p) => p.storage_path));
        }
      }

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

        // listing_photos'ta (listing_id, position) tekil. Düzenlemede yeni
        // fotoğraflar, KALAN fotoğrafların en büyük sırasından sonra
        // başlamalı; sıfırdan başlatmak çakışma hatası verirdi.
        const kept = existingPhotos.filter((p) => !removedPhotoIds.includes(p.id));
        const offset = kept.length > 0 ? Math.max(...kept.map((p) => p.position)) + 1 : 0;

        const { error: photoError } = await supabase.from('listing_photos').insert(
          uploadedPaths.map((storage_path, index) => ({
            listing_id: listing.id,
            storage_path,
            position: offset + index,
          }))
        );
        if (photoError) throw new Error(`Fotoğraflar kaydedilemedi: ${photoError.message}`);
      }

      toast({
        title: isEdit ? 'İlanınız güncellendi' : 'İlanınız oluşturuldu',
        description:
          listing.status === 'yayinda'
            ? 'İlanınız yayında.'
            : 'İlanınız onay bekliyor, kısa sürede yayınlanacak.',
      });

      router.push(`/${listing.slug}-${listing.id}`);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: isEdit ? 'İlan güncellenemedi' : 'İlan oluşturulamadı',
        description: error?.message ?? 'Beklenmeyen bir hata oluştu.',
      });
    } finally {
      setIsSubmitting(false);
      setProgress(null);
      setVideoProgress(null);
    }
  }

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  /**
   * Telefonsuz ilan verilemiyor — kural veritabanında (listings_guard) ama
   * kullanıcıyı formun tamamını doldurup en sonda hataya çarptırmak kötü bir
   * deneyim. Eksik olan tek şeyi baştan söyleyip doğrudan oraya gönderiyoruz.
   */
  if (!profile?.phone) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Phone className="h-6 w-6 text-primary" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Önce telefon numaranızı ekleyin</h1>
        <p className="mt-2 text-muted-foreground">
          Alıcılar size ilanınızdaki numaradan ulaşacak. Numaranız profilinizde tutuluyor;
          bir kez eklediğinizde bütün ilanlarınızda kullanılır ve değiştirdiğinizde
          hepsinde birden güncellenir.
        </p>
        <Button asChild className="mt-6">
          <Link href="/profil/hesap">Telefon Numarası Ekle</Link>
        </Button>
      </div>
    );
  }

  if (isLoadingListing) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <h1 className="text-2xl font-bold">İlan açılamadı</h1>
        <p className="mt-2 text-muted-foreground">{loadError}</p>
        <Button asChild className="mt-6">
          <Link href="/profil/ilanlarim">İlanlarıma Dön</Link>
        </Button>
      </div>
    );
  }

  return (
    <Card className="mx-auto my-6 max-w-3xl">
      <CardHeader>
        <CardTitle>{isEdit ? 'İlanı Düzenle' : (preset?.title ?? 'Yeni İlan Ver')}</CardTitle>
        <CardDescription>
          {preset?.description ??
            'İlan vermek ücretsizdir. Bilgileri eksiksiz doldurmanız ilanınızın daha hızlı ilgi görmesini sağlar.'}
        </CardDescription>
        {preset?.backHref && (
          <Link
            href={preset.backHref}
            className="inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            ← {preset.backLabel ?? 'Geri dön'}
          </Link>
        )}
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* İlan türü ön ayarla kilitliyse sorulmuyor: sahiplendirme
                sayfasından gelen kullanıcı zaten sahiplendirme yapıyor. */}
            {!preset?.kind && (
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
                      <SelectItem value="sahiplendirme">
                        {isSupply ? 'Ücretsiz Veriyorum' : 'Ücretsiz Sahiplendirme'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              {lockedCategory ? (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Kategori</p>
                  <div className="flex h-10 items-center rounded-md border bg-secondary/40 px-3 text-sm">
                    {lockedCategory.name}
                  </div>
                </div>
              ) : (
                <SelectField control={form.control} name="categoryId" label="Kategori" options={selectableCategories} placeholder="Kategori seçin" searchPlaceholder="Kategori ara..." />
              )}
              <SelectField
                control={form.control}
                name="breedId"
                label={isSupply ? 'Malzeme Türü' : 'Cins'}
                options={filteredBreeds}
                searchPlaceholder={isSupply ? 'Malzeme ara...' : 'Cins ara...'}
                placeholder={
                  categoryId
                    ? isSupply
                      ? 'Malzeme türü seçin'
                      : 'Cins seçin'
                    : 'Önce kategori seçin'
                }
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
                    <Textarea rows={6} placeholder={isSupply ? 'Marka, ölçüler, kullanım süresi ve varsa kusurları yazın.' : 'Yaşı, karakteri, sağlık durumu ve teslim koşulları hakkında bilgi verin.'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(kind === 'kayip' || kind === 'bulundu') && (
              <FormField
                control={form.control}
                name="eventDate"
                render={({ field }) => (
                  <FormItem className="sm:max-w-xs">
                    <FormLabel>
                      {kind === 'kayip' ? 'Kaybolduğu Tarih' : 'Bulunduğu Tarih'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        max={new Date().toISOString().slice(0, 10)}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

            {/* Bir kafesin yaşı ve cinsiyeti yok; malzeme ilanında bu blok
                yerine ürünün durumu soruluyor. */}
            {isSupply ? (
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ürünün Durumu</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sifir">Sıfır / Kullanılmamış</SelectItem>
                        <SelectItem value="az_kullanilmis">Az Kullanılmış</SelectItem>
                        <SelectItem value="kullanilmis">Kullanılmış</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Alıcının en çok merak ettiği bilgi bu; açıklamada varsa kusurları da
                      belirtin.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
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
            )}

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

            {/* Telefon artık ilana değil profile bağlı: kullanıcı numarasını
                değiştirdiğinde eski ilanlarda ulaşılamaz bir numara kalıyordu.
                Buradaki kutu yalnızca hangi numaranın görüneceğini bildiriyor;
                değeri veritabanı yazıyor (bkz. listings_guard). */}
            <div className="rounded-lg border bg-secondary/40 p-4">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-medium">İlanda görünecek telefon</p>
                  <p className="mt-0.5 font-mono text-base">{formatTrPhone(profile?.phone) || '—'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Profilinizdeki numara kullanılıyor. Numaranızı değiştirdiğinizde tüm
                    ilanlarınızda otomatik güncellenir.
                  </p>
                  <Link
                    href="/profil/hesap"
                    className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                  >
                    Numarayı değiştir
                  </Link>
                </div>
              </div>
            </div>

            <fieldset className="space-y-3 rounded-lg border p-4">
              <legend className="px-1 text-sm font-semibold">
                {isSupply ? 'Ödeme ve Teslimat' : 'Sağlık ve Teslimat'}
              </legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Aşı, parazit, pedigri ve sağlık raporu yalnızca canlı
                    hayvan ilanında anlamlı. */}
                {!isSupply && (
                  <>
                    <CheckboxField control={form.control} name="isVaccinated" label="Aşıları tam" />
                    <CheckboxField control={form.control} name="isDewormedInternal" label="İç parazit yapıldı" />
                    <CheckboxField control={form.control} name="isDewormedExternal" label="Dış parazit yapıldı" />
                    <CheckboxField control={form.control} name="hasPedigree" label="Pedigrili" />
                    <CheckboxField control={form.control} name="hasHealthReport" label="Sağlık raporu var" />
                  </>
                )}
                <CheckboxField control={form.control} name="acceptsCreditCard" label="Kredi kartı kabul ediliyor" />
                <CheckboxField
                  control={form.control}
                  name="shipsIntercity"
                  label={isSupply ? 'Kargo ile gönderilebilir' : 'Şehir dışına gönderim'}
                />
              </div>
            </fieldset>

            <div className="space-y-3">
              <FormLabel>Fotoğraflar</FormLabel>
              <div className="flex flex-wrap gap-3">
                {/* Depoda duran fotoğraflar. Kaldırma işareti anında
                    uygulanmıyor; kayıt anında satır ve dosya birlikte
                    siliniyor — vazgeçen kullanıcı fotoğrafını kaybetmesin. */}
                {existingPhotos
                  .filter((photo) => !removedPhotoIds.includes(photo.id))
                  .map((photo, i) => {
                    const url = listingPhotoUrl(photo.storage_path);
                    return (
                      <div key={photo.id} className="relative h-24 w-24 overflow-hidden rounded-md border">
                        {url && (
                          <Image src={url} alt={`Mevcut fotoğraf ${i + 1}`} fill sizes="96px" className="object-cover" />
                        )}
                        <button
                          type="button"
                          onClick={() => setRemovedPhotoIds((prev) => [...prev, photo.id])}
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
                          aria-label="Fotoğrafı kaldır"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-0 w-full bg-black/60 text-center text-[10px] text-white">
                            Kapak
                          </span>
                        )}
                      </div>
                    );
                  })}

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
              {removedPhotoIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {removedPhotoIds.length} fotoğraf kaydettiğinizde silinecek.{' '}
                  <button
                    type="button"
                    onClick={() => setRemovedPhotoIds([])}
                    className="font-medium text-primary hover:underline"
                  >
                    Geri al
                  </button>
                </p>
              )}
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
                isEdit ? 'Değişiklikleri Kaydet' : 'İlanı Yayınla'
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
