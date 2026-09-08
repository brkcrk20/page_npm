import { NextResponse } from 'next/server';

/**
 * Kullanıcı görsellerini kendi alan adımızdan servis eder.
 *
 * NEDEN YENİDEN YAZMA DEĞİL DE ROTA
 * Bu iş eskiden next.config'teki bir rewrite kuralıydı: adres bizim, dosya
 * Supabase'den geliyordu. İki sorunu vardı.
 *
 *  1. Vercel dış yeniden yazmaların yanıtını KENARDA ÖNBELLEĞE ALMIYOR.
 *     Her ziyaretçinin her görseli için istek Vercel'den Supabase'e gidip
 *     geliyordu; ölçümde görselin yanıt vermeye başlaması yarım saniyeyi
 *     buluyordu (x-vercel-cache her seferinde MISS).
 *  2. Yanıt başlığını kaynak belirliyordu. Supabase public adreslerde
 *     "no-cache" gönderiyor; next.config'teki Cache-Control kuralı dış
 *     yeniden yazmada devreye girmiyordu, yani tarayıcı da önbelleğe
 *     alamıyordu.
 *
 * Rota olarak yazılınca ikisi de çözülüyor: başlığı biz koyuyoruz ve
 * s-maxage sayesinde Vercel kenar ağı dosyayı saklıyor. İlk isteyen
 * dışında kimse Supabase'e kadar gitmiyor.
 *
 * DOSYA ADLARI DEĞİŞMEZ
 * Görsel adında ilan numarası ve sıra var; içerik değişince ad da
 * değişiyor. Bu yüzden "immutable" güvenli — yanlış görselin önbellekte
 * takılı kalması mümkün değil.
 */

export const runtime = 'nodejs';

/** Bir yıl. Adres değişmediği sürece dosya da değişmiyor. */
const ONBELLEK = 'public, max-age=31536000, s-maxage=31536000, immutable';

/** Yalnızca bilinen kovalar; adres satırından rastgele yol denenmesin. */
const KOVALAR = new Set([
  'ilan-fotograflari',
  'ilan-videolari',
  'isletme-gorselleri',
  'profil-fotograflari',
  'rehber-gorselleri',
]);

export async function GET(
  _istek: Request,
  { params }: { params: Promise<{ bucket: string; yol: string[] }> }
) {
  const { bucket, yol } = await params;

  if (!KOVALAR.has(bucket)) {
    return new NextResponse('Bulunamadı', { status: 404 });
  }

  const kok = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!kok) return new NextResponse('Yapılandırma eksik', { status: 500 });

  const kaynak = `${kok}/storage/v1/object/public/${bucket}/${yol
    .map((parca) => encodeURIComponent(parca))
    .join('/')}`;

  const cevap = await fetch(kaynak, {
    // Depolamadaki dosya değişmiyor; Next'in kendi getirme önbelleği de
    // saklayabilir. Asıl önbellek aşağıdaki başlıkla kenarda oluşuyor.
    next: { revalidate: 31536000 },
  });

  if (!cevap.ok || !cevap.body) {
    return new NextResponse('Bulunamadı', { status: cevap.status === 404 ? 404 : 502 });
  }

  return new NextResponse(cevap.body, {
    status: 200,
    headers: {
      'Content-Type': cevap.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': ONBELLEK,
      ...(cevap.headers.get('content-length')
        ? { 'Content-Length': cevap.headers.get('content-length')! }
        : {}),
    },
  });
}
