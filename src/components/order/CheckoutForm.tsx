'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCardIcon, LockIcon } from 'lucide-react';
import { CartPanel } from '@/components/order/CartPanel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, LinkButton } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet, FieldTitle } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cart, describeConfig, useCart } from '@/lib/cart';
import { data } from '@/lib/data';
import { checkPlz, zoneMessage } from '@/lib/delivery';
import { formatEuro } from '@/lib/format';
import { useLive } from '@/lib/hooks';
import { buildSlots, describeWhen } from '@/lib/hours';
import { readPrefs, writePrefs } from '@/lib/prefs';
import { checkoutSchema, type CheckoutInput } from '@/lib/schemas';

/** Geplante Ankunft: gewähltes Zeitfenster oder jetzt plus Lieferzeit. */
function etaFor(slot: { dayOffset: number; minutes: number } | undefined, etaMin: number) {
  if (!slot) return Date.now() + etaMin * 60_000;
  const d = new Date();
  d.setDate(d.getDate() + slot.dayOffset);
  d.setHours(Math.floor(slot.minutes / 60), slot.minutes % 60, 0, 0);
  return d.getTime();
}

const PAYMENTS = [
  { id: 'karte', title: 'Karte', hint: 'Visa, Mastercard, Apple Pay (Demo)' },
  { id: 'paypal', title: 'PayPal', hint: 'Weiterleitung wird simuliert' },
  { id: 'bar', title: 'Bar', hint: 'Bei Lieferung oder Abholung' },
] as const;

export function CheckoutForm() {
  const router = useRouter();
  const { lines, subtotal, count } = useCart();
  const [settings] = useLive(() => data.getSettings());
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    mode: 'onTouched',
    defaultValues: { mode: 'lieferung', name: '', email: '', phone: '', street: '', plz: '', city: 'Köln', floor: '', note: '', when: '', payment: 'karte', agb: false },
  });
  const { control, register, handleSubmit, setValue, setError, formState } = form;
  const mode = useWatch({ control, name: 'mode' });
  const plz = useWatch({ control, name: 'plz' });
  const when = useWatch({ control, name: 'when' });

  useEffect(() => {
    const p = readPrefs();
    setValue('mode', p.mode);
    if (p.plz) setValue('plz', p.plz);
  }, [setValue]);

  const zoneCheck = settings && /^\d{5}$/.test(plz) ? checkPlz(plz, settings.zones) : null;
  const zone = zoneCheck?.ok ? zoneCheck.zone : null;
  const slotInfo = settings ? buildSlots(settings.hours, mode === 'lieferung' ? (zone?.eta[1] ?? 45) : 20) : null;

  // Zeit vorbelegen: „so schnell wie möglich“, wenn offen, sonst erster freier Termin
  useEffect(() => {
    if (!slotInfo) return;
    const valid = when === 'asap' ? slotInfo.asap : slotInfo.slots.some((s) => s.value === when);
    if (!valid) setValue('when', slotInfo.asap ? 'asap' : (slotInfo.slots[0]?.value ?? ''));
  }, [slotInfo, when, setValue]);

  const fee = mode === 'lieferung' && zone ? zone.fee : 0;
  const total = subtotal + fee;

  const onSubmit = handleSubmit(async (v) => {
    setServerError(null);
    if (!lines.length) return setServerError('Dein Warenkorb ist leer.');
    if (v.mode === 'lieferung') {
      const r = checkPlz(v.plz, settings!.zones);
      if (!r.ok) return setError('plz', { message: zoneMessage(r)! }, { shouldFocus: true });
      if (subtotal < r.zone.min)
        return setServerError(`Für ${r.zone.name.split(',')[0]} liegt der Mindestbestellwert bei ${formatEuro(r.zone.min)}. Es fehlen noch ${formatEuro(r.zone.min - subtotal)}.`);
    }
    const slots = slotInfo?.slots ?? [];
    const slot = slots.find((s) => s.value === v.when);
    const etaMin = v.mode === 'lieferung' ? (zone?.eta[1] ?? 45) : 20;
    const etaAt = etaFor(slot, etaMin);
    const res = await data.placeOrder({
      mode: v.mode,
      lines: lines.map((l) => ({ itemId: l.itemId, name: l.name, qty: l.qty, unit: l.unit, details: describeConfig(l.config) })),
      subtotal,
      fee,
      total,
      customer: { name: v.name, email: v.email, phone: v.phone },
      address: v.mode === 'lieferung' ? { street: v.street, plz: v.plz, city: v.city, floor: v.floor, zoneId: zone!.id } : undefined,
      note: v.note,
      when: { value: v.when, label: describeWhen(v.when, slots) },
      etaAt,
      payment: { method: v.payment },
    });
    if (!res.ok) return setServerError(res.error);
    writePrefs({ mode: v.mode, plz: v.plz });
    cart.clear();
    router.push(`/bestellung/?id=${res.data.id}`);
  });

  if (!count)
    return (
      <div className="mx-auto flex max-w-xl flex-col items-start gap-6 px-5 pt-36 pb-40">
        <h1 className="display text-6xl font-[560]">Kasse.</h1>
        <p className="text-lg text-muted-foreground">Dein Warenkorb ist leer. Such dir zuerst etwas aus.</p>
        <LinkButton variant="brand" size="cta" href="/bestellen/">
          Zur Karte
        </LinkButton>
      </div>
    );

  const err = formState.errors;
  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-[1600px] px-5 pt-28 pb-24 md:px-10 md:pt-36">
      <h1 className="display text-[clamp(3.5rem,8vw,7rem)] leading-[0.86] font-[560]">Kasse.</h1>
      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-14">
        <FieldGroup className="gap-12 lg:col-span-7">
          <FieldSet>
            <FieldLegend className="display text-2xl font-[600]">Wie bekommst du sie?</FieldLegend>
            <Controller
              control={control}
              name="mode"
              render={({ field }) => (
                <ToggleGroup
                  value={[field.value]}
                  onValueChange={(v: string[]) => v[0] && field.onChange(v[0])}
                  className="grid w-full max-w-md grid-cols-2 rounded-full bg-secondary p-1"
                  aria-label="Lieferart"
                >
                  <ToggleGroupItem value="lieferung" className="h-11 rounded-full text-[15px] data-[pressed]:bg-kohle data-[pressed]:text-mehl">
                    Lieferung
                  </ToggleGroupItem>
                  <ToggleGroupItem value="abholung" className="h-11 rounded-full text-[15px] data-[pressed]:bg-kohle data-[pressed]:text-mehl">
                    Abholung
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            />
          </FieldSet>

          {mode === 'lieferung' && (
            <FieldSet>
              <FieldLegend className="display text-2xl font-[600]">Lieferadresse</FieldLegend>
              <FieldGroup className="grid gap-5 sm:grid-cols-6">
                <Field data-invalid={!!err.street} className="sm:col-span-6">
                  <FieldLabel htmlFor="street">Straße und Hausnummer</FieldLabel>
                  <Input id="street" autoComplete="street-address" aria-invalid={!!err.street} className="h-11 text-base" {...register('street')} />
                  <FieldError errors={[err.street]} />
                </Field>
                <Field data-invalid={!!err.plz} className="sm:col-span-2">
                  <FieldLabel htmlFor="plz">PLZ</FieldLabel>
                  <Input
                    id="plz"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    maxLength={5}
                    aria-invalid={!!err.plz}
                    aria-describedby="plz-zone"
                    className="tabular h-11 text-base"
                    {...register('plz', { setValueAs: (v: string) => v.replace(/\D/g, '').slice(0, 5) })}
                  />
                  <FieldError errors={[err.plz]} />
                </Field>
                <Field data-invalid={!!err.city} className="sm:col-span-4">
                  <FieldLabel htmlFor="city">Ort</FieldLabel>
                  <Input id="city" autoComplete="address-level2" aria-invalid={!!err.city} className="h-11 text-base" {...register('city')} />
                  <FieldError errors={[err.city]} />
                </Field>
                <p id="plz-zone" aria-live="polite" className="text-[14px] sm:col-span-6">
                  {zoneCheck?.ok
                    ? `Wir liefern nach ${zoneCheck.zone.name.split(',')[0]}: ${zoneCheck.zone.fee ? formatEuro(zoneCheck.zone.fee) : 'kostenlos'}, ab ${formatEuro(zoneCheck.zone.min)}, ca. ${zoneCheck.zone.eta[0]}–${zoneCheck.zone.eta[1]} Minuten.`
                    : zoneCheck
                      ? <span className="text-destructive">{zoneMessage(zoneCheck)}</span>
                      : <span className="text-muted-foreground">Wir prüfen dein Liefergebiet, sobald die PLZ vollständig ist.</span>}
                </p>
                <Field className="sm:col-span-6">
                  <FieldLabel htmlFor="floor">Etage, Klingel, Hinterhof (optional)</FieldLabel>
                  <Input id="floor" autoComplete="address-line2" className="h-11 text-base" {...register('floor')} />
                </Field>
              </FieldGroup>
            </FieldSet>
          )}

          <FieldSet>
            <FieldLegend className="display text-2xl font-[600]">Wann?</FieldLegend>
            <Controller
              control={control}
              name="when"
              render={({ field }) => {
                const items: Record<string, string> = {};
                if (slotInfo?.asap) items.asap = mode === 'lieferung' ? 'So schnell wie möglich' : 'So schnell wie möglich (ca. 20 Min.)';
                slotInfo?.slots.forEach((s) => (items[s.value] = s.label));
                return (
                  <Field data-invalid={!!err.when} className="max-w-md">
                    <FieldLabel htmlFor="when">{mode === 'lieferung' ? 'Lieferzeit' : 'Abholzeit'}</FieldLabel>
                    <Select items={items} value={field.value || null} onValueChange={(v) => field.onChange(v ?? '')}>
                      <SelectTrigger id="when" className="h-11 w-full text-base" aria-invalid={!!err.when}>
                        <SelectValue placeholder="Zeit wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {Object.entries(items).map(([v, l]) => (
                            <SelectItem key={v} value={v}>
                              {l}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {slotInfo && !slotInfo.asap && <FieldDescription>Gerade geschlossen. Du bestellst vor, wir backen zur gewählten Zeit.</FieldDescription>}
                    <FieldError errors={[err.when]} />
                  </Field>
                );
              }}
            />
          </FieldSet>

          <FieldSet>
            <FieldLegend className="display text-2xl font-[600]">Kontakt</FieldLegend>
            <FieldGroup className="grid gap-5 sm:grid-cols-2">
              <Field data-invalid={!!err.name} className="sm:col-span-2">
                <FieldLabel htmlFor="name">Name</FieldLabel>
                <Input id="name" autoComplete="name" aria-invalid={!!err.name} className="h-11 text-base" {...register('name')} />
                <FieldError errors={[err.name]} />
              </Field>
              <Field data-invalid={!!err.email}>
                <FieldLabel htmlFor="email">E-Mail</FieldLabel>
                <Input id="email" type="email" spellCheck={false} autoComplete="email" aria-invalid={!!err.email} className="h-11 text-base" {...register('email')} />
                <FieldError errors={[err.email]} />
              </Field>
              <Field data-invalid={!!err.phone}>
                <FieldLabel htmlFor="phone">Telefon, für Rückfragen der Fahrer</FieldLabel>
                <Input id="phone" type="tel" autoComplete="tel" aria-invalid={!!err.phone} className="h-11 text-base" {...register('phone')} />
                <FieldError errors={[err.phone]} />
              </Field>
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="note">Anmerkung (optional)</FieldLabel>
                <Textarea id="note" maxLength={240} className="min-h-20 text-base" {...register('note')} />
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSet>
            <FieldLegend className="display text-2xl font-[600]">Bezahlen</FieldLegend>
            <Controller
              control={control}
              name="payment"
              render={({ field }) => (
                <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-2 sm:grid-cols-3">
                  {PAYMENTS.map((p) => (
                    <FieldLabel key={p.id} htmlFor={`pay-${p.id}`}>
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>{p.title}</FieldTitle>
                          <span className="text-[13px] text-muted-foreground">{p.hint}</span>
                        </FieldContent>
                        <RadioGroupItem value={p.id} id={`pay-${p.id}`} />
                      </Field>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              )}
            />
            <p className="mt-3 flex items-center gap-2 text-[13px] text-muted-foreground">
              <LockIcon className="size-3.5" aria-hidden="true" /> Demo: Es wird nichts belastet und keine Kartendaten abgefragt.
            </p>
          </FieldSet>
        </FieldGroup>

        <aside className="lg:col-span-5">
          <div className="sticky top-24 flex flex-col gap-6 rounded-[1.6rem] bg-card p-6 ring-1 ring-border md:p-8">
            <h2 className="display text-3xl font-[560]">Deine Bestellung</h2>
            <CartPanel zone={zone} mode={mode} compact />
            <Controller
              control={control}
              name="agb"
              render={({ field }) => (
                <Field orientation="horizontal" data-invalid={!!err.agb}>
                  <Checkbox id="agb" checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} aria-invalid={!!err.agb} />
                  <FieldContent>
                    <FieldLabel htmlFor="agb" className="font-normal">
                      Ich habe die Demo-Bedingungen und die Datenschutzhinweise gelesen.
                    </FieldLabel>
                    <FieldError errors={[err.agb]} />
                  </FieldContent>
                </Field>
              )}
            />
            {serverError && (
              <Alert variant="destructive">
                <AlertTitle>Das hat nicht geklappt</AlertTitle>
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" variant="brand" size="cta" className="h-14 w-full text-base" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? (
                <>
                  <Spinner data-icon="inline-start" /> Zahlung wird bestätigt
                </>
              ) : (
                <>
                  <CreditCardIcon data-icon="inline-start" aria-hidden="true" />
                  Kostenpflichtig bestellen <span className="tabular">{formatEuro(total)}</span>
                </>
              )}
            </Button>
          </div>
        </aside>
      </div>
    </form>
  );
}
