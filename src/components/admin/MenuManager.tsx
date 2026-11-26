'use client';

import { useState } from 'react';
import { Bento, Card } from './ember';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PencilIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Picture } from '@/components/Picture';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { data } from '@/lib/data';
import { formatEuro } from '@/lib/format';
import { useLive } from '@/lib/hooks';
import { CATEGORIES, type MenuItem } from '@/lib/menu';
import { menuItemSchema, parseEuro, type MenuItemInput } from '@/lib/schemas';

export function MenuManager() {
  const [menu] = useLive(() => data.getMenu());
  const [editing, setEditing] = useState<MenuItem | null>(null);
  if (!menu) return <Skeleton className="h-96 rounded-[28px]" />;
  const off = menu.filter((m) => !m.available).length;

  const toggle = async (m: MenuItem, available: boolean) => {
    const r = await data.updateMenuItem(m.id, { available });
    if (r.ok) toast(available ? `${m.name} ist wieder bestellbar.` : `${m.name} ist ausverkauft.`);
  };

  return (
    <Bento className="xl:grid-cols-12">
      <Card lift={false} aria-label="Stand der Karte" className="flex flex-wrap items-center gap-x-10 gap-y-4 xl:col-span-12">
        <p>
          <span className="block text-[13px] font-medium text-muted-foreground">Gerichte</span>
          <span className="tabular text-[40px] leading-none font-semibold tracking-[-0.04em]">{menu.length}</span>
        </p>
        <p>
          <span className="block text-[13px] font-medium text-muted-foreground">Heute ausverkauft</span>
          <span className="tabular text-[40px] leading-none font-semibold tracking-[-0.04em]">{off}</span>
        </p>
        <p className="max-w-[46ch] text-[14px] text-muted-foreground md:ml-auto">Schalter aus heißt: Auf der Website steht das Gericht als ausverkauft. Preise und Zutaten änderst du über den Stift.</p>
      </Card>
      {CATEGORIES.map((c) => {
        const items = menu.filter((m) => m.category === c.id);
        return (
          <Card key={c.id} lift={false} aria-labelledby={`cat-${c.id}`} className={c.id === 'pizza' ? 'px-0 md:px-0 xl:col-span-12' : 'px-0 md:px-0 xl:col-span-6'}>
            <h2 id={`cat-${c.id}`} className="flex items-center gap-2 px-5 pb-2 text-[19px] font-semibold tracking-[-0.01em] md:px-6">
              {c.label} <span className="tabular grid h-7 min-w-7 place-items-center rounded-full bg-secondary px-2 text-[12px] font-semibold">{items.length}</span>
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5 md:pl-6">Gericht</TableHead>
                  <TableHead className={c.id === 'pizza' ? 'hidden md:table-cell' : 'hidden 2xl:table-cell'}>Zutaten</TableHead>
                  <TableHead className="text-right">Preis</TableHead>
                  <TableHead className="text-center">Bestellbar</TableHead>
                  <TableHead className="pr-5 text-right md:pr-6">
                    <span className="sr-only">Bearbeiten</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((m) => (
                  <TableRow key={m.id} data-state={m.available ? undefined : 'off'} className="data-[state=off]:opacity-60">
                    <TableCell className="pl-5 md:pl-6">
                      <div className="flex items-center gap-3">
                        {m.image ? (
                          <Picture name={m.image} widths={[480, 960]} sizes="40px" width={40} height={40} alt="" className="size-11 shrink-0 rounded-full object-cover" />
                        ) : (
                          <span className="size-11 shrink-0 rounded-full bg-secondary" aria-hidden="true" />
                        )}
                        <span className="font-semibold">{m.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className={cn('hidden max-w-[420px] truncate text-muted-foreground', c.id === 'pizza' ? 'md:table-cell' : '2xl:table-cell')}>{m.desc}</TableCell>
                    <TableCell className="tabular text-right">{formatEuro(m.price)}</TableCell>
                    <TableCell className="text-center">
                      <Switch checked={m.available} onCheckedChange={(v) => toggle(m, v)} aria-label={`${m.name} bestellbar`} />
                    </TableCell>
                    <TableCell className="pr-5 text-right md:pr-6">
                      <Button variant="ghost" size="icon" className="rounded-full bg-secondary hover:bg-accent" onClick={() => setEditing(m)} aria-label={`${m.name} bearbeiten`}>
                        <PencilIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        );
      })}
      <EditDialog item={editing} onClose={() => setEditing(null)} />
    </Bento>
  );
}

function EditDialog({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-[28px] sm:max-w-lg">{item && <EditForm key={item.id} item={item} onClose={onClose} />}</DialogContent>
    </Dialog>
  );
}

function EditForm({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const { register, handleSubmit, formState } = useForm<MenuItemInput>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: { name: item.name, desc: item.desc, price: (item.price / 100).toFixed(2).replace('.', ',') },
  });
  const err = formState.errors;
  const onSubmit = handleSubmit(async (v) => {
    const r = await data.updateMenuItem(item.id, { name: v.name, desc: v.desc, price: parseEuro(v.price) });
    if (!r.ok) return toast.error(r.error);
    toast(`${v.name} gespeichert.`);
    onClose();
  });
  return (
    <form onSubmit={onSubmit} noValidate>
      <DialogHeader>
        <DialogTitle>{item.name} bearbeiten</DialogTitle>
        <DialogDescription>Änderungen sind sofort auf der Website sichtbar.</DialogDescription>
      </DialogHeader>
      <FieldGroup className="mt-5">
        <Field data-invalid={!!err.name}>
          <FieldLabel htmlFor="m-name">Name</FieldLabel>
          <Input id="m-name" aria-invalid={!!err.name} {...register('name')} />
          <FieldError errors={[err.name]} />
        </Field>
        <Field data-invalid={!!err.desc}>
          <FieldLabel htmlFor="m-desc">Zutaten</FieldLabel>
          <Textarea id="m-desc" rows={3} aria-invalid={!!err.desc} {...register('desc')} />
          <FieldError errors={[err.desc]} />
        </Field>
        <Field data-invalid={!!err.price} className="max-w-40">
          <FieldLabel htmlFor="m-price">Preis in €</FieldLabel>
          <Input id="m-price" inputMode="decimal" className="tabular" aria-invalid={!!err.price} {...register('price')} />
          <FieldError errors={[err.price]} />
        </Field>
      </FieldGroup>
      <DialogFooter className="mt-6">
        <Button type="button" variant="outline" className="h-10 rounded-full" onClick={onClose}>
          Abbrechen
        </Button>
        <Button type="submit" className="h-10 rounded-full bg-foreground px-5 text-background hover:bg-foreground/85" disabled={formState.isSubmitting}>
          Speichern
        </Button>
      </DialogFooter>
    </form>
  );
}
