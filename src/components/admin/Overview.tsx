'use client';

import { useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { AnimatedListItem } from '@/components/ui/animated-list';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Skeleton } from '@/components/ui/skeleton';
import { data, statusLabel, type Order } from '@/lib/data';
import { formatEuro, formatTime } from '@/lib/format';
import { useLive, useNow } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { kpis, modeShare, ordersByHour, revenueByDay, topItems } from './stats';
import { StatusPill } from './StatusPill';

const revenueConfig = { umsatz: { label: 'Umsatz (€)', color: 'var(--color-pomodoro)' } } satisfies ChartConfig;
const hourConfig = {
  lieferung: { label: 'Lieferung', color: 'var(--color-kohle)' },
  abholung: { label: 'Abholung', color: 'var(--color-glut)' },
} satisfies ChartConfig;
const topConfig = { anzahl: { label: 'Pizzen', color: 'var(--color-kohle)' } } satisfies ChartConfig;

function Panel({ title, note, className, children }: { title: string; note?: string; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn('rounded-2xl bg-card p-5 ring-1 ring-border md:p-6', className)}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {note && <p className="text-[13px] text-muted-foreground">{note}</p>}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Delta({ now, before }: { now: number; before: number }) {
  if (!before) return <span className="text-muted-foreground">kein Vergleich</span>;
  const d = Math.round(((now - before) / before) * 100);
  return (
    <span className={cn('tabular', d >= 0 ? 'text-emerald-700' : 'text-pomodoro')}>
      {d >= 0 ? '+' : '−'}
      {Math.abs(d)} % <span className="text-muted-foreground">zum Vorwochentag</span>
    </span>
  );
}

export function Overview({ orders, onOpenOrders }: { orders: Order[] | undefined; onOpenOrders: () => void }) {
  const [hist] = useLive(() => data.history());
  const all = useMemo(() => {
    if (!hist || !orders) return null;
    const ids = new Set(orders.map((o) => o.id));
    return [...orders, ...hist.filter((o) => !ids.has(o.id))];
  }, [hist, orders]);
  const now = useNow(60_000);
  const s = useMemo(() => (all ? { k: kpis(all, now), days: revenueByDay(all, now), hours: ordersByHour(all, now), top: topItems(all, now), share: modeShare(all, now) } : null), [all, now]);

  if (!s || !orders)
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
        <Skeleton className="h-80 rounded-2xl md:col-span-4" />
      </div>
    );

  const feed = orders.slice(0, 6);

  return (
    <div className="grid gap-4 xl:grid-cols-12">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:col-span-12">
        <div className="col-span-2 rounded-2xl bg-kohle p-5 text-mehl md:col-span-1 md:p-6">
          <p className="text-[13px] text-mehl/70">Umsatz heute</p>
          <p className="tabular mt-2 text-[2.6rem] leading-none font-semibold tracking-tight">
            <NumberTicker value={s.k.revenue / 100} decimalPlaces={2} className="text-mehl" /> €
          </p>
          <p className="mt-3 text-[13px] text-mehl/70">
            <Delta now={s.k.revenue} before={s.k.revenueLastWeek} />
          </p>
        </div>
        <Kpi label="Bestellungen heute" value={s.k.orders} foot={<Delta now={s.k.orders} before={s.k.ordersLastWeek} />} />
        <Kpi label="Ø Bon" value={s.k.avg / 100} decimals={2} unit="€" foot={<span className="text-muted-foreground">heute</span>} />
        <Kpi label="Ø Lieferzeit" value={s.k.deliveryMinutes} unit="min" foot={<span className="text-muted-foreground">letzte 30 Tage</span>} />
      </div>

      <Panel title="Umsatz" note="letzte 14 Tage, montags Ruhetag" className="xl:col-span-8">
        <ChartContainer config={revenueConfig} className="aspect-auto h-[260px] w-full">
          <BarChart data={s.days} margin={{ left: 4, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} minTickGap={16} />
            <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => `${v.toLocaleString('de-DE')} €`} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar dataKey="umsatz" fill="var(--color-umsatz)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </Panel>

      <Panel title="Gerade reingekommen" className="xl:col-span-4">
        <ul className="flex flex-col gap-2" aria-live="polite">
          <AnimatePresence initial={false}>
            {feed.map((o) => (
              <li key={o.id}>
                <AnimatedListItem>
                  <div className="flex items-center gap-3 rounded-xl bg-secondary/70 px-3 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">
                        {o.customer.name} <span className="font-normal text-muted-foreground">· {o.code}</span>
                      </p>
                      <p className="tabular text-[13px] text-muted-foreground">
                        {formatTime(o.createdAt)} · {formatEuro(o.total)} · {o.mode === 'lieferung' ? o.address?.plz : 'Abholung'}
                      </p>
                    </div>
                    <StatusPill status={o.status} label={statusLabel(o.status, o.mode)} />
                  </div>
                </AnimatedListItem>
              </li>
            ))}
          </AnimatePresence>
        </ul>
        <Button variant="outline" className="mt-4 w-full" onClick={onOpenOrders}>
          {s.k.open} offene Bestellungen ansehen
        </Button>
      </Panel>

      <Panel title="Bestellungen nach Uhrzeit" note="Ø pro Öffnungstag, 4 Wochen" className="xl:col-span-7">
        <ChartContainer config={hourConfig} className="aspect-auto h-[240px] w-full">
          <BarChart data={s.hours} margin={{ left: 0, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="stunde" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v: string) => `${v} h`} />
            <YAxis tickLine={false} axisLine={false} width={32} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="lieferung" stackId="a" fill="var(--color-lieferung)" radius={[0, 0, 3, 3]} isAnimationActive={false} />
            <Bar dataKey="abholung" stackId="a" fill="var(--color-abholung)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </Panel>

      <Panel title="Meistbestellt" note="30 Tage" className="xl:col-span-5">
        <ChartContainer config={topConfig} className="aspect-auto h-[240px] w-full">
          <BarChart data={s.top} layout="vertical" margin={{ left: 0, right: 24 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={96} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator />} />
            <Bar dataKey="anzahl" fill="var(--color-anzahl)" radius={4} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
        <p className="mt-4 text-[13px] text-muted-foreground">
          Lieferung {s.share.lieferung} % · Abholung {s.share.abholung} % · {s.share.total} Bestellungen
        </p>
      </Panel>
    </div>
  );
}

function Kpi({ label, value, decimals = 0, unit, foot }: { label: string; value: number; decimals?: number; unit?: string; foot: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border md:p-6">
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="tabular mt-2 text-[2.2rem] leading-none font-semibold tracking-tight">
        <NumberTicker value={value} decimalPlaces={decimals} />
        {unit && <span className="ml-1 text-[1.1rem] font-medium text-muted-foreground">{unit}</span>}
      </p>
      <p className="mt-3 text-[13px]">{foot}</p>
    </div>
  );
}
