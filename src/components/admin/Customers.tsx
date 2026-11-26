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

const date = new Intl.DateTimeFormat('de-DE', { timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: '2-digit' });

export function Customers() {
  const [orders] = useLive(() => data.listOrders());
  const [hist] = useLive(() => data.history());
  const [q, setQ] = useState('');
  const list = useMemo(() => (orders && hist ? customers([...orders, ...hist]) : null), [orders, hist]);
  if (!list) return <Skeleton className="h-96 rounded-2xl" />;
  const needle = q.trim().toLowerCase();
  const shown = needle ? list.filter((c) => `${c.name} ${c.email} ${c.plz ?? ''}`.toLowerCase().includes(needle)) : list;
  const regulars = list.filter((c) => c.orders >= 5).length;

  return (
    <section className="rounded-2xl bg-card ring-1 ring-border">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <p className="text-[14px] text-muted-foreground">
          <b className="tabular font-semibold text-foreground">{list.length}</b> Kunden, davon <b className="tabular font-semibold text-foreground">{regulars}</b> Stammkunden (5+ Bestellungen)
        </p>
        <InputGroup className="w-full max-w-xs">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, E-Mail oder PLZ" aria-label="Kunden suchen" />
        </InputGroup>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-5">Kunde</TableHead>
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
              <TableCell className="pl-5 font-medium">
                {c.name}
                {c.orders >= 5 && <span className="ml-2 rounded-full bg-glut/20 px-2 py-0.5 text-[11px] font-medium">Stammkunde</span>}
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
    </section>
  );
}
