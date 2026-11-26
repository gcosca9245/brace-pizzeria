'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { LayoutGroup, motion } from 'motion/react';
import { BellIcon, ClockIcon, ExternalLinkIcon, LayoutGridIcon, LogOutIcon, MoonIcon, PizzaIcon, ReceiptTextIcon, SunIcon, UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { asset } from '@/lib/asset';
import { data, type Order } from '@/lib/data';
import { useLive } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import type { Theme } from './AdminApp';
import { Customers } from './Customers';
import { RoundButton } from './ember';
import { MenuManager } from './MenuManager';
import { OrdersBoard } from './OrdersBoard';
import { Overview, OverviewKpis } from './Overview';
import { Search, type Pick } from './Search';
import { SettingsPanel } from './SettingsPanel';

export type View = 'uebersicht' | 'bestellungen' | 'karte' | 'zeiten' | 'kunden';
const NAV: { id: View; label: string; short: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'uebersicht', label: 'Übersicht', short: 'Übersicht', icon: LayoutGridIcon },
  { id: 'bestellungen', label: 'Bestellungen', short: 'Bestellungen', icon: ReceiptTextIcon },
  { id: 'karte', label: 'Speisekarte', short: 'Karte', icon: PizzaIcon },
  { id: 'zeiten', label: 'Zeiten & Gebiete', short: 'Zeiten', icon: ClockIcon },
  { id: 'kunden', label: 'Kunden', short: 'Kunden', icon: UsersIcon },
];

export default function Dashboard({ name, onLogout, theme, setTheme }: { name: string; onLogout: () => void; theme: Theme; setTheme: (t: Theme) => void }) {
  const [view, setView] = useState<View>('uebersicht');
  const [focusOrder, setFocusOrder] = useState<string | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [orders] = useLive(() => data.listOrders(), 5000);
  const [hist] = useLive(() => data.history());
  const [settings] = useLive(() => data.getSettings());

  const all = useMemo(() => {
    if (!hist || !orders) return null;
    const ids = new Set(orders.map((o) => o.id));
    return [...orders, ...hist.filter((o) => !ids.has(o.id))];
  }, [hist, orders]);

  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1) as View;
      if (NAV.some((n) => n.id === h)) setView(h);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  const go = (v: View) => {
    setView(v);
    history.replaceState(null, '', `#${v}`);
    document.getElementById('main')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  };

  const pick = (p: Pick) => {
    if (p.kind === 'order') {
      setFocusOrder(p.id);
      go('bestellungen');
    } else if (p.kind === 'customer') {
      setCustomerQuery(p.query);
      go('kunden');
    } else go('karte');
  };

  const fresh = (orders ?? []).filter((o: Order) => o.status === 'neu').length;
  const current = NAV.find((n) => n.id === view)!;
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const togglePause = async (paused: boolean) => {
    if (!settings) return;
    const r = await data.saveSettings({ ...settings, paused });
    if (r.ok) toast(paused ? 'Bestellannahme pausiert.' : 'Bestellannahme läuft wieder.');
  };
  const logout = async () => {
    await data.logout();
    onLogout();
  };

  return (
    <div className="min-h-dvh bg-[var(--e-canvas)] text-foreground">
      <div className="mx-auto max-w-[1480px] px-3 pt-3 pb-28 sm:px-5 md:pb-14 lg:px-8 lg:pt-6">
        {/* Kopfzeile: Marke · Bereiche · Werkzeuge */}
        <header className="flex items-center gap-3">
          <a href={asset('/admin/')} className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-card pr-5 pl-4 text-[19px] font-bold tracking-[-0.02em]">
            <span className="grid size-7 place-items-center rounded-full bg-[var(--e-accent)] text-white" aria-hidden="true">
              <PizzaIcon className="size-4" />
            </span>
            Brace
            <span className="sr-only"> Küche</span>
          </a>

          <nav aria-label="Bereiche" className="mx-auto hidden md:block">
            <LayoutGroup id="nav">
              <ul className="flex h-12 items-center gap-1 rounded-full bg-card p-1">
                {NAV.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => go(n.id)}
                      aria-current={view === n.id ? 'page' : undefined}
                      className={cn(
                        'relative flex h-10 items-center gap-2 rounded-full px-4 text-[14px] font-medium whitespace-nowrap transition-colors duration-200',
                        view === n.id ? 'text-[var(--e-canvas)]' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {view === n.id && <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-[var(--e-ink)]" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                      <span className="relative">{n.label}</span>
                      {n.id === 'bestellungen' && fresh > 0 && (
                        <span className="tabular relative grid h-5 min-w-5 place-items-center rounded-full bg-[var(--e-accent)] px-1 text-[11px] font-bold text-white" aria-label={`${fresh} neue`}>
                          {fresh}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </LayoutGroup>
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <label className="hidden h-12 cursor-pointer items-center gap-2.5 rounded-full bg-card pr-3 pl-4 text-[13px] font-medium lg:flex">
              <span className={cn('size-2 rounded-full', settings?.paused ? 'bg-muted-foreground' : 'bg-[#2fae52]')} aria-hidden="true" />
              {settings?.paused ? 'Pausiert' : 'Nimmt an'}
              <Switch checked={settings ? !settings.paused : false} disabled={!settings} onCheckedChange={(v) => togglePause(!v)} aria-label="Bestellungen annehmen" />
            </label>
            <div className="hidden h-12 items-center gap-1 rounded-full bg-card p-1 sm:flex" role="group" aria-label="Darstellung">
              {(['hell', 'dunkel'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={theme === t}
                  aria-label={t === 'hell' ? 'Helle Darstellung' : 'Dunkle Darstellung'}
                  onClick={() => setTheme(t)}
                  className={cn('grid size-10 place-items-center rounded-full transition-colors duration-200 [&_svg]:size-[17px]', theme === t ? 'bg-[var(--e-ink)] text-[var(--e-canvas)]' : 'text-muted-foreground hover:text-foreground')}
                >
                  {t === 'hell' ? <SunIcon /> : <MoonIcon />}
                </button>
              ))}
            </div>
            <RoundButton className="size-12 bg-card" onClick={() => go('bestellungen')} aria-label={fresh ? `${fresh} neue Bestellungen ansehen` : 'Bestellungen ansehen'}>
              <BellIcon />
              {fresh > 0 && <span className="absolute top-3 right-3 size-2.5 rounded-full bg-[var(--e-accent)] ring-2 ring-card" aria-hidden="true" />}
            </RoundButton>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button type="button" aria-label={`Konto von ${name}`} className="grid size-12 place-items-center rounded-full bg-[var(--e-ink)] text-[14px] font-bold text-[var(--e-canvas)] transition-transform active:scale-[0.96]" />
                }
              >
                {initials}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-56 rounded-2xl p-1.5">
                <DropdownMenuLabel className="font-normal text-muted-foreground">Angemeldet als {name}</DropdownMenuLabel>
                <DropdownMenuItem className="lg:hidden" onClick={() => settings && togglePause(!settings.paused)}>
                  {settings?.paused ? 'Bestellannahme starten' : 'Bestellannahme pausieren'}
                </DropdownMenuItem>
                <DropdownMenuItem className="sm:hidden" onClick={() => setTheme(theme === 'hell' ? 'dunkel' : 'hell')}>
                  {theme === 'hell' ? <MoonIcon /> : <SunIcon />} {theme === 'hell' ? 'Dunkle Darstellung' : 'Helle Darstellung'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(asset('/'), '_blank', 'noopener')}>
                  <ExternalLinkIcon /> Website öffnen
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOutIcon /> Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {settings?.paused && (
          <p role="status" className="mt-3 rounded-full bg-[var(--e-down-bg)] px-5 py-2.5 text-[14px] font-medium text-[var(--e-down)]">
            Die Bestellannahme ist pausiert. Auf der Website kann gerade niemand bestellen.
          </p>
        )}

        <main id="main" tabIndex={-1} className="outline-none">
          <h1 className="sr-only">{current.label}</h1>
          <div className={cn('mt-6 grid items-end gap-x-8 gap-y-5 md:mt-8', view === 'uebersicht' && 'xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]')}>
            <Search orders={orders} all={all} onPick={pick} />
            {view === 'uebersicht' && <OverviewKpis all={all} />}
          </div>
          <div className="mt-6">
            {view === 'uebersicht' && <Overview all={all} orders={orders} settings={settings} go={go} onOpenOrder={(id) => pick({ kind: 'order', id })} />}
            {view === 'bestellungen' && <OrdersBoard orders={orders} focusId={focusOrder} onFocusDone={() => setFocusOrder(null)} />}
            {view === 'karte' && <MenuManager />}
            {view === 'zeiten' && <SettingsPanel />}
            {view === 'kunden' && <Customers initialQuery={customerQuery} />}
          </div>
        </main>
      </div>

      {/* Mobil: Bereiche als Leiste am unteren Rand, mit dem Daumen erreichbar */}
      <nav aria-label="Bereiche" className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 md:hidden">
        <ul className="mx-auto flex max-w-md items-stretch justify-between rounded-full bg-[var(--e-ink)] p-1.5 text-[var(--e-canvas)]">
          {NAV.map((n) => (
            <li key={n.id} className="flex-1">
              <button
                type="button"
                onClick={() => go(n.id)}
                aria-current={view === n.id ? 'page' : undefined}
                aria-label={n.label}
                className={cn('relative flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium transition-colors', view === n.id ? 'bg-card text-foreground' : 'opacity-75')}
              >
                <n.icon className="size-[18px]" />
                {n.short}
                {n.id === 'bestellungen' && fresh > 0 && <span className="absolute top-2 right-[22%] size-2 rounded-full bg-[var(--e-accent)]" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
