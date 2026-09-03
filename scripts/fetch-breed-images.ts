/**
 * scripts/fetch-breed-images.ts
 *
 * Cins küçük görsellerini Wikimedia Commons'tan indirir, küçültüp WebP'ye
 * çevirir ve public/cins-gorselleri/ altına SEO uyumlu adlarla yazar.
 *
 *   npx tsx scripts/fetch-breed-images.ts
 *   npx tsx scripts/fetch-breed-images.ts --only=kopek-ilanlari
 *   npx tsx scripts/fetch-breed-images.ts --force
 *
 * Neden Wikimedia: cins fotoğraflarının büyük kısmı orada CC lisanslı ve
 * ticari kullanıma açık. Rastgele görsel servisleri (picsum vb.) cinse ait
 * olmayan fotoğraf verir, stok siteleri ise lisans sorunu çıkarır.
 *
 * LİSANS: Yalnızca ticari kullanıma açık lisanslar indiriliyor (CC0, PD,
 * CC-BY, CC-BY-SA). CC-BY ve CC-BY-SA ATIF ZORUNLU tutar; script her görselin
 * yazarını ve lisansını public/cins-gorselleri/attributions.json içine yazıyor
 * ve /gorsel-kaynaklari sayfası bunu yayınlıyor. Bu dosyayı silmeyin.
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import sharp from 'sharp';

import { categories as staticCategories } from '../src/lib/breeds';
import { CATEGORY_DEFS } from '../src/lib/routing';
import { breedImageFilename } from '../src/lib/breed-image';

const UA = 'PetSemtiBot/1.0 (https://petsemti.com; iletisim@petsemti.com)';

/**
 * Irk listesi artık VERİTABANINDAN okunuyor.
 *
 * Eskiden src/lib/breeds.ts okunuyordu; o dosya yalnızca ilk tohumlamanın
 * kaynağı ve göçlerle eklenen ırkları (ör. 59 güvercin ırkı) içermiyor.
 * Sonuç: sonradan eklenen hiçbir ırk görsel almıyordu ve bu sessizce
 * oluyordu — eksik görsel harf yedeğine düştüğü için fark edilmiyordu.
 *
 * Ortam değişkenleri yoksa eski dosyaya düşülüyor; betik bir veritabanı
 * olmadan da çalışabilmeli.
 */
type SourceCategory = { slug: string; title: string; breeds: { name: string }[] };

async function loadCategories(): Promise<SourceCategory[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('! Veritabanı bilgisi yok, src/lib/breeds.ts kullanılıyor.');
    return staticCategories as unknown as SourceCategory[];
  }

  const res = await fetch(
    `${url}/rest/v1/categories?select=slug,name,breeds(name,position)&order=position`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } }
  );
  if (!res.ok) {
    console.warn('! Veritabanı okunamadı, src/lib/breeds.ts kullanılıyor.');
    return staticCategories as unknown as SourceCategory[];
  }

  const rows = (await res.json()) as {
    slug: string;
    name: string;
    breeds: { name: string; position: number }[];
  }[];
  return rows.map((r) => ({
    slug: r.slug,
    title: r.name,
    breeds: [...(r.breeds ?? [])].sort((a, b) => a.position - b.position),
  }));
}
const OUT_ROOT = resolve(__dirname, '../public/cins-gorselleri');

/** Görsel 64px gösteriliyor; 2x ekranlar için 128px üretiyoruz. */
const SIZE = 128;
const WEBP_QUALITY = 68;

// Ticari kullanıma açık lisanslar. Bunun dışındaki hiçbir görsel indirilmiyor.
//
// GFDL bilerek DIŞARIDA: özgür bir lisans olsa da görselin yanında lisansın
// tam metninin yayınlanmasını şart koşuyor; 32 piksellik bir avatar için
// makul değil. O cinsler harf yedeğine düşüyor.
const ALLOWED_LICENSE =
  /^(cc0|cc[- ]by([- ]sa)?([- ][\d.]+)?|public domain|pd-|attribution|copyrighted free use)/i;

/**
 * Türkçe cins adları Wikipedia başlıklarıyla her zaman örtüşmüyor.
 * Sadece otomatik aramanın tutmadığı adlar burada; gerisi ad üzerinden bulunuyor.
 */
/**
 * DOĞRUDAN COMMONS DOSYASI eşlemeleri.
 *
 * Bazı ırkların Wikipedia maddesi yok ama Commons'ta ırkı gerçekten
 * gösteren, ticari kullanıma açık fotoğrafı var. Madde araması bunları
 * bulamıyor — "Adana taklacısı" araması şehir kolajı döndürüyor, ki bunu
 * ırk fotoğrafı diye koymak yanlış olurdu.
 *
 * Buradaki her dosya tek tek doğrulandı: ırkı gösterdiği ve lisansının
 * ticari kullanıma izin verdiği kontrol edildi.
 *
 * Bölgesel taklacıların (Adana, Mardin, Antep, Konya...) özgür lisanslı
 * fotoğrafı hiçbir yerde yok; onlar bilerek boş bırakılıyor ve arayüzde
 * güvercin silueti yedeğine düşüyorlar. Yanlış ırkın fotoğrafını
 * göstermektense siluet dürüst.
 */
const COMMONS_FILES: Record<string, string> = {
  'Taklacı Güvercin':   'File:Takla tumbler(silver bar).jpg',
  'Urfa Taklacısı':     'File:Urfa Pigeon sport 5279.jpg',
  'Dolapçı Güvercin':   'File:Donek.jpg',
  'Halep Güvercini':    'File:Syrian coop tumbler(blue bar).jpg',
  'Şam Güvercini':      'File:Damascene(barred).jpg',
  'Makaracı Güvercin':  'File:Anatolian ringbeater(blue bar).jpg',
  'Kuyruklu (Tavus) Güvercin': 'File:Seldschuk fantail(white).jpg',
};

const TITLE_OVERRIDES: Record<string, string[]> = {
  'Toy Poodle': ['Poodle'],
  'Maltipoo': ['Maltipoo', 'Poodle crossbreed', 'Maltese dog'],
  'Pomeranian Boo': ['Pomeranian (dog)'],
  'Maltese Terrier': ['Maltese dog'],
  'Çin Aslanı': ['Chow Chow'],
  'Sibirya Kurdu (Husky)': ['Siberian Husky'],
  'Alman Kurdu': ['German Shepherd'],
  'Cavalier King Charles': ['Cavalier King Charles Spaniel'],
  'Dakhund - Sosis Köpek': ['Dachshund'],
  'Belçika Kurdu': ['Belgian Shepherd'],
  'Pekinez': ['Pekingese'],
  'Amerikan Cocker': ['American Cocker Spaniel'],
  'Bernese Dağ Köpeği': ['Bernese Mountain Dog'],
  'İngiliz Bulldog': ['Buldok', 'Bulldog', 'English Bulldog'],
  'İngiliz Cocker': ['English Cocker Spaniel'],
  'corgi': ['Welsh Corgi'],
  'Pincher': ['Miniature Pinscher'],
  'Shiba Köpek': ['Shiba Inu'],
  'Alabay (Alabai)': ['Central Asian Shepherd Dog'],
  'Kangal': ['Kangal Shepherd Dog'],
  'bernedoodle': ['Bernedoodle', 'Bernese Mountain Dog'],
  'Bişon Çuha Köpeği': ['Bichon Frise'],
  'Wolfdog': ['Wolfdog'],
  'Schnauzer': ['Schnauzer'],
  'Avustralya Çoban Köpeği': ['Australian Shepherd'],
  'Dalmaçyalı': ['Dalmatian dog'],
  'Danua (Great Dane)': ['Great Dane'],
  'İngiliz Staffordshire': ['Staffordshire Bull Terrier'],
  'Akbaş': ['Akbash'],
  'Alaska Kurdu': ['Alaskan Malamute'],
  'Tekir': ['Tabby cat'],
  'Van Kedisi': ['Van cat'],
  'Ankara Kedisi': ['Turkish Angora'],
  'İran Kedisi': ['Persian cat'],
  'Siyam Kedisi': ['Siamese cat'],
  'Siyam': ['Siamese cat'],
  'Bengal Kedisi': ['Bengal cat'],
  'Muhabbet Kuşu': ['Budgerigar', 'Melopsittacus'],
  'Japon Balığı': ['Goldfish'],
  'Guineapig': ['Guinea pig'],
  'Doberman': ['Dobermann', 'Doberman Pinscher'],
  'Fransız Mastiff': ['Dogue de Bordeaux'],
  'Kafkas Çoban Köpeği': ['Caucasian Shepherd Dog'],
  'Newfoundland Köpek': ['Newfoundland dog'],
  'Saint Bernard': ['St. Bernard (dog)', 'Saint Bernard (dog)'],
  'Samoyed': ['Samoyed dog'],
  'Tibet Mastifi': ['Tibetan Mastiff'],
  'Süs Köpeği': ['Toy dog'],
  'Morkie': ['Yorkshire Terrier'],
  'Munchkin Kedisi': ['Munchkin cat'],
  'Ragdoll Kedisi': ['Ragdoll'],
  'Sarman Kedi': ['Tabby cat'],
  'Sfenks Kedisi': ['Sphynx cat'],
  'Cennet Papağanı': ['Lovebird', 'Agapornis'],
  'Forpus Papağanı': ['Forpus', 'Parrotlet'],
  'Hint Bülbülü': ['Red-whiskered bulbul'],
  'Sultan Papağanı': ['Cockatiel'],
  'Beta': ['Siamese fighting fish'],
  'Melek Balığı': ['Pterophyllum'],
  'Moli': ['Poecilia sphenops', 'Molly (fish)'],
  // --- Güvercin ırkları ---------------------------------------------------
  // Yalnızca gerçekten kendi maddesi olan ırklar eşleniyor. Bölgesel
  // taklacıların (Adana, Mardin, Urfa...) Wikipedia maddesi yok; hepsini
  // "Turkish Tumbler" görseline bağlamak 16 ırkta aynı fotoğrafı tekrarlamak
  // olurdu. Onlar harf yedeğine düşüyor — yedek her ırk için farklı renk
  // üretiyor, tekrarlanan fotoğraftan daha dürüst duruyor.
  'Posta Güvercini': ['Homing pigeon'],
  'Yarış Güvercini': ['Racing Homer', 'Homing pigeon'],
  'Belçika Postası': ['Homing pigeon'],
  'Alman Postası': ['Homing pigeon'],
  'Hollanda Postası': ['Homing pigeon'],
  'Janssen Güvercini': ['Homing pigeon'],
  'Süs Güvercini': ['Fancy pigeon'],
  'Pofuduk (Jakoben) Güvercin': ['Jacobin pigeon'],
  'Kuyruklu (Tavus) Güvercin': ['Fantail pigeon'],
  'Guatrlı Güvercin': ['English Pouter', 'Pouter pigeon'],
  'Modena Güvercini': ['Modena pigeon'],
  'King Güvercini': ['King pigeon'],
  'Rahibe (Nun) Güvercin': ['Nun pigeon', 'Old Dutch Capuchine'],
  'Borazan (Trumpeter) Güvercin': ['English Trumpeter', 'Trumpeter pigeon'],
  'Kıvırcık (Frillback) Güvercin': ['Frillback'],
  'Arşanjel Güvercin': ['Archangel pigeon'],
  'Buhara Güvercini': ['Bokhara Trumpeter'],
  'Lahor Güvercini': ['Lahore pigeon'],
  'Barb Güvercini': ['English Barb', 'Barb pigeon'],
  'Satinet Güvercin': ['Oriental Frill', 'Satinette'],
  'Şam Güvercini': ['Damascene pigeon'],
  'Mısır Güvercini': ['Egyptian Swift'],
  'Bağdat Güvercini': ['Scandaroon'],
  'Taklacı Güvercin': ['Tumbler pigeon'],
  'Makaracı Güvercin': ['Roller pigeon', 'Birmingham Roller'],
  'Ankara Güvercini': ['Ankara pigeon'],
  'Beyaz Güvercin': ['Domestic pigeon'],
  'Karma / Melez Güvercin': ['Rock dove'],
  'Bernedoodle': ['Bernese Mountain Dog'],
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

/** Sayfanın ana görselinin Commons dosya adını bulur. */
async function findImageTitle(host: string, title: string): Promise<string | null> {
  const data = await api(host, {
    action: 'query',
    prop: 'pageimages',
    piprop: 'name',
    titles: title,
    redirects: '1',
  });
  const page = data?.query?.pages?.[0];
  if (!page || page.missing) return null;
  return page.pageimage ? `File:${page.pageimage}` : null;
}

/** Commons'tan indirme adresi ve lisans bilgisi. */
async function imageInfo(fileTitle: string) {
  const data = await api('commons.wikimedia.org', {
    action: 'query',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    titles: fileTitle,
  });
  const page = data?.query?.pages?.[0];
  const info = page?.imageinfo?.[0];
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
  const args = process.argv.slice(2);
  const only = args.find((a) => a.startsWith('--only='))?.split('=')[1];
  const force = args.includes('--force');

  const codeBySlug = new Map(CATEGORY_DEFS.map((c) => [c.slug, c.type]));
  const attributionsPath = resolve(OUT_ROOT, 'attributions.json');

  const attributions: Attribution[] = existsSync(attributionsPath)
    ? JSON.parse(readFileSync(attributionsPath, 'utf8'))
    : [];
  const already = new Set(attributions.map((a) => a.file));

  let ok = 0;
  let skipped = 0;
  const missing: string[] = [];

  const categories = await loadCategories();

  for (const category of categories) {
    if (only && category.slug !== only) continue;

    const code = codeBySlug.get(category.slug);
    if (!code) continue;

    const dir = resolve(OUT_ROOT, category.slug);
    mkdirSync(dir, { recursive: true });

    for (const breed of category.breeds) {
      const filename = breedImageFilename(breed.name, code);
      const target = resolve(dir, filename);

      if (!force && existsSync(target)) {
        skipped++;
        continue;
      }

      let found: Awaited<ReturnType<typeof imageInfo>> = null;

      // Elle doğrulanmış Commons dosyası varsa arama yapmadan onu kullan.
      const direct = COMMONS_FILES[breed.name];
      if (direct) {
        try {
          const info = await imageInfo(direct);
          if (info && ALLOWED_LICENSE.test(info.license)) found = info;
        } catch {
          // Tek bir dosya alınamadıysa aramaya devam et.
        }
      }

      const candidates = TITLE_OVERRIDES[breed.name] ?? [breed.name];

      for (const candidate of found ? [] : candidates) {
        for (const host of ['tr.wikipedia.org', 'en.wikipedia.org']) {
          try {
            const fileTitle = await findImageTitle(host, candidate);
            if (!fileTitle) continue;
            const info = await imageInfo(fileTitle);
            if (info && ALLOWED_LICENSE.test(info.license)) {
              found = info;
              break;
            }
          } catch {
            // Tek bir sorgu hatası tüm koşuyu durdurmasın.
          }
          await sleep(120); // Wikimedia'ya nazik davran
        }
        if (found) break;
      }

      if (!found) {
        missing.push(`${category.slug}/${breed.name}`);
        continue;
      }

      try {
        const res = await fetch(found.url, { headers: { 'User-Agent': UA } });
        if (!res.ok) throw new Error(`indirilemedi ${res.status}`);
        const buffer = Buffer.from(await res.arrayBuffer());

        await sharp(buffer)
          .resize(SIZE, SIZE, { fit: 'cover', position: 'attention' })
          .webp({ quality: WEBP_QUALITY, effort: 6 })
          .toFile(target);

        const relative = `/cins-gorselleri/${category.slug}/${filename}`;
        if (!already.has(relative)) {
          attributions.push({
            breed: breed.name,
            category: category.title,
            file: relative,
            source: found.descriptionUrl,
            artist: found.artist,
            license: found.license,
            licenseUrl: found.licenseUrl,
          });
          already.add(relative);
        }
        ok++;
        process.stdout.write(`.`);
      } catch (error: any) {
        missing.push(`${category.slug}/${breed.name} (${error.message})`);
      }

      await sleep(120);
    }
  }

  mkdirSync(dirname(attributionsPath), { recursive: true });
  writeFileSync(attributionsPath, JSON.stringify(attributions, null, 2), 'utf8');

  console.log(`\n\nindirildi : ${ok}`);
  console.log(`atlandı   : ${skipped} (zaten var)`);
  console.log(`bulunamadı: ${missing.length}`);
  if (missing.length) {
    console.log('\nGörsel bulunamayan cinsler (harf yedeği kullanılacak):');
    for (const m of missing) console.log('  • ' + m);
  }
  console.log(`\nAtıf dosyası: public/cins-gorselleri/attributions.json (${attributions.length} kayıt)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
