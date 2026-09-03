import type { Metadata } from 'next';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Görsel kaynakları ve atıf sayfası.
 *
 * Cins görsellerinin çoğu Wikimedia Commons'tan ve CC BY / CC BY-SA lisanslı.
 * Bu lisanslar esere ATIF YAPMAYI ZORUNLU KILIYOR — bu sayfa o yükümlülüğü
 * karşılıyor. Görseller kullanılmaya devam ettiği sürece bu sayfa yayında
 * kalmalı ve footer'dan erişilebilir olmalı.
 *
 * Liste scripts/fetch-breed-images.ts tarafından üretilen attributions.json
 * dosyasından okunuyor; görsel eklendikçe kendiliğinden güncelleniyor.
 */

export const metadata: Metadata = {
  title: 'Görsel Kaynakları ve Lisanslar | PetSemti',
  description:
    'PetSemti üzerinde kullanılan cins görsellerinin kaynakları, telif sahipleri ve lisans bilgileri.',
  // Atıf sayfası kullanıcı için değil yasal yükümlülük için; arama sonuçlarında
  // gerçek içerik sayfalarıyla rekabet etmesine gerek yok.
  robots: { index: false, follow: true },
};

type Attribution = {
  breed: string;
  category: string;
  file: string;
  source: string;
  artist: string;
  license: string;
  licenseUrl: string;
};

function loadAttributions(): Attribution[] {
  try {
    const path = resolve(process.cwd(), 'public/cins-gorselleri/attributions.json');
    return JSON.parse(readFileSync(path, 'utf8')) as Attribution[];
  } catch {
    return [];
  }
}

export default function ImageCreditsPage() {
  const attributions = loadAttributions();

  const byCategory = attributions.reduce<Record<string, Attribution[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10">
      <h1 className="text-2xl font-bold">Görsel Kaynakları ve Lisanslar</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Sitedeki cins görselleri Wikimedia Commons'tan alınmıştır ve Creative
        Commons lisansları altında kullanılmaktadır. Aşağıda her görselin
        telif sahibi, kaynağı ve lisansı listelenmiştir. Lisans metinlerine
        bağlantılardan ulaşabilirsiniz.
      </p>

      {attributions.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Henüz kayıtlı görsel kaynağı yok.
        </p>
      ) : (
        Object.entries(byCategory).map(([category, items]) => (
          <section key={category} className="mt-8">
            <h2 className="mb-3 text-lg font-bold">{category}</h2>
            <ul className="space-y-2 text-sm">
              {items.map((item) => (
                <li key={item.file} className="border-b pb-2">
                  <span className="font-medium">{item.breed}</span>
                  {' — '}
                  <span className="text-muted-foreground">{item.artist}</span>
                  {' · '}
                  {item.licenseUrl ? (
                    <a
                      href={item.licenseUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-primary hover:underline"
                    >
                      {item.license}
                    </a>
                  ) : (
                    <span>{item.license}</span>
                  )}
                  {item.source && (
                    <>
                      {' · '}
                      <a
                        href={item.source}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="text-primary hover:underline"
                      >
                        kaynak
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
