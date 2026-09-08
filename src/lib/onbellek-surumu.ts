/**
 * Veri önbelleğinin sürüm damgası.
 *
 * SORUN
 * Sunucudaki sorgular unstable_cache ile önbelleğe alınıyor ve Vercel bu
 * önbelleği DAĞITIMLAR ARASINDA koruyor. Yeni bir sürüm yayınlamak onu
 * temizlemiyor. Sorgunun İSTEDİĞİ alanlar değiştiğinde (yeni bir sütun
 * eklendiğinde) yeni kod çalışıyor ama eski, o alanı içermeyen sonuç
 * dönüyor: özellik canlıda "çalışmıyor" görünüyor.
 *
 * Bir kez başımıza geldi: kart görsellerinin mobil kopyası eklendi, deploy
 * çıktı, sayfa hâlâ eski büyük dosyayı basıyordu. Kod doğruydu, veri
 * önbellekten geliyordu.
 *
 * ÇÖZÜM
 * Önbellek anahtarına dağıtımın kimliği ekleniyor. Her yeni sürüm kendi
 * anahtar uzayında başlıyor, yani eski sonuçlar kendiliğinden devre dışı
 * kalıyor. Bedeli, her dağıtımdan sonra ilk isteğin veritabanına gitmesi.
 *
 * Yerelde ve ortam değişkeni yoksa sabit bir değer kullanılıyor; orada
 * önbellek zaten .next/cache ile birlikte siliniyor.
 */
export const ONBELLEK_SURUMU =
  process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? 'yerel';
