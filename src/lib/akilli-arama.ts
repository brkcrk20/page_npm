import { SERVICE_CONFIGS } from '@/lib/services-config';
import {
  staticBreeds,
  staticCategories,
  staticCities,
  staticDistrictsFor,
} from '@/lib/static-catalog';

/**
 * Yazılanı anlayan arama.
 *
 * Kutuya "denizli golden retriever" yazan kişi bir metin araması değil, bir
 * SAYFA arıyor: /kopek-ilanlari/golden-retriever/denizli. Eski kutu bunu
 * yapamıyordu — kullanıcı önce açılır listeden tür, sonra cins, sonra il
 * seçmek zorundaydı; yazdığı metin ise ilan başlıklarında düz arama olarak
 * kullanılıyordu ve "denizli golden retriever" başlıklı bir ilan olmadığı
 * için çoğu zaman boş sonuç dönüyordu.
 *
 * Burada yapılan şey: yazılan metni şehir, ilçe, cins, tür, hizmet ve niyet
 * kelimelerine ayırmak ve elde kalanla birlikte gidilebilecek sayfaları
 * puanlayarak sıralamak. Hepsi tarayıcıda, veritabanına gitmeden: şehir,
 * ilçe, cins ve tür listeleri zaten statik olarak paketin içinde.
 *
 * ÇOK KELİMELİ ADLAR ÖNCE
 * "pet oteli" içinde "pet" ve "otel" ayrı ayrı da geçiyor; "golden retriever"
 * içinde "golden". Eşleştirme her zaman en uzun addan başlıyor, yoksa
 * "pet oteli" araması "pet" diye bir cinse takılırdı.
 */

export type AramaOnerisi = {
  /** Listede sol taraftaki ikonu ve grubu belirliyor. */
  tip: 'ilan' | 'hizmet' | 'urun' | 'metin';
  baslik: string;
  aciklama?: string;
  href: string;
  puan: number;
};

/**
 * Türkçe duyarsız karşılaştırma anahtarı.
 *
 * "Şişli" ile "sisli", "Iğdır" ile "igdir" eşleşsin diye. Kullanıcı arama
 * kutusuna şapkalı harf yazmıyor.
 */
export function anahtar(metin: string): string {
  return metin
    .toLocaleLowerCase('tr')
    .replace(/İ/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Niyet kelimeleri: bunlar kendi bölüm sayfalarına götürüyor. */
const NIYETLER: { kelimeler: string[]; baslik: string; href: string }[] = [
  {
    kelimeler: [
      'sahiplendirme',
      'sahiplenme',
      'sahiplendirilecek',
      'sahiplendiriyorum',
      'ucretsiz',
      'bedava',
      'yuva ariyor',
    ],
    baslik: 'Ücretsiz sahiplendirme ilanları',
    href: '/sahiplendirme',
  },
  {
    kelimeler: ['kayip', 'kayboldu', 'bulundu', 'kayip hayvan'],
    baslik: 'Kayıp ve bulundu ilanları',
    href: '/kayip',
  },
  {
    kelimeler: ['es ariyor', 'es arayan', 'ciftlesme', 'eslesme'],
    baslik: 'Eş arayan ilanları',
    href: '/es-arayanlar',
  },
];

/** Hizmet bölümleri için ek arama kelimeleri (config'teki ad yetmiyor). */
const HIZMET_ESANLAMLI: Record<string, string[]> = {
  veteriner: ['veteriner', 'veterinerlik', 'klinik', 'hayvan hastanesi', 'vet'],
  'pet-oteli': ['pet oteli', 'pet otel', 'hayvan oteli', 'kedi oteli', 'kopek oteli', 'pansiyon'],
  'pet-kuafor': ['pet kuafor', 'kuafor', 'tras', 'hayvan kuaforu'],
  'pet-taksi': ['pet taksi', 'hayvan taksi', 'evcil hayvan taksi'],
  gezdirici: ['gezdirici', 'gezdirme', 'kopek gezdirme', 'yuruyus'],
  egitmen: ['egitmen', 'egitim', 'kopek egitimi', 'itaat egitimi'],
  petshop: ['petshop', 'pet shop', 'mama', 'kedi kumu', 'malzeme', 'magaza'],
};

/** Petshop bölümüne götüren ama aslında ÜRÜN adı olan kelimeler. */
const URUN_KELIMELERI = ['mama', 'kedi kumu', 'malzeme'];

type Bulgu = { baslangic: number; bitis: number };

/**
 * Kelime bazlı eşleştirme.
 *
 * Düz "metin içinde geçiyor mu" yetmiyor, üç şey birden gerekiyor:
 *
 *  1. EK TOLERANSI — kullanıcı "kuaförü", "veterineri", "ankarada" yazıyor.
 *     Sorgu kelimesi anahtarla başlıyorsa ve fazlası üç harfi geçmiyorsa
 *     eşleşme sayılıyor.
 *  2. KISALTMA — "golden" yazan kişi Golden Retriever'ı kastediyor. Çok
 *     kelimeli bir adın SON kelimesi eksik bırakılabiliyor.
 *  3. KELİME SINIRI — "kuş" araması "Kuşadası"na takılmamalı; bu yüzden
 *     karşılaştırma harf harf değil, kelime kelime.
 *
 * En uzun eşleşme kazanıyor: "pet oteli" içinde "pet" de geçiyor, "golden
 * retriever" içinde "golden" de. Kısa olan kazansaydı "pet oteli" araması
 * bir cinse takılırdı.
 */
function kelimeler(metin: string): string[] {
  return metin.split(' ').filter(Boolean);
}

/**
 * Tek kelime karşılaştırması.
 *
 * 'tam'    — birebir aynı ya da yalnızca Türkçe çekim eki farkı ("ankarada").
 * 'kisalt' — kullanıcı kelimeyi yarım bırakmış ("golden" -> "goldendoodle").
 */
function kelimeEslesti(sorgu: string, ad: string): 'tam' | 'kisalt' | null {
  if (sorgu === ad) return 'tam';
  // Türkçe çekim eki: "ankarada" -> "ankara", "kuaförü" -> "kuafor".
  if (sorgu.startsWith(ad) && sorgu.length - ad.length <= 3) return 'tam';
  if (ad.startsWith(sorgu) && sorgu.length >= 4) return 'kisalt';
  return null;
}

/**
 * @param kismiIzin Anahtarın SON kelimeleri eksik bırakılabilir mi?
 *
 * Yalnızca cins adlarında açık: "golden" yazan kişi Golden Retriever'ı
 * kastediyor. Hizmet ve bölüm adlarında kapalı, çünkü orada eksik eşleşme
 * yanlış yere götürüyor: "kedi" araması "kedi oteli"ne takılıp kedi
 * ilanlarını kaçırıyordu.
 */
function enUzunEslesme<T>(
  sorguKelimeleri: string[],
  adaylar: { deger: T; anahtarlar: string[] }[],
  kismiIzin = false
): { deger: T; bulgu: Bulgu; agirlik: number } | null {
  let enIyi: { deger: T; bulgu: Bulgu; agirlik: number } | null = null;

  for (const aday of adaylar) {
    for (const a of aday.anahtarlar) {
      const ak = kelimeler(a);
      if (ak.length === 0 || a.length < 2) continue;

      for (let i = 0; i < sorguKelimeleri.length; i++) {
        let tamSayisi = 0;
        let eslesen = 0;

        while (eslesen < ak.length && i + eslesen < sorguKelimeleri.length) {
          const sonuc = kelimeEslesti(sorguKelimeleri[i + eslesen], ak[eslesen]);
          if (!sonuc) break;
          if (sonuc === 'tam') tamSayisi++;
          eslesen++;
          // Kısaltma ancak son eşleşme olabilir: "golden retr" diye devam
          // etmiyor, kullanıcı kelimeyi orada bırakmış demektir.
          if (sonuc === 'kisalt') break;
        }

        if (eslesen === 0) continue;
        if (!kismiIzin && eslesen < ak.length) continue;

        /**
         * Puanlama: önce TAM eşleşen kelime sayısı.
         *
         * "golden" hem "Goldendoodle"un kısaltması hem "Golden Retriever"ın
         * ilk kelimesi. Yalnızca kelime sayısına bakılsaydı tek kelimelik
         * Goldendoodle kazanırdı; oysa kullanıcının yazdığı kelime Golden
         * Retriever'da AYNEN geçiyor. Tam eşleşme bin puan, kelime başına
         * yüz puan, eksik kalan anahtar kelimesi başına altmış puan ceza.
         */
        const agirlik =
          tamSayisi * 1000 + eslesen * 100 + a.length - (ak.length - eslesen) * 60;

        if (!enIyi || agirlik > enIyi.agirlik) {
          enIyi = { deger: aday.deger, bulgu: { baslangic: i, bitis: i + eslesen }, agirlik };
        }
      }
    }
  }
  return enIyi;
}

/**
 * Yazılan metinden gidilebilecek sayfaları üretir.
 *
 * Sıra puana göre: ne kadar çok şey anlaşıldıysa o kadar yukarıda. Hiçbir şey
 * anlaşılmasa bile liste boş dönmüyor — en altta her zaman düz metin araması
 * ve petshop ürün araması duruyor.
 */
export function oneriUret(sorgu: string, enFazla = 7): AramaOnerisi[] {
  const ham = anahtar(sorgu);
  if (ham.length < 2) return [];

  // Eşleşen kelimeler tek tek düşülüyor; geriye kalan serbest metin oluyor.
  let kelimeDizisi = kelimeler(ham);
  const dus = (b: Bulgu) => {
    kelimeDizisi = [...kelimeDizisi.slice(0, b.baslangic), ...kelimeDizisi.slice(b.bitis)];
  };
  const oneriler: AramaOnerisi[] = [];

  // --- Hizmet bölümü ---
  const hizmet = enUzunEslesme(
    kelimeDizisi,
    SERVICE_CONFIGS.map((c) => ({
      deger: c,
      anahtarlar: [
        ...(HIZMET_ESANLAMLI[c.slug] ?? []),
        anahtar(c.label),
        anahtar(c.unit),
      ],
    }))
  );
  const hizmetAnahtari = hizmet ? kelimeDizisi.slice(hizmet.bulgu.baslangic, hizmet.bulgu.bitis).join(' ') : '';
  if (hizmet) dus(hizmet.bulgu);

  // --- Şehir ve ilçe ---
  const sehir = enUzunEslesme(
    kelimeDizisi,
    staticCities.map((c) => ({ deger: c, anahtarlar: [anahtar(c.name)] }))
  );
  if (sehir) dus(sehir.bulgu);

  const ilce = sehir
    ? enUzunEslesme(
        kelimeDizisi,
        staticDistrictsFor(sehir.deger.slug).map((d) => ({
          deger: d,
          anahtarlar: [anahtar(d.name)],
        }))
      )
    : null;
  if (ilce) dus(ilce.bulgu);

  // --- Cins ---
  const cins = enUzunEslesme(
    kelimeDizisi,
    staticBreeds.map((b) => ({ deger: b, anahtarlar: [anahtar(b.name)] })),
    true
  );
  if (cins) dus(cins.bulgu);

  // --- Tür ---
  const tur = enUzunEslesme(
    kelimeDizisi,
    staticCategories.map((c) => ({
      deger: c,
      anahtarlar: [anahtar(c.name), anahtar(c.name.replace(' İlanları', ''))],
    }))
  );
  if (tur) dus(tur.bulgu);

  // --- Niyet ---
  const niyet = enUzunEslesme(
    kelimeDizisi,
    NIYETLER.map((n) => ({ deger: n, anahtarlar: n.kelimeler }))
  );
  if (niyet) dus(niyet.bulgu);

  const kalan = kelimeDizisi.join(' ');

  const konum = ilce
    ? `${sehir!.deger.name} / ${ilce.deger.name}`
    : sehir
      ? sehir.deger.name
      : null;

  // --- Hizmet önerisi ---
  if (hizmet) {
    const parcalar = [hizmet.deger.slug];
    if (sehir) {
      parcalar.push(sehir.deger.slug);
      if (ilce) parcalar.push(ilce.deger.slug);
    }
    /**
     * "kedi kumu", "mama" gibi bir ÜRÜN kelimesiyle petshop bölümüne
     * gelindiyse o kelime aramanın kendisi: kullanıcı mağaza listesi değil,
     * o ürünü satan mağazaları arıyor.
     */
    const urunKelimesi = URUN_KELIMELERI.includes(hizmetAnahtari) ? hizmetAnahtari : '';
    const terim = kalan || urunKelimesi;
    const sorguEki = terim ? `?q=${encodeURIComponent(terim)}` : '';
    oneriler.push({
      tip: 'hizmet',
      baslik: terim
        ? `"${terim}" için ${konum ? konum + ' ' : ''}${hizmet.deger.label.toLocaleLowerCase('tr')}`
        : konum
          ? `${konum} ${hizmet.deger.label}`
          : hizmet.deger.label,
      aciklama: konum && terim ? konum : 'Hizmet rehberi',
      href: `/${parcalar.join('/')}${sorguEki}`,
      puan: 100 + (sehir ? 20 : 0) + (ilce ? 10 : 0) + (terim ? 5 : 0),
    });
  }

  // --- İlan önerisi ---
  const kategoriSlug = cins
    ? staticCategories.find((c) => c.id === cins.deger.category_id)?.slug
    : tur?.deger.slug;

  if (kategoriSlug) {
    const parcalar = [kategoriSlug];
    // Cins + il üçüncü seviyede geçerli bir sayfa; cins + ilçe değil.
    if (cins) {
      parcalar.push(cins.deger.slug);
      if (sehir) parcalar.push(sehir.deger.slug);
    } else if (sehir) {
      parcalar.push(sehir.deger.slug);
      if (ilce) parcalar.push(ilce.deger.slug);
    }

    const ad = cins ? cins.deger.name : tur!.deger.name;
    oneriler.push({
      tip: 'ilan',
      baslik: konum && !(cins && ilce) ? `${konum} ${ad}` : ad,
      aciklama: cins
        ? staticCategories.find((c) => c.id === cins.deger.category_id)?.name
        : 'İlanlar',
      href: `/${parcalar.join('/')}`,
      puan: 90 + (cins ? 20 : 0) + (sehir ? 15 : 0) + (ilce ? 5 : 0),
    });
  }

  // --- Niyet önerisi ---
  if (niyet) {
    oneriler.push({
      tip: 'ilan',
      baslik: niyet.deger.baslik,
      href: niyet.deger.href,
      // Tür de anlaşıldıysa niyet öne geçiyor: "kayıp kedi" yazan kişi kedi
      // ilanlarını değil, kayıp ilanlarını arıyor.
      puan: 95 + (tur || cins ? 20 : 0),
    });
  }

  // --- Ürün araması ---
  // Elde marka/ürün gibi bir metin kaldıysa ya da hiçbir şey anlaşılmadıysa:
  // "royal canin" gibi aramaların tek doğru cevabı petshop kataloğu.
  const urunTerimi = hizmet ? '' : kalan || (!cins && !tur && !niyet ? ham : '');
  if (urunTerimi) {
    const parcalar = ['petshop'];
    if (sehir) {
      parcalar.push(sehir.deger.slug);
      if (ilce) parcalar.push(ilce.deger.slug);
    }
    oneriler.push({
      tip: 'urun',
      baslik: `"${urunTerimi}" satan petshoplar`,
      aciklama: konum ? konum : 'Türkiye geneli',
      href: `/${parcalar.join('/')}?q=${encodeURIComponent(urunTerimi)}`,
      puan: 60 + (sehir ? 10 : 0),
    });
  }

  // --- Düz metin araması (her zaman en altta) ---
  oneriler.push({
    tip: 'metin',
    baslik: `Tüm ilanlarda "${sorgu.trim()}" ara`,
    href: `/arama?q=${encodeURIComponent(sorgu.trim())}${
      sehir ? `&city=${sehir.deger.slug}` : ''
    }${ilce ? `&district=${ilce.deger.slug}` : ''}`,
    puan: 10,
  });

  // Aynı adrese iki satır çıkmasın; yüksek puanlı olan kalıyor.
  const gorulen = new Set<string>();
  return oneriler
    .sort((a, b) => b.puan - a.puan)
    .filter((o) => !gorulen.has(o.href) && gorulen.add(o.href))
    .slice(0, enFazla);
}
