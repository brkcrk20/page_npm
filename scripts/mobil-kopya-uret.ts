/**
 * scripts/mobil-kopya-uret.ts — kart görsellerinin mobil kopyasını üretir.
 *
 *   npx tsx scripts/mobil-kopya-uret.ts
 *
 * NEDEN
 * Kart görseli 400 piksel genişliğinde ama telefonda ~134 piksele çiziliyor;
 * inen verinin dörtte üçü boşa gidiyor ve yavaş bağlantıda LCP'yi tek başına
 * bir saniyeden fazla geciktiriyor (bkz. 0069 numaralı göç).
 *
 * Betik eldeki 400 piksellik kopyayı indirip 200 piksele küçültüyor ve
 * "-k.webp" yerine "-s.webp" adıyla aynı klasöre koyuyor. Tekrar
 * çalıştırılabilir: küçük kopyası olan satırlar atlanıyor.
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';

/** Mobil kart görselinin genişliği. Telefonda ~134 piksel isteniyor; 200
 *  piksel hem yedek payı bırakıyor hem de tabletlerde yetiyor. */
const MOBIL_GENISLIK = 200;
const KOVA = 'ilan-fotograflari';

function ortam(): Record<string, string> {
  const metin = readFileSync('.env.local', 'utf8');
  return Object.fromEntries(
    metin
      .split('\n')
      .filter((satir) => satir.includes('='))
      .map((satir) => [satir.slice(0, satir.indexOf('=')), satir.slice(satir.indexOf('=') + 1)])
  );
}

async function main() {
  const env = ortam();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: fotolar, error } = await supabase
    .from('listing_photos')
    .select('id, thumb_path, thumb_sm_path')
    .not('thumb_path', 'is', null)
    .is('thumb_sm_path', null);

  if (error) throw new Error(error.message);
  if (!fotolar?.length) {
    console.log('Küçültülecek fotoğraf yok.');
    return;
  }

  console.log(`${fotolar.length} fotoğraf işlenecek.`);
  let basarili = 0;

  for (const foto of fotolar) {
    const kaynak = foto.thumb_path as string;
    const hedef = kaynak.replace(/-k\.webp$/, '-s.webp');

    if (hedef === kaynak) {
      console.warn(`  atlandı (beklenmeyen ad): ${kaynak}`);
      continue;
    }

    const indirilen = await supabase.storage.from(KOVA).download(kaynak);
    if (indirilen.error || !indirilen.data) {
      console.warn(`  indirilemedi: ${kaynak} — ${indirilen.error?.message}`);
      continue;
    }

    const girdi = Buffer.from(await indirilen.data.arrayBuffer());
    const cikti = await sharp(girdi)
      .resize({ width: MOBIL_GENISLIK, withoutEnlargement: true })
      .webp({ quality: 74 })
      .toBuffer();

    const yukleme = await supabase.storage.from(KOVA).upload(hedef, cikti, {
      contentType: 'image/webp',
      upsert: true,
      // Supabase varsayılanı no-cache; bkz. CreateListingForm.
      cacheControl: '2592000',
    });
    if (yukleme.error) {
      console.warn(`  yüklenemedi: ${hedef} — ${yukleme.error.message}`);
      continue;
    }

    const guncelleme = await supabase
      .from('listing_photos')
      .update({ thumb_sm_path: hedef })
      .eq('id', foto.id);
    if (guncelleme.error) {
      console.warn(`  kaydedilemedi: ${hedef} — ${guncelleme.error.message}`);
      continue;
    }

    basarili++;
    console.log(`  ${girdi.length} B -> ${cikti.length} B  ${hedef.split('/').pop()}`);
  }

  console.log(`${basarili} fotoğrafın mobil kopyası üretildi.`);
}

void main();
