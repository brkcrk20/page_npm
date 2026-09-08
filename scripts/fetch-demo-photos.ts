/**
 * scripts/fetch-demo-photos.ts
 *
 * Demo ilanların fotoğraflarını Wikimedia Commons'tan indirir, ilan
 * fotoğrafı ölçüsüne getirir ve Supabase Storage'a yükler.
 *
 *   npx tsx scripts/fetch-demo-photos.ts
 *   npx tsx scripts/fetch-demo-photos.ts --force
 *
 * Neden Commons: stok fotoğraf siteleri hem lisans riski taşıyor hem de
 * "gerçek bir ilan gibi durması" hedefinin tam tersini veriyor — stüdyoda
 * çekilmiş, sahibi belli olmayan bir köpek fotoğrafı ilandan çok reklama
 * benziyor. Commons'taki fotoğrafların çoğu insanların kendi hayvanlarını
 * çektiği kareler.
 *
 * Yalnızca ticari kullanıma açık lisanslar (CC0, PD, CC-BY, CC-BY-SA)
 * indiriliyor. CC-BY ve CC-BY-SA atıf zorunlu kıldığı için her fotoğrafın
 * yazarı ve lisansı demo-fotograflar.json içine yazılıyor;
 * /gorsel-kaynaklari sayfası bu dosyayı da yayınlıyor. Silmeyin.
 *
 * Fotoğraflar demo içerik silinse bile depolamada kalıyor: "demo ekle"
 * düğmesi tekrar basıldığında yeniden indirme gerekmesin.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setDefaultResultOrder } from 'node:dns';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

import { DEMO_ILANLAR } from '../src/lib/demo/ilanlar';

/** upload.wikimedia.org burada yalnızca IPv4 üzerinden yanıt veriyor. */
setDefaultResultOrder('ipv4first');

const UA = 'PetSemtiBot/1.0 (https://petsemti.com; iletisim@petsemti.com)';
const KOVA = 'ilan-fotograflari';
const ONEK = 'demo';
const GENISLIK = 1200;
const KALITE = 80;
const ATIF_YOLU = resolve(process.cwd(), 'src/lib/demo/fotograf-atiflari.json');

const IZINLI_LISANS =
  /^(cc0|cc[- ]?by([- ]?sa)?([- ]?\d(\.\d)?)?|public domain|pd|no restrictions)/i;

/**
 * Fotoğraf olmayan dosyaları eleyen başlık süzgeci.
 *
 * İlk koşuda arama "Guppy" için Aero Spacelines Guppy kargo uçağını,
 * "Guinea pig" için doku kesiti mikroskop görüntülerini, "Damascene" için
 * Şam işi kakma tepsileri getirdi. Commons'ta bir terimin ansiklopedik
 * karşılığı çoğu zaman aradığımız şey değil; ilanda gravür, çizim ya da
 * mikroskop görüntüsü işe yaramıyor.
 */
const FOTOGRAF_DEGIL =
  /(engrav|illustrat|drawing|dessin|painting|lithograph|woodcut|etching|diagram|schema|map |chart|histolog|micrograph|section|slide|logo|coat of arms|stamp|banknote|aircraft|airplane|plane |aero |locomotive|poster|manuscript|book|cover|icon|symbol|advert|catalog|plate |museum|exhibit|aquarium of|zoo |\.svg|\.tif)/i;

/**
 * Çekim tarihi olmayan dosyalar eleniyor.
 *
 * Kategori süzgeci gravürleri ve eski baskı taramalarını tam
 * temizlemedi: "Category:Fancy pigeons" içinde 19. yüzyıl kitap
 * sayfaları, "Category:Hamsters" içinde gravürler var. Ayırt eden en
 * güvenilir işaret fotoğraf makinesinin bıraktığı çekim tarihi: taranmış
 * bir baskıda bu alan ya yok ya da yüz yıl öncesini gösteriyor.
 */
function fotografTarihiUygun(meta: any): boolean {
  const ham = String(meta?.DateTimeOriginal?.value ?? '').replace(/<[^>]*>/g, '');
  const yil = Number(ham.match(/(19|20)\d{2}/)?.[0] ?? 0);
  return yil >= 1995;
}

type Atif = {
  ilan: string;
  path: string;
  source: string;
  artist: string;
  license: string;
  licenseUrl: string;
};

const uyu = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function commons(params: Record<string, string>) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`commons ${res.status}`);
  return res.json();
}

const metniTemizle = (html?: string) =>
  (html ?? '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

/**
 * Aday dosyalar.
 *
 * Terim "Category:" ile başlıyorsa o kategorinin dosyaları listeleniyor,
 * aksi hâlde serbest arama yapılıyor.
 *
 * Kategori tercih ediliyor çünkü serbest arama Commons'ta çok gürültülü:
 * "Guppy" kargo uçağını, "Guinea pig" doku kesitlerini, "Fancy pigeon"
 * 19. yüzyıl gravürlerini getiriyordu. Kategoriler insan eliyle
 * derlendiği için içindeki dosyalar gerçekten o konuya ait.
 */
async function adaylar(terim: string, adet: number, tarihSart = true) {
  const kategoriMi = terim.startsWith('Category:');
  const data = kategoriMi
    ? await commons({
        action: 'query',
        generator: 'categorymembers',
        gcmtitle: terim,
        gcmtype: 'file',
        gcmlimit: String(adet * 8),
        prop: 'imageinfo',
        iiprop: 'url|extmetadata|size|mime',
      })
    : await commons({
        action: 'query',
        generator: 'search',
        gsrnamespace: '6',
        gsrsearch: `${terim} filetype:bitmap`,
        gsrlimit: String(adet * 4),
        prop: 'imageinfo',
        iiprop: 'url|extmetadata|size|mime',
      });

  const sayfalar: any[] = data?.query?.pages ?? [];
  const cikti = [];
  for (const s of sayfalar) {
    const info = s.imageinfo?.[0];
    if (!info) continue;
    if (FOTOGRAF_DEGIL.test(String(s.title ?? ''))) continue;
    // Yalnızca gerçek fotoğraf biçimleri; çizim ve tarama çoğunlukla
    // png/tif/svg olarak yükleniyor.
    if (!/^image\/(jpeg|webp)$/.test(String(info.mime ?? ''))) continue;
    // Küçük ve dar görseller ilan fotoğrafı olarak kullanılamıyor.
    if ((info.width ?? 0) < 800 || (info.height ?? 0) < 600) continue;

    const meta = info.extmetadata ?? {};
    const lisans = metniTemizle(meta.LicenseShortName?.value) || 'bilinmiyor';
    if (!IZINLI_LISANS.test(lisans)) continue;
    if (tarihSart && !fotografTarihiUygun(meta)) continue;

    cikti.push({
      url: info.url as string,
      source: info.descriptionurl as string,
      license: lisans,
      licenseUrl: metniTemizle(meta.LicenseUrl?.value),
      artist: metniTemizle(meta.Artist?.value) || 'bilinmiyor',
    });
  }
  return cikti;
}

/**
 * Elle seçilmiş dosyaların bilgisi.
 *
 * Süzgeçler uygulanmıyor: dosyayı zaten insan seçti. Yalnızca lisans
 * kontrol ediliyor, çünkü atıf yükümlülüğü için gerekli.
 */
async function secilenler(dosyalar: string[]) {
  const data = await commons({
    action: 'query',
    titles: dosyalar.map((d) => (d.startsWith('File:') ? d : `File:${d}`)).join('|'),
    prop: 'imageinfo',
    iiprop: 'url|extmetadata|size|mime',
  });
  const sayfalar: any[] = data?.query?.pages ?? [];
  const sirali = dosyalar.map((d) => {
    const ad = (d.startsWith('File:') ? d : `File:${d}`).replace(/_/g, ' ');
    return sayfalar.find((s) => String(s.title).replace(/_/g, ' ') === ad);
  });

  const cikti = [];
  for (const s of sirali) {
    const info = s?.imageinfo?.[0];
    if (!info) continue;
    const meta = info.extmetadata ?? {};
    const lisans = metniTemizle(meta.LicenseShortName?.value) || 'bilinmiyor';
    if (!IZINLI_LISANS.test(lisans)) {
      console.log(`  ! lisans uygun değil, atlandı: ${s.title} (${lisans})`);
      continue;
    }
    cikti.push({
      url: info.url as string,
      source: info.descriptionurl as string,
      license: lisans,
      licenseUrl: metniTemizle(meta.LicenseUrl?.value),
      artist: metniTemizle(meta.Artist?.value) || 'bilinmiyor',
    });
  }
  return cikti;
}

async function main() {
  const force = process.argv.includes('--force');
  /** --only=slug1,slug2 — yalnızca bu ilanları yeniden çeker. */
  const sadece = process.argv
    .find((a) => a.startsWith('--only='))
    ?.slice('--only='.length)
    .split(',')
    .filter(Boolean);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  mkdirSync(resolve(process.cwd(), 'src/lib/demo'), { recursive: true });
  const atiflar: Atif[] = existsSync(ATIF_YOLU)
    ? JSON.parse(readFileSync(ATIF_YOLU, 'utf8'))
    : [];
  const varOlan = new Map(atiflar.map((a) => [a.path, a]));

  let yeni = 0;
  const eksik: string[] = [];

  for (const ilan of DEMO_ILANLAR) {
    if (sadece && !sadece.includes(ilan.slug)) continue;
    const gerekli = ilan.fotografSayisi ?? 3;
    const mevcut = atiflar.filter((a) => a.ilan === ilan.slug).length;
    if (mevcut >= gerekli && !force && !sadece) continue;

    let bulunanlar: Awaited<ReturnType<typeof adaylar>> = [];

    if (ilan.gorseller?.length) {
      bulunanlar = await secilenler(ilan.gorseller);
    }

    for (const terim of bulunanlar.length ? [] : ilan.gorselTerimleri) {
      try {
        const liste = await adaylar(terim, gerekli);
        for (const a of liste) {
          if (bulunanlar.some((b) => b.url === a.url)) continue;
          bulunanlar.push(a);
          if (bulunanlar.length >= gerekli) break;
        }
      } catch {
        // Tek terimin hatası tüm ilanı düşürmesin.
      }
      if (bulunanlar.length >= gerekli) break;
      await uyu(200);
    }

    // Hiçbir aday çekim tarihi süzgecinden geçmediyse aynı terimleri
    // tarih şartı olmadan bir kez daha deniyoruz: bazı kategorilerde
    // fotoğrafların tamamı tarihsiz yüklenmiş oluyor.
    if (bulunanlar.length === 0 && !ilan.gorseller?.length) {
      for (const terim of ilan.gorselTerimleri) {
        try {
          for (const a of await adaylar(terim, gerekli, false)) {
            if (bulunanlar.some((b) => b.url === a.url)) continue;
            bulunanlar.push(a);
            if (bulunanlar.length >= gerekli) break;
          }
        } catch {
          /* yoksay */
        }
        if (bulunanlar.length >= gerekli) break;
        await uyu(300);
      }
    }

    if (bulunanlar.length === 0) {
      eksik.push(ilan.slug);
      continue;
    }

    for (let i = 0; i < bulunanlar.length; i++) {
      const kaynak = bulunanlar[i];
      const yol = `${ONEK}/${ilan.slug}/${i + 1}.webp`;
      if (varOlan.has(yol) && !force && !sadece) continue;

      try {
        const res = await fetch(kaynak.url, { headers: { 'User-Agent': UA } });
        if (!res.ok) throw new Error(`indirilemedi ${res.status}`);

        const govde = await sharp(Buffer.from(await res.arrayBuffer()))
          .rotate()
          .resize({ width: GENISLIK, withoutEnlargement: true })
          .webp({ quality: KALITE, effort: 6 })
          .toBuffer();

        const { error } = await supabase.storage
          .from(KOVA)
          .upload(yol, govde, {
            contentType: 'image/webp',
            upsert: true,
            cacheControl: '2592000',
          });
        if (error) throw new Error(error.message);

        const olcu = await sharp(govde).metadata();
        const kayit: Atif & { width?: number; height?: number } = {
          ilan: ilan.slug,
          path: yol,
          source: kaynak.source,
          artist: kaynak.artist,
          license: kaynak.license,
          licenseUrl: kaynak.licenseUrl,
          width: olcu.width,
          height: olcu.height,
        };
        const idx = atiflar.findIndex((a) => a.path === yol);
        if (idx >= 0) atiflar[idx] = kayit;
        else atiflar.push(kayit);
        varOlan.set(yol, kayit);
        yeni++;
        console.log(`  ✓ ${yol}  ${kaynak.license}`);
      } catch (e) {
        console.log(`  ✗ ${yol}  ${(e as Error).message}`);
      }
      await uyu(400);
    }
  }

  atiflar.sort((a, b) => a.path.localeCompare(b.path));
  writeFileSync(ATIF_YOLU, JSON.stringify(atiflar, null, 2) + '\n', 'utf8');

  console.log(`\n${yeni} fotoğraf yüklendi, toplam ${atiflar.length}.`);
  if (eksik.length) console.log('Görsel bulunamayan ilanlar:', eksik.join(', '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
