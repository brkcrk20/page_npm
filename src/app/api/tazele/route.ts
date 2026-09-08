import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

import { createSupabaseAdminClient } from '@/lib/supabase/server';

/**
 * İlan değişince önbelleği tazeleyen uç.
 *
 * SORUN
 * Liste sayfaları CDN'de 60 saniye, altlarındaki veri sorgusu ayrıca 60
 * saniye duruyor. İkisi üst üste binince kullanıcı yeni verdiği ilanı iki
 * dakikaya kadar göremiyordu — ilan aslında anında yayına giriyor
 * (app_settings.listing.auto_approve), gecikme tamamen önbellekten
 * kaynaklanıyordu. İlanını verip listeye bakan kişi için bu, "ilanım
 * yayınlanmadı" demek.
 *
 * ÇÖZÜM
 * İlan eklendiğinde/düzenlendiğinde tarayıcı buraya haber veriyor; burası
 * ilanın DEĞDİĞİ sayfaları tazeliyor. Tamamı değil: bütün önbelleği
 * boşaltmak (revalidatePath('/', 'layout')) her ilanda siteyi soğuk
 * bırakırdı. İlan hangi kategori, cins, il ve ilçedeyse yalnızca o
 * sayfalar yenileniyor.
 *
 * YETKİ
 * İlan numarası dışında bir şey almıyor ve yalnızca önbellek temizliyor;
 * veri okumuyor, yazmıyor. Kötüye kullanımın tavanı "sayfa bir kez daha
 * üretilir" olduğu için oturum aranmıyor — ama sayfalar ilanın kendi
 * kaydından türetiliyor, istekten gelen yola göre değil.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  let ilanNo: number | null = null;
  try {
    const govde = await request.json();
    ilanNo = Number(govde?.ilanNo);
  } catch {
    ilanNo = null;
  }

  // Veri önbelleği her durumda tazeleniyor: ilan silinmiş de olabilir.
  revalidateTag('listings');
  revalidatePath('/');

  if (!ilanNo || !Number.isFinite(ilanNo)) {
    return NextResponse.json({ ok: true, yollar: ['/'] });
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('listings')
    .select(
      `id, slug, kind,
       categories ( slug ),
       breeds ( slug ),
       cities ( slug ),
       districts ( slug )`
    )
    .eq('id', ilanNo)
    .maybeSingle();

  const yollar = new Set<string>(['/']);

  if (data) {
    const kategori = (data as any).categories?.slug as string | undefined;
    const cins = (data as any).breeds?.slug as string | undefined;
    const sehir = (data as any).cities?.slug as string | undefined;
    const ilce = (data as any).districts?.slug as string | undefined;

    if (kategori) {
      yollar.add(`/${kategori}`);
      if (cins) yollar.add(`/${kategori}/${cins}`);
      if (sehir) {
        yollar.add(`/${kategori}/${sehir}`);
        if (cins) yollar.add(`/${kategori}/${cins}/${sehir}`);
        if (ilce) yollar.add(`/${kategori}/${sehir}/${ilce}`);
      }
    }

    // Tür sayfaları: sahiplendirme, kayıp, eş arayanlar.
    const turSayfasi: Record<string, string> = {
      sahiplendirme: '/sahiplendirme',
      kayip: '/kayip',
      bulundu: '/kayip',
      es_arayan: '/es-arayanlar',
    };
    const tur = turSayfasi[(data as any).kind as string];
    if (tur) yollar.add(tur);

    // İlanın kendi sayfası: düzenlemeden sonra eski hâli kalmasın.
    if ((data as any).slug) yollar.add(`/ilan/${(data as any).slug}-${data.id}`);
  }

  for (const yol of yollar) revalidatePath(yol);

  return NextResponse.json({ ok: true, yollar: [...yollar] });
}
