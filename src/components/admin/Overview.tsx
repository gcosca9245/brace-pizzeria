'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRightIcon, BellRingIcon, BikeIcon, ClockIcon, FlameIcon, GlobeIcon, ZapIcon } from 'lucide-react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { Picture } from '@/components/Picture';
import { AnimatedListItem } from '@/components/ui/animated-list';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { statusLabel, type Order, type Settings } from '@/lib/data';
import { formatEuro, formatTime } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import type { View } from './Dashboard';
import { Bento, Card, CardTitle, Delta, Gauge, RoundButton, Ticker, ZoneMap } from './ember';
import { dayTarget, kpis, revenueByDay, slotHeat, SLOT_HOURS, topItems, weekdayIndex, zoneCounts } from './stats';
import { StatusPill } from './StatusPill';

const OPEN = ['neu', 'zubereitung', 'ofen', 'unterwegs'];
const DAY = 86_400_000;
const revenueConfig = { umsatz: { label: 'Umsatz', color: 'var(--e-accent)' } } satisfies ChartConfig;
const monthFmt = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', month: 'long', year: 'numeric' });
const dayNum = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', day: 'numeric' });
const WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const euro0 = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

/** Drei Kennzahlen neben der Suche, wie in der Vorlage. */
export function OverviewKpis({ all }: { all: Order[] | null }) {
  const now = useNow(60_000);
  const k = useMemo(() => (all ? kpis(all, now) : null), [all, now]);
  if (!k) return <Skeleton className="h-20 rounded-3xl" />;
  const items = [
    { label: 'Umsatz heute', value: k.revenue / 100, decimals: 0, unit: '€', now: k.revenue, before: k.revenueLastWeek },
    { label: 'Bestellungen heute', value: k.orders, decimals: 0, now: k.orders, before: k.ordersLastWeek },
    { label: 'Ø Bon heute', value: k.avg / 100, decimals: 2, unit: '€', now: 0, before: 0 },
  ];
  return (
    <dl className="-mx-3 flex snap-x gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
      {items.map((it) => (
        <div key={it.label} className="min-w-[44%] shrink-0 snap-start rounded-3xl bg-card px-4 py-3 sm:min-w-0 sm:bg-transparent sm:p-0">
          <dt className="text-[13px] font-medium text-muted-foreground">{it.label}</dt>
          <dd className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[clamp(1.9rem,3.4vw,3rem)] leading-none font-semibold tracking-[-0.035em]">
              <Ticker value={it.value} decimals={it.decimals} />
              {it.unit && <span className="ml-1 text-[0.55em] font-medium text-muted-foreground">{it.unit}</span>}
            </span>
            {it.before ? <Delta now={it.now} before={it.before} /> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

type Props = { all: Order[] | null; orders: Order[] | undefined; settings: Settings | undefined; go: (v: View) => void; onOpenOrder: (id: string) => void };

export function Overview({ all, orders, settings, go, onOpenOrder }: Props) {
  const now = useNow(60_000);
  const [range, setRange] = useState<7 | 14>(7);
  const s = useMemo(() => {
    if (!all) return null;
    return {
      k: kpis(all, now),
      target: dayTarget(all, now),
      days: revenueByDay(all, now, range),
      top: topItems(all, now, 30, 5),
      heat: slotHeat(all, now),
    };
  }, [all, now, range]);
  const zones = useMemo(() => (all && settings ? zoneCounts(all, now, settings.zones) : null), [all, now, settings]);

  if (!s || !orders)
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        {['xl:col-span-5', 'xl:col-span-2', 'xl:col-span-2', 'xl:col-span-3', 'xl:col-span-5', 'xl:col-span-7'].map((c, i) => (
          <Skeleton key={`${c}-${i}`} className={cn('h-72 rounded-[28px]', c)} />
        ))}
      </div>
    );

  const open = orders.filter((o) => OPEN.includes(o.status));
  const count = (st: string) => orders.filter((o) => o.status === st).length;
  const fresh = count('neu');
  const next = [...open].filter((o) => o.status !== 'unterwegs').sort((a, b) => a.etaAt - b.etaAt)[0] ?? open[0];
  const biggest = [...open].sort((a, b) => b.total - a.total)[0];
  const progress = s.target ? s.k.revenue / s.target : 0;
  const todayOrders = s.k.orders;
  const fast = s.k.deliveryMinutes > 0 && s.k.deliveryMinutes <= 40;
  const homeZone = settings?.zones[0];
  const maxTop = Math.max(1, ...s.top.map((t) => t.anzahl));

  return (
    <div className="flex flex-col gap-4">
      <Bento className="md:grid-cols-2 xl:grid-cols-12">
        {/* Tagesziel mit Tacho */}
        <Card aria-labelledby="h-ziel" className="md:col-span-2 xl:col-span-5">
          <div className="flex items-start justify-between gap-4">
            <CardTitle id="h-ziel">Tagesziel Umsatz</CardTitle>
            <RoundButton onClick={() => go('bestellungen')} aria-label="Bestellungen öffnen">
              <ArrowUpRightIcon />
            </RoundButton>
          </div>
          <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] items-end gap-4">
            <div className="pb-2">
              <p className="text-[13px] font-medium text-muted-foreground">Ø Lieferzeit</p>
              <p className="mt-1 flex items-center gap-2">
                <span className="text-[clamp(2.6rem,4vw,3.4rem)] leading-none font-semibold tracking-[-0.04em]">
                  <Ticker value={s.k.deliveryMinutes} />
                </span>
                {fast && (
                  <span className="inline-flex h-6 items-center gap-1 rounded-full bg-[var(--e-up-bg)] px-2 text-[12px] font-semibold text-[var(--e-up)]">
                    <ZapIcon className="size-3" aria-hidden="true" /> Schnell
                  </span>
                )}
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">Minuten, 30 Tage</p>
            </div>
            <div className="flex flex-col items-center">
              <Gauge value={progress} label={s.target ? `${Math.round(progress * 100)} Prozent vom Tagesziel erreicht` : 'Heute Ruhetag'} />
              <p className="tabular -mt-1 text-center text-[13px] text-muted-foreground">
                {s.target ? (
                  <>
                    <b className="font-semibold text-foreground">{Math.round(progress * 100)} %</b> von {euro0.format(s.target / 100)}
                  </>
                ) : (
                  'Heute kein Vergleichswert'
                )}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {[
              { st: 'neu', icon: BellRingIcon },
              { st: 'ofen', icon: FlameIcon },
              { st: 'unterwegs', icon: BikeIcon },
            ].map(({ st, icon: Icon }) => (
              <button
                key={st}
                type="button"
                onClick={() => go('bestellungen')}
                aria-label={`${statusLabel(st as Order['status'], 'lieferung')}: ${count(st)}`}
                className="relative grid size-14 place-items-center rounded-full ring-1 ring-border transition-colors hover:bg-secondary"
              >
                <Icon className="size-5" aria-hidden="true" />
                {count(st) > 0 && (
                  <span className="tabular absolute -top-1 -right-1 grid h-6 min-w-6 place-items-center rounded-full bg-[#c42a4a] px-1 text-[11px] font-bold text-white ring-2 ring-card" aria-hidden="true">
                    {count(st)}
                  </span>
                )}
              </button>
            ))}
            <div className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-full px-3 ring-1 ring-border">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary" aria-hidden="true">
                <GlobeIcon className="size-4" />
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[14px] font-semibold">Website-Shop</span>
                <span className="block truncate text-[12px] text-muted-foreground">
                  <b className="tabular font-semibold text-[var(--e-down)]">{todayOrders}</b> Bestellungen heute
                </span>
              </span>
            </div>
          </div>
        </Card>

        {/* Offene Bestellungen: die eine orange Handlungskarte */}
        <Card tone="accent" aria-labelledby="h-offen" className="flex min-h-[280px] flex-col xl:col-span-2">
          <div className="flex items-start justify-between gap-2">
            <h2 id="h-offen" className="text-[26px] leading-[1.1] font-medium tracking-[-0.02em]">
              Offene Bestellungen
            </h2>
          </div>
          <button
            type="button"
            onClick={() => go('bestellungen')}
            className="mt-4 inline-flex h-10 w-fit items-center gap-2 rounded-full bg-white px-4 text-[14px] font-semibold text-[#12111a] transition-transform active:scale-[0.97]"
          >
            <ArrowUpRightIcon className="size-4" aria-hidden="true" /> Zum Board
          </button>
          <div className="mt-auto flex items-end gap-2 pt-6">
            <span className="text-[72px] leading-[0.85] font-semibold tracking-[-0.05em]">
              <Ticker value={open.length} />
            </span>
            <span className="pb-1 text-[13px] leading-tight font-semibold text-[#12111a]">
              davon {fresh}
              <br />
              neu
            </span>
          </div>
        </Card>

        {/* Als Nächstes raus */}
        <Card aria-labelledby="h-next" className="flex min-h-[280px] flex-col xl:col-span-2">
          <CardTitle id="h-next">Als Nächstes raus</CardTitle>
          {next ? (
            <button
              type="button"
              onClick={() => onOpenOrder(next.id)}
              className="relative mt-auto w-full rounded-[22px] bg-secondary p-3 text-left transition-colors hover:bg-accent"
              aria-label={`${next.code} von ${next.customer.name} öffnen`}
            >
              <span className="absolute inset-x-4 -top-2 -z-0 h-4 rounded-t-[14px] bg-[var(--e-ink)]" aria-hidden="true" />
              <span className="tabular inline-flex h-7 items-center gap-1.5 rounded-full bg-card px-2.5 text-[12px] font-medium">
                <ClockIcon className="size-3.5" aria-hidden="true" /> {formatTime(next.etaAt)} Uhr
              </span>
              <span className="mt-2 block truncate text-[15px] font-semibold">{next.customer.name}</span>
              <span className="mt-1 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                <span className="size-2 rounded-full bg-[var(--e-accent)]" aria-hidden="true" />
                {next.code}, {next.mode === 'lieferung' ? next.address?.plz : 'Abholung'}
              </span>
            </button>
          ) : (
            <p className="mt-auto text-[14px] text-muted-foreground">Gerade ist nichts offen.</p>
          )}
        </Card>

        {/* Liefergebiet */}
        <Card aria-labelledby="h-map" className="flex min-h-[280px] flex-col overflow-hidden md:col-span-2 xl:col-span-3">
          <div className="relative z-10 flex items-start justify-between gap-2">
            <CardTitle id="h-map">
              Lieferungen
              <br />
              nach Gebiet
            </CardTitle>
            <RoundButton onClick={() => go('zeiten')} aria-label="Liefergebiete bearbeiten" className="bg-transparent">
              <ArrowUpRightIcon />
            </RoundButton>
          </div>
          <div className="absolute inset-x-0 top-10 bottom-16">
            <ZoneMap active={(settings?.zones ?? []).map((z) => z.active)} />
          </div>
          <div className="relative z-10 mt-auto flex items-center gap-3 rounded-full bg-card/90 p-1.5 pr-1.5 backdrop-blur-sm">
            <Picture name="p-margherita" widths={[480, 960]} sizes="48px" width={48} height={48} alt="" className="size-12 rounded-full object-cover" />
            <span className="text-[34px] leading-none font-semibold tracking-[-0.04em]">
              <Ticker value={zones && homeZone ? zones[homeZone.id] : 0} />
            </span>
            <span className="min-w-0 flex-1 text-[12px] leading-tight text-muted-foreground">
              {homeZone?.name ?? 'Ehrenfeld'}
              <br />
              30 Tage
            </span>
            <RoundButton dark onClick={() => go('zeiten')} aria-label="Zonen ansehen">
              <ArrowUpRightIcon />
            </RoundButton>
          </div>
        </Card>
      </Bento>

      <Bento className="xl:grid-cols-12">
        {/* Umsatz: vergangene Tage schraffiert, heute voll */}
        <Card aria-labelledby="h-umsatz" lift={false} className="xl:col-span-5">
          <div className="flex items-center justify-between gap-3">
            <CardTitle id="h-umsatz">Umsatz</CardTitle>
            <div className="flex h-10 items-center rounded-full bg-secondary p-1" role="group" aria-label="Zeitraum">
              {([7, 14] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={range === r}
                  onClick={() => setRange(r)}
                  className={cn('h-8 rounded-full px-3 text-[13px] font-medium transition-colors', range === r ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground')}
                >
                  {r} Tage
                </button>
              ))}
            </div>
          </div>
          <ChartContainer config={revenueConfig} className="mt-4 aspect-auto h-[260px] w-full">
            <BarChart data={s.days} margin={{ left: 0, right: 0, top: 36, bottom: 0 }} barCategoryGap="18%">
              <defs>
                <pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <rect width="7" height="7" fill="var(--secondary)" />
                  <line x1="0" y1="0" x2="0" y2="7" stroke="var(--e-hatch)" strokeWidth="3.5" />
                </pattern>
              </defs>
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} interval={range === 14 ? 1 : 0} tickFormatter={(v: string) => v.split(' ')[0]} />
              <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toLocaleString('de-DE')}k` : `${v}`)} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(v) => `${Number(v).toLocaleString('de-DE')} €`} />} />
              <Bar
                dataKey="umsatz"
                animationDuration={900}
                animationEasing="ease-out"
                shape={(p: unknown) => {
                  const { x, y, width, height, index, value } = p as { x: number; y: number; width: number; height: number; index: number; value: number };
                  const last = index === s.days.length - 1;
                  const h = Math.max(height, width); // auch kleine Werte als runde Kapsel
                  const top = y + height - h;
                  const label = `${Math.round(value).toLocaleString('de-DE')} €`;
                  const w = label.length * 7.2 + 20;
                  const cx = x + width / 2;
                  return (
                    <g>
                      <rect x={x} y={top} width={width} height={h} rx={width / 2} fill={last ? 'var(--e-accent)' : 'url(#hatch)'} />
                      {last && (
                        <>
                          <rect x={cx - w / 2} y={top - 32} width={w} height={24} rx={12} fill="var(--e-ink)" />
                          <text x={cx} y={top - 16} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--e-canvas)">
                            {label}
                          </text>
                          <circle cx={cx} cy={top + width / 2} r={4} fill="var(--e-ink)" stroke="#fff" strokeWidth={2} />
                        </>
                      )}
                    </g>
                  );
                }}
              />
            </BarChart>
          </ChartContainer>
        </Card>

        {/* Wochenplan: Stoßzeiten + dunkles Popup */}
        <Card aria-labelledby="h-woche" lift={false} className="xl:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <CardTitle id="h-woche">Stoßzeiten der Woche</CardTitle>
            <span className="inline-flex h-10 items-center rounded-full bg-secondary px-4 text-[13px] font-medium capitalize">{monthFmt.format(now)}</span>
          </div>
          <Week heat={s.heat} now={now} closed={settings?.hours.map((h) => h.closed) ?? []} />
          {biggest && (
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.45, type: 'spring', stiffness: 240, damping: 26 }}
              className="mt-4 rounded-[26px] bg-[var(--e-pop)] p-5 text-white xl:absolute xl:right-5 xl:bottom-5 xl:mt-0 xl:w-[300px]"
            >
              <p className="text-[22px] leading-tight font-medium tracking-[-0.02em]">Größte offene Bestellung</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[12px] font-semibold">
                <span className="inline-flex h-7 items-center rounded-full bg-[var(--e-accent)] px-3 text-[#12111a]">{biggest.code}</span>
                <span className="tabular inline-flex h-7 items-center gap-1.5 rounded-full px-3 ring-1 ring-white/25">
                  <ClockIcon className="size-3.5" aria-hidden="true" /> {formatTime(biggest.etaAt)} Uhr
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="min-w-0 text-[13px] leading-snug text-white/80">
                  <span className="block truncate font-semibold text-white">{biggest.customer.name}</span>
                  {biggest.lines.reduce((n, l) => n + l.qty, 0)} Artikel, {formatEuro(biggest.total)}
                </p>
                <button
                  type="button"
                  onClick={() => onOpenOrder(biggest.id)}
                  className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#12111a] transition-transform active:scale-[0.96]"
                  aria-label={`${biggest.code} öffnen`}
                >
                  <ArrowUpRightIcon className="size-[18px]" />
                </button>
              </div>
            </motion.div>
          )}
        </Card>
      </Bento>

      <Bento className="xl:grid-cols-12">
        <Card aria-labelledby="h-feed" lift={false} className="xl:col-span-7">
          <div className="flex items-center justify-between gap-3">
            <CardTitle id="h-feed">Gerade reingekommen</CardTitle>
            <button type="button" onClick={() => go('bestellungen')} className="h-10 rounded-full bg-secondary px-4 text-[13px] font-semibold transition-colors hover:bg-accent">
              Alle {open.length} offenen
            </button>
          </div>
          <ul className="mt-4 flex flex-col gap-2" aria-live="polite">
            <AnimatePresence initial={false}>
              {orders.slice(0, 5).map((o) => (
                <li key={o.id}>
                  <AnimatedListItem>
                    <button type="button" onClick={() => onOpenOrder(o.id)} className="flex w-full items-center gap-3 rounded-[20px] bg-secondary px-3 py-2.5 text-left transition-colors hover:bg-accent">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-card" aria-hidden="true">
                        {o.mode === 'lieferung' ? <BikeIcon className="size-4" /> : <ClockIcon className="size-4" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-semibold">{o.customer.name}</span>
                        <span className="tabular block truncate text-[13px] text-muted-foreground">
                          {o.code}, {formatTime(o.createdAt)} Uhr, {formatEuro(o.total)}
                        </span>
                      </span>
                      <StatusPill status={o.status} label={statusLabel(o.status, o.mode)} />
                    </button>
                  </AnimatedListItem>
                </li>
              ))}
            </AnimatePresence>
          </ul>
        </Card>

        <Card aria-labelledby="h-top" lift={false} className="xl:col-span-5">
          <CardTitle id="h-top">Meistbestellt</CardTitle>
          <p className="mt-1 text-[13px] text-muted-foreground">Pizzen, letzte 30 Tage</p>
          <ol className="mt-5 flex flex-col gap-3.5">
            {s.top.map((t, i) => (
              <li key={t.name} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 text-[14px]">
                <span className="truncate font-medium">{t.name}</span>
                <span className="h-3 overflow-hidden rounded-full bg-secondary">
                  <motion.span
                    className={cn('block h-full rounded-full', i === 0 ? 'bg-[var(--e-accent)]' : 'bg-[var(--e-ink)]')}
                    initial={{ width: 0 }}
                    animate={{ width: `${(t.anzahl / maxTop) * 100}%` }}
                    transition={{ duration: 0.9, delay: 0.2 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  />
                </span>
                <span className="tabular w-10 text-right font-semibold">{t.anzahl}</span>
              </li>
            ))}
          </ol>
        </Card>
      </Bento>
    </div>
  );
}

function Week({ heat, now, closed }: { heat: number[][]; now: number; closed: boolean[] }) {
  const today = weekdayIndex(now);
  const monday = now - today * DAY;
  const max = Math.max(1, ...heat.flat());
  return (
    <div className="mt-5 overflow-x-auto pb-1 xl:pr-[316px]">
      <table className="w-full min-w-[520px] border-separate border-spacing-y-1.5 text-[13px]">
        <caption className="sr-only">Ø Bestellungen je Stunde und Wochentag, letzte vier Wochen</caption>
        <thead>
          <tr>
            <th scope="col" className="w-14">
              <span className="sr-only">Uhrzeit</span>
            </th>
            {WD.map((d, i) => (
              <th key={d} scope="col" className="font-medium">
                <span className={cn('tabular inline-flex h-8 items-center rounded-full px-2.5 whitespace-nowrap', i === today ? 'bg-[var(--e-ink)] text-[var(--e-canvas)]' : 'text-muted-foreground')}>
                  {d}, {dayNum.format(monday + i * DAY)}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SLOT_HOURS.map((h, r) => (
            <tr key={h}>
              <th scope="row" className="tabular text-left font-medium text-muted-foreground">
                {h} Uhr
              </th>
              {WD.map((d, c) => {
                const v = heat[c][r];
                const shut = closed[c];
                const k = v / max;
                return (
                  <td key={d} className="text-center">
                    <motion.span
                      initial={{ scale: 0.4 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.15 + (c + r) * 0.025, type: 'spring', stiffness: 300, damping: 24 }}
                      className={cn(
                        'mx-auto block size-9 rounded-full md:size-10',
                        shut || v === 0 ? 'border-[1.5px] border-dashed border-border' : k > 0.85 ? 'bg-[var(--e-accent)]' : 'bg-[var(--e-peach)]',
                      )}
                      style={!shut && v > 0 && k <= 0.85 ? { opacity: 0.35 + k * 0.65 } : undefined}
                      title={shut ? 'Ruhetag' : `Ø ${v.toLocaleString('de-DE')} Bestellungen`}
                    />
                    <span className="sr-only">{shut ? 'Ruhetag' : `Ø ${v.toLocaleString('de-DE')}`}</span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
