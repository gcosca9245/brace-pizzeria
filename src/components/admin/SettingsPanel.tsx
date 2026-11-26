'use client';

import { useState } from 'react';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { data, type Settings } from '@/lib/data';
import type { Zone } from '@/lib/delivery';
import { minutesToClock } from '@/lib/format';
import { useLive } from '@/lib/hooks';
import { WEEKDAYS } from '@/lib/site';
import { Bento, Card, ZoneMap } from './ember';

const toMin = (v: string) => {
  const [h, m] = v.split(':').map(Number);
  return h * 60 + (m || 0);
};

const zoneSchema = z.object({
  name: z.string().trim().min(2, 'Name fehlt.'),
  plz: z.array(z.string().regex(/^\d{5}$/, 'PLZ müssen fünfstellig sein.')).min(1, 'Mindestens eine PLZ.'),
  fee: z.number().min(0).max(2000),
  min: z.number().min(0).max(10000),
  eta: z.tuple([z.number().min(5), z.number().max(180)]).refine(([a, b]) => a < b, 'Lieferzeit: von muss kleiner als bis sein.'),
});

function euroInput(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',');
}

export function SettingsPanel() {
  const [saved] = useLive(() => data.getSettings());
  if (!saved) return <Skeleton className="h-96 rounded-[28px]" />;
  return <Editor saved={saved} />;
}

function Editor({ saved }: { saved: Settings }) {
  const [draft, setDraft] = useState<Settings>(() => structuredClone(saved));
  const [errors, setErrors] = useState<string[]>([]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const setDay = (i: number, patch: Partial<Settings['hours'][number]>) => setDraft({ ...draft, hours: draft.hours.map((d, j) => (j === i ? { ...d, ...patch } : d)) });
  const setZone = (i: number, patch: Partial<Zone>) => setDraft({ ...draft, zones: draft.zones.map((z, j) => (j === i ? { ...z, ...patch } : z)) });

  const save = async () => {
    const errs: string[] = [];
    draft.hours.forEach((d, i) => {
      if (!d.closed && d.close <= d.open) errs.push(`${WEEKDAYS[i]}: Schluss muss nach Öffnung liegen.`);
    });
    const seen = new Map<string, string>();
    draft.zones.forEach((z) => {
      const r = zoneSchema.safeParse(z);
      if (!r.success) errs.push(`${z.name || 'Neue Zone'}: ${r.error.issues[0].message}`);
      z.plz.forEach((p) => {
        if (seen.has(p)) errs.push(`PLZ ${p} steht in „${seen.get(p)}“ und „${z.name}“.`);
        seen.set(p, z.name);
      });
    });
    setErrors(errs);
    if (errs.length) return;
    const r = await data.saveSettings(draft);
    if (r.ok) toast('Gespeichert. Die Website nutzt ab sofort die neuen Werte.');
    else toast.error(r.error);
  };

  return (
    <Bento className="xl:grid-cols-12">
      <Card lift={false} aria-labelledby="h-hours" className="xl:col-span-5">
        <h2 id="h-hours" className="text-[19px] font-semibold tracking-[-0.01em]">
          Öffnungszeiten
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">Bestimmt die Zeitfenster an der Kasse.</p>
        <ul className="mt-5 flex flex-col divide-y divide-border">
          {draft.hours.map((d, i) => (
            <li key={i} className="flex flex-wrap items-center gap-3 py-2.5">
              <span className="w-24 text-[14px] font-medium">{WEEKDAYS[i]}</span>
              <Switch checked={!d.closed} onCheckedChange={(v) => setDay(i, { closed: !v })} aria-label={`${WEEKDAYS[i]} geöffnet`} />
              {d.closed ? (
                <span className="text-[14px] text-muted-foreground">Ruhetag</span>
              ) : (
                <span className="flex items-center gap-2">
                  <Input type="time" step={900} value={minutesToClock(d.open)} onChange={(e) => setDay(i, { open: toMin(e.target.value) })} className="tabular h-10 w-[7.75rem] rounded-full px-3" aria-label={`${WEEKDAYS[i]} ab`} />
                  <span aria-hidden="true">–</span>
                  <Input type="time" step={900} value={minutesToClock(d.close)} onChange={(e) => setDay(i, { close: toMin(e.target.value) })} className="tabular h-10 w-[7.75rem] rounded-full px-3" aria-label={`${WEEKDAYS[i]} bis`} />
                </span>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card lift={false} aria-labelledby="h-zones" className="xl:col-span-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="h-zones" className="text-[19px] font-semibold tracking-[-0.01em]">
              Liefergebiete
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">Die PLZ-Prüfung auf der Website liest genau diese Liste.</p>
          </div>
          <Button
            variant="outline"
            className="h-10 rounded-full"
            onClick={() =>
              setDraft({ ...draft, zones: [...draft.zones, { id: `z${Date.now().toString(36)}`, name: '', plz: [], fee: 490, min: 3500, eta: [50, 65], active: false }] })
            }
          >
            <PlusIcon /> Zone
          </Button>
        </div>
        <div className="relative mt-5 h-44 overflow-hidden rounded-[22px] bg-secondary">
          <ZoneMap active={draft.zones.map((z) => z.active)} />
          <p className="absolute bottom-3 left-3 rounded-full bg-card px-3 py-1.5 text-[12px] font-semibold">
            {draft.zones.filter((z) => z.active).length} von {draft.zones.length} Zonen aktiv
          </p>
        </div>
        <ul className="mt-4 flex flex-col gap-3">
          {draft.zones.map((z, i) => (
            <li key={z.id} className="rounded-[22px] bg-secondary p-4">
              <div className="flex items-center gap-3">
                <Input value={z.name} onChange={(e) => setZone(i, { name: e.target.value })} placeholder="Name der Zone" className="h-9 flex-1 bg-card font-medium" aria-label="Name der Zone" />
                <Label className="flex items-center gap-2 text-[13px]">
                  <Switch checked={z.active} onCheckedChange={(v) => setZone(i, { active: v })} />
                  Aktiv
                </Label>
                <Button variant="ghost" size="icon-sm" aria-label={`Zone ${z.name} entfernen`} onClick={() => setDraft({ ...draft, zones: draft.zones.filter((_, j) => j !== i) })}>
                  <Trash2Icon />
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-[2fr_1fr_1fr_1.3fr]">
                <label className="col-span-2 text-[12px] text-muted-foreground md:col-span-1">
                  PLZ, mit Komma getrennt
                  <Input
                    defaultValue={z.plz.join(', ')}
                    onBlur={(e) => setZone(i, { plz: e.target.value.split(/[\s,;]+/).filter(Boolean) })}
                    inputMode="numeric"
                    className="tabular mt-1 h-9 bg-card text-[14px] text-foreground"
                  />
                </label>
                <label className="text-[12px] text-muted-foreground">
                  Gebühr €
                  <Input defaultValue={euroInput(z.fee)} onBlur={(e) => setZone(i, { fee: Math.round(Number(e.target.value.replace(',', '.')) * 100) || 0 })} inputMode="decimal" className="tabular mt-1 h-9 bg-card text-[14px] text-foreground" />
                </label>
                <label className="text-[12px] text-muted-foreground">
                  Mindestwert €
                  <Input defaultValue={euroInput(z.min)} onBlur={(e) => setZone(i, { min: Math.round(Number(e.target.value.replace(',', '.')) * 100) || 0 })} inputMode="decimal" className="tabular mt-1 h-9 bg-card text-[14px] text-foreground" />
                </label>
                <label className="col-span-2 text-[12px] text-muted-foreground md:col-span-1">
                  Lieferzeit, Minuten
                  <span className="mt-1 flex items-center gap-1.5">
                    <Input type="number" value={z.eta[0]} onChange={(e) => setZone(i, { eta: [Number(e.target.value), z.eta[1]] })} className="tabular h-9 bg-card text-[14px] text-foreground" aria-label="von" />
                    –
                    <Input type="number" value={z.eta[1]} onChange={(e) => setZone(i, { eta: [z.eta[0], Number(e.target.value)] })} className="tabular h-9 bg-card text-[14px] text-foreground" aria-label="bis" />
                  </span>
                </label>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <div className="sticky bottom-24 z-10 md:bottom-4 flex flex-wrap items-center justify-end gap-3 xl:col-span-12">
        {errors.length > 0 && (
          <ul role="alert" className="mr-auto rounded-[20px] bg-[var(--e-down-bg)] px-4 py-2.5 text-[14px] font-medium text-[var(--e-down)]">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        <Button variant="outline" className="h-11 rounded-full bg-card px-5" disabled={!dirty} onClick={() => setDraft(structuredClone(saved))}>
          Verwerfen
        </Button>
        <Button className="h-11 rounded-full px-6 font-semibold" disabled={!dirty} onClick={save}>
          Speichern
        </Button>
      </div>
    </Bento>
  );
}
