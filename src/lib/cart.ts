'use client';

import { useSyncExternalStore } from 'react';
import { DOUGHS, EXTRAS, SIZES, type DoughId, type ExtraId, type MenuItem, type SizeId } from './menu';

export type LineConfig = {
  size: SizeId;
  dough: DoughId;
  extras: ExtraId[];
  without: string[];
  note: string;
};

export type CartLine = {
  key: string;
  itemId: string;
  name: string;
  qty: number;
  /** Einzelpreis inkl. Konfiguration, Cent */
  unit: number;
  config?: LineConfig;
};

const KEY = 'brace.cart.v1';
const listeners = new Set<() => void>();
let cache: CartLine[] | null = null;
const EMPTY: CartLine[] = [];

function read(): CartLine[] {
  if (cache) return cache;
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(lines: CartLine[]) {
  cache = lines;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    /* Speicher voll oder privat – Warenkorb bleibt im Speicher */
  }
  listeners.forEach((l) => l());
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      cache = null;
      listeners.forEach((l) => l());
    }
  });
}

export function unitPrice(item: MenuItem, config?: LineConfig) {
  if (!config) return item.price;
  const size = SIZES.find((s) => s.id === config.size)?.delta ?? 0;
  const dough = DOUGHS.find((d) => d.id === config.dough)?.delta ?? 0;
  const extras = config.extras.reduce((sum, id) => sum + (EXTRAS.find((e) => e.id === id)?.price ?? 0), 0);
  return item.price + size + dough + extras;
}

export const defaultConfig = (): LineConfig => ({ size: 'normal', dough: 'klassisch', extras: [], without: [], note: '' });

const configKey = (itemId: string, c?: LineConfig) =>
  c ? [itemId, c.size, c.dough, [...c.extras].sort().join('+'), [...c.without].sort().join('+'), c.note.trim()].join('|') : itemId;

export function describeConfig(c?: LineConfig): string {
  if (!c) return '';
  const parts: string[] = [];
  if (c.size !== 'normal') parts.push(SIZES.find((s) => s.id === c.size)!.label);
  if (c.dough !== 'klassisch') parts.push(DOUGHS.find((d) => d.id === c.dough)!.label);
  c.extras.forEach((id) => parts.push(`+ ${EXTRAS.find((e) => e.id === id)!.label}`));
  c.without.forEach((w) => parts.push(`ohne ${w}`));
  if (c.note.trim()) parts.push(`„${c.note.trim()}“`);
  return parts.join(', ');
}

export const cart = {
  add(item: MenuItem, config: LineConfig | undefined, qty = 1) {
    const cfg = item.category === 'pizza' ? (config ?? defaultConfig()) : undefined;
    const key = configKey(item.id, cfg);
    const lines = [...read()];
    const existing = lines.findIndex((l) => l.key === key);
    if (existing >= 0) lines[existing] = { ...lines[existing], qty: Math.min(20, lines[existing].qty + qty) };
    else lines.push({ key, itemId: item.id, name: item.name, qty, unit: unitPrice(item, cfg), config: cfg });
    write(lines);
  },
  setQty(key: string, qty: number) {
    const lines = read()
      .map((l) => (l.key === key ? { ...l, qty: Math.max(0, Math.min(20, qty)) } : l))
      .filter((l) => l.qty > 0);
    write(lines);
  },
  clear() {
    write([]);
  },
  lines: read,
};

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useCart() {
  const lines = useSyncExternalStore(subscribe, read, () => EMPTY);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const subtotal = lines.reduce((s, l) => s + l.qty * l.unit, 0);
  return { lines, count, subtotal };
}
