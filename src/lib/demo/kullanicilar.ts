import type { DemoKullanici } from './tipler';

/**
 * Demo hesaplar.
 *
 * Telefon numarası verilmiyor. Gerçek bir ziyaretçi demo bir ilandaki
 * numarayı arasa, ya boşa arama yapar ya da numara başka birine aitse o
 * kişiyi rahatsız eder. İletişim yalnızca site içi mesajla mümkün ve
 * mesaja karşılık gelmeyeceği ilan sayfasında yazıyor.
 *
 * E-postalar @demo.petsemti.com altında: gerçek bir posta kutusuna
 * düşmeyen, bize ait bir alan adı. Hesaplar bu adreslerle yeniden
 * üretildiği için "sil" ve "ekle" arasında kimlikler tutarlı kalıyor.
 */
export const DEMO_KULLANICILAR: DemoKullanici[] = [
  {
    anahtar: 'elif',
    email: 'elif.demir@demo.petsemti.com',
    fullName: 'Elif Demir',
    username: 'elifdemir',
    accountType: 'bireysel',
    bio: 'Kadıköy’de yaşıyorum, mahalledeki kedilere bakıyorum. Yuva bulduğum dostları buradan paylaşıyorum.',
    citySlug: 'istanbul',
    districtSlug: 'kadikoy',
  },
  {
    anahtar: 'mert',
    email: 'mert.aydin@demo.petsemti.com',
    fullName: 'Mert Aydın',
    username: 'mertaydin',
    accountType: 'bireysel',
    bio: 'Güvercin yetiştiriyorum. Taklacı ve posta hatlarıyla ilgileniyorum.',
    citySlug: 'adana',
    districtSlug: 'seyhan',
  },
  {
    anahtar: 'zeynep',
    email: 'zeynep.koc@demo.petsemti.com',
    fullName: 'Zeynep Koç',
    username: 'zeynepkoc',
    accountType: 'bireysel',
    bio: 'Evde kalabalık bir hayvan ailesi var. Fazla malzemeleri devrediyorum.',
    citySlug: 'ankara',
    districtSlug: 'cankaya',
  },
  {
    anahtar: 'burak',
    email: 'burak.sahin@demo.petsemti.com',
    fullName: 'Burak Şahin',
    username: 'buraksahin',
    accountType: 'bireysel',
    bio: 'Bursa’da yaşıyorum. Sokakta bulduğum yavrulara geçici bakım veriyorum.',
    citySlug: 'bursa',
    districtSlug: 'nilufer',
  },
  {
    anahtar: 'anadolu',
    email: 'anadolu.kennel@demo.petsemti.com',
    fullName: 'Anadolu Kennel',
    username: 'anadolukennel',
    accountType: 'kurumsal',
    companyTitle: 'Anadolu Kennel Hayvancılık Ltd. Şti.',
    bio: 'Üretim izinli köpek yetiştirme tesisi. Kangal ve çoban köpeği hatlarıyla çalışıyoruz.',
    citySlug: 'sivas',
    districtSlug: 'merkez',
    dogrulanmis: true,
  },
  {
    anahtar: 'egekatteri',
    email: 'ege.katteri@demo.petsemti.com',
    fullName: 'Ege Katteri',
    username: 'egekatteri',
    accountType: 'kurumsal',
    companyTitle: 'Ege Katteri Kedi Yetiştiriciliği Ltd. Şti.',
    bio: 'İzmir merkezli katteri. British Shorthair ve Scottish hatları üzerine çalışıyoruz.',
    citySlug: 'izmir',
    districtSlug: 'karsiyaka',
    dogrulanmis: true,
  },
  {
    anahtar: 'kanatpet',
    email: 'kanat.petshop@demo.petsemti.com',
    fullName: 'Kanat Pet',
    username: 'kanatpet',
    accountType: 'kurumsal',
    companyTitle: 'Kanat Pet Ticaret Ltd. Şti.',
    bio: 'Kuş ve akvaryum ürünleri üzerine uzmanlaşmış işletme.',
    citySlug: 'konya',
    districtSlug: 'selcuklu',
    dogrulanmis: true,
  },
  {
    anahtar: 'akdenizpet',
    email: 'akdeniz.pet@demo.petsemti.com',
    fullName: 'Akdeniz Pet',
    username: 'akdenizpet',
    accountType: 'kurumsal',
    companyTitle: 'Akdeniz Pet Hayvancılık Ltd. Şti.',
    bio: 'Antalya’da kemirgen, sürüngen ve akvaryum canlıları.',
    citySlug: 'antalya',
    districtSlug: 'muratpasa',
    dogrulanmis: true,
  },
];
