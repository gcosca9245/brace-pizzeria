'use client';

import { DEFAULT_ZONES } from '../delivery';
import { MENU, type MenuItem } from '../menu';
import { DEFAULT_HOURS } from '../site';
import type { DataAdapter, NewOrder, Order, OrderStatus, Result, Settings } from './types';
import { ORDER_STATUSES } from './types';

/**
 * Demo-Adapter: alles bleibt im localStorage dieses Browsers. Kein Server, keine echten Zahlungen.
 * Für den Echtbetrieb liegt in supabase/schema.sql das passende Schema samt RLS bereit.
 */
const K = {
  orders: 'brace.orders.v1',
  menu: 'brace.menu.v1',
  settings: 'brace.settings.v1',
  seeded: 'brace.seeded.v1',
  session: 'brace.admin.session',
} as const;

const ADMIN = {
  email: 'kueche@brace-demo.example',
  name: 'Küche Brace',
  // SHA-256("brace-demo-salt:" + Passwort). Zugang steht in docs/DEMO-ZUGANG.md.
  hash: '0e3fb50a7cd9513705acc3bfe5fa848648c6c5e27719ab9fd95413a442e393a6',
};

const isBrowser = () => typeof window !== 'undefined';
const load = <T,>(key: string, fallback: T): T => {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};
const save = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('brace:data', { detail: key }));
};

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
const code = () => `B-${Math.floor(1000 + Math.random() * 9000)}`;

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- Demo-Daten ---------- */

/** Deterministischer Zufall, damit Statistiken bei jedem Laden gleich aussehen. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = ['Lena', 'Jonas', 'Mira', 'Can', 'Sophie', 'Malte', 'Aylin', 'Tim', 'Hannah', 'Luca', 'Nora', 'Felix', 'Elif', 'Paul', 'Greta', 'Emre', 'Clara', 'Ben', 'Ida', 'Noah'];
const LAST = ['Becker', 'Yilmaz', 'Hoffmann', 'Schmitz', 'Wagner', 'Krämer', 'Demir', 'Lange', 'Richter', 'Esposito', 'Vogel', 'Brandt', 'Kaya', 'Fuchs'];
const STREETS = ['Körnerstraße', 'Lenauplatz', 'Subbelrather Straße', 'Gutenbergstraße', 'Ottostraße', 'Neptunplatz', 'Brüsseler Straße', 'Lindenstraße', 'Neusser Straße', 'Sülzburgstraße'];

let poolCache: ReturnType<typeof makePool> | null = null;
const customerPool = () => (poolCache ??= makePool());

function makePool() {
  const r = rng(7);
  return Array.from({ length: 380 }, (_, i) => {
    const first = FIRST[Math.floor(r() * FIRST.length)];
    const last = LAST[Math.floor(r() * LAST.length)];
    const zone = DEFAULT_ZONES[r() < 0.55 ? 0 : r() < 0.7 ? 1 : 2];
    return {
      name: `${first} ${last}`,
      email: `${first}.${last}${i}`.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue') + '@mail.example',
      phone: `0170 ${String(1000000 + Math.floor(r() * 8999999))}`,
      street: `${STREETS[Math.floor(r() * STREETS.length)]} ${1 + Math.floor(r() * 80)}`,
      plz: zone.plz[Math.floor(r() * zone.plz.length)],
      zone,
    };
  });
}

function demoOrder(r: () => number, at: number, status: OrderStatus, menu: MenuItem[]): Order {
  const pool = customerPool();
  // Ein harter Kern Stammkunden bestellt deutlich öfter als der Rest.
  const c = r() < 0.32 ? pool[Math.floor(r() * 36)] : pool[Math.floor(r() * pool.length)];
  const pizzas = menu.filter((m) => m.category === 'pizza');
  const others = menu.filter((m) => m.category !== 'pizza');
  const lines = Array.from({ length: 1 + Math.floor(r() * 3) }, () => {
    const it = r() < 0.78 ? pizzas[Math.floor(r() * pizzas.length)] : others[Math.floor(r() * others.length)];
    return { itemId: it.id, name: it.name, qty: 1 + (r() < 0.25 ? 1 : 0), unit: it.price, details: '' };
  });
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unit, 0);
  const mode = r() < 0.72 ? 'lieferung' : 'abholung';
  const fee = mode === 'lieferung' ? c.zone.fee : 0;
  return {
    id: uid(),
    code: `B-${Math.floor(1000 + r() * 9000)}`,
    createdAt: at,
    mode,
    lines,
    subtotal,
    fee,
    total: subtotal + fee,
    customer: { name: c.name, email: c.email, phone: c.phone },
    address: mode === 'lieferung' ? { street: c.street, plz: c.plz, city: 'Köln', floor: '', zoneId: c.zone.id } : undefined,
    note: '',
    when: { value: 'asap', label: 'So schnell wie möglich' },
    etaAt: at + (mode === 'lieferung' ? c.zone.eta[1] : 20) * 60_000,
    payment: { method: (['karte', 'paypal', 'bar'] as const)[Math.floor(r() * 3)], ref: 'DEMO' },
    status,
    log: [{ status, at }],
    autopilot: false,
  };
}

/** 35 Tage Verlauf, abends stärker, am Wochenende mehr. */
function generateHistory(menu: MenuItem[]): Order[] {
  const r = rng(2026);
  const out: Order[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let d = 35; d >= 1; d--) {
    const day = new Date(today.getTime() - d * 86_400_000);
    const wd = (day.getDay() + 6) % 7;
    if (wd === 0) continue; // Montag Ruhetag
    const base = wd >= 4 ? 52 : 30;
    const n = Math.round(base * (0.8 + r() * 0.45));
    for (let i = 0; i < n; i++) {
      // Stoßzeit 18–21 Uhr, mittags am Wochenende
      const hour = wd >= 4 && r() < 0.22 ? 12 + Math.floor(r() * 3) : 17 + Math.floor(Math.pow(r(), 0.8) * 5.5);
      const at = day.getTime() + hour * 3_600_000 + Math.floor(r() * 60) * 60_000;
      out.push(demoOrder(r, at, r() < 0.02 ? 'storniert' : 'geliefert', menu));
    }
  }
  return out;
}

/* ---------- Autopilot (Demo) ---------- */
const STEP_AFTER_MS: Record<string, number> = { neu: 45_000, zubereitung: 150_000, ofen: 240_000, unterwegs: 720_000 };

function advance(order: Order, now: number): Order {
  if (!order.autopilot || order.status === 'geliefert' || order.status === 'storniert') return order;
  let o = order;
  for (;;) {
    const idx = ORDER_STATUSES.indexOf(o.status as (typeof ORDER_STATUSES)[number]);
    const since = o.log[o.log.length - 1].at;
    const wait = STEP_AFTER_MS[o.status];
    if (idx < 0 || wait === undefined || now - since < wait) break;
    const next = ORDER_STATUSES[idx + 1];
    o = { ...o, status: next, log: [...o.log, { status: next, at: since + wait }] };
  }
  return o;
}

/* ---------- Adapter ---------- */
let historyCache: Order[] | null = null;

function readOrders(): Order[] {
  const now = Date.now();
  const orders = load<Order[]>(K.orders, []);
  let changed = false;
  const next = orders.map((o) => {
    const a = advance(o, now);
    if (a !== o) changed = true;
    return a;
  });
  if (changed) save(K.orders, next);
  return next;
}

function menuWithOverrides(): MenuItem[] {
  const overrides = load<Record<string, Partial<MenuItem>>>(K.menu, {});
  return MENU.map((m) => ({ ...m, ...overrides[m.id] }));
}

/** Damit das Küchen-Board beim ersten Öffnen nicht leer ist: ein paar laufende Demo-Bestellungen. */
function seedLiveOrders() {
  if (load<boolean>(K.seeded, false)) return;
  const r = rng(Date.now() % 100000);
  const now = Date.now();
  const menu = menuWithOverrides();
  const seeds: [OrderStatus, number][] = [
    ['neu', 2],
    ['neu', 4],
    ['zubereitung', 7],
    ['zubereitung', 9],
    ['ofen', 11],
    ['unterwegs', 18],
    ['unterwegs', 24],
    ['geliefert', 46],
    ['geliefert', 63],
  ];
  const live = seeds.map(([status, minAgo]) => {
    const o = demoOrder(r, now - minAgo * 60_000, status, menu);
    return { ...o, log: [{ status, at: now - minAgo * 60_000 }] };
  });
  save(K.orders, [...live, ...load<Order[]>(K.orders, [])]);
  save(K.seeded, true);
}

export const localAdapter: DataAdapter = {
  kind: 'local',
  async getMenu() {
    return menuWithOverrides();
  },
  async updateMenuItem(id, patch) {
    const overrides = load<Record<string, Partial<MenuItem>>>(K.menu, {});
    overrides[id] = { ...overrides[id], ...patch };
    save(K.menu, overrides);
    const item = menuWithOverrides().find((m) => m.id === id);
    return item ? { ok: true, data: item } : { ok: false, error: 'Gericht nicht gefunden.' };
  },
  async getSettings() {
    return load<Settings>(K.settings, { hours: DEFAULT_HOURS, zones: DEFAULT_ZONES, paused: false });
  },
  async saveSettings(s) {
    save(K.settings, s);
    return { ok: true, data: s };
  },
  async placeOrder(input: NewOrder): Promise<Result<Order>> {
    const settings = await this.getSettings();
    if (settings.paused) return { ok: false, error: 'Die Küche nimmt gerade keine Bestellungen an. Bitte versuch es gleich noch einmal.' };
    // Preise serverseitig (hier: gegen die Karte) nachrechnen, nie dem Warenkorb vertrauen.
    const menu = menuWithOverrides();
    for (const l of input.lines) {
      const item = menu.find((m) => m.id === l.itemId);
      if (!item || !item.available) return { ok: false, error: `„${l.name}“ ist gerade nicht verfügbar.` };
      if (l.unit < item.price) return { ok: false, error: 'Die Preise haben sich geändert. Bitte prüfe deinen Warenkorb.' };
    }
    await new Promise((r) => setTimeout(r, 900)); // Demo: Zahlungsdienst antwortet
    const now = Date.now();
    const order: Order = {
      ...input,
      id: uid(),
      code: code(),
      createdAt: now,
      status: 'neu',
      log: [{ status: 'neu', at: now }],
      autopilot: true,
      payment: { method: input.payment.method, ref: input.payment.method === 'bar' ? 'Barzahlung' : `DEMO-${Math.random().toString(36).slice(2, 8).toUpperCase()}` },
    };
    save(K.orders, [order, ...readOrders()]);
    return { ok: true, data: order };
  },
  async getOrder(id) {
    return readOrders().find((o) => o.id === id) ?? null;
  },
  async listOrders() {
    seedLiveOrders();
    return readOrders().sort((a, b) => b.createdAt - a.createdAt);
  },
  async setOrderStatus(id, status) {
    const orders = readOrders();
    const i = orders.findIndex((o) => o.id === id);
    if (i < 0) return { ok: false, error: 'Bestellung nicht gefunden.' };
    const o = { ...orders[i], status, autopilot: false, log: [...orders[i].log, { status, at: Date.now() }] };
    orders[i] = o;
    save(K.orders, orders);
    return { ok: true, data: o };
  },
  async history() {
    historyCache ??= generateHistory(MENU);
    return historyCache;
  },
  async login(email, password) {
    const ok = email.trim().toLowerCase() === ADMIN.email && (await sha256(`brace-demo-salt:${password}`)) === ADMIN.hash;
    await new Promise((r) => setTimeout(r, 450));
    if (!ok) return { ok: false, error: 'E-Mail oder Passwort stimmt nicht.' };
    sessionStorage.setItem(K.session, JSON.stringify({ email: ADMIN.email, name: ADMIN.name }));
    return { ok: true, data: { email: ADMIN.email, name: ADMIN.name } };
  },
  async logout() {
    sessionStorage.removeItem(K.session);
  },
  async session() {
    if (!isBrowser()) return null;
    try {
      const raw = sessionStorage.getItem(K.session);
      return raw ? (JSON.parse(raw) as { email: string; name: string }) : null;
    } catch {
      return null;
    }
  },
};
