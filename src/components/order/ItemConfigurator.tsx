'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Picture } from '@/components/Picture';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldContent, FieldGroup, FieldLabel, FieldLegend, FieldSet, FieldTitle } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { cart, defaultConfig, unitPrice, type LineConfig } from '@/lib/cart';
import { formatEuro } from '@/lib/format';
import { DOUGHS, EXTRAS, SIZES, type DoughId, type ExtraId, type MenuItem, type SizeId } from '@/lib/menu';

/** Pizza konfigurieren: Größe, Teig, Extras, Zutaten weglassen, Hinweis. Preis rechnet live mit. */
export function ItemConfigurator(props: { item: MenuItem | null; onClose: () => void }) {
  return <Configurator key={props.item?.id ?? 'leer'} {...props} />;
}

function Configurator({ item, onClose }: { item: MenuItem | null; onClose: () => void }) {
  const [config, setConfig] = useState<LineConfig>(defaultConfig);
  const [qty, setQty] = useState(1);
  const router = useRouter();
  const id = useId();

  if (!item) return null;
  const price = unitPrice(item, config) * qty;

  const toggle = <T extends string>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const add = () => {
    cart.add(item, config, qty);
    onClose();
    toast.success(`${qty > 1 ? `${qty} × ` : ''}${item.name} liegt im Warenkorb`, {
      action: { label: 'Zur Kasse', onClick: () => router.push('/kasse/') },
    });
  };

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92svh] gap-0 overflow-hidden p-0 sm:max-w-[560px] max-sm:top-auto max-sm:bottom-0 max-sm:max-w-full max-sm:translate-y-0 max-sm:rounded-b-none">
        <div className="max-h-[calc(92svh-5.5rem)] overflow-y-auto overscroll-contain">
          {item.image && (
            <div className="relative aspect-[16/9] overflow-hidden bg-kohle">
              <Picture
                name={item.image}
                alt={`${item.name}, von oben fotografiert`}
                widths={[480, 960]}
                sizes="(max-width: 640px) 100vw, 560px"
                width={960}
                height={960}
                className="size-full object-cover"
              />
            </div>
          )}
          <div className="flex flex-col gap-7 p-5 md:p-7">
            <div>
              <DialogTitle className="display text-[2rem] leading-tight font-[600]">{item.name}</DialogTitle>
              <DialogDescription className="mt-1.5 text-[15px] text-muted-foreground">{item.desc}</DialogDescription>
            </div>
            <FieldGroup className="gap-7">
              <FieldSet>
                <FieldLegend variant="label">Größe</FieldLegend>
                <RadioGroup
                  value={config.size}
                  onValueChange={(v) => setConfig((c) => ({ ...c, size: v as SizeId }))}
                  className="grid grid-cols-2 gap-2"
                >
                  {SIZES.map((s) => (
                    <FieldLabel key={s.id} htmlFor={`${id}-size-${s.id}`}>
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>{s.label}</FieldTitle>
                          <span className="text-[13px] text-muted-foreground">
                            {s.hint}
                            {s.delta ? `, + ${formatEuro(s.delta)}` : ''}
                          </span>
                        </FieldContent>
                        <RadioGroupItem value={s.id} id={`${id}-size-${s.id}`} />
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              </FieldSet>
              <FieldSet>
                <FieldLegend variant="label">Teig</FieldLegend>
                <RadioGroup
                  value={config.dough}
                  onValueChange={(v) => setConfig((c) => ({ ...c, dough: v as DoughId }))}
                  className="grid grid-cols-2 gap-2"
                >
                  {DOUGHS.map((d) => (
                    <FieldLabel key={d.id} htmlFor={`${id}-dough-${d.id}`}>
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>{d.label}</FieldTitle>
                          <span className="text-[13px] text-muted-foreground">
                            {d.hint}
                            {d.delta ? `, + ${formatEuro(d.delta)}` : ''}
                          </span>
                        </FieldContent>
                        <RadioGroupItem value={d.id} id={`${id}-dough-${d.id}`} />
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              </FieldSet>
              <FieldSet>
                <FieldLegend variant="label">Extras</FieldLegend>
                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                  {EXTRAS.map((e) => (
                    <Field key={e.id} orientation="horizontal" className="border-b border-border py-2.5">
                      <Checkbox
                        id={`${id}-x-${e.id}`}
                        checked={config.extras.includes(e.id)}
                        onCheckedChange={() => setConfig((c) => ({ ...c, extras: toggle<ExtraId>(c.extras, e.id) }))}
                      />
                      <FieldLabel htmlFor={`${id}-x-${e.id}`} className="flex-1 font-normal">
                        {e.label}
                      </FieldLabel>
                      <span className="tabular text-[13px] text-muted-foreground">+ {formatEuro(e.price)}</span>
                    </Field>
                  ))}
                </div>
              </FieldSet>
              {item.removable.length > 0 && (
                <FieldSet>
                  <FieldLegend variant="label">Lieber ohne</FieldLegend>
                  <div className="flex flex-wrap gap-x-6 gap-y-2.5">
                    {item.removable.map((r) => (
                      <Field key={r} orientation="horizontal" className="w-auto">
                        <Checkbox
                          id={`${id}-w-${r}`}
                          checked={config.without.includes(r)}
                          onCheckedChange={() => setConfig((c) => ({ ...c, without: toggle(c.without, r) }))}
                        />
                        <FieldLabel htmlFor={`${id}-w-${r}`} className="font-normal">
                          ohne {r}
                        </FieldLabel>
                      </Field>
                    ))}
                  </div>
                </FieldSet>
              )}
              <Field>
                <FieldLabel htmlFor={`${id}-note`}>Hinweis an die Küche</FieldLabel>
                <Textarea
                  id={`${id}-note`}
                  maxLength={80}
                  placeholder="z. B. gut durchgebacken"
                  value={config.note}
                  onChange={(e) => setConfig((c) => ({ ...c, note: e.target.value }))}
                  className="min-h-16 text-base"
                />
              </Field>
            </FieldGroup>
          </div>
        </div>
        <div className="flex items-center gap-3 border-t border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-7">
          <div className="flex items-center gap-1 rounded-full border border-border p-1">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Eine weniger" onClick={() => setQty((q) => Math.max(1, q - 1))}>
              <MinusIcon />
            </Button>
            <span className="tabular w-6 text-center" aria-live="polite">
              {qty}
            </span>
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Eine mehr" onClick={() => setQty((q) => Math.min(20, q + 1))}>
              <PlusIcon />
            </Button>
          </div>
          <Button variant="brand" size="cta" className="flex-1" onClick={add}>
            Hinzufügen <span className="tabular">{formatEuro(price)}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
