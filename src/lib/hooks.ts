'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Lädt Daten und lädt bei Änderungen neu: eigene Schreibvorgänge (brace:data),
 * andere Tabs (storage) und optional per Intervall (Demo-Autopilot).
 */
export function useLive<T>(loader: () => Promise<T>, intervalMs = 0) {
  const [value, setValue] = useState<T | undefined>(undefined);
  const ref = useRef(loader);
  useEffect(() => {
    ref.current = loader;
  });
  const reload = useCallback(() => {
    void ref.current().then(setValue);
  }, []);
  useEffect(() => {
    reload();
    const on = () => reload();
    window.addEventListener('brace:data', on);
    window.addEventListener('storage', on);
    // Abfragen pausieren, solange der Tab im Hintergrund ist (Akku), beim Zurückkommen sofort aktualisieren.
    const tick = () => !document.hidden && reload();
    const onVisible = () => !document.hidden && reload();
    document.addEventListener('visibilitychange', onVisible);
    const t = intervalMs ? window.setInterval(tick, intervalMs) : 0;
    return () => {
      window.removeEventListener('brace:data', on);
      window.removeEventListener('storage', on);
      document.removeEventListener('visibilitychange', onVisible);
      if (t) window.clearInterval(t);
    };
  }, [reload, intervalMs]);
  return [value, reload] as const;
}

export function useMediaQuery(query: string) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return match;
}

/** Aktuelle Zeit, die in Intervallen neu rendert. */
export function useNow(ms = 30_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(t);
  }, [ms]);
  return now;
}

export const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
