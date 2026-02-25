# Petsemti – Hızlı Proje Analizi ve Yapılacaklar

## 1) Hızlı Durum Özeti
- Proje **Next.js 15 + React 19 + TypeScript + Firebase** stack’i ile kurulmuş.
- Paket scriptlerinde `dev`, `build`, `start`, `typecheck` mevcut; `lint` komutu halen Next’in eski etkileşimli lint kurulumuna bağlı görünüyor.
- Ürün hedefi (ilanlar, servis rehberi, kullanıcı hesabı, AI destekli cins tahmini) dokümanda açık; ancak README oldukça kısa ve operasyonel kurulum detayları eksik.

## 2) Teknik Bulgular

### A. Derleme/Tip Kontrol Sağlığı
`npm run typecheck` çıktısına göre derlemeyi bozan kritik TypeScript hataları var:
1. `src/app/admin/BreedManagement.tsx`
   - `Breed[]` ile `string[]` arasında tip uyuşmazlığı.
2. `src/app/ilan/[id]/yeni/CreateListingForm.tsx`
   - `@/lib/firebase` içinden `useUser`, `useFirestore`, `useStorage` importları bulunamıyor.
   - `@/lib/firebase/firestore/use-user-profile` yolu mevcut değil.
3. `src/components/ui/calendar.tsx`
   - `react-day-picker` custom component API’si ile uyumsuz `IconLeft/IconRight` kullanımı.
4. `src/firebase/firestore/use-user-profile.ts`
   - `doc(...)` referansı yanlışlıkla `DocumentData`’ya cast ediliyor; `useDoc` beklediği ref tipiyle uyumsuz.
5. `src/lib/types.ts`
   - `@/docs/backend.json` import yolu `tsconfig` alias kapsamı dışında (`@/*` sadece `src/*`’a işaret ediyor).

### B. Mimari Tutarlılık
- Firebase tarafında iki farklı yaklaşım var:
  - `src/lib/firebase.ts` (basit singleton export: `auth`, `db`, `storage`)
  - `src/firebase/index.ts` + provider/hooks tabanlı mimari
- Bu ikili yapı modüller arası import karışıklığına yol açmış ve doğrudan typecheck hatalarına yansımış.

### C. Lint ve Kod Kalitesi Süreci
- `npm run lint`, ESLint yapılandırması interaktif prompt’a düştüğü için CI/non-interactive ortamda tamamlanamıyor.
- Bu durum ekip içi kalite kontrolünün otomasyona alınmasını engeller.

### D. Dokümantasyon ve Operasyon
- README’da kurulum, env değişkenleri, Firebase setup ve dağıtım adımları detaylı değil.
- `docs/blueprint.md` ürün hedefini anlatıyor; ancak geliştirme roadmap’i ve teknik karar kayıtları (ADR) görünmüyor.

## 3) Öncelikli Yapılacaklar (Backlog)

## P0 – Bloklayıcılar (Önce bunlar)
1. **TypeScript hatalarını sıfırla** (hedef: `npm run typecheck` temiz).
   - `BreedManagement` içinde tipleri `Breed[]` ile uyumlu hale getir (UI’da `name` alanı kullan).
   - `CreateListingForm` importlarını tek Firebase mimarisine göre düzelt.
   - `use-user-profile` hook tipini `DocumentReference | null` olacak şekilde düzelt.
   - `lib/types.ts` için backend şema importunu çalışır hale getir (alias/konum düzenlemesi).
   - `calendar.tsx` için `react-day-picker` sürümüne uygun custom navigation implementasyonu yap.
2. **Lint sürecini non-interactive hale getir**.
   - Projede kalıcı ESLint config ekle.
   - `npm run lint` komutunun prompt’suz çalıştığını doğrula.

## P1 – Mimari ve Sürdürülebilirlik
3. **Firebase erişim katmanını tekleştir**.
   - `src/lib/firebase.ts` ve `src/firebase/*` arasında net bir standard belirle.
   - Tüm import yollarını bu standarda migrate et.
4. **Admin ekranlarındaki “simüle” işlemleri kalıcı backend’e bağla**.
   - Özellikle cins yönetimi ekranındaki ekle/sil işlemleri yalnızca local state yerine Firestore/Server Action üzerinden kalıcı olmalı.

## P2 – Ürün ve DX iyileştirmeleri
5. **README’yi operasyonel hale getir**.
   - `.env` örneği, geliştirme komutları, Firebase kurulum adımları, deploy akışı ekle.
6. **Test tabanı ekle**.
   - En azından kritik form validasyonları ve önemli hook’lar için birim testleri.
7. **AI akışları için gözlemlenebilirlik**.
   - Genkit akışlarında hata loglama, timeout/retry stratejisi, maliyet farkındalığı notları.

## 4) Önerilen 7 Günlük Uygulama Planı
- **Gün 1-2:** P0 TypeScript + lint blokajlarını kaldır.
- **Gün 3-4:** Firebase katmanını tekilleştir, import migration.
- **Gün 5:** Admin ekranlarının kalıcı veri yazımını devreye al.
- **Gün 6:** README + env + runbook dokümantasyonunu tamamla.
- **Gün 7:** Kritik akış testleri + smoke test checklist.

## 5) Tamamlanma Kriterleri (Definition of Done)
- `npm run typecheck` ✅
- `npm run lint` ✅ (non-interactive)
- En az bir admin CRUD akışı kalıcı backend ile çalışıyor ✅
- README ile sıfırdan kurulum yapılabiliyor ✅
- Temel test/smoke checklist’i repoda mevcut ✅

