/**
 * Kategori renkleri.
 *
 * Site tek renge (petrol) indirgenince her şey gri-beyaz görünmeye başladı;
 * kategoriler birbirinden ayırt edilemiyordu. Her kategoriye kendi tonu
 * verildi: menüde, rozetlerde ve kategori başlıklarında kullanılıyor.
 *
 * Tonlar ana renkten türetilmedi, kasıtlı olarak birbirinden uzak seçildi —
 * amaç süs değil, kullanıcının "hangi bölümdeyim" sorusunu renkten
 * cevaplayabilmesi. Hepsi açık zemin + koyu yazı olarak tanımlı; kontrast
 * oranları AA sınırının üstünde.
 */

export type KategoriRengi = {
  /** Yumuşak zemin — rozet ve simge kutusu için. */
  yumusak: string;
  /** Koyu metin/simge rengi. */
  koyu: string;
  /** Kenarlık. */
  kenar: string;
  /** Dolu zemin — seçili durum için. */
  dolu: string;
};

const PALET: Record<string, KategoriRengi> = {
  Dog:      { yumusak: 'bg-amber-50',   koyu: 'text-amber-700',   kenar: 'border-amber-200',   dolu: 'bg-amber-500' },
  Cat:      { yumusak: 'bg-violet-50',  koyu: 'text-violet-700',  kenar: 'border-violet-200',  dolu: 'bg-violet-500' },
  Bird:     { yumusak: 'bg-sky-50',     koyu: 'text-sky-700',     kenar: 'border-sky-200',     dolu: 'bg-sky-500' },
  Aquarium: { yumusak: 'bg-cyan-50',    koyu: 'text-cyan-700',    kenar: 'border-cyan-200',    dolu: 'bg-cyan-500' },
  Pigeon:   { yumusak: 'bg-indigo-50',  koyu: 'text-indigo-700',  kenar: 'border-indigo-200',  dolu: 'bg-indigo-500' },
  Supply:   { yumusak: 'bg-emerald-50', koyu: 'text-emerald-700', kenar: 'border-emerald-200', dolu: 'bg-emerald-500' },
  Other:    { yumusak: 'bg-rose-50',    koyu: 'text-rose-700',    kenar: 'border-rose-200',    dolu: 'bg-rose-500' },
};

const VARSAYILAN: KategoriRengi = {
  yumusak: 'bg-slate-50',
  koyu: 'text-slate-700',
  kenar: 'border-slate-200',
  dolu: 'bg-slate-500',
};

export function kategoriRengi(code: string | null | undefined): KategoriRengi {
  return (code && PALET[code]) || VARSAYILAN;
}
