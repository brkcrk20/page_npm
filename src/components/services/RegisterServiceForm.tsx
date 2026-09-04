'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Building2, Loader2, Phone } from 'lucide-react';

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
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useSupabaseAuth } from '@/lib/supabase/auth-provider';
import { WEEKDAY_NAMES } from '@/lib/opening-hours';
import type { ServiceConfig } from '@/lib/services-config';
import { GirisDaveti } from '@/components/GirisDaveti';

/**
 * Hizmet sağlayıcı kayıt formu (yedi kategorinin hepsi için).
 *
 * Kayıt onay kuyruğuna düşüyor: rehberler güven üzerine kurulu, doğrulanmamış
 * kaydın doğrudan yayına girmesi rehberin değerini düşürürdü. Durum, doğrulama
 * rozeti ve sayaçlar veritabanı tarafında zorla normalleştiriliyor
 * (service_providers_guard), yani form ne gönderirse göndersin kullanıcı
 * kendini doğrulanmış gösteremiyor.
 */

const schema = z.object({
  name: z.string().trim().min(2, 'İşletme adı en az 2 karakter olmalı.').max(120),
  description: z.string().trim().max(2000).optional(),
  phone: z.string().trim().min(10, 'Geçerli bir telefon girin.'),
  phoneAlt: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  email: z.string().trim().email('Geçerli bir e-posta girin.').optional().or(z.literal('')),
  website: z.string().trim().url('Geçerli bir adres girin (https:// ile).').optional().or(z.literal('')),
  cityId: z.string().min(1, 'İl seçin.'),
  districtId: z.string().optional(),
  address: z.string().trim().min(10, 'Açık adres girin.'),
  licenseNumber: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;
type Option = { id: number; name: string; slug: string };
type Feature = { id: number; slug: string; name: string; group_name: string; position: number };

type DayHours = { isClosed: boolean; is24h: boolean; opens: string; closes: string };

const DEFAULT_DAY: DayHours = { isClosed: false, is24h: false, opens: '09:00', closes: '19:00' };

export function RegisterServiceForm({ config }: { config: ServiceConfig }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, profile, isUserLoading, isProfileLoading } = useSupabaseAuth();

  const [cities, setCities] = useState<Option[]>([]);
  const [districts, setDistricts] = useState<Option[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<number>>(new Set());
  const [hours, setHours] = useState<Record<number, DayHours>>(() =>
    Object.fromEntries(
      [1, 2, 3, 4, 5, 6, 7].map((d) => [d, { ...DEFAULT_DAY, isClosed: d === 7 }])
    )
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '', description: '', phone: '', phoneAlt: '', whatsapp: '',
      email: '', website: '', cityId: '', districtId: '', address: '', licenseNumber: '',
    },
  });

  const cityId = form.watch('cityId');

  useEffect(() => {
    // Giriş yapmamış kullanıcı artık yönlendirilmiyor; ne yapması
    // gerektiğini anlatan bir ekran görüyor (bkz. GirisDaveti).
  }, [isUserLoading, user, router]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    (async () => {
      const [cits, feats] = await Promise.all([
        supabase.from('cities').select('id, name, slug').order('name'),
        supabase
          .from('service_features')
          .select('id, slug, name, group_name, position')
          .eq('service_type', config.type)
          .eq('is_active', true)
          .order('position'),
      ]);
      if (cits.data) setCities(cits.data as Option[]);
      if (feats.data) setFeatures(feats.data as Feature[]);
    })();
  }, [config.type]);

  useEffect(() => {
    if (!cityId) {
      setDistricts([]);
      return;
    }
    getSupabaseBrowserClient()
      .from('districts')
      .select('id, name, slug')
      .eq('city_id', Number(cityId))
      .order('name')
      .then(({ data }) => setDistricts((data as Option[]) ?? []));
    form.setValue('districtId', '');
  }, [cityId]);

  const featureGroups = useMemo(() => {
    const map = new Map<string, Feature[]>();
    for (const feature of features) {
      const list = map.get(feature.group_name) ?? [];
      list.push(feature);
      map.set(feature.group_name, list);
    }
    return Array.from(map);
  }, [features]);

  function toggleFeature(id: number) {
    setSelectedFeatures((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function updateDay(weekday: number, patch: Partial<DayHours>) {
    setHours((prev) => ({ ...prev, [weekday]: { ...prev[weekday], ...patch } }));
  }

  async function onSubmit(values: FormValues) {
    if (!user) return;
    setIsSubmitting(true);
    const supabase = getSupabaseBrowserClient();

    try {
      const { data: provider, error } = await supabase
        .from('service_providers')
        .insert({
          service_type: config.type,
          owner_id: user.id,
          name: values.name,
          slug: 'placeholder', // trigger addan üretiyor
          description: values.description?.trim() || null,
          phone: values.phone.trim(),
          phone_alt: values.phoneAlt?.trim() || null,
          whatsapp: values.whatsapp?.trim() || null,
          email: values.email?.trim() || null,
          website: values.website?.trim() || null,
          city_id: Number(values.cityId),
          district_id: values.districtId ? Number(values.districtId) : null,
          address: values.address.trim(),
          license_number: values.licenseNumber?.trim() || null,
        })
        .select('id')
        .single();

      if (error) throw new Error(error.message);

      if (selectedFeatures.size > 0) {
        const { error: featureError } = await supabase
          .from('service_provider_features')
          .insert(
            Array.from(selectedFeatures, (feature_id) => ({
              provider_id: provider.id,
              feature_id,
            }))
          );
        if (featureError) throw new Error(`Özellikler kaydedilemedi: ${featureError.message}`);
      }

      const { error: hoursError } = await supabase.from('service_provider_hours').insert(
        Object.entries(hours).map(([weekday, day]) => ({
          provider_id: provider.id,
          weekday: Number(weekday),
          is_closed: day.isClosed,
          is_24h: day.is24h,
          opens_at: day.isClosed || day.is24h ? null : `${day.opens}:00`,
          closes_at: day.isClosed || day.is24h ? null : `${day.closes}:00`,
        }))
      );
      if (hoursError) throw new Error(`Çalışma saatleri kaydedilemedi: ${hoursError.message}`);

      toast({
        title: 'Kaydınız alındı',
        description: 'İşletmeniz incelendikten sonra rehberde yayınlanacak.',
      });
      router.push(`/${config.slug}`);
      router.refresh();
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Kayıt oluşturulamadı',
        description: error?.message ?? 'Beklenmeyen bir hata oluştu.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    return (
      <GirisDaveti
        baslik={`İşletmenizi PetSemti'de yayınlayın`}
        aciklama="Doğrulama sonrası işletmeniz ilgili şehir ve hizmet kategorilerinde listelenir."
        girisEtiketi="Giriş Yap"
        kayitEtiketi="Kurumsal Hesap Oluştur"
        donusYolu={`/${config.slug}/kayit`}
        icon={Building2}
        altNot={
          <>
            Rehber kaydı kurumsal hesap gerektirir. Kayıt ücretsizdir; başvurunuz
            yayına alınmadan önce incelenir.
          </>
        }
      />
    );
  }

  /**
   * Rehber kaydı işletmelere ait. Kural veritabanında
   * (service_providers_guard) ama uzun formu doldurtup en sonda reddetmek
   * kötü bir deneyim; eksik olan tek şey baştan söyleniyor.
   *
   * Kurumsala geçiş kapalı bir kapı değil: hesap bilgilerinden firma
   * bilgileri doldurularak yükseltilebiliyor.
   */
  if (profile?.account_type !== 'kurumsal') {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Bu bölüm işletmelere özel</h1>
        <p className="mt-2 text-muted-foreground">
          {config.label} rehberine yalnızca kurumsal hesaplar kayıt açabilir. Hesabınız şu
          an bireysel görünüyor.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          İşletme sahibiyseniz firma ünvanı, vergi dairesi, vergi numarası ve adres
          bilgilerinizi girerek kurumsal hesaba geçebilirsiniz.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/profil/hesap">Kurumsal Hesaba Geç</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/${config.slug}`}>{config.label} Rehberine Dön</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!profile?.phone) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Phone className="h-6 w-6 text-primary" />
        </div>
        <h1 className="mt-4 text-2xl font-bold">Önce telefon numaranızı ekleyin</h1>
        <p className="mt-2 text-muted-foreground">
          Rehberdeki kayıtlara müşteriler telefonla ulaşıyor. Numaranız profilinizde
          tutuluyor.
        </p>
        <Button asChild className="mt-6">
          <Link href="/profil/hesap">Telefon Numarası Ekle</Link>
        </Button>
      </div>
    );
  }

  return (
    <Card className="mx-auto my-6 max-w-3xl">
      <CardHeader>
        <CardTitle>{config.registerCta}</CardTitle>
        <CardDescription>
          Kayıt ücretsizdir. Bilgileriniz incelendikten sonra rehberde yayınlanır.
          Ruhsat / oda kayıt numarası girmeniz doğrulanmış rozeti almanızı
          hızlandırır.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İşletme Adı</FormLabel>
                  <FormControl>
                    <Input placeholder={`Örn: ${config.label} — işletme adınız`} {...field} />
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
                  <FormLabel>Tanıtım</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="İşletmeniz, ekibiniz ve uzmanlık alanlarınız hakkında bilgi verin." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl><Input placeholder="0212 000 00 00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneAlt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İkinci Telefon</FormLabel>
                    <FormControl><Input placeholder="Opsiyonel" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl><Input placeholder="Boş bırakılırsa telefon kullanılır" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-posta</FormLabel>
                    <FormControl><Input type="email" placeholder="Opsiyonel" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Web Sitesi</FormLabel>
                  <FormControl><Input placeholder="https://" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="cityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İl</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="İl seçin"
                        searchPlaceholder="İl ara..."
                        ariaLabel="İl"
                        className="w-full"
                        options={cities.map((c) => ({ value: String(c.id), label: c.name }))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="districtId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İlçe</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        placeholder={cityId ? 'İlçe seçin' : 'Önce il seçin'}
                        searchPlaceholder="İlçe ara..."
                        ariaLabel="İlçe"
                        disabled={!cityId}
                        className="w-full"
                        options={districts.map((d) => ({ value: String(d.id), label: d.name }))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açık Adres</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Mahalle, cadde, no" {...field} />
                  </FormControl>
                  <FormDescription>Yol tarifi bu adresten üretilir.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="licenseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Oda Kayıt / Ruhsat No</FormLabel>
                  <FormControl><Input placeholder="Opsiyonel — doğrulamayı hızlandırır" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {featureGroups.map(([group, groupFeatures]) => (
              <fieldset key={group} className="rounded-lg border p-4">
                <legend className="px-1 text-sm font-semibold">{group}</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {groupFeatures.map((feature) => (
                    <label key={feature.id} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox
                        checked={selectedFeatures.has(feature.id)}
                        onCheckedChange={() => toggleFeature(feature.id)}
                      />
                      {feature.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}

            <fieldset className="rounded-lg border p-4">
              <legend className="px-1 text-sm font-semibold">Çalışma Saatleri</legend>
              <div className="mt-2 space-y-2">
                {[1, 2, 3, 4, 5, 6, 7].map((weekday) => {
                  const day = hours[weekday];
                  return (
                    <div key={weekday} className="flex flex-wrap items-center gap-3 border-b pb-2 last:border-b-0">
                      <span className="w-24 text-sm font-medium">{WEEKDAY_NAMES[weekday]}</span>

                      <label className="flex items-center gap-1.5 text-sm">
                        <Checkbox
                          checked={day.isClosed}
                          onCheckedChange={(v) => updateDay(weekday, { isClosed: Boolean(v) })}
                        />
                        Kapalı
                      </label>

                      <label className="flex items-center gap-1.5 text-sm">
                        <Checkbox
                          checked={day.is24h}
                          disabled={day.isClosed}
                          onCheckedChange={(v) => updateDay(weekday, { is24h: Boolean(v) })}
                        />
                        24 saat
                      </label>

                      {!day.isClosed && !day.is24h && (
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`acilis-${weekday}`} className="sr-only">
                            {WEEKDAY_NAMES[weekday]} açılış
                          </Label>
                          <Input
                            id={`acilis-${weekday}`}
                            type="time"
                            value={day.opens}
                            onChange={(e) => updateDay(weekday, { opens: e.target.value })}
                            className="h-9 w-28"
                          />
                          <span className="text-muted-foreground">–</span>
                          <Label htmlFor={`kapanis-${weekday}`} className="sr-only">
                            {WEEKDAY_NAMES[weekday]} kapanış
                          </Label>
                          <Input
                            id={`kapanis-${weekday}`}
                            type="time"
                            value={day.closes}
                            onChange={(e) => updateDay(weekday, { closes: e.target.value })}
                            className="h-9 w-28"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydı Gönder
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
