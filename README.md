# PetSemti

Türkiye geneli evcil hayvan ilan platformu. Next.js 15 (App Router) + Supabase.

## Kurulum

```bash
cp .env.example .env.local   # Supabase bilgilerini doldur
npm install
npm run db:setup             # şema + referans verisi (81 il, 973 ilçe, cinsler)
npm run dev
```

## Komutlar

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi |
| `npm run typecheck` | Tip denetimi |
| `npm run db:setup` | Göçleri ve referans verisini uygular (tekrar çalıştırılabilir) |
| `npm run db:seed` | Referans verisi SQL'ini TypeScript kaynaklarından yeniden üretir |
| `npm run db:types` | Veritabanı tiplerini yeniden üretir |

## Yapı

```
src/app/[slug]                     kategori veya ilan detayı
src/app/[slug]/[segment]           cins veya şehir
src/app/[slug]/[segment]/[ilce]    ilçe
supabase/migrations/               veritabanı şeması (sıralı)
supabase/seed/                     üretilmiş referans verisi
```

URL şemasının tek doğruluk kaynağı `src/lib/routing.ts`.
