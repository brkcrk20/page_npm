import { NextResponse } from 'next/server';

import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { tcknGecerliMi, vknGecerliMi, adNormalize } from '@/lib/dogrulama/kimlik';
import { nviDogrula } from '@/lib/dogrulama/nvi';

/**
 * Kimlik doğrulama başvurusu.
 *
 * NEDEN SUNUCUDA
 * Doğrulama sonucunu istemci yazamamalı — yazabilseydi doğrulama diye bir
 * şey olmazdı. profiles üzerindeki muhafız bu alanları istemciye kapatıyor;
 * buradaki yönetici istemcisi (service_role) muhafızdan muaf.
 *
 * ÜÇ SONUÇ
 *   NVI "eşleşti" derse           → anında doğrulandı
 *   NVI "eşleşmedi" derse         → anında reddedildi
 *   NVI'ya sorulamazsa / kurumsal → yönetici incelemesine düşer
 *
 * Sorulamayan başvuruyu doğrulanmış saymak, doğrulamayı hiç yapmamaktan
 * daha kötü olurdu: kullanıcı doğrulandığını sanır, biz de öyle işaretleriz.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Govde = {
  kind?: 'tc' | 'vergi';
  nationalId?: string;
  firstName?: string;
  lastName?: string;
  birthYear?: string | number;
  taxNumber?: string;
  taxOffice?: string;
  companyTitle?: string;
};

function hata(mesaj: string, kod = 400) {
  return NextResponse.json({ error: mesaj }, { status: kod });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return hata('Önce giriş yapmalısınız.', 401);

  let govde: Govde;
  try {
    govde = (await request.json()) as Govde;
  } catch {
    return hata('İstek okunamadı.');
  }

  const admin = createSupabaseAdminClient();

  // Doğrulanmış bir hesabın yeniden başvurmasına gerek yok; incelemedeki
  // başvurunun üstüne ikincisini açmak da kuyruğu kirletir.
  const { data: mevcut } = await admin
    .from('profiles')
    .select('identity_status')
    .eq('id', user.id)
    .maybeSingle();

  if (mevcut?.identity_status === 'dogrulandi') {
    return hata('Profiliniz zaten doğrulanmış.');
  }
  if (mevcut?.identity_status === 'inceleniyor') {
    return hata('Başvurunuz inceleniyor. Sonuçlanmadan yeni başvuru yapamazsınız.');
  }

  if (govde.kind === 'tc') {
    const tckn = (govde.nationalId ?? '').replace(/\s/g, '');
    const ad = adNormalize(govde.firstName ?? '');
    const soyad = adNormalize(govde.lastName ?? '');
    const dogumYili = Number(govde.birthYear);
    const buYil = new Date().getFullYear();

    if (!tcknGecerliMi(tckn)) return hata('TC kimlik numarası geçersiz.');
    if (ad.length < 2 || soyad.length < 2) return hata('Ad ve soyadınızı yazın.');
    if (!Number.isInteger(dogumYili) || dogumYili < buYil - 120 || dogumYili > buYil - 18) {
      return hata('Doğum yılı geçersiz. 18 yaşından küçükler ilan veremez.');
    }

    const nvi = await nviDogrula({ tckn, ad, soyad, dogumYili });

    if (nvi === false) {
      return hata(
        'Girdiğiniz bilgiler nüfus kayıtlarıyla eşleşmedi. Ad, soyad ve doğum yılını kimliğinizdeki gibi yazın.'
      );
    }

    const durum = nvi === true ? 'dogrulandi' : 'inceleniyor';

    const { data: basvuru, error: basvuruHata } = await admin
      .from('identity_requests')
      .insert({
        user_id: user.id,
        kind: 'tc',
        national_id: tckn,
        first_name: ad,
        last_name: soyad,
        birth_year: dogumYili,
        status: durum,
        nvi_result: nvi,
        nvi_checked_at: new Date().toISOString(),
        reviewed_at: nvi === true ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (basvuruHata) return hata('Başvuru kaydedilemedi: ' + basvuruHata.message, 500);

    const { error: profilHata } = await admin
      .from('profiles')
      .update({
        identity_kind: 'tc',
        identity_status: durum,
        identity_verified_at: nvi === true ? new Date().toISOString() : null,
        identity_rejected_reason: null,
        identity_birth_year: dogumYili,
        national_id: tckn,
        is_verified: nvi === true,
        verified_at: nvi === true ? new Date().toISOString() : null,
      })
      .eq('id', user.id);

    if (profilHata) return hata('Profil güncellenemedi: ' + profilHata.message, 500);

    return NextResponse.json({ status: durum, requestId: basvuru.id, nvi });
  }

  if (govde.kind === 'vergi') {
    const vkn = (govde.taxNumber ?? '').replace(/\s/g, '');
    const unvan = (govde.companyTitle ?? '').trim();
    const daire = (govde.taxOffice ?? '').trim();

    if (!vknGecerliMi(vkn)) return hata('Vergi kimlik numarası geçersiz.');
    if (unvan.length < 3) return hata('Firma ünvanını yazın.');
    if (daire.length < 2) return hata('Vergi dairesini yazın.');

    // Vergi numarası için herkese açık bir sorgulama servisi yok; bu yüzden
    // kurumsal başvurular her zaman elle inceleniyor.
    const { data: basvuru, error: basvuruHata } = await admin
      .from('identity_requests')
      .insert({
        user_id: user.id,
        kind: 'vergi',
        tax_number: vkn,
        tax_office: daire,
        company_title: unvan,
        status: 'inceleniyor',
      })
      .select('id')
      .single();

    if (basvuruHata) return hata('Başvuru kaydedilemedi: ' + basvuruHata.message, 500);

    const { error: profilHata } = await admin
      .from('profiles')
      .update({
        identity_kind: 'vergi',
        identity_status: 'inceleniyor',
        identity_rejected_reason: null,
        tax_number: vkn,
        tax_office: daire,
        company_title: unvan,
      })
      .eq('id', user.id);

    if (profilHata) return hata('Profil güncellenemedi: ' + profilHata.message, 500);

    return NextResponse.json({ status: 'inceleniyor', requestId: basvuru.id, nvi: null });
  }

  return hata('Doğrulama türü seçilmedi.');
}
