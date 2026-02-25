# SEO ve Route Yapısı Hızlı Denetim (Petsemti)

## Kapsam
Bu denetim, `src/app` altındaki route yapısını, Next.js metadata kullanımını ve temel teknik SEO sinyallerini hızlıca kontrol eder.

## Kısa Sonuç
- **SEO altyapısı kısmen eksik**: Sadece global metadata var; route bazlı metadata/canonical/robots/sitemap tanımları yok.
- **Route tarafında bozuk link riski var**: `/kopek-ilanlari` listesi için sayfa dosyası yok, ama bazı yerlerde bu URL’ye link veriliyor.
- **URL standardı tutarsız**: `pet_kuafor` ve `pet_taksi` gibi underscore içeren yollar SEO açısından zayıf.
- **Potansiyel içerik çoğaltma**: `/ilan/[id]` ve `/listings/[id]` aynı amaca hizmet eden iki detay rotası; canonical stratejisi yok.

---

## Bulgular

### 1) Metadata yalnızca global seviyede
Projede metadata tanımı sadece `layout.tsx` içinde bulunuyor; route bazlı `generateMetadata` / `export const metadata` bulunmuyor.

**Etkisi:**
- Kategori ve ilan detay sayfalarında benzersiz title/description üretilemiyor.
- SERP’te düşük tıklama oranı (CTR) ve içerik ayrışması problemi oluşabilir.

### 2) `lang` değeri içerikle uyumsuz
`<html lang="en">` kullanılıyor, ancak içerik ağırlıkla Türkçe.

**Etkisi:**
- Arama motoru ve erişilebilirlik araçları dil sinyalini yanlış yorumlayabilir.

### 3) Teknik SEO dosyaları eksik
`src/app` altında `robots.ts`, `sitemap.ts`, `manifest.webmanifest` (veya eşdeğer metadata route’ları) görünmüyor.

**Etkisi:**
- Tarama/politika sinyalleri eksik.
- Site haritası olmadan özellikle dinamik rota keşfi zayıflayabilir.

### 4) Bozuk route / link riski: `/kopek-ilanlari`
`src/app` altında `kopek-ilanlari/page.tsx` yok; sadece `kopek-ilanlari/[slug]/page.tsx` var. Buna rağmen breadcrumb içinde `/kopek-ilanlari` linki geçiyor.

**Etkisi:**
- Kullanıcı 404’a düşebilir.
- İç link kalitesi düşer, crawl budget olumsuz etkilenebilir.

### 5) URL adlandırma tutarsız: underscore kullanımı
`/pet_kuafor` ve `/pet_taksi` rotaları underscore ile tanımlanmış.

**Etkisi:**
- Türkçe içerik ve mevcut slug yaklaşımıyla (`kedi-ilanlari`, `pet-oteli`) uyumsuzluk.
- URL okunabilirliği ve paylaşılabilirliği azalır.

### 6) Potansiyel duplicate content: `/ilan/[id]` vs `/listings/[id]`
Kodda iki farklı ilan detay rotası aktif olarak kullanılıyor.

**Etkisi:**
- Aynı/benzer içeriğin iki URL’de sunulması durumunda canonical gereksinimi doğar.
- Doğru canonical yoksa index sinyali bölünebilir.

### 7) Genel dinamik rota davranışı (`/[catId]/[slug]`) şüpheli
Bu rota dosyasında sayfa içeriği `Dog` sabitine göre çalışıyor (parametre odaklı görünmüyor).

**Etkisi:**
- Route niyeti ile içerik eşleşmezliği.
- Yanlış içerik üretimi veya beklenmeyen indexlenme riski.

---

## Önceliklendirilmiş Aksiyonlar

### P0 (Hemen)
1. `/kopek-ilanlari` için gerçek liste sayfası ekle veya mevcut linkleri geçerli rotaya yönlendir.
2. `lang="tr"` olarak güncelle.
3. `/ilan/[id]` ve `/listings/[id]` için tek kanonik rota belirleyip canonical uygula.

### P1 (Kısa vadede)
4. Kategori ve ilan detay sayfalarına route bazlı metadata ekle (`generateMetadata`).
5. `robots.ts` ve `sitemap.ts` ekle.
6. Underscore URL’leri hyphen’a taşı (`/pet-kuafor`, `/pet-taksi`) + 301 yönlendirme planı.

### P2 (Orta vadede)
7. `/[catId]/[slug]` rotasını parametre odaklı hale getir veya gereksizse kaldır.
8. Admin/login/profil gibi sayfalarda `noindex` politikası uygula.

---

## Hızlı Kontrol Listesi
- [ ] Her indexlenecek sayfada benzersiz title/description var.
- [ ] Canonical alanı detay sayfalarında tek rota stratejisini yansıtıyor.
- [ ] `robots.txt` ve `sitemap.xml` üretimi aktif.
- [ ] İç linklerde 404 veren URL yok.
- [ ] URL formatı tutarlı (hyphen bazlı).
