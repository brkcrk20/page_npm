/**
 * scripts/kucuk-kopya-uret.ts
 *
 * Mevcut ilan fotoğraflarının 400 piksellik kopyasını üretir.
 *
 *   npx tsx scripts/kucuk-kopya-uret.ts
 *
 * Görseller barındırma sağlayıcısının iyileştiricisinden çıkarıldıktan
 * sonra kart ve şeritler tam boy dosyayı indirmeye başladı. Küçük kopya
 * yükleme anında üretiliyor; bu betik yalnızca eski kayıtlar için.
 *
 * Yeniden çalıştırılabilir: thumb_path'i dolu olan fotoğraflar atlanıyor.
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const KOVA = 'ilan-fotograflari';
const GENISLIK = 400;
const KALITE = 74;
const ONBELLEK = '2592000';

/** "a/b/1.webp" → "a/b/1-k.webp" */
export function kucukYol(yol: string): string {
  const nokta = yol.lastIndexOf('.');
  return nokta === -1 ? `${yol}-k` : `${yol.slice(0, nokta)}-k${yol.slice(nokta)}`;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.');
    process.exit(1);
  }
  const supabase = createClient(url, key);

  const { data: fotolar, error } = await supabase
    .from('listing_photos')
    .select('id, storage_path, thumb_path')
    .is('thumb_path', null);

  if (error) {
    console.error('Fotoğraflar alınamadı:', error.message);
    process.exit(1);
  }

  console.log(`${fotolar?.length ?? 0} fotoğrafın küçük kopyası yok.`);
  let ok = 0;

  for (const foto of fotolar ?? []) {
    const hedef = kucukYol(foto.storage_path);
    try {
      const { data, error: indirme } = await supabase.storage.from(KOVA).download(foto.storage_path);
      if (indirme || !data) throw new Error(indirme?.message ?? 'indirilemedi');

      const govde = await sharp(Buffer.from(await data.arrayBuffer()))
        .resize({ width: GENISLIK, withoutEnlargement: true })
        .webp({ quality: KALITE, effort: 6 })
        .toBuffer();

      const { error: yukleme } = await supabase.storage.from(KOVA).upload(hedef, govde, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: ONBELLEK,
      });
      if (yukleme) throw new Error(yukleme.message);

      const { error: guncelleme } = await supabase
        .from('listing_photos')
        .update({ thumb_path: hedef })
        .eq('id', foto.id);
      if (guncelleme) throw new Error(guncelleme.message);

      ok++;
    } catch (e) {
      console.log(`  ✗ ${foto.storage_path}: ${(e as Error).message}`);
    }
  }

  console.log(`${ok} küçük kopya üretildi.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
