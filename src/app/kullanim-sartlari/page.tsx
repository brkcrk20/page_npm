import type { Metadata } from 'next';
import Link from 'next/link';

import { Clause, LegalPage } from '@/components/LegalPage';
import { getSiteContact } from '@/lib/queries/site-settings';

export const metadata: Metadata = {
  title: 'Kullanım Şartları | PetSemti',
  description:
    'PetSemti kullanım şartları: üyelik, ilan verme kuralları, yasaklı içerikler, sorumluluk sınırları ve hesap kapatma.',
};

/**
 * Kullanım şartları.
 *
 * Bu sayfa kayıt formundaki zorunlu onay kutusundan bağlanıyordu ve YOKTU —
 * kullanıcı kabul ettiğini beyan ettiği metni 404 sayfasında görüyordu.
 * Kabul edilmesi istenen bir metnin okunabilir olmaması hem güven sorunu hem
 * de sözleşmenin geçerliliği açısından sorunlu.
 *
 * DİKKAT: Metin, benzer pazaryerlerinin yaygın uygulamalarına ve 6563 sayılı
 * kanunun "yer sağlayıcı" tanımına dayanarak yazıldı. HUKUKÇU İNCELEMESİNDEN
 * GEÇMEDİ. Yayına almadan önce bir avukata okutulmalı; özellikle sorumluluk
 * sınırları ve kişisel veri bölümü.
 */
export default async function Page() {
  const contact = await getSiteContact();
  const name = contact.legal_name || 'PetSemti';

  return (
    <LegalPage
      title="Kullanım Şartları"
      updatedAt="3 Eylül 2026"
      intro={`Bu metin, petsemti.com ("Site") üzerinden sunulan hizmetlerin kullanım koşullarını düzenler. Siteye üye olarak veya ilan vererek bu koşulları kabul etmiş sayılırsınız.`}
    >
      <Clause no="1" title="Tarafların Konumu">
        <p>
          {name}, Site üzerinde <strong>yer sağlayıcıdır</strong>. Doğrudan hayvan alım
          satımı yapmaz, ilan konusu hayvanın sahibi, satıcısı veya aracısı değildir.
          İlanların içeriği, doğruluğu ve hukuka uygunluğu tümüyle ilan sahibinin
          sorumluluğundadır.
        </p>
        <p>
          Site, kullanıcılar arasındaki iletişimi kolaylaştıran teknik bir altyapı sunar.
          Taraflar arasında kurulan hiçbir sözleşmenin tarafı değildir; ödeme, teslimat ve
          satış sonrası süreçlere karışmaz.
        </p>
      </Clause>

      <Clause no="2" title="Üyelik">
        <p>
          Üyelik ücretsizdir ve 18 yaşını doldurmuş kişiler tarafından açılabilir. Üyelik
          bilgilerinin doğru ve güncel olması zorunludur; özellikle telefon numarası,
          ilanlarınızda alıcıların size ulaşacağı numaradır ve size ait olmalıdır.
        </p>
        <p>
          Hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizin üçüncü kişilerce
          kullanıldığını fark ederseniz derhal değiştirmeniz gerekir.
        </p>
        <p>
          İşletme kayıtları (veteriner, pet oteli, kuaför, eğitmen, pet taksi, petshop,
          gezdirici) yalnızca kurumsal hesaplarla açılabilir ve yayına alınmadan önce
          incelenir.
        </p>
      </Clause>

      <Clause no="3" title="İlan Verme Kuralları">
        <p>İlanlarda aşağıdakiler zorunludur:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Başlık ve açıklamanın ilan konusunu doğru yansıtması</li>
          <li>Fotoğrafların ilana konu hayvana ait ve güncel olması</li>
          <li>Fiyat belirtiliyorsa gerçek satış fiyatı olması</li>
          <li>Yaş, cins, aşı ve sağlık bilgilerinin doğru verilmesi</li>
        </ul>
        <p>
          İlanlar yayına alındıktan sonra da denetlenebilir. Kurallara aykırı bulunan
          ilanlar yayından kaldırılır; tekrarı hâlinde hesap askıya alınabilir.
        </p>
      </Clause>

      <Clause no="4" title="Yasaklı İçerik ve Davranışlar">
        <p>Aşağıdakiler kesinlikle yasaktır:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Mevzuatça satışı, edinilmesi veya bulundurulması yasak olan türlere ilişkin
            ilanlar; yabani ve koruma altındaki hayvanlar
          </li>
          <li>Hayvana kötü muameleyi, dövüştürmeyi veya buna yönelik yetiştirmeyi içeren içerik</li>
          <li>Yanıltıcı fotoğraf, sahte belge, gerçek olmayan şecere veya sağlık raporu</li>
          <li>Başkasına ait ilan, fotoğraf veya metnin izinsiz kullanımı</li>
          <li>Aynı hayvan için çok sayıda ilan açarak listeleri doldurmak</li>
          <li>Site üzerinden dolandırıcılık, kapora tuzağı veya ödeme yönlendirmesi</li>
          <li>Otomatik araçlarla toplu veri çekme, siteye aşırı yük bindirme</li>
        </ul>
        <p>
          Hayvanların korunmasına ilişkin mevzuat ve yerel düzenlemelere uymak ilan
          sahibinin yükümlülüğündedir.
        </p>
      </Clause>

      <Clause no="5" title="İçerik Üzerindeki Haklar">
        <p>
          Yüklediğiniz fotoğraf, video ve metinlerin haklarına sahip olduğunuzu ya da
          kullanma yetkiniz bulunduğunu beyan edersiniz. Bu içerikleri, ilanınızın
          yayınlanması ve tanıtılması amacıyla kullanmamız için bize süresiz olmayan,
          devredilemez bir kullanım izni vermiş olursunuz. İlanınızı sildiğinizde bu izin
          sona erer.
        </p>
      </Clause>

      <Clause no="6" title="Ücretlendirme">
        <p>
          İlan vermek ücretsizdir. Öne çıkarma, kurumsal üyelik ve ilan hakkı paketleri
          gibi isteğe bağlı hizmetler ücretli olarak sunulabilir. Ücretli bir hizmet satın
          almadan önce fiyat ve kapsam açıkça gösterilir.
        </p>
        <p>
          Bir hizmetin ücretlendirilmeye başlaması, o tarihten önce ücretsiz kullanılmış
          hizmetler için geriye dönük bir borç doğurmaz.
        </p>
      </Clause>

      <Clause no="7" title="Sorumluluğun Sınırı">
        <p>
          Site, ilan içeriklerini önceden denetlemekle yükümlü değildir. Kullanıcılar
          arasındaki uyuşmazlıklardan, hayvanın sağlık durumundan, teslimattan veya
          ödemeden doğan zararlardan sorumlu tutulamaz.
        </p>
        <p>
          Hukuka aykırı bir içerik bildirildiğinde, bildirim değerlendirilir ve gerekliyse
          içerik yayından kaldırılır.
        </p>
        <p>
          Teknik arıza, bakım veya mücbir sebeplerle hizmete erişimin kesintiye uğraması
          hâlinde sorumluluk kabul edilmez.
        </p>
      </Clause>

      <Clause no="8" title="Hesabın Askıya Alınması ve Kapatılması">
        <p>
          Bu şartlara aykırı davranan hesaplar uyarı yapılmaksızın askıya alınabilir veya
          kapatılabilir. Hesabınızı dilediğiniz zaman{' '}
          <Link href="/profil/hesap" className="text-primary hover:underline">
            hesap bilgileri
          </Link>{' '}
          sayfasından kalıcı olarak silebilirsiniz. Silme işlemi ilanlarınızı,
          fotoğraflarınızı, mesajlarınızı ve favorilerinizi kapsar; mali kayıtlar mevzuatın
          gerektirdiği süre boyunca saklanır.
        </p>
      </Clause>

      <Clause no="9" title="Kişisel Veriler">
        <p>
          Kişisel verilerinizin işlenmesine ilişkin bilgilendirme{' '}
          <Link href="/gizlilik-politikasi" className="text-primary hover:underline">
            Gizlilik Politikası
          </Link>{' '}
          sayfasında yer alır.
        </p>
      </Clause>

      <Clause no="10" title="Değişiklikler ve Yürürlük">
        <p>
          Bu şartlar güncellenebilir. Güncel metin bu sayfada yayımlandığı anda yürürlüğe
          girer; Siteyi kullanmaya devam etmeniz güncel şartları kabul ettiğiniz anlamına
          gelir.
        </p>
        <p>
          Uyuşmazlıklarda Türkiye Cumhuriyeti hukuku uygulanır.
          {contact.address ? ` Yetkili merci: ${contact.address} adresinin bağlı bulunduğu mahkeme ve icra daireleri.` : ''}
        </p>
      </Clause>

      <Clause no="11" title="İletişim">
        <p>
          Sorularınız ve bildirimleriniz için{' '}
          <Link href="/iletisim" className="text-primary hover:underline">
            iletişim sayfamızı
          </Link>{' '}
          kullanabilirsiniz.
        </p>
      </Clause>
    </LegalPage>
  );
}
