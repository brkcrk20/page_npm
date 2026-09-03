/**
 * Çalışma saatleri hesaplamaları.
 *
 * weekday: 1 = Pazartesi … 7 = Pazar (ISO 8601). JavaScript'in getDay()'i
 * 0 = Pazar döndürdüğü için doğrudan kullanılamıyor; dönüştürme burada tek
 * yerde yapılıyor.
 *
 * Saatler Türkiye saatine göre yorumlanıyor. Sunucu UTC'de çalıştığı için
 * dönüşüm yapılmazsa "şu an açık mı" üç saat kayardı.
 */

export const WEEKDAY_NAMES: Record<number, string> = {
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
  7: 'Pazar',
};

export type OpeningHour = {
  weekday: number;
  opens_at: string | null;
  closes_at: string | null;
  is_closed: boolean;
  is_24h: boolean;
};

export type OpenState =
  | { status: 'acik'; until: string | null }
  | { status: 'acik_24'; until: null }
  | { status: 'kapali'; nextOpen: { weekday: number; opens_at: string } | null }
  | { status: 'bilinmiyor'; nextOpen: null };

/** "09:00:00" -> 540 (dakika) */
function toMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** "09:00:00" -> "09:00" */
export function formatTime(value: string | null): string {
  if (!value) return '';
  return value.slice(0, 5);
}

/** Şu anki Türkiye saati: ISO gün numarası ve gün içi dakika. */
function nowInTurkey(): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');

  // Gün numarasını ayrı alıyoruz: kısa gün adı yerelleştirmeye bağlı,
  // sayısal karşılaştırma daha güvenli.
  const istanbulNow = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Europe/Istanbul' })
  );
  const jsDay = istanbulNow.getDay(); // 0 = Pazar
  const weekday = jsDay === 0 ? 7 : jsDay;

  return { weekday, minutes: hour * 60 + minute };
}

/**
 * İşletme şu an açık mı?
 *
 * Gece yarısını aşan mesai (ör. 20:00 – 02:00) destekleniyor: kapanış saati
 * açılıştan küçükse aralık ertesi güne taşıyor demektir. Nöbetçi klinikler
 * için bu yaygın.
 */
export function getOpenState(hours: OpeningHour[]): OpenState {
  if (!hours || hours.length === 0) return { status: 'bilinmiyor', nextOpen: null };

  const { weekday, minutes } = nowInTurkey();
  const byDay = new Map(hours.map((h) => [h.weekday, h]));

  const today = byDay.get(weekday);

  if (today && !today.is_closed) {
    if (today.is_24h) return { status: 'acik_24', until: null };

    if (today.opens_at && today.closes_at) {
      const opens = toMinutes(today.opens_at);
      const closes = toMinutes(today.closes_at);

      const openNow =
        closes > opens
          ? minutes >= opens && minutes < closes
          : minutes >= opens || minutes < closes; // gece yarısını aşan mesai

      if (openNow) return { status: 'acik', until: formatTime(today.closes_at) };
    }
  }

  // Dün gece başlayıp bugüne taşan mesai (ör. dün 20:00 – bugün 02:00).
  const yesterdayNo = weekday === 1 ? 7 : weekday - 1;
  const yesterday = byDay.get(yesterdayNo);
  if (yesterday && !yesterday.is_closed && !yesterday.is_24h && yesterday.opens_at && yesterday.closes_at) {
    const opens = toMinutes(yesterday.opens_at);
    const closes = toMinutes(yesterday.closes_at);
    if (closes <= opens && minutes < closes) {
      return { status: 'acik', until: formatTime(yesterday.closes_at) };
    }
  }

  // Kapalı: bir sonraki açılışı bul (bugün dahil, yedi gün ileriye).
  for (let offset = 0; offset < 7; offset++) {
    const day = ((weekday - 1 + offset) % 7) + 1;
    const entry = byDay.get(day);
    if (!entry || entry.is_closed) continue;

    if (entry.is_24h) return { status: 'kapali', nextOpen: { weekday: day, opens_at: '00:00' } };
    if (!entry.opens_at) continue;

    // Bugünse yalnızca henüz gelmemiş açılış saati sayılır.
    if (offset === 0 && toMinutes(entry.opens_at) <= minutes) continue;

    return { status: 'kapali', nextOpen: { weekday: day, opens_at: formatTime(entry.opens_at) } };
  }

  return { status: 'kapali', nextOpen: null };
}

/** Haftalık tabloyu Pazartesi'den Pazar'a sıralı, eksik günler kapalı olarak döner. */
export function normalizeWeek(hours: OpeningHour[]): OpeningHour[] {
  const byDay = new Map(hours.map((h) => [h.weekday, h]));
  return [1, 2, 3, 4, 5, 6, 7].map(
    (weekday) =>
      byDay.get(weekday) ?? {
        weekday,
        opens_at: null,
        closes_at: null,
        is_closed: true,
        is_24h: false,
      }
  );
}
