/**
 * PetSemti amblemi.
 *
 * SVG dosya olarak değil bileşen olarak: turuncu başlıkta beyaz, alt
 * bilgide renkli görünmesi gerekiyor ve tek renk sürüm currentColor
 * kullanınca CSS'ten yönetilebiliyor. Ayrı dosya olsaydı her renk için
 * ayrı istek olurdu.
 *
 * Kaynak dosyalar public/marka/ altında duruyor (amblem.svg,
 * amblem-mono.svg, logo-yatay.svg) — dışarıya verilecek yerler için.
 */

const YUVA_D = 'M32 5 4.8 26.4v27.1A4.5 4.5 0 0 0 9.3 58h45.4a4.5 4.5 0 0 0 4.5-4.5V26.4L32 5Z';
const KALP_D =
  'M32 17.8c-1.8-2.4-5.9-2-5.9 1.4 0 2.6 3.4 4.9 5.9 6.8 2.5-1.9 5.9-4.2 5.9-6.8 0-3.4-4.1-3.8-5.9-1.4Z';
const KOPEK = [
  'M21 31.4c-3.2-1.1-6 .6-6.6 4-.5 3.2 1 6.2 3.4 6.9 1.4.4 2.5-.4 2.7-1.8Z',
  'M19.4 41.8c-2 1.6-3.2 4.2-3.2 7.3v5.5c0 .9.7 1.6 1.6 1.6h11.4c.9 0 1.6-.7 1.6-1.6v-5.5c0-3.1-1.2-5.7-3.2-7.3Z',
  'M28.4 33.9c1.9.2 3.2 1 3.8 2.1.3.5-.1 1.1-.7 1.1-1.3 0-2.4-.2-3.3-.7Z',
];
const KEDI = [
  'M47.6 56.2c2.9-.5 4.6-2.3 4.6-4.7 0-1.8-.9-3.1-2.4-3.7-.8-.3-1.6.2-1.7.9-.1.7.2 1.3.9 1.6.5.2.8.6.8 1.1 0 .9-.7 1.5-2.2 1.8Z',
  'M41.3 44c-1.7 1.4-2.7 3.6-2.7 6.2v4.4c0 .9.7 1.6 1.6 1.6h8.9c.9 0 1.6-.7 1.6-1.6v-4.4c0-2.6-1-4.8-2.7-6.2Z',
  'M44.5 33.4c-.9 0-1.8.2-2.6.6l-1.5-3.9c-.3-.7.5-1.3 1.1-.9l3.5 2.2 3.5-2.2c.6-.4 1.4.2 1.1.9l-1.5 3.9c2.4 1.1 3.9 3.4 3.4 5.9-.4 2.3-2.4 4-4.8 4.1-3 .1-5.5-2.3-5.5-5.2 0-2.3 1.5-4.3 3.6-5Z',
];

/** Marka renkleri. Lacivert marka kimliğinden, turuncu sitenin ana rengi. */
const LACIVERT = '#1E2A44';
const TURUNCU = '#ec5822';

export function LogoMark({
  size = 32,
  variant = 'renkli',
  className,
}: {
  size?: number;
  /** 'renkli' iki renkli marka hâli, 'mono' bulunduğu metnin rengini alır. */
  variant?: 'renkli' | 'mono';
  className?: string;
}) {
  const mono = variant === 'mono';
  const yuva = mono ? 'currentColor' : LACIVERT;
  const kalp = mono ? 'currentColor' : TURUNCU;
  const kopek = mono ? 'currentColor' : LACIVERT;
  const kedi = mono ? 'currentColor' : TURUNCU;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="PetSemti"
    >
      <path d={YUVA_D} fill="none" stroke={yuva} strokeWidth={4.6} strokeLinejoin="round" />
      <path d={KALP_D} fill={kalp} />
      <g fill={kopek}>
        {KOPEK.map((d) => (
          <path key={d} d={d} />
        ))}
        <circle cx="23.4" cy="35.6" r="5.6" />
      </g>
      <g fill={kedi} opacity={mono ? 0.85 : 1}>
        {KEDI.map((d) => (
          <path key={d} d={d} />
        ))}
        <circle cx="44.5" cy="38.6" r="5.2" />
      </g>
    </svg>
  );
}

/** Amblem + kelime markası. Kelime HTML metni: her boyutta net kalıyor. */
export function Logo({
  variant = 'renkli',
  showTagline = false,
  size = 34,
}: {
  variant?: 'renkli' | 'mono';
  showTagline?: boolean;
  size?: number;
}) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={size} variant={variant} />
      <span className="flex flex-col leading-none">
        <span className="text-xl font-bold tracking-tight">petsemti</span>
        {showTagline && (
          <span className="mt-0.5 whitespace-nowrap text-[8px] font-medium uppercase tracking-[0.12em] opacity-70">
            Tüm patiler için, tek bir yer
          </span>
        )}
      </span>
    </span>
  );
}
