/**
 * Demo (vitrin) içeriğinin tipleri.
 *
 * İçerik veritabanında değil kodda duruyor. Sebebi: bu satırlar bir kez
 * yazılıp bırakılacak veri değil, "ekle" ve "sil" düğmeleriyle defalarca
 * uygulanıp kaldırılacak bir tanım. Kodda durduğunda sürüm geçmişi
 * içeriğin ne olduğunu da taşıyor ve demo hesapların e-postaları gibi
 * tekrar üretilmesi gereken alanlar sabit kalıyor.
 */

export type DemoKullanici = {
  /** İlanların bağlanacağı anahtar. */
  anahtar: string;
  email: string;
  fullName: string;
  username: string;
  accountType: 'bireysel' | 'kurumsal';
  companyTitle?: string;
  bio?: string;
  citySlug: string;
  districtSlug?: string;
  /** Kimliği doğrulanmış görünsün mü (onaylı rozeti). */
  dogrulanmis?: boolean;
};

export type DemoIlan = {
  /** Hem depolama klasörü hem ilan adresi için. */
  slug: string;
  kullanici: string;
  kategori: string;
  cins?: string;
  cinsDiger?: string;
  kind: 'satilik' | 'sahiplendirme' | 'kayip' | 'bulundu' | 'es_arayan';
  /**
   * Kayıp/bulundu ilanlarında olayın kaç gün önce olduğu.
   *
   * Sabit tarih yazılamıyor: demo içerik aylarca durabilir ve "3 Ocak'ta
   * kayboldu" diyen bir ilan yazın ortasında saçma görünür. Tarih
   * uygulanırken bugünden geriye sayılarak hesaplanıyor.
   */
  olayGunOnce?: number;
  baslik: string;
  aciklama: string;
  fiyat?: number;
  pazarlik?: boolean;
  yasAy?: number;
  cinsiyet?: 'erkek' | 'disi' | 'belirtilmemis';
  boyut?: 'mini' | 'kucuk' | 'orta' | 'buyuk' | 'dev';
  renk?: string;
  adet?: number;
  asili?: boolean;
  icParazit?: boolean;
  disParazit?: boolean;
  kisir?: boolean;
  secere?: boolean;
  mikrocip?: boolean;
  saglikRaporu?: boolean;
  durum?: 'sifir' | 'az_kullanilmis' | 'kullanilmis';
  sehir: string;
  ilce?: string;
  /**
   * Elle seçilmiş Commons dosyaları ("Takla Tümmler.jpg" gibi).
   *
   * Verilmişse arama hiç yapılmıyor. Commons araması bu konularda
   * güvenilir değil: "Guppy" kargo uçağı, "Guinea pig" doku kesiti,
   * "Fancy pigeon" 19. yüzyıl gravürü getiriyor. Elle seçim, ilanın
   * fotoğrafının gerçekten o hayvana ait olmasının tek garantisi.
   */
  gorseller?: string[];
  /** gorseller yoksa Commons'ta aranacak terimler; sırayla deneniyor. */
  gorselTerimleri: string[];
  fotografSayisi?: number;
};

export type DemoIsletme = {
  slug: string;
  tur: 'veteriner' | 'pet_oteli' | 'kuafor' | 'pet_taksi' | 'gezdirici' | 'egitmen' | 'petshop';
  ad: string;
  aciklama: string;
  sehir: string;
  ilce?: string;
  adres?: string;
  /** service_features.slug listesi. */
  ozellikler?: string[];
  /** Haftanın günleri için açılış-kapanış; boş bırakılırsa saat yazılmıyor. */
  saatler?: { gun: number; acilis: string; kapanis: string }[];
};
