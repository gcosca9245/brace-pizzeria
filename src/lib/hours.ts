import { WEEKDAYS, type WeekHours } from './site';

/** Aktuelle Zeit in Köln: Wochentag (0 = Montag) und Minuten seit Mitternacht. */
export function berlinNow(now = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Berlin',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const wd = parts.find((p) => p.type === 'weekday')!.value;
  const h = Number(parts.find((p) => p.type === 'hour')!.value) % 24;
  const m = Number(parts.find((p) => p.type === 'minute')!.value);
  const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(wd);
  return { day, minutes: h * 60 + m };
}

export function isOpenNow(hours: WeekHours, now = Date.now()) {
  const { day, minutes } = berlinNow(now);
  const d = hours[day];
  return !d.closed && minutes >= d.open && minutes < d.close - 15;
}

export type Slot = { value: string; label: string; dayOffset: number; minutes: number };

/**
 * Bestellzeiten im 15-Minuten-Raster: heute ab jetzt + Vorlauf, sonst am nächsten Öffnungstag.
 * `value` ist stabil serialisierbar ("asap" oder "d<offset>-<minuten>").
 */
export function buildSlots(hours: WeekHours, leadMinutes: number, now = Date.now()): { asap: boolean; slots: Slot[] } {
  const { day, minutes } = berlinNow(now);
  const asap = isOpenNow(hours, now);
  for (let offset = 0; offset < 7; offset++) {
    const d = hours[(day + offset) % 7];
    if (d.closed) continue;
    const from = offset === 0 ? Math.max(d.open, Math.ceil((minutes + leadMinutes) / 15) * 15) : d.open + 15;
    const slots: Slot[] = [];
    for (let m = from; m <= d.close - 15; m += 15) {
      const prefix = offset === 0 ? 'Heute' : offset === 1 ? 'Morgen' : WEEKDAYS[(day + offset) % 7];
      const clock = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      slots.push({ value: `d${offset}-${m}`, label: `${prefix}, ${clock} Uhr`, dayOffset: offset, minutes: m });
    }
    if (slots.length) return { asap, slots };
  }
  return { asap, slots: [] };
}

export function describeWhen(value: string, slots: Slot[]) {
  if (value === 'asap') return 'So schnell wie möglich';
  return slots.find((s) => s.value === value)?.label ?? value;
}

/** Nächste Öffnung als kurzer Text, z. B. „Heute bis 22:30“ oder „Öffnet Freitag 12:00“. */
export function openingLine(hours: WeekHours, now = Date.now()) {
  const { day, minutes } = berlinNow(now);
  const clock = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  const today = hours[day];
  if (!today.closed && minutes < today.close && minutes >= today.open) return { open: true, text: `Geöffnet bis ${clock(today.close)} Uhr` };
  if (!today.closed && minutes < today.open) return { open: false, text: `Öffnet heute um ${clock(today.open)} Uhr` };
  for (let o = 1; o < 8; o++) {
    const d = hours[(day + o) % 7];
    if (!d.closed) return { open: false, text: `Öffnet ${o === 1 ? 'morgen' : WEEKDAYS[(day + o) % 7]} um ${clock(d.open)} Uhr` };
  }
  return { open: false, text: 'Derzeit geschlossen' };
}
