# Design System

Bu doküman, `src/components/ui/` altyapısının ve ilişkili tasarım
token'larının özetidir. Hiçbir mevcut sayfa bu değişikliklerle yeniden
tasarlanmadı — bu doküman yalnızca **altyapıyı** açıklar.

## 1. Renk Sistemi

Roller CSS custom property olarak `src/app/globals.css` içinde (light + dark)
tanımlanır ve `tailwind.config.ts` üzerinden Tailwind sınıflarına bağlanır.

| Rol         | Tailwind sınıfı              | Kullanım                         |
|-------------|-------------------------------|-----------------------------------|
| Primary     | `bg-primary` / `text-primary` | Ana marka rengi, birincil aksiyon |
| Secondary   | `bg-secondary`                | İkincil aksiyon, nötr vurgu       |
| Success     | `bg-success`                  | Onay, başarı durumu               |
| Warning     | `bg-warning`                  | Dikkat gerektiren durum           |
| Danger      | `bg-destructive`              | Hata, silme, geri alınamaz işlem  |
| Info        | `bg-info`                     | Bilgilendirme                     |
| Neutral     | `bg-neutral`                  | Nötr etiket/arka plan             |

Her rolün `-foreground` eşleniği vardır (ör. `text-success-foreground`) ve
dark mode değerleri `.dark` bloğunda ayrıca tanımlıdır.

## 2. Spacing Standardı

Taban birim 4px'dir. Var olan Tailwind sayısal spacing sınıfları (`p-4`,
`gap-2` vb.) **hiç değiştirilmedi**; bunlara ek olarak semantic isimler
`ds-*` önekiyle eklendi (ör. `p-ds-4`, `gap-ds-6`).

| İsim | Token   | Değer  |
|------|---------|--------|
| xs   | `ds-1`  | 4px    |
| sm   | `ds-2`  | 8px    |
| md   | `ds-4`  | 16px   |
| lg   | `ds-6`  | 24px   |
| xl   | `ds-8`  | 32px   |
| 2xl  | `ds-12` | 48px   |
| 3xl  | `ds-16` | 64px   |

## 3. Border Radius Standardı

`--radius` (0.8rem) merkezi değişkeninden türetilir.

| Sınıf       | Değer                        |
|-------------|-------------------------------|
| `rounded-sm`| `calc(var(--radius) - 4px)`  |
| `rounded-md`| `calc(var(--radius) - 2px)`  |
| `rounded-lg`| `var(--radius)`               |
| `rounded-xl`| `calc(var(--radius) + 4px)`  |
| `rounded-full` | Tailwind varsayılanı (9999px) |

## 4. Shadow (Elevation) Standardı

Var olan `shadow-sm/md/lg/xl` sınıfları korunur. Ek olarak semantic
elevation seviyeleri tanımlandı:

| Sınıf                    | Kullanım                          |
|---------------------------|------------------------------------|
| `shadow-elevation-low`    | Kart, hafif ayrım                  |
| `shadow-elevation-medium` | Dropdown, popover, hover kartlar   |
| `shadow-elevation-high`   | Modal, dialog, öne çıkan yüzeyler  |

## 5. Typography Standardı

Proje fontları: gövde için `font-body` (PT Sans), başlıklar için
`font-headline` (Poppins). Semantic ölçek `text-ds-*` önekiyle eklendi;
mevcut `text-sm`, `text-lg` vb. sınıflar aynen çalışmaya devam eder.

| Sınıf            | Boyut / satır yük. | Kullanım         |
|-------------------|--------------------|------------------|
| `text-ds-caption` | 12px / 16px        | Yardımcı metin   |
| `text-ds-body-sm` | 14px / 20px        | İkincil gövde    |
| `text-ds-body`    | 16px / 24px        | Standart gövde   |
| `text-ds-body-lg` | 18px / 28px        | Vurgulu gövde    |
| `text-ds-h4`      | 20px / 28px, 600   | Alt başlık       |
| `text-ds-h3`      | 24px / 32px, 600   | Bölüm başlığı    |
| `text-ds-h2`      | 30px / 36px, 700   | Sayfa alt başlığı|
| `text-ds-h1`      | 36px / 40px, 700   | Sayfa başlığı    |
| `text-ds-display` | 48px, 700          | Hero/vurgu       |

## 6. Bileşenler (`src/components/ui/`)

| Bileşen     | Durum       | Not                                             |
|--------------|-------------|--------------------------------------------------|
| Button       | Düzenlendi  | `success` / `warning` / `info` variant eklendi   |
| Input        | Değişmedi   | Zaten standarda uygun                            |
| Textarea     | Değişmedi   | Zaten standarda uygun                            |
| Select       | Değişmedi   | Zaten standarda uygun (Radix tabanlı)            |
| Badge        | Düzenlendi  | `success` / `warning` / `info` variant eklendi   |
| Card         | Değişmedi   | Zaten standarda uygun                            |
| Dialog       | Değişmedi   | Zaten standarda uygun (Radix tabanlı)            |
| Modal        | Yeni        | `Dialog` üzerine kurulu yüksek seviyeli wrapper  |
| Loading      | Yeni        | `Spinner` + ortalanmış düzen                     |
| Spinner      | Yeni        | Boyut/tone variant'lı tekil dönen ikon           |
| EmptyState   | Yeni        | İkon + başlık + açıklama + aksiyon               |
| Skeleton     | Değişmedi   | Zaten standarda uygun                            |
| Avatar       | Değişmedi   | Zaten standarda uygun (Radix tabanlı)            |
| Divider      | Yeni        | `Separator` üzerine kurulu, opsiyonel etiketli   |

Tüm bileşenler `class-variance-authority` + `cn()` (clsx + tailwind-merge)
deseniyle, projede zaten kullanılan shadcn/ui yaklaşımını takip eder.

## 7. Dark Mode

Tüm yeni renk token'ları hem `:root` hem `.dark` bloklarında tanımlıdır.
Hiçbir mevcut CSS değişkeni silinmedi veya değiştirilmedi.
