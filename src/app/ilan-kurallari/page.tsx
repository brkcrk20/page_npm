import type { Metadata } from 'next';
import Link from 'next/link';

import { Clause, LegalPage } from '@/components/LegalPage';
import { createSupabasePublicClient, isSupabaseServerConfigured } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'İlan Verme Kuralları',
  description:
    'PetSemti ilan verme kuralları: yasaklı ırklar, yaş ve aşı şartı, yasaklı içerikler, fotoğraf kuralları ve ilanın kaldırılma sebepleri.',
  alternates: { canonical: '/ilan-kurallari' },
};

export const revalidate = 3600;

/**
 * İlan verme kuralları.
 *
 * İncelediğim Türk ilan sitelerinin tamamında var ve iki işi birden
 * görüyor: kullanıcıya ne yapabileceğini söylemek, moderasyon kararlarına
 * dayanak oluşturmak. "İlanınız kaldırıldı" demenin ardında gösterilecek
 * bir metin olmadan moderasyon keyfî görünüyor.
 *
 * Yasaklı ırk listesi koda gömülü değil, veritabanından okunuyor: mevzuat
 * değişince tek satır güncellemeyle güncelleniyor ve ilan muhafızıyla aynı
 * kaynağı kullanıyor — sayfada yazan ile uygulanan kural ayrışamıyor.
 */
async function getRestrictedBreeds(): Promise<string[]> {
  if (!isSupabaseServerConfigured()) return [];
  try {
    const { data } = await createSupabasePublicClient()
      .from('breeds')
      .select('name')
      .eq('is_restricted', true)
      .order('name');
    return (data ?? []).map((b: { name: string }) => b.name);
  } catch {
    return [];
  }
}

export default async function Page() {
  const restricted = await getRestrictedBreeds();

  return (
    <LegalPage
      title="İlan Verme Kuralları"
      updatedAt="3 Eylül 2026"
      intro="İlanınızın yayında kalması için uyulması gereken kurallar. Bu kurallara aykırı ilanlar uyarı yapılmadan yayından kaldırılır."
    >
      <Clause no="1" title="Yasaklı Irklar">
        <p>
          5199 sayılı Hayvanları Koruma Kanunu uyarınca bazı ırkların satışı,
          sahiplendirilmesi, takası, sergilenmesi ve üretimi <strong>yasaktır</strong>. Bu
          ırklara ait ilan açılamaz; sistem bu ilanları kabul etmez.
        </p>
        {restricted.length > 0 && (
          <ul className="list-disc space-y-1 pl-5">
            {restricted.map((name) => (
              <li key={name}>
                <strong>{name}</strong>
              </li>
            ))}
          </ul>
        )}
        <p>
          Bu ırklara sahip olanların mevcut hayvanlarını bulundurma hakkı saklıdır; yasak
          olan alım, satım ve sahiplendirme işlemidir. Kısırlaştırma ve kayıt yükümlülükleri
          için ilçe tarım müdürlüğüne başvurun.
        </p>
      </Clause>

      <Clause no="2" title="Yaş ve Sağlık Şartı">
        <p>
          <strong>2 aylığını doldurmamış</strong> yavruların satışı ve annesinden ayrılması
          yasaktır. Aşıları yapılmamış hayvanlar için satış ilanı verilemez.
        </p>
        <p>
          İlanda belirtilen yaş, aşı ve sağlık bilgileri doğru olmak zorundadır. Aşı karnesi,
          varsa şecere ve sağlık raporu alıcıya teslim edilmelidir.
        </p>
      </Clause>

      <Clause no="3" title="Yasaklı İçerikler">
        <ul className="list-disc space-y-1 pl-5">
          <li>Yabani ve koruma altındaki türler</li>
          <li>Hayvan dövüşü, dövüş için yetiştirme veya buna özendiren içerik</li>
          <li>Hayvana kötü muamele içeren fotoğraf, video veya metin</li>
          <li>Kulak/kuyruk kesimi gibi estetik amaçlı müdahalelerin reklamı</li>
          <li>Sahte belge, gerçek olmayan şecere veya sağlık raporu</li>
          <li>Başkasına ait ilan, fotoğraf veya metnin izinsiz kullanımı</li>
        </ul>
      </Clause>

      <Clause no="4" title="Fotoğraf Kuralları">
        <ul className="list-disc space-y-1 pl-5">
          <li>Fotoğraflar ilana konu hayvana ait ve güncel olmalı</li>
          <li>İnternetten alınmış veya başka bir ilandan kopyalanmış fotoğraf kullanılamaz</li>
          <li>Fotoğraf üzerine telefon numarası, adres veya başka site adı yazılamaz</li>
          <li>Yüz, plaka gibi üçüncü kişilere ait bilgiler görünmemeli</li>
        </ul>
      </Clause>

      <Clause no="5" title="İlan Düzeni">
        <ul className="list-disc space-y-1 pl-5">
          <li>Başlık ilan konusunu yansıtmalı; büyük harfle bağırma ve yıldız/sembol dizisi kullanılmamalı</li>
          <li>Aynı hayvan için birden fazla ilan açılamaz</li>
          <li>İlan doğru kategoride ve doğru ırkla açılmalı</li>
          <li>Fiyat belirtiliyorsa gerçek satış fiyatı olmalı</li>
          <li>Açıklamada başka bir siteye veya sosyal medya hesabına yönlendirme yapılamaz</li>
        </ul>
      </Clause>

      <Clause no="6" title="İletişim">
        <p>
          İlanınızda görünen telefon numarası profilinizden alınır ve size ait olmalıdır.
          Başkasına ait numarayla ilan verilemez.
        </p>
      </Clause>

      <Clause no="7" title="Kural İhlalinde Ne Olur?">
        <p>
          Kurallara aykırı ilanlar yayından kaldırılır. Tekrarlayan ihlallerde hesap askıya
          alınabilir veya kapatılabilir. Dolandırıcılık şüphesi taşıyan durumlar yetkili
          mercilere bildirilir.
        </p>
        <p>
          Kurallara aykırı bir ilan gördüğünüzde ilan sayfasındaki{' '}
          <strong>“Şikayet Et”</strong> bağlantısını kullanabilirsiniz. Bildiriminiz ilan
          sahibine gösterilmez.
        </p>
      </Clause>

      <Clause no="8" title="Platformun Konumu">
        <p>
          PetSemti bir <strong>yer sağlayıcıdır</strong>. Doğrudan hayvan satışı yapmaz, ilan
          konusu hayvanın sahibi veya aracısı değildir, komisyon almaz. İlanların içeriğinden
          ilan sahibi sorumludur. Ayrıntı için{' '}
          <Link href="/kullanim-sartlari" className="text-primary hover:underline">
            Kullanım Şartları
          </Link>
          .
        </p>
      </Clause>
    </LegalPage>
  );
}
