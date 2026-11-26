import type { Customer, Order } from '@/lib/data';
import { MENU } from '@/lib/menu';

const PIZZA_IDS = new Set(MENU.filter((m) => m.category === 'pizza').map((m) => m.id));

const DAY = 86_400_000;
const berlinDay = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit' });
const berlinKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });
const berlinHour = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', hour: '2-digit', hourCycle: 'h23' });
const berlinWeekday = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', weekday: 'short' });

export const dayKey = (ts: number) => berlinKey.format(ts);
const valid = (o: Order) => o.status !== 'storniert';

export function kpis(all: Order[], now: number) {
  const today = dayKey(now);
  const lastWeek = dayKey(now - 7 * DAY);
  const t = all.filter((o) => valid(o) && dayKey(o.createdAt) === today);
  const lw = all.filter((o) => valid(o) && dayKey(o.createdAt) === lastWeek && berlinHour.format(o.createdAt) <= berlinHour.format(now));
  const sum = (xs: Order[]) => xs.reduce((s, o) => s + o.total, 0);
  const delivered = all.filter((o) => o.mode === 'lieferung' && o.status === 'geliefert' && now - o.createdAt < 30 * DAY);
  const mins = delivered
    .map((o) => {
      const end = [...o.log].reverse().find((l) => l.status === 'geliefert')?.at ?? o.etaAt;
      return end ? (end - o.createdAt) / 60000 : null;
    })
    .filter((m): m is number => m !== null && m > 0 && m < 120);
  return {
    revenue: sum(t),
    revenueLastWeek: sum(lw),
    orders: t.length,
    ordersLastWeek: lw.length,
    avg: t.length ? Math.round(sum(t) / t.length) : 0,
    deliveryMinutes: mins.length ? Math.round(mins.reduce((a, b) => a + b, 0) / mins.length) : 0,
    open: all.filter((o) => ['neu', 'zubereitung', 'ofen', 'unterwegs'].includes(o.status)).length,
  };
}

export function revenueByDay(all: Order[], now: number, days = 14) {
  const out: { key: string; label: string; umsatz: number; bestellungen: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const ts = now - i * DAY;
    out.push({ key: dayKey(ts), label: `${berlinWeekday.format(ts).replace('.', '')} ${berlinDay.format(ts)}`, umsatz: 0, bestellungen: 0 });
  }
  const idx = new Map(out.map((d, i) => [d.key, i]));
  for (const o of all) {
    if (!valid(o)) continue;
    const i = idx.get(dayKey(o.createdAt));
    if (i === undefined) continue;
    out[i].umsatz += o.total / 100;
    out[i].bestellungen += 1;
  }
  out.forEach((d) => (d.umsatz = Math.round(d.umsatz)));
  return out;
}

export function ordersByHour(all: Order[], now: number, days = 28) {
  const hours = Array.from({ length: 12 }, (_, i) => ({ stunde: `${i + 12}`, lieferung: 0, abholung: 0 }));
  for (const o of all) {
    if (!valid(o) || now - o.createdAt > days * DAY) continue;
    const h = Number(berlinHour.format(o.createdAt)) - 12;
    if (!Number.isFinite(h) || h < 0 || h >= hours.length) continue;
    hours[h][o.mode] += 1;
  }
  // Durchschnitt pro Öffnungstag (ca. 6 von 7 Tagen)
  const openDays = Math.max(1, Math.round((days * 6) / 7));
  return hours.map((h) => ({ ...h, lieferung: +(h.lieferung / openDays).toFixed(1), abholung: +(h.abholung / openDays).toFixed(1) }));
}

export function topItems(all: Order[], now: number, days = 30, limit = 6) {
  const m = new Map<string, number>();
  for (const o of all) {
    if (!valid(o) || now - o.createdAt > days * DAY) continue;
    for (const l of o.lines) {
      if (!PIZZA_IDS.has(l.itemId)) continue;
      m.set(l.name, (m.get(l.name) ?? 0) + l.qty);
    }
  }
  return [...m.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, anzahl]) => ({ name, anzahl }));
}

export function modeShare(all: Order[], now: number, days = 30) {
  let l = 0;
  let a = 0;
  for (const o of all) {
    if (!valid(o) || now - o.createdAt > days * DAY) continue;
    if (o.mode === 'lieferung') l++;
    else a++;
  }
  const total = l + a || 1;
  return { lieferung: Math.round((l / total) * 100), abholung: Math.round((a / total) * 100), total: l + a };
}

export function customers(all: Order[]): Customer[] {
  const m = new Map<string, Customer>();
  for (const o of all) {
    if (!valid(o)) continue;
    const key = o.customer.email.toLowerCase();
    const c = m.get(key) ?? { key, name: o.customer.name, email: o.customer.email, phone: o.customer.phone, orders: 0, revenue: 0, last: 0, plz: o.address?.plz };
    c.orders += 1;
    c.revenue += o.total;
    if (o.createdAt > c.last) {
      c.last = o.createdAt;
      c.name = o.customer.name;
      if (o.address?.plz) c.plz = o.address.plz;
    }
    m.set(key, c);
  }
  return [...m.values()].sort((a, b) => b.revenue - a.revenue);
}

const berlinDow = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', weekday: 'short' });
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
/** Wochentag in Berlin, 0 = Montag. */
export const weekdayIndex = (ts: number) => DOW.indexOf(berlinDow.format(ts));

/** Tagesziel: Ø Umsatz der letzten vier gleichen Wochentage (ganzer Tag). */
export function dayTarget(all: Order[], now: number) {
  const keys = new Set([1, 2, 3, 4].map((k) => dayKey(now - 7 * k * DAY)));
  let sum = 0;
  for (const o of all) if (valid(o) && keys.has(dayKey(o.createdAt))) sum += o.total;
  return Math.round(sum / 4);
}

export const SLOT_HOURS = [17, 18, 19, 20, 21, 22];
/** Ø Bestellungen je Wochentag und Stunde (4 Wochen) – für den Wochenplan. */
export function slotHeat(all: Order[], now: number) {
  const grid = Array.from({ length: 7 }, () => SLOT_HOURS.map(() => 0));
  for (const o of all) {
    if (!valid(o) || now - o.createdAt > 28 * DAY) continue;
    const d = weekdayIndex(o.createdAt);
    const h = SLOT_HOURS.indexOf(Number(berlinHour.format(o.createdAt)));
    if (d >= 0 && h >= 0) grid[d][h] += 1;
  }
  return grid.map((row) => row.map((n) => Math.round((n / 4) * 10) / 10));
}

/** Lieferungen je Zone (30 Tage). */
export function zoneCounts(all: Order[], now: number, zones: { id: string; plz: string[] }[]) {
  const out: Record<string, number> = {};
  for (const z of zones) out[z.id] = 0;
  for (const o of all) {
    if (!valid(o) || o.mode !== 'lieferung' || now - o.createdAt > 30 * DAY || !o.address) continue;
    const z = zones.find((x) => x.plz.includes(o.address!.plz));
    if (z) out[z.id] += 1;
  }
  return out;
}
