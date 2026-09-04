import { JsonLd } from '@/components/JsonLd';
import type { SayfaIcerigi } from '@/lib/queries/page-content';

/**
 * Liste sayfalarının özgün metin blokları.
 *
 * İki parça: listenin ÜSTÜNDE kısa bir giriş, ALTINDA uzun metin ve SSS.
 * Uzun metni yukarı koymak, aradığı ilanı görmek isteyen kullanıcıyı üç
 * paragraf okumaya zorlardı.
 *
 * SSS ayrıca FAQPage işaretlemesiyle veriliyor: arama sonucunda soruların
 * açılır liste olarak görünmesi tıklama oranını gözle görülür artırıyor.
 * İşaretleme yalnızca sayfada GÖRÜNEN sorular için üretiliyor — görünmeyen
 * içeriği işaretlemek arama motoru kurallarına aykırı.
 */

export function PageIntro({ icerik }: { icerik: SayfaIcerigi | null }) {
  if (!icerik?.intro?.trim()) return null;

  return (
    <p className="mb-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
      {icerik.intro}
    </p>
  );
}

export function PageBody({ icerik }: { icerik: SayfaIcerigi | null }) {
  if (!icerik) return null;

  const paragraflar = (icerik.body ?? '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraflar.length === 0 && icerik.faq.length === 0) return null;

  return (
    <>
      {icerik.faq.length > 0 && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: icerik.faq.map((s) => ({
              '@type': 'Question',
              name: s.soru,
              acceptedAnswer: { '@type': 'Answer', text: s.cevap },
            })),
          }}
        />
      )}

      <section className="mt-10 space-y-6 rounded-xl border bg-white p-6">
        {paragraflar.length > 0 && (
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            {paragraflar.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>
        )}

        {icerik.faq.length > 0 && (
          <div>
            <h2 className="mb-3 text-lg font-bold text-foreground">Sık Sorulan Sorular</h2>
            <dl className="divide-y">
              {icerik.faq.map((s) => (
                <div key={s.soru} className="py-3 first:pt-0 last:pb-0">
                  <dt className="font-medium">{s.soru}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {s.cevap}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>
    </>
  );
}
