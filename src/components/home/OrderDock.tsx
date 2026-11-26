'use client';

import { useId } from 'react';
import { LinkButton } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { data } from '@/lib/data';
import { checkPlz, zoneMessage } from '@/lib/delivery';
import { formatEuro } from '@/lib/format';
import { useLive } from '@/lib/hooks';
import { openingLine } from '@/lib/hours';
import { usePrefs, writePrefs } from '@/lib/prefs';
import { cn } from '@/lib/utils';

/** Bestell-Einstieg direkt im ersten Bild: Lieferart, PLZ-Prüfung, los. */
export function OrderDock({ className }: { className?: string }) {
  const [settings] = useLive(() => data.getSettings());
  const { mode, plz } = usePrefs();
  const id = useId();
  const setMode = (m: 'lieferung' | 'abholung') => writePrefs({ mode: m });
  const setPlz = (v: string) => writePrefs({ plz: v });
  const check = settings && plz.length === 5 ? checkPlz(plz, settings.zones) : null;
  const status = settings ? openingLine(settings.hours) : null;

  const onPlz = (v: string) => {
    const clean = v.replace(/\D/g, '').slice(0, 5);
    setPlz(clean);
  };

  return (
    <div
      className={cn(
        'w-full rounded-[1.4rem] bg-mehl/[0.07] p-1.5 ring-1 ring-mehl/15 md:w-[380px]',
        '[@media(pointer:fine)]:backdrop-blur-md',
        className,
      )}
    >
      <div className="flex flex-col gap-4 rounded-[1.05rem] bg-ofen/70 p-4 shadow-[inset_0_1px_0_rgb(244_239_231/0.08)] md:p-5">
        <p className="flex items-center gap-2 text-[13px] text-mehl/80" aria-live="polite">
          <span
            aria-hidden="true"
            className={cn('size-1.5 rounded-full', status?.open ? 'bg-glut shadow-[0_0_0_3px_rgb(233_137_74/0.2)]' : 'bg-mehl/40')}
          />
          {status?.text ?? 'Öffnungszeiten werden geladen'}
        </p>
        <ToggleGroup
          value={[mode]}
          onValueChange={(v: string[]) => {
            const next = (v[0] as 'lieferung' | 'abholung' | undefined) ?? mode;
            setMode(next);
          }}
          className="grid w-full grid-cols-2 rounded-full bg-mehl/[0.06] p-1"
          aria-label="Lieferart"
        >
          <ToggleGroupItem value="lieferung" className="h-9 rounded-full text-sm data-[pressed]:bg-mehl data-[pressed]:text-kohle">
            Liefern lassen
          </ToggleGroupItem>
          <ToggleGroupItem value="abholung" className="h-9 rounded-full text-sm data-[pressed]:bg-mehl data-[pressed]:text-kohle">
            Abholen
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="grid grid-cols-[1fr_auto] gap-2 md:grid-cols-1">
          {mode === 'lieferung' ? (
            <>
              <label htmlFor={id} className="sr-only text-[13px] text-mehl/80 md:not-sr-only">
                Liefern wir zu dir? Postleitzahl eingeben
              </label>
              <input
                id={id}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="PLZ, z. B. 50823"
                value={plz}
                onChange={(e) => onPlz(e.target.value)}
                aria-describedby={`${id}-r`}
                className="tabular h-12 min-w-0 rounded-full border border-mehl/20 bg-transparent px-5 text-base text-mehl placeholder:text-mehl/50 focus-visible:border-glut focus-visible:outline-none md:h-11 md:rounded-xl md:px-4"
              />
              <p id={`${id}-r`} className="col-span-2 text-[13px] leading-snug text-mehl/80 md:order-1 md:col-span-1 md:min-h-[2.6em]" aria-live="polite">
                {check?.ok
                  ? `${check.zone.name.split(',')[0]}: ${check.zone.fee ? formatEuro(check.zone.fee) + ' Liefergebühr' : 'Lieferung kostenlos'}, ab ${formatEuro(check.zone.min)}, ca. ${check.zone.eta[0]}–${check.zone.eta[1]} Min.`
                  : check
                    ? zoneMessage(check)
                    : 'Ehrenfeld liefern wir kostenlos.'}
              </p>
            </>
          ) : (
            <p className="text-[13px] leading-snug text-mehl/80 md:min-h-[2.6em]">Abholung an der Venloer Straße, meist in 15–20 Minuten fertig.</p>
          )}
          <LinkButton variant="brand" size="cta" className="row-start-1 md:order-2 md:row-start-auto md:mt-2 md:w-full [grid-column:2] md:[grid-column:auto]" href="/bestellen/">
            <span className="md:hidden">Bestellen</span>
            <span className="max-md:hidden">Jetzt bestellen</span>
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
