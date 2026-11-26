'use client';

import { MinusIcon, PlusIcon } from 'lucide-react';
import { Button, LinkButton } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Separator } from '@/components/ui/separator';
import { cart, describeConfig, useCart } from '@/lib/cart';
import { formatEuro } from '@/lib/format';
import type { Zone } from '@/lib/delivery';
import { cn } from '@/lib/utils';

type Props = {
  zone?: Zone | null;
  mode: 'lieferung' | 'abholung';
  /** In der Kasse ohne eigenen Weiter-Button */
  compact?: boolean;
  onCheckout?: () => void;
  className?: string;
};

export function CartPanel({ zone, mode, compact, onCheckout, className }: Props) {
  const { lines, subtotal } = useCart();
  const fee = mode === 'lieferung' && zone ? zone.fee : 0;
  const missing = mode === 'lieferung' && zone ? Math.max(0, zone.min - subtotal) : 0;

  if (!lines.length)
    return (
      <Empty className={cn('border border-dashed border-border', className)}>
        <EmptyHeader>
          <EmptyTitle className="display text-2xl">Noch leer.</EmptyTitle>
          <EmptyDescription>Such dir eine Pizza aus, sie landet dann hier.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <ul className="flex flex-col gap-4" aria-label="Warenkorb">
        {lines.map((l) => (
          <li key={l.key} className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2">
            <div className="min-w-0">
              <p className="font-medium">{l.name}</p>
              {l.config && describeConfig(l.config) && <p className="text-[13px] text-muted-foreground">{describeConfig(l.config)}</p>}
            </div>
            <p className="tabular text-right">{formatEuro(l.unit * l.qty)}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" className="rounded-full" aria-label={`${l.name}: eine weniger`} onClick={() => cart.setQty(l.key, l.qty - 1)}>
                <MinusIcon />
              </Button>
              <span className="tabular w-7 text-center text-sm" aria-label={`Menge ${l.qty}`}>
                {l.qty}
              </span>
              <Button variant="outline" size="icon-sm" className="rounded-full" aria-label={`${l.name}: eine mehr`} onClick={() => cart.setQty(l.key, l.qty + 1)}>
                <PlusIcon />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Separator />
      <dl className="grid grid-cols-[1fr_auto] gap-y-1.5 text-[15px]">
        <dt className="text-muted-foreground">Zwischensumme</dt>
        <dd className="tabular text-right">{formatEuro(subtotal)}</dd>
        {mode === 'lieferung' && (
          <>
            <dt className="text-muted-foreground">Lieferung{zone ? ` nach ${zone.name.split(',')[0]}` : ''}</dt>
            <dd className="tabular text-right">{zone ? (fee ? formatEuro(fee) : 'frei') : 'PLZ fehlt'}</dd>
          </>
        )}
        <dt className="pt-2 font-medium">Gesamt</dt>
        <dd className="tabular pt-2 text-right text-lg font-medium">{formatEuro(subtotal + fee)}</dd>
      </dl>
      {missing > 0 && (
        <p className="rounded-lg bg-secondary px-3 py-2 text-[13px]">
          Noch {formatEuro(missing)} bis zum Mindestbestellwert für {zone!.name.split(',')[0]}.
        </p>
      )}
      {!compact && (
        <LinkButton
          variant="brand"
          size="cta"
          className="w-full" href="/kasse/" onClick={onCheckout}
        >
          Zur Kasse <span className="tabular">{formatEuro(subtotal + fee)}</span>
        </LinkButton>
      )}
    </div>
  );
}
