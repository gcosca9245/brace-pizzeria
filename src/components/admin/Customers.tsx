'use client';

import { useMemo, useState } from 'react';
import { SearchIcon } from 'lucide-react';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { data } from '@/lib/data';
import { formatEuro } from '@/lib/format';
import { useLive } from '@/lib/hooks';
import { customers } from './stats';
import { Bento, Card, Ticker } from './ember';

const date = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: '2-digit' });

export function Customers({ initialQuery = '' }: { initialQuery?: string }) {
  const [orders] = useLive(() => data.listOrders());
  const [hist] = useLive(() => data.history());
  const [q, setQ] = useState(initialQuery);
  const list = useMemo(() => (orders && hist ? customers([...orders, ...hist]) : null), [orders, hist]);
  if (!list) return <Skeleton className="h-96 rounded-[28px]" />;
  const needle = q.trim().toLowerCase();
  const shown = needle ? list.filter((c) => `${c.name} ${c.email} ${c.plz ?? ''}`.toLowerCase().includes(needle)) : list;
  const regulars = list.filter((c) => c.orders >= 5).length;
  const avg = list.length ? list.reduce((s, c) => s + c.revenue, 0) / list.length / 100 : 0;
  const stats = [
    { label: 'Kunden', value: list.length, decimals: 0 },
    { label: 'Stammkunden, 5+ Bestellungen', value: regulars, decimals: 0 },
    { label: 'Ø Umsatz pro Kunde', value: avg, decimals: 2, unit: '€' },
  ];

  return (
    <Bento className="md:grid-cols-3">
      {stats.map((st, i) => (
        <Card key={st.label} tone={i === 1 ? 'accent' : 'white'} className="min-h-36">
          <h2 className={i === 1 ? 'text-[13px] font-semibold text-[#12111a]' : 'text-[13px] font-medium text-muted-foreground'}>{st.label}</h2>
          <p className="mt-5 text-[52px] leading-none font-semibold tracking-[-0.045em]">
            <Ticker value={st.value} decimals={st.decimals} />
            {st.unit && <span className={i === 1 ? 'ml-1 text-[0.5em]' : 'ml-1 text-[0.5em] text-muted-foreground'}>{st.unit}</span>}
          </p>
        </Card>
      ))}
    <Card lift={false} aria-label="Kundenliste" className="px-0 py-0 md:col-span-3 md:px-0 md:py-0">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 md:p-6">
        <p className="text-[19px] font-semibold tracking-[-0.01em]">Alle Kunden</p>
        <InputGroup className="h-11 w-full max-w-xs rounded-full">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, E-Mail oder PLZ" aria-label="Kunden suchen" />
        </InputGroup>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5 md:pl-6">Kunde</TableHead>
            <TableHead className="hidden md:table-cell">Kontakt</TableHead>
            <TableHead>PLZ</TableHead>
            <TableHead className="text-right">Bestellungen</TableHead>
            <TableHead className="text-right">Umsatz</TableHead>
            <TableHead className="hidden pr-5 text-right sm:table-cell">Zuletzt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.slice(0, 80).map((c) => (
            <TableRow key={c.key}>
              <TableCell className="pl-5 font-semibold md:pl-6">
                {c.name}
                {c.orders >= 5 && <span className="ml-2 rounded-full bg-[var(--e-peach)] px-2 py-0.5 text-[11px] font-semibold">Stammkunde</span>}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {c.email}
                <span className="tabular block text-[12px]">{c.phone}</span>
              </TableCell>
              <TableCell className="tabular">{c.plz ?? '–'}</TableCell>
              <TableCell className="tabular text-right">{c.orders}</TableCell>
              <TableCell className="tabular text-right">{formatEuro(c.revenue)}</TableCell>
              <TableCell className="tabular hidden pr-5 text-right text-muted-foreground sm:table-cell">{date.format(c.last)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {shown.length === 0 && <p className="p-8 text-center text-[14px] text-muted-foreground">Niemand gefunden.</p>}
      {shown.length > 80 && <p className="p-4 text-center text-[13px] text-muted-foreground">Die ersten 80 von {shown.length}.</p>}
    </Card>
    </Bento>
  );
}
