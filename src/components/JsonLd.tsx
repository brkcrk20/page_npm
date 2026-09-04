/**
 * Yapısal veri (schema.org / JSON-LD).
 *
 * Sitede hiç yoktu. Bu, arama sonuçlarında en görünür farkı yaratan
 * eksiklerden biri: yapısal veri olmadan Google ilanı düz bir bağlantı
 * olarak gösteriyor; olduğunda fiyat, stok durumu, görsel, konum ve
 * kırıntı yolu sonucun içinde çıkıyor. Pet ilanı gibi rekabetin yüksek
 * olduğu bir alanda tıklama oranını doğrudan etkiliyor.
 *
 * dangerouslySetInnerHTML kullanılıyor çünkü script içeriği JSX metni
 * olarak kaçırılırsa (&quot; gibi) geçersiz JSON üretiyor. İçerik bizim
 * ürettiğimiz nesneden geliyor, kullanıcı girdisi JSON.stringify ile
 * kaçırılıyor; `<` karakteri ayrıca escape ediliyor ki metin içindeki
 * "</script>" etiketi bloğu erken kapatamasın.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
