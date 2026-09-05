/**
 * scripts/fetch-guide-covers.ts
 *
 * Rehber yazılarının kapak görsellerini Wikimedia Commons'tan indirir,
 * 16:9 kırpıp WebP'ye çevirir ve public/rehber-gorselleri/ altına yazar.
 * Sonra guides.cover_path alanını günceller.
 *
 *   npx tsx scripts/fetch-guide-covers.ts
 *   npx tsx scripts/fetch-guide-covers.ts --force
 *
 * Cins görselleriyle aynı lisans disiplini: yalnızca ticari kullanıma açık
 * lisanslar (CC0, PD, CC-BY, CC-BY-SA) indiriliyor ve CC-BY / CC-BY-SA
 * atıf zorunlu kıldığı için her görselin yazarı ve lisansı
 * public/rehber-gorselleri/attributions.json içine yazılıyor.
 * /gorsel-kaynaklari sayfası bu dosyayı da yayınlıyor. Silmeyin.
 *
 * Stok görsel kullanılmıyor: hem lisans riski hem de yazıyla ilgisi olmayan
 * genel bir fotoğrafın okuyucuya hiçbir şey anlatmaması.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { setDefaultResultOrder } from 'node:dns';

/**
 * upload.wikimedia.org bazı ağlarda yalnızca IPv4 üzerinden yanıt veriyor;
 * Node varsayılan olarak IPv6'yı önce deniyor ve indirme zaman aşımına
 * uğruyor. API çağrıları çalıştığı için sorun ilk bakışta görünmüyordu:
 * görsel bulunuyor, indirilemiyordu.
 */
setDefaultResultOrder('ipv4first');

const UA = 'PetSemtiBot/1.0 (https://petsemti.com; iletisim@petsemti.com)';
const OUT = resolve(process.cwd(), 'public/rehber-gorselleri');
const GENISLIK = 1200;
const YUKSEKLIK = 675; // 16:9 — paylaşım kartı ve kart ızgarası aynı oranı kullanıyor
const KALITE = 78;

const ALLOWED_LICENSE =
  /^(cc0|cc[- ]?by([- ]?sa)?([- ]?\d(\.\d)?)?|public domain|pd|no restrictions)/i;

/**
 * Yazı adresine göre arama terimleri.
 *
 * Yazının başlığını doğrudan aramak işe yaramıyor ("Köpeklerde aşı
 * takvimi" diye bir Commons maddesi yok). Her yazı için konuyu görsel
 * olarak anlatan İngilizce madde adları veriliyor; sırayla deneniyor.
 */
const TERIMLER: Record<string, string[]> = {
  'yavru-kopek-sahiplenirken-nelere-dikkat-edilir': ['Puppy', 'Golden Retriever', 'Labrador Retriever', 'Dog'],
  'british-shorthair-bakimi': ['British Shorthair', 'British Shorthair cat'],
  'kopeklerde-asi-takvimi': ['Veterinarian', 'Vaccination', 'Dog'],
  'kedi-kaybolunca-ne-yapilmali': ['Cat', 'Domestic cat', 'Feral cat'],
  'pet-oteli-secerken-dikkat-edilmesi-gerekenler': ['Dog kennel', 'Animal shelter', 'Dog'],
  'ilk-kez-kedi-sahiplenenler-icin-rehber': ['Kitten', 'Domestic cat'],
};

/** Konu bilinmiyorsa hayvan türünden makul bir yedek. */
const YEDEK = ['Pet', 'Domestic animal'];

type Atif = {
  guide: string;
  file: string;
  source: string;
  artist: string;
  license: string;
  licenseUrl: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function api(host: string, params: Record<string, string>) {
  const url = new URL(`https://${host}/w/api.php`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`${host} ${res.status}`);
  return res.json();
}

async function gorselAdi(baslik: string): Promise<string | null> {
  const data = await api('en.wikipedia.org', {
    action: 'query',
    prop: 'pageimages',
    piprop: 'name',
    titles: baslik,
    redirects: '1',
  });
  const page = data?.query?.pages?.[0];
  if (!page || page.missing) return null;
  return page.pageimage ? `File:${page.pageimage}` : null;
}

async function gorselBilgi(dosya: string) {
  const data = await api('commons.wikimedia.org', {
    action: 'query',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    titles: dosya,
  });
  const info = data?.query?.pages?.[0]?.imageinfo?.[0];
  if (!info) return null;

  const meta = info.extmetadata ?? {};
  const strip = (html?: string) =>
    (html ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

  return {
    url: info.url as string,
    descriptionUrl: info.descriptionurl as string,
    license: strip(meta.LicenseShortName?.value) || 'bilinmiyor',
    licenseUrl: strip(meta.LicenseUrl?.value),
    artist: strip(meta.Artist?.value) || 'bilinmiyor',
  };
}

async function main() {
  const force = process.argv.includes('--force');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  const { data: yazilar, error } = await supabase
    .from('guides')
    .select('id, slug, title, cover_path');
  if (error) {
    console.error('Yazılar alınamadı:', error.message);
    process.exit(1);
  }

  mkdirSync(OUT, { recursive: true });
  const atifYolu = resolve(OUT, 'attributions.json');
  const atiflar: Atif[] = existsSync(atifYolu)
    ? JSON.parse(readFileSync(atifYolu, 'utf8'))
    : [];
  const varOlan = new Set(atiflar.map((a) => a.file));

  let ok = 0;
  const eksik: string[] = [];

  for (const y of yazilar ?? []) {
    if (y.cover_path && !force) {
      continue;
    }

    const hedefAd = `${y.slug}.webp`;
    const hedef = resolve(OUT, hedefAd);
    const gorunur = `/rehber-gorselleri/${hedefAd}`;

    let bulunan: Awaited<ReturnType<typeof gorselBilgi>> = null;
    for (const terim of TERIMLER[y.slug] ?? YEDEK) {
      try {
        const dosya = await gorselAdi(terim);
        if (dosya) {
          const bilgi = await gorselBilgi(dosya);
          if (bilgi && ALLOWED_LICENSE.test(bilgi.license)) {
            bulunan = bilgi;
            break;
          }
        }
      } catch {
        // Tek bir sorgu hatası tüm koşuyu durdurmasın.
      }
      await sleep(150);
    }

    if (!bulunan) {
      eksik.push(y.slug);
      continue;
    }

    try {
      const res = await fetch(bulunan.url, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error(`indirilemedi ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());

      await sharp(buffer)
        .resize(GENISLIK, YUKSEKLIK, { fit: 'cover', position: 'attention' })
        .webp({ quality: KALITE, effort: 6 })
        .toFile(hedef);

      const { error: guncelleme } = await supabase
        .from('guides')
        .update({ cover_path: gorunur })
        .eq('id', y.id);
      if (guncelleme) throw new Error(guncelleme.message);

      if (!varOlan.has(gorunur)) {
        atiflar.push({
          guide: y.title,
          file: gorunur,
          source: bulunan.descriptionUrl,
          artist: bulunan.artist,
          license: bulunan.license,
          licenseUrl: bulunan.licenseUrl,
        });
        varOlan.add(gorunur);
      }
      ok++;
      console.log(`  ✓ ${y.slug} — ${bulunan.license}`);
    } catch (e) {
      eksik.push(`${y.slug} (${e instanceof Error ? e.message : e})`);
    }
    await sleep(150);
  }

  writeFileSync(atifYolu, JSON.stringify(atiflar, null, 2) + '\n');
  console.log(`\nİndirilen: ${ok}`);
  if (eksik.length) console.log('Bulunamayan:', eksik.join(', '));
}

void main();
