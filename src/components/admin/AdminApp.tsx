'use client';

import { useEffect, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { BarChart3Icon, ClockIcon, ExternalLinkIcon, LogOutIcon, PizzaIcon, ReceiptTextIcon, UsersIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, LinkButton } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { data, type Order } from '@/lib/data';
import { useLive } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { Customers } from './Customers';
import { Login } from './Login';
import { MenuManager } from './MenuManager';
import { OrdersBoard } from './OrdersBoard';
import { Overview } from './Overview';
import { SettingsPanel } from './SettingsPanel';

type View = 'uebersicht' | 'bestellungen' | 'karte' | 'zeiten' | 'kunden';
const NAV: { id: View; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'uebersicht', label: 'Übersicht', icon: BarChart3Icon },
  { id: 'bestellungen', label: 'Bestellungen', icon: ReceiptTextIcon },
  { id: 'karte', label: 'Speisekarte', icon: PizzaIcon },
  { id: 'zeiten', label: 'Zeiten & Gebiete', icon: ClockIcon },
  { id: 'kunden', label: 'Kunden', icon: UsersIcon },
];

export function AdminApp() {
  const [session, reloadSession] = useLive(() => data.session());
  if (session === undefined)
    return (
      <div className="p-10">
        <Skeleton className="h-10 w-48" />
      </div>
    );
  if (!session) return <Login onDone={reloadSession} />;
  return <Dashboard name={session.name} onLogout={reloadSession} />;
}

function Dashboard({ name, onLogout }: { name: string; onLogout: () => void }) {
  const [view, setView] = useState<View>('uebersicht');
  const [orders] = useLive(() => data.listOrders(), 5000);
  const [settings] = useLive(() => data.getSettings());

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

  const fresh = (orders ?? []).filter((o: Order) => o.status === 'neu').length;
  const current = NAV.find((n) => n.id === view)!;

  const togglePause = async (paused: boolean) => {
    if (!settings) return;
    const r = await data.saveSettings({ ...settings, paused });
    if (r.ok) toast(paused ? 'Bestellannahme pausiert.' : 'Bestellannahme läuft wieder.');
  };

  return (
    <div className="min-h-dvh bg-mehl-2/60 lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="dark sticky top-0 z-30 bg-kohle text-mehl lg:h-dvh">
        <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-3 lg:block lg:px-6 lg:pt-7">
          <Link href="/" className="display text-[2rem] leading-none font-[560]">
            Brace
          </Link>
          <p className="text-[12px] text-mehl/60 lg:mt-1">Küche · Ehrenfeld</p>
        </div>
        <nav aria-label="Bereiche" className="overflow-x-auto px-3 pb-3 lg:mt-6 lg:overflow-visible lg:pb-0">
          <ul className="flex gap-1 lg:flex-col">
            {NAV.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => go(n.id)}
                  aria-current={view === n.id ? 'page' : undefined}
                  className={cn(
                    'flex h-10 w-full items-center gap-3 rounded-lg px-3 text-[14px] whitespace-nowrap transition-colors duration-150',
                    view === n.id ? 'bg-mehl/12 text-mehl' : 'text-mehl/70 hover:bg-mehl/6 hover:text-mehl',
                  )}
                >
                  <n.icon className="size-4 shrink-0" />
                  {n.label}
                  {n.id === 'bestellungen' && fresh > 0 && (
                    <Badge className="ml-auto bg-pomodoro text-white tabular" aria-label={`${fresh} neue`}>
                      {fresh}
                    </Badge>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="hidden px-6 lg:absolute lg:inset-x-0 lg:bottom-6 lg:block">
          <p className="text-[13px] text-mehl/60">Angemeldet als</p>
          <p className="text-[14px]">{name}</p>
          <div className="mt-4 flex gap-2">
            <LinkButton variant="outline" size="sm" className="border-mehl/20 bg-transparent text-mehl" href="/" target="_blank">
              <ExternalLinkIcon /> Website
            </LinkButton>
            <Button
              variant="outline"
              size="sm"
              className="border-mehl/20 bg-transparent text-mehl"
              onClick={async () => {
                await data.logout();
                onLogout();
              }}
            >
              <LogOutIcon /> Abmelden
            </Button>
          </div>
        </div>
      </aside>

      <main id="main" tabIndex={-1} className="min-w-0 px-4 pt-6 pb-16 outline-none md:px-8 lg:pt-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[13px] text-muted-foreground">Demo-Daten, gespeichert in diesem Browser</p>
            <h1 className="text-[28px] font-semibold tracking-tight">{current.label}</h1>
          </div>
          <div className="flex items-center gap-3 rounded-full bg-card px-4 py-2 ring-1 ring-border">
            <span className={cn('size-2 rounded-full', settings?.paused ? 'bg-asche' : 'bg-emerald-600')} aria-hidden="true" />
            <Label htmlFor="accept" className="text-[14px]">
              {settings?.paused ? 'Annahme pausiert' : 'Nimmt Bestellungen an'}
            </Label>
            <Switch id="accept" checked={settings ? !settings.paused : false} disabled={!settings} onCheckedChange={(v) => togglePause(!v)} />
          </div>
        </header>
        <div className="mt-7">
          {view === 'uebersicht' && <Overview orders={orders} onOpenOrders={() => go('bestellungen')} />}
          {view === 'bestellungen' && <OrdersBoard orders={orders} />}
          {view === 'karte' && <MenuManager />}
          {view === 'zeiten' && <SettingsPanel />}
          {view === 'kunden' && <Customers />}
        </div>
        <div className="mt-12 flex gap-2 lg:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await data.logout();
              onLogout();
            }}
          >
            <LogOutIcon /> Abmelden
          </Button>
        </div>
      </main>
    </div>
  );
}
