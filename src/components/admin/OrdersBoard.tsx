'use client';

import { useState } from 'react';
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

export function OrdersBoard({ orders }: { orders: Order[] | undefined }) {
  const now = useNow();
  const [openId, setOpenId] = useState<string | null>(null);
  if (!orders)
    return (
      <div className="grid gap-4 md:grid-cols-5">
        {ORDER_STATUSES.map((s) => (
          <Skeleton key={s} className="h-96 rounded-2xl" />
        ))}
      </div>
    );
  const recent = orders.filter((o) => o.status !== 'geliefert' || now - o.createdAt < 3 * HOUR);
  const open = orders.find((o) => o.id === openId) ?? null;
  const cancelled = orders.filter((o) => o.status === 'storniert' && now - o.createdAt < 6 * HOUR);

  return (
    <>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:snap-none md:grid-cols-5 md:overflow-visible md:px-0">
        {ORDER_STATUSES.map((s) => {
          const col = recent.filter((o) => o.status === s).sort((a, b) => a.createdAt - b.createdAt);
          return (
            <section key={s} aria-labelledby={`col-${s}`} className="w-[82vw] max-w-sm shrink-0 snap-start rounded-2xl bg-secondary/60 p-2.5 md:w-auto md:max-w-none">
              <h2 id={`col-${s}`} className="flex items-center justify-between px-2 pt-1.5 pb-3 text-[14px] font-semibold">
                {STATUS_LABEL[s]}
                <span className="tabular rounded-full bg-card px-2 text-[12px] font-medium text-muted-foreground ring-1 ring-border">{col.length}</span>
              </h2>
              <ul className="flex flex-col gap-2">
                {col.length === 0 && <li className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-[13px] text-muted-foreground">Leer</li>}
                {col.map((o) => (
                  <OrderCard key={o.id} o={o} now={now} onOpen={() => setOpenId(o.id)} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {cancelled.length > 0 && <p className="mt-2 text-[13px] text-muted-foreground">Storniert (6 Std.): {cancelled.map((o) => o.code).join(', ')}</p>}

      <Sheet open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
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
                {open.note && <p className="rounded-lg bg-glut/15 px-3 py-2">„{open.note}“</p>}
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
                    <Button variant="outline" onClick={() => move(open, 'storniert')}>
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
    <Button size="sm" variant={o.status === 'neu' ? 'brand' : 'default'} className={cn('h-9', className)} onClick={() => move(o, next)}>
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
    <li className={cn('rounded-xl bg-card p-3 shadow-[0_1px_0_rgb(0_0_0/0.04)] ring-1 ring-border', o.status === 'neu' && 'ring-2 ring-pomodoro/70')}>
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
      <p className={cn('tabular mt-1 text-[12px]', late ? 'font-medium text-pomodoro' : 'text-muted-foreground')}>
        {o.status === 'geliefert' ? `${statusLabel('geliefert', o.mode)}` : `${late ? 'Überfällig seit' : 'Geplant'} ${formatTime(o.etaAt)} Uhr`}
      </p>
      {o.status !== 'geliefert' && <NextButton o={o} className="mt-3 w-full" />}
    </li>
  );
}
