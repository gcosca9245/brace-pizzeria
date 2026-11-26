'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRightIcon, BikeIcon, EllipsisIcon, ShoppingBagIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { data, ORDER_STATUSES, statusLabel, STATUS_LABEL, type Order, type OrderStatus } from '@/lib/data';
import { formatDateTime, formatEuro, formatTime } from '@/lib/format';
import { useNow } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { StatusPill } from './StatusPill';

const HOUR = 3_600_000;

async function move(o: Order, status: OrderStatus) {
  const before = o.status;
  const r = await data.setOrderStatus(o.id, status);
  if (!r.ok) return toast.error(r.error);
  // Jeder Schritt lässt sich ein paar Sekunden lang zurücknehmen, Stornieren eingeschlossen.
  toast(`${o.code}: ${statusLabel(status, o.mode)}`, {
    duration: status === 'storniert' ? 8000 : 4000,
    action: { label: 'Rückgängig', onClick: () => void data.setOrderStatus(o.id, before) },
  });
}

export function OrdersBoard({ orders, focusId, onFocusDone }: { orders: Order[] | undefined; focusId?: string | null; onFocusDone?: () => void }) {
  const now = useNow();
  const [openId, setOpenId] = useState<string | null>(null);
  // Aus Suche oder Übersicht: direkt die Bestellung aufklappen
  const activeId = openId ?? focusId ?? null;
  const close = () => {
    setOpenId(null);
    onFocusDone?.();
  };
  if (!orders)
    return (
      <div className="grid gap-4 md:grid-cols-5">
        {ORDER_STATUSES.map((s) => (
          <Skeleton key={s} className="h-96 rounded-[28px]" />
        ))}
      </div>
    );
  const recent = orders.filter((o) => o.status !== 'geliefert' || now - o.createdAt < 3 * HOUR);
  const open = orders.find((o) => o.id === activeId) ?? null;
  const cancelled = orders.filter((o) => o.status === 'storniert' && now - o.createdAt < 6 * HOUR);

  return (
    <>
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
        className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3 pb-4 sm:-mx-5 sm:px-5 lg:mx-0 lg:grid lg:snap-none lg:grid-cols-5 lg:overflow-visible lg:px-0"
      >
        {ORDER_STATUSES.map((s, si) => {
          const col = recent.filter((o) => o.status === s).sort((a, b) => a.createdAt - b.createdAt);
          return (
            <motion.section
              key={s}
              variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 30 } } }}
              aria-labelledby={`col-${s}`}
              className="w-[84vw] max-w-sm shrink-0 snap-start rounded-[28px] bg-card p-2.5 lg:w-auto lg:max-w-none"
            >
              <h2 id={`col-${s}`} className="flex items-center justify-between gap-2 px-2.5 pt-2 pb-3 text-[16px] font-semibold tracking-[-0.01em]">
                <span className="flex items-center gap-2">
                  <span className={cn('size-2.5 rounded-full', si === 0 ? 'bg-[var(--e-accent)]' : si === 4 ? 'bg-border' : 'bg-foreground')} aria-hidden="true" />
                  {STATUS_LABEL[s]}
                </span>
                <span className="tabular grid h-7 min-w-7 place-items-center rounded-full bg-secondary px-2 text-[12px] font-semibold">{col.length}</span>
              </h2>
              <ul className="flex flex-col gap-2">
                {col.length === 0 && <li className="rounded-[20px] border-[1.5px] border-dashed border-border px-3 py-8 text-center text-[13px] text-muted-foreground">Nichts in dieser Spalte</li>}
                {col.map((o) => (
                  <OrderCard key={o.id} o={o} now={now} onOpen={() => setOpenId(o.id)} />
                ))}
              </ul>
            </motion.section>
          );
        })}
      </motion.div>
      {cancelled.length > 0 && <p className="mt-2 text-[13px] text-muted-foreground">Storniert (6 Std.): {cancelled.map((o) => o.code).join(', ')}</p>}

      <Sheet open={!!open} onOpenChange={(v) => !v && close()}>
        <SheetContent className="w-full overflow-y-auto border-0 sm:m-3 sm:h-[calc(100dvh-1.5rem)] sm:max-w-md sm:rounded-[28px]">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3 text-xl">
                  {open.code} <StatusPill status={open.status} label={statusLabel(open.status, open.mode)} />
                </SheetTitle>
                <SheetDescription>
                  {formatDateTime(open.createdAt)} · {open.mode === 'lieferung' ? 'Lieferung' : 'Abholung'} · {open.when.label}
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-5 px-4 pb-8 text-[15px]">
                <ul className="flex flex-col gap-2">
                  {open.lines.map((l, i) => (
                    <li key={i} className="grid grid-cols-[1fr_auto] gap-3">
                      <span>
                        <b className="tabular font-semibold">{l.qty}×</b> {l.name}
                        {l.details && <span className="block text-[13px] text-muted-foreground">{l.details}</span>}
                      </span>
                      <span className="tabular">{formatEuro(l.qty * l.unit)}</span>
                    </li>
                  ))}
                </ul>
                {open.note && <p className="rounded-2xl bg-[var(--e-peach)] px-4 py-3">„{open.note}“</p>}
                <Separator />
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
                  <dt className="text-muted-foreground">Kunde</dt>
                  <dd>{open.customer.name}</dd>
                  <dt className="text-muted-foreground">Telefon</dt>
                  <dd className="tabular">{open.customer.phone}</dd>
                  {open.address && (
                    <>
                      <dt className="text-muted-foreground">Adresse</dt>
                      <dd>
                        {open.address.street}
                        {open.address.floor && `, ${open.address.floor}`}
                        <br />
                        {open.address.plz} {open.address.city}
                      </dd>
                    </>
                  )}
                  <dt className="text-muted-foreground">Zahlung</dt>
                  <dd className="tabular">
                    {open.payment.method} · {open.payment.ref}
                  </dd>
                  <dt className="text-muted-foreground">Gesamt</dt>
                  <dd className="tabular font-semibold">{formatEuro(open.total)}</dd>
                </dl>
                <Separator />
                <ol className="flex flex-col gap-1 text-[14px]">
                  {open.log.map((l, i) => (
                    <li key={i} className="tabular flex justify-between">
                      <span>{statusLabel(l.status, open.mode)}</span>
                      <span className="text-muted-foreground">{formatTime(l.at)}</span>
                    </li>
                  ))}
                </ol>
                {open.status !== 'storniert' && open.status !== 'geliefert' && (
                  <div className="flex gap-2">
                    <NextButton o={open} className="flex-1" />
                    <Button variant="outline" className="h-10 rounded-full" onClick={() => move(open, 'storniert')}>
                      Stornieren
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function NextButton({ o, className }: { o: Order; className?: string }) {
  const i = ORDER_STATUSES.indexOf(o.status as (typeof ORDER_STATUSES)[number]);
  const next = i >= 0 ? ORDER_STATUSES[i + 1] : undefined;
  if (!next) return null;
  return (
    <Button
      size="sm"
      className={cn('h-10 rounded-full font-semibold', o.status === 'neu' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-foreground text-background hover:bg-foreground/85', className)}
      onClick={() => move(o, next)}
    >
      {o.status === 'neu' ? 'Annehmen' : statusLabel(next, o.mode)}
      <ArrowRightIcon />
    </Button>
  );
}

function OrderCard({ o, now, onOpen }: { o: Order; now: number; onOpen: () => void }) {
  const mins = Math.max(0, Math.round((now - o.createdAt) / 60000));
  const late = o.status !== 'geliefert' && o.status !== 'storniert' && now > o.etaAt;
  const items = o.lines.reduce((s, l) => s + l.qty, 0);
  return (
    <li className={cn('rounded-[22px] bg-secondary p-3.5 transition-shadow', o.status === 'neu' && 'ring-2 ring-[var(--e-accent)]')}>
      <div className="flex items-start justify-between gap-2">
        <button type="button" onClick={onOpen} className="min-w-0 text-left" aria-label={`${o.code} von ${o.customer.name} öffnen`}>
          <p className="tabular text-[13px] text-muted-foreground">
            {o.code} · vor {mins} Min.
          </p>
          <p className="mt-0.5 truncate text-[15px] font-semibold">{o.customer.name}</p>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Status von ${o.code} setzen`} />}>
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Status setzen</DropdownMenuLabel>
            {ORDER_STATUSES.map((s) => (
              <DropdownMenuItem key={s} disabled={s === o.status} onClick={() => move(o, s)}>
                {statusLabel(s, o.mode)}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => move(o, 'storniert')}>
              Stornieren
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="mt-2 line-clamp-2 text-[13px] text-muted-foreground">{o.lines.map((l) => `${l.qty}× ${l.name}`).join(', ')}</p>
      <div className="mt-3 flex items-center justify-between gap-2 text-[13px]">
        <span className="flex items-center gap-1.5">
          {o.mode === 'lieferung' ? <BikeIcon className="size-3.5" aria-hidden="true" /> : <ShoppingBagIcon className="size-3.5" aria-hidden="true" />}
          {o.mode === 'lieferung' ? o.address?.plz : 'Abholung'}
        </span>
        <span className="tabular">
          {items} Art. · <b className="font-semibold">{formatEuro(o.total)}</b>
        </span>
      </div>
      <p className={cn('tabular mt-1 text-[12px]', late ? 'font-semibold text-[var(--e-down)]' : 'text-muted-foreground')}>
        {o.status === 'geliefert' ? `${statusLabel('geliefert', o.mode)}` : `${late ? 'Überfällig seit' : 'Geplant'} ${formatTime(o.etaAt)} Uhr`}
      </p>
      {o.status !== 'geliefert' && <NextButton o={o} className="mt-3 w-full" />}
    </li>
  );
}
