'use client';

import { useSyncExternalStore } from 'react';

/** Kleine Vorauswahl (Lieferart, PLZ), die zwischen Startseite, Karte und Kasse mitläuft. */
export type Prefs = { mode: 'lieferung' | 'abholung'; plz: string };
const KEY = 'brace.prefs.v1';

export function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { mode: 'lieferung', plz: '', ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    /* ignorieren */
  }
  return { mode: 'lieferung', plz: '' };
}

export function writePrefs(p: Partial<Prefs>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readPrefs(), ...p }));
  } catch {
    /* ignorieren */
  }
  window.dispatchEvent(new Event('brace:prefs'));
}

const SERVER: Prefs = { mode: 'lieferung', plz: '' };
let cacheRaw: string | null | undefined;
let cache: Prefs = SERVER;

function snapshot(): Prefs {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    /* ignorieren */
  }
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cache = readPrefs();
  }
  return cache;
}

function subscribe(cb: () => void) {
  window.addEventListener('brace:prefs', cb);
  window.addEventListener('storage', cb);
  return () => {
    window.removeEventListener('brace:prefs', cb);
    window.removeEventListener('storage', cb);
  };
}

/** Vorauswahl als externer Store: ohne setState im Effect, Server rendert den Standard. */
export const usePrefs = () => useSyncExternalStore(subscribe, snapshot, () => SERVER);
