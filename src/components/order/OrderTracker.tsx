'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckIcon } from 'lucide-react';
import { LinkButton } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { asset } from '@/lib/asset';
import { data, ORDER_STATUSES, statusLabel, type Order } from '@/lib/data';
import { formatEuro, formatTime } from '@/lib/format';
import { useLive } from '@/lib/hooks';
import { cn } from '@/lib/utils';

/** Passendes Standbild aus dem Film zu jedem Schritt */
const FRAME: Record<string, number> = { neu: 1, zubereitung: 48, ofen: 95, unterwegs: 150, geliefert: 168, storniert: 1 };
const COPY: Record<string, string> = {
  neu: 'Die Küche hat deine Bestellung gesehen.',
  zubereitung: 'Dein Teig wird gerade ausgezogen und belegt.',
  ofen: 'Neunzig Sekunden im Holzofen.',
  unterwegs: 'Geschnitten, verpackt, auf dem Lastenrad.',
  geliefert: 'Guten Appetit.',
  storniert: 'Diese Bestellung wurde storniert.',
};

export function OrderTracker() {
  const params = useSearchParams();
  const id = params.get('id') ?? '';
  const [order] = useLive<Order | null>(() => data.getOrder(id), 4000);

  if (order === null || !id)
    return (
      <div className="mx-auto max-w-xl px-5 pt-36 pb-40">
        <Empty>
          <EmptyHeader>
            <EmptyTitle className="display text-4xl">Bestellung nicht gefunden.</EmptyTitle>
            <EmptyDescription>
              Der Link ist unvollständig, oder die Bestellung wurde in einem anderen Browser aufgegeben. In der Demo liegen Bestellungen nur in diesem Browser.
            </EmptyDescription>
          </EmptyHeader>
          <LinkButton variant="brand" size="cta" href="/bestellen/">
            Zur Karte
          </LinkButton>
        </Empty>
      </div>
    );
  if (!order)
    return (
      <div className="mx-auto max-w-[1600px] px-5 pt-36 md:px-10">
        <Skeleton className="h-24 w-2/3" />
        <Skeleton className="mt-10 h-64 w-full" />
      </div>
    );

  const steps = ORDER_STATUSES;
  const current = order.status === 'storniert' ? -1 : steps.indexOf(order.status);
  const logAt = (s: string) => [...order.log].reverse().find((l) => l.status === s)?.at;
  const done = order.status === 'geliefert';

  return (
    <div className="mx-auto max-w-[1600px] px-5 pt-28 pb-24 md:px-10 md:pt-36">
      <p className="tabular text-[15px] text-muted-foreground">Bestellung {order.code}</p>
      <h1 className="display mt-2 text-[clamp(3rem,7.5vw,6.5rem)] leading-[0.9] font-[560]">
        {done ? 'Angekommen.' : `Danke, ${order.customer.name.split(' ')[0]}.`}
      </h1>

      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <div className="dark relative overflow-hidden rounded-[1.75rem] bg-ofen text-mehl">
            <img
              key={order.status}
              src={asset(`/media/film/d1280/${String(FRAME[order.status]).padStart(3, '0')}.webp`)}
              alt=""
              width={1280}
              height={720}
              className="aspect-[16/10] w-full object-cover opacity-90 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700"
            />
            <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,rgb(15_12_10/0.88),transparent)] p-6 pt-20 md:p-8 md:pt-24">
              <p className="text-[13px] text-mehl/75" aria-live="polite">
                {statusLabel(order.status, order.mode)}
              </p>
              <p className="display mt-1 text-[clamp(1.8rem,3.4vw,2.8rem)] leading-tight font-[560]">{COPY[order.status]}</p>
              {!done && order.status !== 'storniert' && (
                <p className="tabular mt-3 text-[17px]">
                  {order.mode === 'lieferung' ? 'Ankunft' : 'Abholbereit'} ca. {formatTime(order.etaAt)} Uhr
                </p>
              )}
            </div>
          </div>

          <ol className="mt-10 grid gap-0 md:grid-cols-5" aria-label="Status deiner Bestellung">
            {steps.map((s, i) => {
              const reached = i <= current;
              const at = logAt(s);
              return (
                <li key={s} className="relative flex gap-4 pb-6 md:flex-col md:gap-3 md:pr-3 md:pb-0" aria-current={i === current ? 'step' : undefined}>
                  <span className="relative flex flex-col items-center md:flex-row">
                    <span
                      className={cn(
                        'relative z-10 flex size-7 items-center justify-center rounded-full border transition-colors duration-500',
                        reached ? 'border-pomodoro bg-pomodoro text-white' : 'border-border bg-mehl text-muted-foreground',
                      )}
                    >
                      {i < current || (done && i === current) ? <CheckIcon className="size-3.5" aria-hidden="true" /> : <span className="text-[12px]">{i + 1}</span>}
                      {i === current && !done && <span aria-hidden="true" className="absolute inset-0 rounded-full bg-pomodoro/40 motion-safe:animate-ping" />}
                    </span>
                    {i < steps.length - 1 && (
                      <span aria-hidden="true" className={cn('absolute top-7 left-1/2 h-full w-px -translate-x-1/2 md:top-1/2 md:left-7 md:h-px md:w-[calc(100%-1.75rem)] md:translate-x-0', i < current ? 'bg-pomodoro' : 'bg-border')} />
                    )}
                  </span>
                  <span>
                    <span className={cn('block text-[15px]', reached ? 'font-medium' : 'text-muted-foreground')}>{statusLabel(s, order.mode)}</span>
                    <span className="tabular block text-[13px] text-muted-foreground">{at ? `${formatTime(at)} Uhr` : '–'}</span>
                  </span>
                </li>
              );
            })}
          </ol>
          {order.autopilot && !done && (
            <p className="mt-6 rounded-xl bg-secondary px-4 py-3 text-[14px]">
              Demo: Der Status läuft von selbst weiter. In der{' '}
              <Link href="/admin/" className="font-medium underline underline-offset-4">
                Küchenansicht
              </Link>{' '}
              kannst du ihn auch von Hand setzen.
            </p>
          )}
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-[1.6rem] bg-card p-6 ring-1 ring-border md:p-8">
            <h2 className="display text-3xl font-[560]">Was kommt</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {order.lines.map((l, i) => (
                <li key={i} className="grid grid-cols-[1fr_auto] gap-4 text-[15px]">
                  <span>
                    {l.qty} × {l.name}
                    {l.details && <span className="block text-[13px] text-muted-foreground">{l.details}</span>}
                  </span>
                  <span className="tabular">{formatEuro(l.qty * l.unit)}</span>
                </li>
              ))}
            </ul>
            <Separator className="my-5" />
            <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 text-[15px]">
              <dt className="text-muted-foreground">Lieferung</dt>
              <dd className="tabular text-right">{order.fee ? formatEuro(order.fee) : 'frei'}</dd>
              <dt className="font-medium">Gesamt</dt>
              <dd className="tabular text-right font-medium">{formatEuro(order.total)}</dd>
            </dl>
            <Separator className="my-5" />
            <dl className="grid gap-4 text-[15px] sm:grid-cols-2">
              <div>
                <dt className="text-[13px] text-muted-foreground">{order.mode === 'lieferung' ? 'Lieferadresse' : 'Abholung'}</dt>
                <dd className="mt-1">
                  {order.address ? (
                    <>
                      {order.address.street}
                      <br />
                      {order.address.plz} {order.address.city}
                    </>
                  ) : (
                    'Venloer Straße, Ehrenfeld'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[13px] text-muted-foreground">Zeit</dt>
                <dd className="mt-1">{order.when.label}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-muted-foreground">Zahlung</dt>
                <dd className="tabular mt-1">
                  {order.payment.method === 'karte' ? 'Karte' : order.payment.method === 'paypal' ? 'PayPal' : 'Bar'}, {order.payment.ref}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
