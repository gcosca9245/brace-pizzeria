'use client';

import '@fontsource-variable/plus-jakarta-sans/index.css';
import { useEffect, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { MotionConfig } from 'motion/react';
import { data } from '@/lib/data';
import { useLive } from '@/lib/hooks';
import { Login } from './Login';

// Das Dashboard (Charts, Board, Tabellen) erst nach dem Login nachladen – das Login bleibt leicht.
const Dashboard = dynamic(() => import('./Dashboard'), {
  ssr: false,
  loading: () => <div className="min-h-dvh bg-[var(--e-canvas)]" />,
});

export type Theme = 'hell' | 'dunkel';
const THEME_KEY = 'brace-kueche-theme';

const themeListeners = new Set<() => void>();
const readTheme = (): Theme => (localStorage.getItem(THEME_KEY) === 'dunkel' ? 'dunkel' : 'hell');
const subscribeTheme = (cb: () => void) => {
  themeListeners.add(cb);
  window.addEventListener('storage', cb);
  return () => {
    themeListeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
};

/** Hängt den Küchen-Look an <html>, damit auch Dialoge, Menüs und Toasts (Portale) ihn tragen. */
function useEmberTheme() {
  const theme = useSyncExternalStore(subscribeTheme, readTheme, () => 'hell' as Theme);
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add('ember');
    html.classList.toggle('ember-dark', theme === 'dunkel');
    return () => html.classList.remove('ember', 'ember-dark');
  }, [theme]);
  const set = (t: Theme) => {
    localStorage.setItem(THEME_KEY, t);
    themeListeners.forEach((l) => l());
  };
  return [theme, set] as const;
}

export function AdminApp() {
  const [session, reloadSession] = useLive(() => data.session());
  const [theme, setTheme] = useEmberTheme();
  return (
    <MotionConfig reducedMotion="user">
      {session === undefined ? (
        // Vorgerendert: das Login (LCP). Ist schon eine Sitzung da, blendet CSS es aus, bis das Dashboard steht.
        <div className="k-login-ssr">
          <Login onDone={reloadSession} />
        </div>
      ) : !session ? (
        <Login onDone={reloadSession} />
      ) : (
        <Dashboard name={session.name} onLogout={reloadSession} theme={theme} setTheme={setTheme} />
      )}
    </MotionConfig>
  );
}

