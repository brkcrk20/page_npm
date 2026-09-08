import { JsonLd } from '@/components/JsonLd';

/**
 * Ana sayfa sık sorulan sorular.
 *
 * İki işi birden görüyor. Birincisi kullanıcı: siteye ilk kez gelen kişi
 * "burada ne satılıyor, ücretli mi, güvenli mi" sorularının cevabını
 * ilanların altında buluyor. İkincisi arama: FAQPage işaretlemesi bu
 * soruların Google sonucunda açılır liste olarak görünmesini sağlıyor ve
 * sohbet tabanlı aramalarda ("petsemti güvenilir mi") doğrudan alıntı
 * verilebilecek bir kaynak oluşturuyor.
 *
 * Sorular gerçek: destek kutusuna gelen ve Yardım Merkezi'nde en çok
 * okunan başlıklardan seçildi. İşaretleme yalnızca sayfada GÖRÜNEN
 * soruları taşıyor — görünmeyeni işaretlemek arama motoru kurallarına
 * aykırı.
 */

const SORULAR: { soru: string; cevap: string }[] = [
  {
    soru: 'PetSemti nedir?',
    cevap:
      'PetSemti; evcil hayvan ilanları, yerel pet hizmetleri ve güvercin dünyasını tek yerde toplayan bir pet yaşam platformudur. Kedi, köpek, kuş, akvaryum ve güvercin ilanlarının yanında kayıp-bulundu bölümü, ikinci el pet malzemeleri ve yedi başlıkta hizmet rehberi bulunuyor.',
  },
  {
    soru: 'İlan vermek ücretli mi?',
    cevap:
      'Hayır. Üyelik de ilan vermek de ücretsiz. Şu anda sitede ücretli bir paket satışı yapılmıyor.',
  },
  {
    soru: 'Hayvan satışı yapabilir miyim?',
    cevap:
      '5199 sayılı Hayvanları Koruma Kanunu uyarınca kedi, köpek ve gelinciklerin satışı yalnızca üretim izni bulunan işletmeler üzerinden yapılabiliyor. Bu yüzden bireysel hesaplar yalnızca ücretsiz sahiplendirme ilanı verebiliyor; satış için kurumsal hesap gerekiyor. Güvercin ve pet malzemeleri bu kuralın dışında.',
  },
  {
    soru: 'Sahiplendirme ilanında ücret istenebilir mi?',
    cevap:
      'Hayır. Sahiplendirme ilanında ücret, "aşı masrafı" ya da "kapora" adı altında para talep edilmesi yasak. Böyle bir durumla karşılaşırsanız ilanı bildirin.',
  },
  {
    soru: 'İlan sahibinin telefonunu kimler görebiliyor?',
    cevap:
      'Yalnızca giriş yapmış üyeler. Numara sayfanın kaynağında bulunmuyor; "Telefonu Göster" düğmesine basıldığında sunucudan isteniyor. Bu, numaraları toplayan otomatik yazılımlara karşı alınmış bir önlem.',
  },
  {
    soru: 'Dolandırıcılıktan nasıl korunurum?',
    cevap:
      'Görmediğiniz bir hayvan ya da ürün için asla ön ödeme yapmayın. Kargoyla hayvan gönderme teklifleri ciddiye alınmamalı. Hayvanı yerinde, mümkünse annesiyle birlikte görün; aşı karnesini ve mikroçip kaydını isteyin. Görüşmeyi site içi mesajla yürütün.',
  },
  {
    soru: 'İlanım ne kadar süre yayında kalır?',
    cevap:
      'İlanlar 30 gün boyunca listelerde görünüyor. Süre dolduğunda ilan silinmiyor, yayından kalkıyor; İlanlarım sayfasından tek tıkla yeniden yayına alabiliyorsunuz.',
  },
  {
    soru: 'Kaybolan hayvanım için ne yapabilirim?',
    cevap:
      'Kayıp & Bulundu bölümünden ücretsiz kayıp ilanı verebilirsiniz. İlanda kaybolduğu semti, tarihi ve varsa mikroçip numarasını yazın; ayırt edici bir özelliği ise sahiplik doğrulaması için kendinize saklayın. Aynı bölümde bulunan hayvan ilanları da yayımlanıyor.',
  },
];

export function AnaSayfaSSS() {
  return (
    <section className="rounded-xl border bg-white p-6 md:p-8">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: SORULAR.map((s) => ({
            '@type': 'Question',
            name: s.soru,
            acceptedAnswer: { '@type': 'Answer', text: s.cevap },
          })),
        }}
      />

      <h2 className="text-xl font-bold md:text-2xl">Sık Sorulan Sorular</h2>
      <dl className="mt-4 divide-y">
        {SORULAR.map((s) => (
          <div key={s.soru} className="py-3.5 first:pt-0 last:pb-0">
            <dt className="font-medium">{s.soru}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.cevap}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
