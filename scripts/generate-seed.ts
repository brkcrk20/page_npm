/**
 * scripts/generate-seed.ts
 *
 * Referans verisini (kategoriler, şehirler, ilçeler, cinsler) mevcut TypeScript
 * kaynaklarından okuyup supabase/seed/0001_reference_data.sql dosyasını üretir.
 *
 * Neden üretiyoruz da elle yazmıyoruz: slug'lar hem uygulamada (routing.ts) hem
 * veritabanında kullanılıyor. Tek kaynaktan türetilmezlerse zamanla ayrışır ve
 * URL'ler sessizce kırılır.
 *
 * Çalıştırma:  npx tsx scripts/generate-seed.ts
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

import { slugify, CATEGORY_DEFS } from '../src/lib/routing';
import { citiesData } from '../src/lib/turkiye-data';
import { categories } from '../src/lib/breeds';

// ---------------------------------------------------------------------------
// Plaka kodları — cities.id olarak kullanılıyor.
// İl adları turkiye-data.ts ile birebir eşleşmek zorunda; eşleşmezse script
// hata verip duruyor (sessizce eksik il yüklemektense gürültülü çökmek iyidir).
// ---------------------------------------------------------------------------
const PLAKA: Record<string, number> = {
  'Adana': 1, 'Adıyaman': 2, 'Afyonkarahisar': 3, 'Ağrı': 4, 'Amasya': 5,
  'Ankara': 6, 'Antalya': 7, 'Artvin': 8, 'Aydın': 9, 'Balıkesir': 10,
  'Bilecik': 11, 'Bingöl': 12, 'Bitlis': 13, 'Bolu': 14, 'Burdur': 15,
  'Bursa': 16, 'Çanakkale': 17, 'Çankırı': 18, 'Çorum': 19, 'Denizli': 20,
  'Diyarbakır': 21, 'Edirne': 22, 'Elazığ': 23, 'Erzincan': 24, 'Erzurum': 25,
  'Eskişehir': 26, 'Gaziantep': 27, 'Giresun': 28, 'Gümüşhane': 29, 'Hakkari': 30,
  'Hatay': 31, 'Isparta': 32, 'Mersin': 33, 'İstanbul': 34, 'İzmir': 35,
  'Kars': 36, 'Kastamonu': 37, 'Kayseri': 38, 'Kırklareli': 39, 'Kırşehir': 40,
  'Kocaeli': 41, 'Konya': 42, 'Kütahya': 43, 'Malatya': 44, 'Manisa': 45,
  'Kahramanmaraş': 46, 'Mardin': 47, 'Muğla': 48, 'Muş': 49, 'Nevşehir': 50,
  'Niğde': 51, 'Ordu': 52, 'Rize': 53, 'Sakarya': 54, 'Samsun': 55,
  'Siirt': 56, 'Sinop': 57, 'Sivas': 58, 'Tekirdağ': 59, 'Tokat': 60,
  'Trabzon': 61, 'Tunceli': 62, 'Şanlıurfa': 63, 'Uşak': 64, 'Van': 65,
  'Yozgat': 66, 'Zonguldak': 67, 'Aksaray': 68, 'Bayburt': 69, 'Karaman': 70,
  'Kırıkkale': 71, 'Batman': 72, 'Şırnak': 73, 'Bartın': 74, 'Ardahan': 75,
  'Iğdır': 76, 'Yalova': 77, 'Karabük': 78, 'Kilis': 79, 'Osmaniye': 80,
  'Düzce': 81,
};

/** Postgres string literali — tek tırnak kaçışı. */
const q = (value: string) => `'${value.replace(/'/g, "''")}'`;

function main() {
  const errors: string[] = [];
  const out: string[] = [];

  out.push('-- ============================================================================');
  out.push('-- supabase/seed/0001_reference_data.sql');
  out.push('--');
  out.push('-- ÜRETİLMİŞ DOSYA — elle düzenlemeyin.');
  out.push('-- Kaynak: src/lib/turkiye-data.ts, src/lib/breeds.ts, src/lib/routing.ts');
  out.push('-- Yeniden üretmek için: npx tsx scripts/generate-seed.ts');
  out.push('--');
  out.push('-- Idempotent: tekrar tekrar çalıştırılabilir (on conflict do update).');
  out.push('-- ============================================================================');
  out.push('');
  out.push('begin;');
  out.push('');

  // --- Kategoriler ---------------------------------------------------------
  out.push('-- Kategoriler ---------------------------------------------------------------');
  const categoryIds = new Map<string, number>();
  CATEGORY_DEFS.forEach((def, index) => {
    const id = index + 1;
    categoryIds.set(def.slug, id);
    out.push(
      `insert into public.categories (id, slug, name, code, position) values ` +
        `(${id}, ${q(def.slug)}, ${q(def.title)}, ${q(def.type)}, ${id})` +
        `\n  on conflict (id) do update set slug = excluded.slug, name = excluded.name, ` +
        `code = excluded.code, position = excluded.position;`
    );
  });
  out.push(
    `select setval(pg_get_serial_sequence('public.categories','id'), ${CATEGORY_DEFS.length}, true)` +
      `\n  where pg_get_serial_sequence('public.categories','id') is not null;`
  );
  out.push('');

  // --- Şehirler ------------------------------------------------------------
  out.push('-- Şehirler ------------------------------------------------------------------');
  const cityNames = Object.keys(citiesData);

  for (const city of cityNames) {
    if (PLAKA[city] === undefined) errors.push(`turkiye-data.ts'te olup PLAKA haritasında olmayan il: "${city}"`);
  }
  for (const city of Object.keys(PLAKA)) {
    if (!(city in citiesData)) errors.push(`PLAKA haritasında olup turkiye-data.ts'te olmayan il: "${city}"`);
  }

  const citySlugs = new Set<string>();
  for (const city of cityNames) {
    const slug = slugify(city);
    if (!slug) errors.push(`İl için boş slug üretildi: "${city}"`);
    if (citySlugs.has(slug)) errors.push(`Yinelenen il slug'ı: "${slug}"`);
    citySlugs.add(slug);

    out.push(
      `insert into public.cities (id, slug, name) values (${PLAKA[city]}, ${q(slug)}, ${q(city)})` +
        `\n  on conflict (id) do update set slug = excluded.slug, name = excluded.name;`
    );
  }
  out.push('');

  // --- İlçeler -------------------------------------------------------------
  out.push('-- İlçeler -------------------------------------------------------------------');
  let districtCount = 0;
  for (const city of cityNames) {
    const cityId = PLAKA[city];
    const seen = new Set<string>();
    const rows: string[] = [];

    for (const district of citiesData[city]) {
      const slug = slugify(district);
      if (!slug) {
        errors.push(`İlçe için boş slug: "${district}" (${city})`);
        continue;
      }
      // Aynı il içinde çakışan ilçe slug'ı olursa (ör. büyük/küçük harf farkı)
      // ikincisini atla — unique kısıtı zaten reddederdi.
      if (seen.has(slug)) {
        errors.push(`Yinelenen ilçe slug'ı: "${slug}" (${city})`);
        continue;
      }
      seen.add(slug);
      rows.push(`(${cityId}, ${q(slug)}, ${q(district)})`);
      districtCount++;
    }

    if (rows.length > 0) {
      out.push(
        `insert into public.districts (city_id, slug, name) values\n  ${rows.join(',\n  ')}` +
          `\n  on conflict (city_id, slug) do update set name = excluded.name;`
      );
    }
  }
  out.push('');

  // --- Cinsler -------------------------------------------------------------
  out.push('-- Cinsler -------------------------------------------------------------------');
  let breedCount = 0;
  for (const cat of categories) {
    const categoryId = categoryIds.get(cat.slug);
    if (categoryId === undefined) {
      errors.push(`breeds.ts'teki kategori routing.ts'te yok: "${cat.slug}"`);
      continue;
    }

    const seen = new Set<string>();
    const rows: string[] = [];

    cat.breeds.forEach((breed, index) => {
      const slug = slugify(breed.name);
      if (!slug) {
        errors.push(`Cins için boş slug: "${breed.name}" (${cat.slug})`);
        return;
      }
      if (seen.has(slug)) {
        errors.push(`Yinelenen cins slug'ı: "${slug}" (${cat.slug})`);
        return;
      }
      // Şehir slug'ıyla çakışma cins sayfasını erişilemez yapar; veritabanı
      // trigger'ı da bunu reddeder, burada erken yakalıyoruz.
      if (citySlugs.has(slug)) {
        errors.push(`Cins slug'ı şehirle çakışıyor: "${slug}" (${breed.name})`);
        return;
      }
      seen.add(slug);
      rows.push(`(${categoryId}, ${q(slug)}, ${q(breed.name)}, ${index})`);
      breedCount++;
    });

    if (rows.length > 0) {
      out.push(`-- ${cat.title}`);
      out.push(
        `insert into public.breeds (category_id, slug, name, position) values\n  ${rows.join(',\n  ')}` +
          `\n  on conflict (category_id, slug) do update set name = excluded.name, position = excluded.position;`
      );
    }
  }
  out.push('');
  out.push('commit;');
  out.push('');

  if (errors.length > 0) {
    console.error('\nSeed üretilemedi. Önce şu sorunları düzeltin:\n');
    for (const e of errors) console.error('  • ' + e);
    process.exit(1);
  }

  const target = resolve(__dirname, '../supabase/seed/0001_reference_data.sql');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, out.join('\n'), 'utf8');

  console.log('Seed üretildi: supabase/seed/0001_reference_data.sql');
  console.log(`  kategori : ${CATEGORY_DEFS.length}`);
  console.log(`  il       : ${cityNames.length}`);
  console.log(`  ilçe     : ${districtCount}`);
  console.log(`  cins     : ${breedCount}`);
}

main();
