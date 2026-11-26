'use client';

import { useState } from 'react';
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
  if (!menu) return <Skeleton className="h-96 rounded-2xl" />;

  const toggle = async (m: MenuItem, available: boolean) => {
    const r = await data.updateMenuItem(m.id, { available });
    if (r.ok) toast(available ? `${m.name} ist wieder bestellbar.` : `${m.name} ist ausverkauft.`);
  };

  return (
    <div className="flex flex-col gap-6">
      {CATEGORIES.map((c) => {
        const items = menu.filter((m) => m.category === c.id);
        return (
          <section key={c.id} aria-labelledby={`cat-${c.id}`} className="rounded-2xl bg-card ring-1 ring-border">
            <h2 id={`cat-${c.id}`} className="px-5 pt-5 pb-2 text-[15px] font-semibold">
              {c.label} <span className="font-normal text-muted-foreground">· {items.length}</span>
            </h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5">Gericht</TableHead>
                  <TableHead className="hidden md:table-cell">Zutaten</TableHead>
                  <TableHead className="text-right">Preis</TableHead>
                  <TableHead className="text-center">Bestellbar</TableHead>
                  <TableHead className="pr-5 text-right">
                    <span className="sr-only">Bearbeiten</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((m) => (
                  <TableRow key={m.id} data-state={m.available ? undefined : 'off'} className="data-[state=off]:opacity-60">
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        {m.image ? (
                          <Picture name={m.image} widths={[480, 960]} sizes="40px" width={40} height={40} alt="" className="size-10 shrink-0 rounded-full object-cover" />
                        ) : (
                          <span className="size-10 shrink-0 rounded-full bg-secondary" aria-hidden="true" />
                        )}
                        <span className="font-medium">{m.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[420px] truncate text-muted-foreground md:table-cell">{m.desc}</TableCell>
                    <TableCell className="tabular text-right">{formatEuro(m.price)}</TableCell>
                    <TableCell className="text-center">
                      <Switch checked={m.available} onCheckedChange={(v) => toggle(m, v)} aria-label={`${m.name} bestellbar`} />
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditing(m)} aria-label={`${m.name} bearbeiten`}>
                        <PencilIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        );
      })}
      <EditDialog item={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function EditDialog({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">{item && <EditForm key={item.id} item={item} onClose={onClose} />}</DialogContent>
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
        <Button type="button" variant="outline" onClick={onClose}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={formState.isSubmitting}>
          Speichern
        </Button>
      </DialogFooter>
    </form>
  );
}
