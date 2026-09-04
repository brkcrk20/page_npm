import type { Metadata } from 'next';
import Link from 'next/link';

import { Clause, LegalPage } from '@/components/LegalPage';
import { getSiteContact } from '@/lib/queries/site-settings';

export const metadata: Metadata = {
  title: 'Gizlilik Politikası | PetSemti',
  description:
    'PetSemti gizlilik politikası: hangi kişisel veriler işleniyor, neden, ne kadar saklanıyor ve KVKK kapsamındaki haklarınız.',
};

/**
 * Gizlilik politikası.
 *
 * Metin sitenin GERÇEK davranışını anlatıyor, genel bir şablon değil: hangi
 * kolonun herkese açık olduğu (public_profiles view'ı), telefonun neden
 * ilanla birlikte göründüğü, hesap silmenin neyi kapsadığı buradaki
 * uygulamayla birebir. Uygulamayla örtüşmeyen bir gizlilik metni, olmamasından
 * daha kötü.
 *
 * DİKKAT: HUKUKÇU İNCELEMESİNDEN GEÇMEDİ. VERBİS kaydı gerekiyorsa ayrıca
 * yapılmalı.
 */
export default async function Page() {
  const contact = await getSiteContact();
  const name = contact.legal_name || 'PetSemti';

  return (
    <LegalPage
      title="Gizlilik Politikası"
      updatedAt="3 Eylül 2026"
      intro="Bu metin, petsemti.com kullanırken hangi kişisel verilerinizin işlendiğini, neden işlendiğini ve haklarınızı açıklar."
    >
      <Clause no="1" title="Veri Sorumlusu">
        <p>
          Verileriniz {name} tarafından, 6698 sayılı Kişisel Verilerin Korunması Kanunu
          kapsamında veri sorumlusu sıfatıyla işlenir.
          {contact.address && ` Adres: ${contact.address}.`}
          {contact.email && ` İletişim: ${contact.email}.`}
        </p>
      </Clause>

      <Clause no="2" title="İşlenen Veriler">
        <p>
          <strong>Üyelik sırasında:</strong> ad soyad, kullanıcı adı, e-posta adresi,
          telefon numarası, şifreniz (geri döndürülemez şekilde şifrelenmiş olarak),
          kurumsal hesaplarda firma unvanı, vergi dairesi, vergi numarası ve işletme
          adresi.
        </p>
        <p>
          <strong>Kullanım sırasında:</strong> verdiğiniz ilanlar ve içerikleri,
          yüklediğiniz fotoğraf ve videolar, profil fotoğrafınız, favorileriniz, site
          içindeki mesajlaşmalarınız, ilan görüntülenme ve iletişim sayıları, son giriş
          tarihiniz.
        </p>
        <p>
          <strong>Ücretli hizmet alırsanız:</strong> sipariş kaydı ve faturanın
          gerektirdiği bilgiler.
        </p>
        <p>Şifreniz tarafımızdan görülemez; sıfırlanabilir ama okunamaz.</p>
      </Clause>

      <Clause no="3" title="Verilerin Kullanım Amacı">
        <ul className="list-disc space-y-1 pl-5">
          <li>Üyeliğinizi oluşturmak ve giriş yapmanızı sağlamak</li>
          <li>İlanlarınızı yayınlamak ve alıcıların size ulaşmasını sağlamak</li>
          <li>Site içi mesajlaşmayı işletmek</li>
          <li>Kural ihlallerini ve dolandırıcılığı tespit etmek</li>
          <li>Ücretli hizmetlerde sipariş ve fatura kaydı tutmak</li>
          <li>Yasal yükümlülükleri yerine getirmek</li>
        </ul>
      </Clause>

      <Clause no="4" title="Hangi Bilgileriniz Herkese Açık">
        <p>
          İlan verdiğinizde şunlar <strong>ilanınızla birlikte herkese görünür</strong>:
          adınız veya firma unvanınız, kullanıcı adınız, profil fotoğrafınız, varsa
          hakkınızda metniniz, üyelik tarihiniz ve{' '}
          <strong>telefon numaranız</strong>.
        </p>
        <p>
          Telefon numaranız ilanınızın iletişim numarasıdır; alıcının size ulaşmasının yolu
          budur. Numaranızı profilinizden değiştirdiğinizde tüm ilanlarınızda güncellenir.
          İlan vermediğiniz sürece numaranız hiçbir yerde yayınlanmaz.
        </p>
        <p>
          <strong>Numaranız ilan sayfasının kaynak kodunda bulunmaz.</strong> Ziyaretçi
          &quot;Telefonu Göster&quot; veya &quot;WhatsApp&quot; düğmesine bastığında
          sunucudan ayrıca istenir. Böylece sayfaları tarayan otomatik programlar tek
          seferde numara toplayamaz. Birincil iletişim yolu site içi mesajlaşmadır;
          numaranızı vermeden yazışabilirsiniz.
        </p>
        <p>
          <strong>Hiçbir koşulda yayınlanmayan bilgiler:</strong> e-posta adresiniz, TC
          kimlik numaranız, vergi numaranız ve işletme adresiniz (işletme kaydı açıp
          rehberde yayınlamayı kendiniz seçmediyseniz).
        </p>
      </Clause>

      <Clause no="5" title="Verilerin Paylaşımı">
        <p>
          Verileriniz pazarlama amacıyla üçüncü kişilere satılmaz veya kiralanmaz.
          Paylaşım yalnızca şu hâllerde olur:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Hizmetin çalışması için kullanılan altyapı sağlayıcıları (barındırma ve
            veritabanı hizmeti)
          </li>
          <li>Ücretli hizmetlerde ödeme kuruluşu</li>
          <li>Yetkili kamu kurumlarının hukuka uygun talepleri</li>
        </ul>
      </Clause>

      <Clause no="6" title="Çerezler">
        <p>
          Site, oturumunuzu açık tutmak için zorunlu çerezler kullanır. Bu çerezler
          olmadan giriş yapılamaz. Reklam amaçlı takip çerezi kullanılmamaktadır.
        </p>
      </Clause>

      <Clause no="7" title="Saklama Süresi">
        <p>
          Üyelik verileriniz hesabınız açık kaldığı sürece saklanır. Hesabınızı
          sildiğinizde ilanlarınız, fotoğraflarınız, videolarınız, mesajlarınız ve
          favorileriniz kalıcı olarak silinir.
        </p>
        <p>
          Ücretli bir hizmet aldıysanız, mali mevzuatın öngördüğü süre boyunca sipariş ve
          fatura kaydı saklanır; bu kayıt hesabınızla bağı koparılmış hâlde tutulur.
        </p>
      </Clause>

      <Clause no="8" title="Haklarınız">
        <p>KVKK m.11 uyarınca şunları talep edebilirsiniz:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Verilerinizin işlenip işlenmediğini öğrenme ve bilgi talep etme</li>
          <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
          <li>Silinmesini veya yok edilmesini isteme</li>
          <li>İşlemeye itiraz etme</li>
        </ul>
        <p>
          Bilgilerinizin çoğunu{' '}
          <Link href="/profil/hesap" className="text-primary hover:underline">
            hesap bilgileri
          </Link>{' '}
          sayfasından doğrudan düzeltebilir, hesabınızı aynı sayfadan kalıcı olarak
          silebilirsiniz. Diğer talepleriniz için{' '}
          <Link href="/iletisim" className="text-primary hover:underline">
            iletişim sayfasını
          </Link>{' '}
          kullanabilirsiniz.
        </p>
      </Clause>

      <Clause no="9" title="Güvenlik">
        <p>
          Veriler şifreli bağlantı üzerinden iletilir. Veritabanında satır düzeyinde erişim
          kuralları uygulanır: bir kullanıcı yalnızca kendi verisine erişebilir. Şifreler
          geri döndürülemez şekilde saklanır.
        </p>
      </Clause>

      <Clause no="10" title="Değişiklikler">
        <p>
          Bu politika güncellenebilir. Güncel metin bu sayfada yayımlanır ve yayımlandığı
          anda geçerli olur.
        </p>
      </Clause>
    </LegalPage>
  );
}
