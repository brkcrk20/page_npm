import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { DEMO_KULLANICILAR } from './kullanicilar';
import { DEMO_ILANLAR } from './ilanlar';
import { DEMO_ISLETMELER } from './isletmeler';
import atiflar from './fotograf-atiflari.json';

/**
 * Demo içeriğin uygulanması ve silinmesi.
 *
 * Tamamı servis anahtarıyla çalışıyor: ilanların doğrudan "yayinda"
 * durumunda açılması, bireysel hesap kuralının atlanması ve auth
 * kullanıcılarının oluşturulup silinmesi normal yetkilerle mümkün değil.
 *
 * İşlem iki yönde de tekrarlanabilir: "ekle" var olan kaydı bulursa
 * üstüne yazıyor, "sil" hiçbir şey bulamazsa sessizce geçiyor. Yarıda
 * kalan bir çalıştırmadan sonra düğmeye tekrar basmak yeterli.
 */

type Foto = { ilan: string; path: string; width?: number; height?: number };

const FOTOGRAFLAR = atiflar as Foto[];

/** Demo hesapların parolası; hiçbir yerde giriş için kullanılmıyor. */
function parolaUret(email: string): string {
  // Sabit ama tahmin edilmesi anlamsız: bu hesaplarla giriş yapılmıyor,
  // ilan sahipliği dışında bir işlevleri yok.
  return `demo-${Buffer.from(email).toString('base64url').slice(0, 24)}-Aa1!`;
}

export type DemoDurumu = {
  kullanici: number;
  ilan: number;
  isletme: number;
  /** Tanımda kaç tane var (hedef sayılar). */
  hedef: { kullanici: number; ilan: number; isletme: number };
};

export async function demoDurumu(): Promise<DemoDurumu> {
  const supabase = createSupabaseAdminClient();
  const say = async (tablo: 'profiles' | 'listings' | 'service_providers') => {
    const { count } = await supabase
      .from(tablo)
      .select('id', { count: 'exact', head: true })
      .eq('is_demo', true);
    return count ?? 0;
  };

  return {
    kullanici: await say('profiles'),
    ilan: await say('listings'),
    isletme: await say('service_providers'),
    hedef: {
      kullanici: DEMO_KULLANICILAR.length,
      ilan: DEMO_ILANLAR.length,
      isletme: DEMO_ISLETMELER.length,
    },
  };
}

/** Slug → id eşlemeleri; her çalıştırmada bir kez okunuyor. */
async function katalog() {
  const supabase = createSupabaseAdminClient();
  const [kategoriler, cinsler, sehirler, ilceler, ozellikler] = await Promise.all([
    supabase.from('categories').select('id, slug'),
    supabase.from('breeds').select('id, slug, category_id'),
    supabase.from('cities').select('id, slug'),
    supabase.from('districts').select('id, slug, city_id'),
    supabase.from('service_features').select('id, slug, service_type'),
  ]);

  const harita = <T extends { slug: string }>(satirlar: T[] | null) =>
    new Map((satirlar ?? []).map((s) => [s.slug, s]));

  return {
    kategori: harita(kategoriler.data),
    // Cins adresleri kategoriler arasında tekrar edebiliyor ("akvaryum"
    // hem kategori hem malzeme adı), o yüzden anahtar kategoriyle birlikte.
    cins: new Map(
      (cinsler.data ?? []).map((b) => [`${b.category_id}:${b.slug}`, b])
    ),
    sehir: harita(sehirler.data),
    ilce: new Map((ilceler.data ?? []).map((d) => [`${d.city_id}:${d.slug}`, d])),
    ozellik: new Map(
      (ozellikler.data ?? []).map((f) => [`${f.service_type}:${f.slug}`, f])
    ),
  };
}

export type DemoSonuc = { eklenen: number; guncellenen: number; hata: string[] };

export async function demoEkle(): Promise<{
  kullanici: DemoSonuc;
  ilan: DemoSonuc;
  isletme: DemoSonuc;
}> {
  const supabase = createSupabaseAdminClient();
  const k = await katalog();

  const bos = (): DemoSonuc => ({ eklenen: 0, guncellenen: 0, hata: [] });
  const sonuc = { kullanici: bos(), ilan: bos(), isletme: bos() };

  // --- Hesaplar ---
  const kullaniciId = new Map<string, string>();
  for (const kul of DEMO_KULLANICILAR) {
    try {
      // Var olan hesabı e-postadan buluyoruz: auth tarafında "upsert" yok.
      const { data: liste } = await supabase.auth.admin.listUsers({ perPage: 200 });
      let id = liste?.users.find((u) => u.email === kul.email)?.id;

      if (!id) {
        const { data, error } = await supabase.auth.admin.createUser({
          email: kul.email,
          password: parolaUret(kul.email),
          email_confirm: true,
          user_metadata: { full_name: kul.fullName },
        });
        if (error) throw new Error(error.message);
        id = data.user!.id;
        sonuc.kullanici.eklenen++;
      } else {
        sonuc.kullanici.guncellenen++;
      }

      kullaniciId.set(kul.anahtar, id);

      const sehir = k.sehir.get(kul.citySlug);
      const ilce = kul.districtSlug && sehir ? k.ilce.get(`${sehir.id}:${kul.districtSlug}`) : null;

      const { error: profilHatasi } = await supabase.from('profiles').upsert(
        {
          id,
          full_name: kul.fullName,
          username: kul.username,
          bio: kul.bio ?? null,
          account_type: kul.accountType,
          company_title: kul.companyTitle ?? null,
          city_id: sehir?.id ?? null,
          district_id: ilce?.id ?? null,
          is_verified: kul.dogrulanmis ?? false,
          verified_at: kul.dogrulanmis ? new Date().toISOString() : null,
          identity_status: kul.dogrulanmis ? 'dogrulandi' : 'yok',
          // Telefon bilerek boş: demo ilandaki numara gerçek birine
          // düşerse o kişiyi rahatsız eder.
          phone: null,
          is_demo: true,
        } as never,
        { onConflict: 'id' }
      );
      if (profilHatasi) throw new Error(profilHatasi.message);
    } catch (e) {
      sonuc.kullanici.hata.push(`${kul.anahtar}: ${(e as Error).message}`);
    }
  }

  // --- İlanlar ---
  for (const ilan of DEMO_ILANLAR) {
    try {
      const sahip = kullaniciId.get(ilan.kullanici);
      if (!sahip) throw new Error(`hesap yok: ${ilan.kullanici}`);

      const kategori = k.kategori.get(ilan.kategori);
      if (!kategori) throw new Error(`kategori yok: ${ilan.kategori}`);

      const cins = ilan.cins ? k.cins.get(`${kategori.id}:${ilan.cins}`) : null;
      if (ilan.cins && !cins) throw new Error(`cins yok: ${ilan.cins}`);

      const sehir = k.sehir.get(ilan.sehir);
      if (!sehir) throw new Error(`şehir yok: ${ilan.sehir}`);
      const ilce = ilan.ilce ? k.ilce.get(`${sehir.id}:${ilan.ilce}`) : null;

      const kullanici = DEMO_KULLANICILAR.find((x) => x.anahtar === ilan.kullanici)!;

      const govde = {
        owner_id: sahip,
        kind: ilan.kind,
        status: 'yayinda',
        category_id: kategori.id,
        breed_id: cins?.id ?? null,
        breed_other: ilan.cinsDiger ?? null,
        title: ilan.baslik,
        slug: ilan.slug,
        description: ilan.aciklama,
        price: ilan.kind === 'satilik' ? (ilan.fiyat ?? null) : null,
        is_negotiable: ilan.pazarlik ?? false,
        age_months: ilan.yasAy ?? null,
        gender: ilan.cinsiyet ?? 'belirtilmemis',
        size: ilan.boyut ?? null,
        color: ilan.renk ?? null,
        quantity: ilan.adet ?? 1,
        is_vaccinated: ilan.asili ?? false,
        is_dewormed_internal: ilan.icParazit ?? false,
        is_dewormed_external: ilan.disParazit ?? false,
        is_neutered: ilan.kisir ?? false,
        has_pedigree: ilan.secere ?? false,
        has_microchip: ilan.mikrocip ?? false,
        has_health_report: ilan.saglikRaporu ?? false,
        city_id: sehir.id,
        district_id: ilce?.id ?? null,
        contact_phone: null,
        show_phone: false,
        allow_whatsapp: false,
        /**
         * demo_key: tekrar çalıştırmada aynı ilanı bulmak için.
         *
         * Adres (slug) anahtar olarak kullanılamıyor: listings_sync_slug
         * tetikleyicisi onu başlıktan yeniden üretiyor, yani yazdığımız
         * değer kaydedilmiyor. Anahtar olmadan her çalıştırma ilanları
         * baştan ekliyor ve sayı ikiye katlanıyordu.
         */
        details: { demo_key: ilan.slug, ...(ilan.durum ? { condition: ilan.durum } : {}) },
        owner_account_type: kullanici.accountType,
        published_at: new Date().toISOString(),
        is_demo: true,
      };

      const { data: mevcut } = await supabase
        .from('listings')
        .select('id')
        .eq('is_demo', true)
        .eq('details->>demo_key', ilan.slug)
        .maybeSingle();

      let ilanId: number;
      if (mevcut) {
        const { error } = await supabase.from('listings').update(govde as never).eq('id', mevcut.id);
        if (error) throw new Error(error.message);
        ilanId = mevcut.id;
        sonuc.ilan.guncellenen++;
      } else {
        const { data, error } = await supabase
          .from('listings')
          .insert(govde as never)
          .select('id')
          .single();
        if (error) throw new Error(error.message);
        ilanId = (data as { id: number }).id;
        sonuc.ilan.eklenen++;
      }

      // Fotoğraflar depolamada duruyor; burada yalnızca satırlar yazılıyor.
      const fotolar = FOTOGRAFLAR.filter((f) => f.ilan === ilan.slug).sort((a, b) =>
        a.path.localeCompare(b.path)
      );
      await supabase.from('listing_photos').delete().eq('listing_id', ilanId);
      if (fotolar.length) {
        const { error } = await supabase.from('listing_photos').insert(
          fotolar.map((f, i) => ({
            listing_id: ilanId,
            storage_path: f.path,
            position: i,
            width: f.width ?? null,
            height: f.height ?? null,
          })) as never
        );
        if (error) throw new Error(error.message);
      }
    } catch (e) {
      sonuc.ilan.hata.push(`${ilan.slug}: ${(e as Error).message}`);
    }
  }

  // --- İşletmeler ---
  for (const isl of DEMO_ISLETMELER) {
    try {
      const sehir = k.sehir.get(isl.sehir);
      if (!sehir) throw new Error(`şehir yok: ${isl.sehir}`);
      const ilce = isl.ilce ? k.ilce.get(`${sehir.id}:${isl.ilce}`) : null;

      const govde = {
        service_type: isl.tur,
        status: 'yayinda',
        owner_id: null,
        name: isl.ad,
        slug: isl.slug,
        description: isl.aciklama,
        city_id: sehir.id,
        district_id: ilce?.id ?? null,
        address: isl.adres ?? null,
        phone: null,
        whatsapp: null,
        email: null,
        published_at: new Date().toISOString(),
        is_demo: true,
      };

      const { data: mevcut } = await supabase
        .from('service_providers')
        .select('id')
        .eq('is_demo', true)
        .eq('name', isl.ad)
        .maybeSingle();

      let islId: number;
      if (mevcut) {
        const { error } = await supabase
          .from('service_providers')
          .update(govde as never)
          .eq('id', mevcut.id);
        if (error) throw new Error(error.message);
        islId = mevcut.id;
        sonuc.isletme.guncellenen++;
      } else {
        const { data, error } = await supabase
          .from('service_providers')
          .insert(govde as never)
          .select('id')
          .single();
        if (error) throw new Error(error.message);
        islId = (data as { id: number }).id;
        sonuc.isletme.eklenen++;
      }

      await supabase.from('service_provider_features').delete().eq('provider_id', islId);
      const ozellikIdleri = (isl.ozellikler ?? [])
        .map((slug) => k.ozellik.get(`${isl.tur}:${slug}`)?.id)
        .filter((id): id is number => typeof id === 'number');
      if (ozellikIdleri.length) {
        await supabase
          .from('service_provider_features')
          .insert(ozellikIdleri.map((fid) => ({ provider_id: islId, feature_id: fid })) as never);
      }

      await supabase.from('service_provider_hours').delete().eq('provider_id', islId);
      if (isl.saatler?.length) {
        await supabase.from('service_provider_hours').insert(
          isl.saatler.map((s) => ({
            provider_id: islId,
            weekday: s.gun,
            opens_at: s.acilis,
            closes_at: s.kapanis,
            is_closed: false,
            is_24h: s.acilis === '00:00' && s.kapanis === '23:59',
          })) as never
        );
      }
    } catch (e) {
      sonuc.isletme.hata.push(`${isl.slug}: ${(e as Error).message}`);
    }
  }

  return sonuc;
}

export async function demoSil(): Promise<{ ilan: number; isletme: number; kullanici: number; hata: string[] }> {
  const supabase = createSupabaseAdminClient();
  const hata: string[] = [];

  const { data: ilanlar } = await supabase.from('listings').select('id').eq('is_demo', true);
  const ilanIdleri = (ilanlar ?? []).map((l) => l.id);
  if (ilanIdleri.length) {
    // Fotoğraf satırları ilana bağlı; dosyalar depolamada kalıyor ki
    // "ekle" düğmesi tekrar basıldığında yeniden indirme gerekmesin.
    await supabase.from('listing_photos').delete().in('listing_id', ilanIdleri);
    const { error } = await supabase.from('listings').delete().in('id', ilanIdleri);
    if (error) hata.push(`ilanlar: ${error.message}`);
  }

  const { data: isletmeler } = await supabase
    .from('service_providers')
    .select('id')
    .eq('is_demo', true);
  const islIdleri = (isletmeler ?? []).map((p) => p.id);
  if (islIdleri.length) {
    await supabase.from('service_provider_features').delete().in('provider_id', islIdleri);
    await supabase.from('service_provider_hours').delete().in('provider_id', islIdleri);
    const { error } = await supabase.from('service_providers').delete().in('id', islIdleri);
    if (error) hata.push(`işletmeler: ${error.message}`);
  }

  const { data: profiller } = await supabase.from('profiles').select('id').eq('is_demo', true);
  let silinenKullanici = 0;
  for (const p of profiller ?? []) {
    // auth kullanıcısı silinince profil de kaskadla gidiyor.
    const { error } = await supabase.auth.admin.deleteUser(p.id);
    if (error) hata.push(`hesap ${p.id}: ${error.message}`);
    else silinenKullanici++;
  }

  return { ilan: ilanIdleri.length, isletme: islIdleri.length, kullanici: silinenKullanici, hata };
}
