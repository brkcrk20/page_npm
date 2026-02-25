# Petsemti

Next.js + Firebase tabanli ilan platformu.

## Gelistirme

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## Uretim Yayin Hazirlik Kontrolu

```bash
npm run typecheck
npm run build
```

## URL ve SEO Notlari

- Birincil Turkce (ASCII) rotalar:
  - `/giris`
  - `/ilanlar`
  - `/ilanlar/yeni`
  - `/pet-kuafor`
  - `/pet-taksi`
- Eski rotalar 301 ile yeni rotalara yonlendirilir (`next.config.ts`).
- `robots.txt` ve `sitemap.xml` metadata route olarak uretilir.

## Firebase App Hosting Yayin

Bu depoda `apphosting.yaml` oldugu icin hedef ortam Firebase App Hosting'dir.

1. Firebase CLI kurulu olmali ve projeye login olunmali.
2. Proje secimi yapilmali.
3. Deploy tetiklenmeli.

Ornek akis:

```bash
firebase login
firebase use <project-id>
firebase deploy
```

> Not: Bu ortamda CLI/kimlik bilgisi yoksa deploy komutu calismayabilir.
