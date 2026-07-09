/**
 * design-tokens.ts
 *
 * Projenin Design System'inin tek doğruluk kaynağına (globals.css + 
 * tailwind.config.ts) karşılık gelen TypeScript referansı. Bu dosya CSS
 * üretmez; yalnızca Tailwind sınıflarını programatik olarak (ör. JS
 * tarafında koşullu class seçimi, Storybook, dokümantasyon) okumak
 * isteyen kod için tip güvenli bir sözlük sağlar.
 *
 * Kaynak gerçek değerler:
 *  - Renkler:      src/app/globals.css  (CSS custom properties)
 *  - Tailwind key'leri: tailwind.config.ts (theme.extend)
 *
 * Bu dosya mevcut hiçbir sayfa tarafından henüz import edilmiyor; yeni
 * bileşenler geliştirirken referans/rehber olarak kullanılmak üzere
 * hazırlanmıştır.
 */

/** Renk sistemi — semantic roller. */
export const colorRoles = {
  primary: "primary",
  secondary: "secondary",
  success: "success",
  warning: "warning",
  danger: "destructive", // Not: proje genelinde "destructive" adı kullanılıyor.
  info: "info",
  neutral: "neutral",
} as const

export type ColorRole = keyof typeof colorRoles

/** Spacing ölçeği (4px baz). Tailwind'de `ds-*` önekiyle karşılık gelir. */
export const spacing = {
  xs: { token: "ds-1", rem: "0.25rem", px: 4 },
  sm: { token: "ds-2", rem: "0.5rem", px: 8 },
  md: { token: "ds-4", rem: "1rem", px: 16 },
  lg: { token: "ds-6", rem: "1.5rem", px: 24 },
  xl: { token: "ds-8", rem: "2rem", px: 32 },
  "2xl": { token: "ds-12", rem: "3rem", px: 48 },
  "3xl": { token: "ds-16", rem: "4rem", px: 64 },
} as const

/** Border radius ölçeği. `--radius` CSS değişkenine göre türetilir. */
export const radius = {
  sm: "sm", // calc(var(--radius) - 4px)
  md: "md", // calc(var(--radius) - 2px)
  lg: "lg", // var(--radius)
  xl: "xl", // calc(var(--radius) + 4px)
  full: "full",
} as const

/** Shadow (elevation) ölçeği. */
export const shadow = {
  low: "shadow-elevation-low",
  medium: "shadow-elevation-medium",
  high: "shadow-elevation-high",
} as const

/** Typography ölçeği. Tailwind'de `text-ds-*` önekiyle karşılık gelir. */
export const typography = {
  caption: "text-ds-caption",
  bodySmall: "text-ds-body-sm",
  body: "text-ds-body",
  bodyLarge: "text-ds-body-lg",
  h4: "text-ds-h4",
  h3: "text-ds-h3",
  h2: "text-ds-h2",
  h1: "text-ds-h1",
  display: "text-ds-display",
  /** Başlıklar için proje fontu (tailwind.config.ts -> fontFamily.headline). */
  fontHeadline: "font-headline",
  /** Gövde metni için proje fontu (tailwind.config.ts -> fontFamily.body). */
  fontBody: "font-body",
} as const

export const designTokens = {
  colorRoles,
  spacing,
  radius,
  shadow,
  typography,
} as const
