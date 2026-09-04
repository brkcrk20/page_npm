'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Check,
  Heart,
  Loader2,
  MessageSquare,
  Star,
  Stethoscope,
  Store,
  User,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

/**
 * Kayıt akışı.
 *
 * İki adım: önce NE İÇİN kayıt olunduğu seçiliyor, sonra o seçime uygun form
 * gösteriliyor. Eskiden "Bireysel / Kurumsal" diye iki sekme vardı ve hangisini
 * seçmesi gerektiği kullanıcıya hiçbir yerde anlatılmıyordu — özellikle
 * veteriner, pet otel gibi işletmeler bireysel hesap açıp sonra işletme
 * sayfası açamıyordu.
 *
 * Kurumsal formda altı ek alan var; bunları herkese göstermek bireysel
 * kullanıcıyı gereksiz yere caydırıyordu.
 */

const baseFields = {
  name: z.string().trim().min(2, 'Ad soyad en az 2 karakter olmalı.'),
  username: z
    .string()
    .trim()
    .min(3, 'Kullanıcı adı en az 3 karakter olmalı.')
    .regex(/^[a-zA-Z0-9_]+$/, 'Yalnızca harf, rakam ve alt çizgi kullanabilirsiniz.'),
  email: z.string().trim().email('Geçerli bir e-posta adresi girin.'),
  phone: z.string().trim().min(10, 'Geçerli bir telefon numarası girin.'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalı.'),
  agreement: z.literal(true, {
    errorMap: () => ({ message: 'Üyelik sözleşmesini kabul etmelisiniz.' }),
  }),
};

const individualSchema = z.object({ userType: z.literal('bireysel'), ...baseFields });

const corporateSchema = z.object({
  userType: z.literal('kurumsal'),
  ...baseFields,
  companyTitle: z.string().trim().min(2, 'Firma / işletme ünvanı gerekli.'),
  companyType: z.enum(['Sahis', 'Limited', 'Anonim'], {
    errorMap: () => ({ message: 'Şirket türü seçin.' }),
  }),
  /**
   * TC kimlik numarası kayıt sırasında istenmiyor.
   *
   * Kurumsal kaydı açan kişinin TC'si zorunlu alandı ve kayıt ekranında
   * duruyordu. İşletmeyi tanımlayan şey vergi numarası; yetkilinin TC'si
   * kayıt anında hiçbir kontrolde kullanılmıyordu, yalnızca saklanıyordu.
   * Gereksiz yere hassas veri toplamamak için alan kaldırıldı.
   *
   * Kimlik doğrulaması ayrı bir akış (/profil/dogrulama) ve orada
   * TC ya da vergi numarasından biri isteniyor.
   */
  taxNo: z.string().trim().min(10, 'Vergi numarası en az 10 haneli olmalı.'),
  taxOffice: z.string().trim().min(2, 'Vergi dairesi gerekli.'),
  companyAddress: z.string().trim().min(10, 'Açık adres gerekli.'),
});

const formSchema = z.discriminatedUnion('userType', [individualSchema, corporateSchema]);
type FormValues = z.infer<typeof formSchema>;

type AccountType = 'bireysel' | 'kurumsal';

/**
 * Supabase'in hata metinleri İngilizce ve teknik. Kullanıcıya ne yapması
 * gerektiğini söyleyen karşılıklara çeviriyoruz — özellikle "kayıt kapalı"
 * durumunda genel bir hata göstermek, sorunun sitede mi kendisinde mi
 * olduğunu anlamasını imkânsız kılıyordu.
 */
function translateSignUpError(message: string): { title: string; description: string } {
  const m = message.toLowerCase();

  // Ağ hatası: sunucuya hiç ulaşılamadı. Daha önce ham "Failed to fetch"
  // metni gösteriliyordu ve kullanıcı sorunun kendisinde olduğunu sanıyordu.
  if (
    m.includes('failed to fetch') ||
    m.includes('networkerror') ||
    m.includes('network request failed') ||
    m.includes('fetch failed') ||
    m.includes('load failed')
  ) {
    return {
      title: 'Sunucuya ulaşılamıyor',
      description:
        'İnternet bağlantınızı kontrol edin. Bağlantınız sorunsuzsa geçici bir sunucu sorunu olabilir; birkaç dakika sonra tekrar deneyin.',
    };
  }
  if (m.includes('signups are disabled') || m.includes('signup is disabled')) {
    return {
      title: 'Kayıt geçici olarak kapalı',
      description:
        'Yeni üyelik alımı şu an durdurulmuş durumda. Kısa süre içinde tekrar deneyin.',
    };
  }
  if (m.includes('already registered') || m.includes('already been registered')) {
    return {
      title: 'Bu e-posta zaten kayıtlı',
      description: 'Giriş yapmayı ya da şifrenizi sıfırlamayı deneyin.',
    };
  }
  if (m.includes('password')) {
    return {
      title: 'Şifre yeterince güçlü değil',
      description: 'En az 6 karakter, harf ve rakam içeren bir şifre seçin.',
    };
  }
  if (m.includes('invalid') && m.includes('email')) {
    return { title: 'E-posta adresi geçersiz', description: 'Adresi kontrol edip tekrar deneyin.' };
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return {
      title: 'Çok fazla deneme',
      description: 'Bir süre bekleyip tekrar deneyin.',
    };
  }
  // Bilinmeyen hatalarda ham mesajı gizlemiyoruz: destek istendiğinde
  // kullanıcının söyleyebileceği tek ipucu bu.
  return { title: 'Kayıt tamamlanamadı', description: message };
}

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();

  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Toast tek başına yetmiyor: uzun formun altındayken ekranın üstünde beliren
  // bildirim mobilde fark edilmiyor ve düğme boşa basılmış gibi hissettiriyor.
  // Hata ayrıca formun içinde, gönder düğmesinin hemen üstünde gösteriliyor.
  const [formError, setFormError] = useState<{ title: string; description: string } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userType: 'bireysel',
      name: '',
      username: '',
      email: '',
      phone: '',
      password: '',
      agreement: false as any,
    } as any,
  });

  function choose(type: AccountType) {
    setAccountType(type);
    form.setValue('userType', type);
    // Kurumsal alanlar yalnızca kurumsal seçiminde şemaya giriyor; boş
    // başlatmazsak react-hook-form "undefined" ile doğrulamaya girip
    // anlaşılmaz hata veriyor.
    if (type === 'kurumsal') {
      form.setValue('companyTitle' as any, '');
      form.setValue('taxNo' as any, '');
      form.setValue('taxOffice' as any, '');
      form.setValue('companyAddress' as any, '');
    }
  }

  /**
   * Doğrulama başarısızsa hiçbir şey olmuyormuş gibi görünüyordu: hatalı alan
   * ekranın dışındaysa kullanıcı kırmızı yazıyı göremiyor. Artık ilk hatalı
   * alana kaydırıp özet gösteriyoruz.
   */
  function onInvalid(errors: Record<string, any>) {
    const firstKey = Object.keys(errors)[0];
    const message = errors[firstKey]?.message ?? 'Lütfen eksik alanları doldurun.';

    setFormError({ title: 'Eksik veya hatalı bilgi', description: String(message) });

    const el = document.querySelector<HTMLElement>(`[name="${firstKey}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true });
    }
  }

  async function onSubmit(values: FormValues) {
    setFormError(null);
    setIsLoading(true);
    const supabase = getSupabaseBrowserClient();

    try {
      const username = values.username.trim().toLowerCase();

      const { data: available, error: checkError } = await supabase.rpc('username_available', {
        p_username: username,
      });
      if (checkError) {
        // Ham hata metnini olduğu gibi göstermek yerine çeviriden geçiriyoruz;
        // ağ kopukluğunda "Kullanıcı adı kontrol edilemedi: Failed to fetch"
        // gibi bir mesaj kullanıcıya hiçbir şey anlatmıyordu.
        const t = translateSignUpError(checkError.message);
        setFormError(t);
        toast({ variant: 'destructive', ...t });
        setIsLoading(false);
        return;
      }
      if (available === false) {
        form.setError('username', { message: 'Bu kullanıcı adı zaten alınmış.' });
        setIsLoading(false);
        return;
      }

      const metadata: Record<string, string> = {
        full_name: values.name,
        username,
        phone: values.phone,
        account_type: values.userType,
      };

      if (values.userType === 'kurumsal') {
        metadata.company_title = values.companyTitle;
        metadata.company_type = values.companyType;
        metadata.tax_number = values.taxNo;
        metadata.tax_office = values.taxOffice;
        metadata.company_address = values.companyAddress;
      }

      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { data: metadata },
      });

      if (error) {
        const translated = translateSignUpError(error.message);
        setFormError(translated);
        toast({ variant: 'destructive', ...translated });
        setIsLoading(false);
        return;
      }

      // Supabase, zaten kayıtlı bir e-posta için e-posta sayımını önlemek
      // adına hatasız ama kimliksiz bir yanıt döndürüyor. Bunu sessiz başarı
      // gibi göstermek kullanıcıyı çıkmaza sokuyordu.
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        const dup = {
          title: 'Bu e-posta zaten kayıtlı',
          description: 'Giriş yapmayı ya da şifrenizi sıfırlamayı deneyin.',
        };
        setFormError(dup);
        toast({ variant: 'destructive', ...dup });
        setIsLoading(false);
        return;
      }

      if (!data.session) {
        toast({
          title: 'Kaydınız alındı',
          description: 'E-posta adresinize gönderilen doğrulama bağlantısına tıklayın.',
        });
        router.push('/login');
        return;
      }

      toast({ title: 'Hoş geldiniz!', description: 'Hesabınız oluşturuldu.' });
      router.push('/');
      router.refresh();
    } catch (error: any) {
      const failure = {
        title: 'Kayıt tamamlanamadı',
        description: error?.message ?? 'Beklenmeyen bir hata oluştu.',
      };
      setFormError(failure);
      toast({ variant: 'destructive', ...failure });
    } finally {
      setIsLoading(false);
    }
  }

  // --- Adım 1: hesap türü seçimi ---
  if (accountType === null) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold">Nasıl kullanacaksınız?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hesap türünü sonradan da değiştirebilirsiniz.
          </p>
        </div>

        <button
          type="button"
          onClick={() => choose('bireysel')}
          className="w-full rounded-xl border-2 p-5 text-left transition-colors hover:border-primary hover:bg-secondary/40"
        >
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-primary/10 p-2 text-primary">
              <User className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-bold">Bireysel Hesap</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Hayvan sahiplendirmek, satmak veya almak isteyenler için.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm">
                <Benefit icon={Heart}>Ücretsiz ilan verin</Benefit>
                <Benefit icon={MessageSquare}>Alıcılarla mesajlaşın</Benefit>
                <Benefit icon={Star}>Beğendiklerinizi favorilere ekleyin</Benefit>
              </ul>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => choose('kurumsal')}
          className="w-full rounded-xl border-2 p-5 text-left transition-colors hover:border-primary hover:bg-secondary/40"
        >
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-primary/10 p-2 text-primary">
              <Building2 className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-bold">Kurumsal Hesap</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Veteriner kliniği, pet oteli, kuaför, petshop, pet taksi, eğitmen,
                gezdirici ve üreticiler için.
              </p>
              <ul className="mt-3 space-y-1.5 text-sm">
                <Benefit icon={Stethoscope}>
                  İşletmenizi rehbere ekleyin, müşteriler size ulaşsın
                </Benefit>
                <Benefit icon={Store}>Çalışma saatleri ve hizmet listesi yayınlayın</Benefit>
                <Benefit icon={Star}>Doğrulanmış işletme rozeti alın</Benefit>
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                Fatura kesebilmemiz için vergi bilgileri istenir.
              </p>
            </div>
          </div>
        </button>

        <p className="pt-2 text-center text-sm text-muted-foreground">
          Zaten hesabınız var mı?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Giriş yapın
          </Link>
        </p>
      </div>
    );
  }

  // --- Adım 2: form ---
  const isCorporate = accountType === 'kurumsal';

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setAccountType(null)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Hesap türünü değiştir
      </button>

      <div className="rounded-lg bg-secondary/60 px-4 py-3 text-sm">
        <span className="font-semibold">
          {isCorporate ? 'Kurumsal Hesap' : 'Bireysel Hesap'}
        </span>{' '}
        <span className="text-muted-foreground">
          {isCorporate
            ? '— işletmenizi rehberde yayınlayabilirsiniz'
            : '— ücretsiz ilan verebilir ve mesajlaşabilirsiniz'}
        </span>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-4" noValidate>
          <Field control={form.control} name="name" label="Ad Soyad" placeholder="Adınız ve soyadınız" />
          <Field
            control={form.control}
            name="username"
            label="Kullanıcı Adı"
            placeholder="ornek_kullanici"
            description="Profil adresinizde görünür. Sonradan değiştirilemez."
          />
          <Field control={form.control} name="email" label="E-posta" type="email" placeholder="ornek@eposta.com" />
          <Field control={form.control} name="phone" label="Telefon" placeholder="05XX XXX XX XX" />
          <Field
            control={form.control}
            name="password"
            label="Şifre"
            type="password"
            placeholder="En az 6 karakter"
          />

          {isCorporate && (
            <fieldset className="space-y-4 rounded-lg border p-4">
              <legend className="px-1 text-sm font-semibold">İşletme Bilgileri</legend>

              <Field
                control={form.control}
                name="companyTitle"
                label="İşletme / Firma Ünvanı"
                placeholder="Örn: Dost Veteriner Kliniği"
              />

              <FormField
                control={form.control}
                name={'companyType' as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Şirket Türü</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value as string}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seçiniz" />
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

              <Field control={form.control} name="taxNo" label="Vergi No" placeholder="10 veya 11 haneli" />

              <Field control={form.control} name="taxOffice" label="Vergi Dairesi" placeholder="Örn: Kadıköy" />

              <FormField
                control={form.control}
                name={'companyAddress' as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>İşletme Adresi</FormLabel>
                    <FormControl>
                      <Textarea rows={2} placeholder="Mahalle, cadde, no, ilçe/il" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </fieldset>
          )}

          <FormField
            control={form.control}
            name="agreement"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value as boolean}
                    onCheckedChange={field.onChange}
                    className="mt-0.5"
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel className="font-normal">
                    <Link href="/kullanim-sartlari" className="text-primary hover:underline">
                      Üyelik sözleşmesini
                    </Link>{' '}
                    okudum ve kabul ediyorum.
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          {formError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{formError.title}</AlertTitle>
              <AlertDescription>{formError.description}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCorporate ? 'Kurumsal Hesap Oluştur' : 'Ücretsiz Hesap Oluştur'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Zaten hesabınız var mı?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Giriş yapın
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
}

function Benefit({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4 shrink-0 text-emerald-600" />
      {children}
    </li>
  );
}

function Field({
  control,
  name,
  label,
  placeholder,
  type,
  description,
}: {
  control: any;
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  description?: string;
}) {
  return (
    <FormField
      control={control}
      name={name as any}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} placeholder={placeholder} {...field} />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
