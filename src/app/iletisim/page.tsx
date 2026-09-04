import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, Building2, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getSiteContact } from '@/lib/queries/site-settings';
import { ContactForm } from './ContactForm';

export const metadata: Metadata = {
  title: 'İletişim | PetSemti',
  description: 'PetSemti ile iletişime geçin: destek, ilan bildirimi ve kurumsal başvurular.',
};

/**
 * İletişim.
 *
 * Bilgiler ayarlardan geliyor; tanımlı olmayan hiçbir kanal gösterilmiyor.
 * Eskiden alt bilgide 0555 555 55 55 gibi yer tutucular vardı ve gerçekmiş
 * gibi duruyordu — arayan kişiyi başkasının numarasına düşürebilecek bir hata.
 *
 * En sık gelen taleplerin (ilan bildirimi, hesap sorunu) kendi kendine
 * çözülebilen yolları en üstte: destek kanalına gitmeden önce kullanıcı
 * çözümü görebiliyor.
 */
export default async function Page() {
  const contact = await getSiteContact();
  const hasChannel = Boolean(contact.email || contact.phone || contact.whatsapp);

  return (
    <div className="bg-secondary/30">
      <div className="mx-auto w-full max-w-3xl px-5 py-8 md:py-12">
        <nav aria-label="Kırıntı navigasyonu" className="mb-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary hover:underline">
            Ana Sayfa
          </Link>
          <span aria-hidden className="mx-1">›</span>
          <span className="text-foreground">İletişim</span>
        </nav>

        <h1 className="text-2xl font-bold md:text-3xl">İletişim</h1>
        <p className="mt-2 text-muted-foreground">
          Aşağıdaki konuların çoğunu bize yazmadan, doğrudan hesabınızdan
          çözebilirsiniz.
        </p>

        <section className="mt-6 space-y-3">
          <Shortcut
            title="İlanımı düzenlemek veya kaldırmak istiyorum"
            text="İlanlarım sayfasından ilanınızı yayından kaldırabilir, satıldı olarak işaretleyebilir veya silebilirsiniz."
            href="/profil/ilanlarim"
            cta="İlanlarım"
          />
          <Shortcut
            title="Telefon numaramı değiştirmek istiyorum"
            text="Hesap bilgilerinizden değiştirdiğinizde tüm ilanlarınızda otomatik güncellenir."
            href="/profil/hesap"
            cta="Hesap Bilgilerim"
          />
          <Shortcut
            title="Şifremi unuttum"
            text="E-posta adresinize sıfırlama bağlantısı gönderebiliriz."
            href="/sifremi-unuttum"
            cta="Şifremi Sıfırla"
          />
          <Shortcut
            title="İşletmemi rehbere eklemek istiyorum"
            text="Veteriner, pet oteli, kuaför, eğitmen, pet taksi, petshop ve gezdirici rehberlerine kurumsal hesapla kayıt açabilirsiniz."
            href="/profil/hesap"
            cta="Kurumsal Hesaba Geç"
          />
        </section>

        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="flex items-center gap-2 font-bold text-amber-900">
            <AlertTriangle className="h-5 w-5" />
            Kurallara aykırı bir ilan gördüyseniz
          </h2>
          <p className="mt-2 text-sm text-amber-900">
            Hayvana kötü muamele, yanıltıcı fotoğraf, sahte belge, yasaklı tür veya
            dolandırıcılık şüphesi taşıyan ilanları bize bildirin. Bildiriminizde{' '}
            <strong>ilan numarasını</strong> yazmanız incelemeyi hızlandırır. İlan numarası
            ilan sayfasında ve adresin sonunda yer alır.
          </p>
        </section>

        {/* Form her koşulda burada.
            Eskiden ayarlar boşken sayfa "iletişim bilgileri henüz
            yayınlanmadı" deyip kullanıcıyı elleri boş gönderiyordu — oysa
            iletişim sayfasına gelen kişi tam olarak iletişim kurmak
            istiyor. Telefon ve e-posta girildiğinde aşağıda ayrıca
            görünüyor; form onlara bağlı değil. */}
        <section className="mt-6 rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold">Bize yazın</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Mesajınız doğrudan bize ulaşır; e-posta adresinize dönüş yaparız.
          </p>
          <div className="mt-4">
            <ContactForm />
          </div>
        </section>

        {hasChannel && (
          <section className="mt-6 rounded-xl border bg-white p-6">
            <h2 className="text-lg font-bold">Diğer kanallar</h2>
            <div className="mt-4 space-y-3">
              {contact.email && (
                <Channel
                  icon={Mail}
                  label="E-posta"
                  value={contact.email}
                  href={`mailto:${contact.email}`}
                />
              )}
              {contact.phone && (
                <Channel
                  icon={Phone}
                  label="Telefon"
                  value={contact.phone}
                  href={`tel:${contact.phone.replace(/\s/g, '')}`}
                />
              )}
              {contact.whatsapp && (
                <Channel
                  icon={MessageCircle}
                  label="WhatsApp"
                  value={contact.whatsapp}
                  href={`https://wa.me/${contact.whatsapp.replace(/\D/g, '')}`}
                />
              )}
              {contact.address && (
                <Channel icon={MapPin} label="Adres" value={contact.address} />
              )}
              {contact.legal_name && (
                <Channel icon={Building2} label="Unvan" value={contact.legal_name} />
              )}
            </div>
          </section>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Kişisel verilerinizle ilgili talepleriniz için{' '}
          <Link href="/gizlilik-politikasi" className="text-primary hover:underline">
            Gizlilik Politikası
          </Link>{' '}
          sayfasına bakabilirsiniz.
        </p>
      </div>
    </div>
  );
}

function Shortcut({
  title,
  text,
  href,
  cta,
}: {
  title: string;
  text: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{text}</p>
      </div>
      <Button asChild size="sm" variant="outline">
        <Link href={href}>{cta}</Link>
      </Button>
    </div>
  );
}

function Channel({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: any;
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="break-all font-medium">{value}</p>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} target={href.startsWith('http') ? '_blank' : undefined} className="block hover:text-primary">
      {body}
    </Link>
  ) : (
    body
  );
}
