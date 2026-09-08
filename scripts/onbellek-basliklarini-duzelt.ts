/**
 * scripts/onbellek-basliklarini-duzelt.ts
 *
 * Depolamadaki mevcut dosyaların önbellek başlığını düzeltir.
 *
 *   npx tsx scripts/onbellek-basliklarini-duzelt.ts
 *   npx tsx scripts/onbellek-basliklarini-duzelt.ts --kuru   (yalnızca listeler)
 *
 * NEDEN GEREKLİ
 * Supabase yüklenen dosyalara varsayılan olarak "cache-control: no-cache"
 * veriyor. Sonuç: paylaşım kartındaki ve "Büyük Fotoğraf" bağlantısındaki
 * görseller her seferinde baştan indiriliyor. Ölçüldü — karşılaştırma için
 * bakılan patibul.com görselleri bir gün önbellekleniyor, bizimkiler hiç.
 *
 * Yükleme tarafı düzeltildi (cacheControl), ama başlık dosyanın üstünde
 * saklandığı için eski dosyalar eski başlıkla kalıyor. Bu betik onları
 * aynı içerikle yeniden yazarak başlığı güncelliyor.
 *
 * Görsel iyileştiriciden geçen adresler (kart ve galeri görselleri) bu
 * betiğe bağlı değil; onları next.config.ts'teki minimumCacheTTL çözüyor.
 */

import { createClient } from '@supabase/supabase-js';

const ONBELLEK = '2592000'; // 30 gün
const KOVALAR = [
  'ilan-fotograflari',
  'profil-fotograflari',
  'isletme-gorselleri',
] as const;

type Dosya = { kova: string; yol: string };

type Istemci = ReturnType<typeof createClient>;

async function klasoruTara(
  supabase: Istemci,
  kova: string,
  onek: string
): Promise<Dosya[]> {
  const { data, error } = await supabase.storage.from(kova).list(onek, { limit: 1000 });
  if (error) {
    console.error(`  ! ${kova}/${onek}: ${error.message}`);
    return [];
  }

  const cikti: Dosya[] = [];
  for (const girdi of data ?? []) {
    const yol = onek ? `${onek}/${girdi.name}` : girdi.name;
    // Klasörlerin id'si yok; dosyaların var.
    if (girdi.id) cikti.push({ kova, yol });
    else cikti.push(...(await klasoruTara(supabase, kova, yol)));
  }
  return cikti;
}

async function main() {
  const kuru = process.argv.includes('--kuru');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.');
    process.exit(1);
  }
  const supabase: Istemci = createClient(url, key);

  let toplam = 0;
  let duzeltilen = 0;

  for (const kova of KOVALAR) {
    const dosyalar = await klasoruTara(supabase, kova, '');
    console.log(`${kova}: ${dosyalar.length} dosya`);
    toplam += dosyalar.length;
    if (kuru) continue;

    for (const d of dosyalar) {
      try {
        const { data, error } = await supabase.storage.from(d.kova).download(d.yol);
        if (error || !data) throw new Error(error?.message ?? 'indirilemedi');

        const { error: yazma } = await supabase.storage
          .from(d.kova)
          .update(d.yol, data, { cacheControl: ONBELLEK, upsert: true, contentType: data.type });
        if (yazma) throw new Error(yazma.message);

        duzeltilen++;
      } catch (e) {
        console.log(`  ✗ ${d.kova}/${d.yol}: ${(e as Error).message}`);
      }
    }
  }

  console.log(kuru ? `\ntoplam ${toplam} dosya (kuru koşu)` : `\n${duzeltilen}/${toplam} dosya güncellendi.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
