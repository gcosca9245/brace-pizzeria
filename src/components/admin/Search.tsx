'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { PizzaIcon, ReceiptTextIcon, SearchIcon, UserIcon } from 'lucide-react';
import { data, statusLabel, type Order } from '@/lib/data';
import { formatEuro } from '@/lib/format';
import { useLive } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { customers } from './stats';

export type Pick = { kind: 'order'; id: string } | { kind: 'customer'; query: string } | { kind: 'pizza'; id: string };
type Hit = { key: string; pick: Pick; icon: typeof PizzaIcon; title: string; meta: string };

/** Die große Suche oben: Bestellungen (Code, Name), Kunden und Gerichte. */
export function Search({ orders, all, onPick }: { orders: Order[] | undefined; all: Order[] | null; onPick: (p: Pick) => void }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [menu] = useLive(() => data.getMenu());
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const people = useMemo(() => (all ? customers(all) : []), [all]);

  const hits = useMemo<Hit[]>(() => {
    const n = q.trim().toLowerCase();
    if (n.length < 2) return [];
    const o: Hit[] = (orders ?? [])
      .filter((x) => `${x.code} ${x.customer.name}`.toLowerCase().includes(n))
      .slice(0, 4)
      .map((x) => ({ key: `o${x.id}`, pick: { kind: 'order', id: x.id }, icon: ReceiptTextIcon, title: `${x.code} – ${x.customer.name}`, meta: `${statusLabel(x.status, x.mode)}, ${formatEuro(x.total)}` }));
    const c: Hit[] = people
      .filter((x) => `${x.name} ${x.email}`.toLowerCase().includes(n))
      .slice(0, 3)
      .map((x) => ({ key: `c${x.key}`, pick: { kind: 'customer', query: x.name }, icon: UserIcon, title: x.name, meta: `${x.orders} Bestellungen` }));
    const m: Hit[] = (menu ?? [])
      .filter((x) => x.name.toLowerCase().includes(n))
      .slice(0, 3)
      .map((x) => ({ key: `m${x.id}`, pick: { kind: 'pizza', id: x.id }, icon: PizzaIcon, title: x.name, meta: x.available ? formatEuro(x.price) : 'Ausverkauft' }));
    return [...o, ...c, ...m];
  }, [q, orders, people, menu]);

  const choose = (h: Hit) => {
    onPick(h.pick);
    setQ('');
    setOpen(false);
    input.current?.blur();
  };

  const show = open && q.trim().length >= 2;

  return (
    <div className="relative">
      <div className="flex items-center gap-3 border-b border-foreground/10 pb-3 focus-within:border-foreground/40">
        <input
          ref={input}
          role="combobox"
          aria-expanded={show}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={show && hits[active] ? `${listId}-${active}` : undefined}
          aria-label="Bestellung, Kunde oder Pizza suchen"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, hits.length - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === 'Enter' && hits[active]) choose(hits[active]);
            else if (e.key === 'Escape') setOpen(false);
          }}
          placeholder="Bestellung, Kunde oder Pizza suchen…"
          className="min-w-0 flex-1 bg-transparent text-[1.05rem] min-[400px]:text-[1.15rem] sm:text-[clamp(1.4rem,1.95vw,2.25rem)] leading-tight font-medium tracking-[-0.025em] outline-none placeholder:text-foreground"
        />
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-card sm:size-12" aria-hidden="true">
          <SearchIcon className="size-[18px]" />
        </span>
      </div>
      {show && (
        <ul id={listId} role="listbox" aria-label="Treffer" className="absolute inset-x-0 top-full z-30 mt-2 max-h-[60vh] overflow-auto rounded-[24px] bg-popover p-2 shadow-[0_24px_60px_-20px_rgb(18_17_26/0.25)] ring-1 ring-border">
          {hits.length === 0 && <li className="px-4 py-3 text-[14px] text-muted-foreground">Nichts gefunden. Probier den Code einer Bestellung, z. B. B-…</li>}
          {hits.map((h, i) => (
            <li
              key={h.key}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(h)}
              onMouseEnter={() => setActive(i)}
              className={cn('flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5', i === active && 'bg-secondary')}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-foreground" aria-hidden="true">
                <h.icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{h.title}</span>
                <span className="block truncate text-[13px] text-muted-foreground">{h.meta}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
