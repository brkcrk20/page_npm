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

/**
 * Amblem: konum iğnesi + pati.
 *
 * Önceki amblem bir evin içinde kedi, köpek ve kalp taşıyordu — beş ayrı
 * biçim. 32 pikselde bunların hiçbiri seçilmiyordu, sekmedeki 16 pikselde
 * gri bir leke oluyordu. Marka işaretinin ölçüsü küçük boyutta okunabilmesi.
 *
 * Yeni işaret tek siluet: "semt" fikrini taşıyan konum iğnesi, içinde
 * oyulmuş bir pati. İki biçim, iki renk. 16 pikselde bile iğne ve pati
 * ayrı ayrı seçiliyor.
 */
const IGNE_D =
  'M32 3C20.4 3 11 12.4 11 24c0 14.6 17.6 33.3 20.1 35.9a1.3 1.3 0 0 0 1.8 0C35.4 57.3 53 38.6 53 24 53 12.4 43.6 3 32 3Z';

/** Pati: üç parmak, bir taban. Oyularak (iğne renginin üstüne) çiziliyor. */
const PATI_TABAN_D =
  'M32 31.8c-4.4 0-8 2.7-8 6.1 0 2.6 2.4 4.1 5 4.1 1.1 0 2.1-.3 3-.3s1.9.3 3 .3c2.6 0 5-1.5 5-4.1 0-3.4-3.6-6.1-8-6.1Z';
const PARMAKLAR: [number, number, number, number][] = [
  [23.2, 25.4, 3.1, 4.0],
  [32.0, 22.6, 3.3, 4.2],
  [40.8, 25.4, 3.1, 4.0],
];

/** Marka renkleri. Lacivert marka kimliğinden, turuncu sitenin ana rengi. */
// Marka renkleri site paletiyle aynı: ana renk petrol, vurgu amber.
// Turuncu amblem yeni palette yabancı duruyordu.
/**
 * Amblem tek renk.
 *
 * İki renkli sürüm (iğne mavi, bir parmak açık mavi) sitenin gül rengiyle
 * çakışıyordu: başlıkta beyaz, alt bilgide mavi bir amblem vardı ve ikisi
 * aynı markaya ait görünmüyordu. Tek renk hem her zeminde çalışıyor hem de
 * amblemi 16 pikselde bile tek bir okunur leke olarak tutuyor.
 */
const MARKA = '#C92C53';

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

  /**
   * Pati, iğnenin içinden MASKE ile oyuluyor.
   *
   * Renkli sürümde beyaz pati çizmek yeterliydi ama tek renk sürüm koyu bir
   * zemine konduğunda pati zeminin rengini alması gerekiyor — sabit bir renk
   * yazmak orada işe yaramıyordu. Maske ile pati gerçek bir delik oluyor ve
   * amblem her zeminde doğru görünüyor.
   */
  const maskeId = `pati-maske-${size}-${mono ? 'm' : 'r'}`;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="PetSemti"
    >
      <mask id={maskeId}>
        <rect width="64" height="64" fill="white" />
        <path d={PATI_TABAN_D} fill="black" />
        {PARMAKLAR.map(([cx, cy, rx, ry]) => (
          <ellipse key={cx} cx={cx} cy={cy} rx={rx} ry={ry} fill="black" />
        ))}
      </mask>

      <path d={IGNE_D} fill={mono ? 'currentColor' : MARKA} mask={`url(#${maskeId})`} />

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
