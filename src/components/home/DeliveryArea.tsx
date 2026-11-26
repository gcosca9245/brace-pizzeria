'use client';

import { useId, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { data } from '@/lib/data';
import { checkPlz, DEFAULT_ZONES, zoneMessage, type ZoneCheck } from '@/lib/delivery';
import { formatEuro } from '@/lib/format';
import { useLive } from '@/lib/hooks';
import { writePrefs } from '@/lib/prefs';
import { cn } from '@/lib/utils';

export function DeliveryArea() {
  const [settings] = useLive(() => data.getSettings());
  const zones = settings?.zones ?? DEFAULT_ZONES;
  const [plz, setPlz] = useState('');
  const [check, setCheck] = useState<ZoneCheck | null>(null);
  const id = useId();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = checkPlz(plz, zones);
    setCheck(r);
    if (r.ok) writePrefs({ plz, mode: 'lieferung' });
  };

  return (
    <section id="liefergebiet" aria-labelledby="liefer-h" className="bg-mehl-2 text-kohle">
      <div className="mx-auto grid max-w-[1600px] gap-16 px-5 py-24 md:grid-cols-12 md:gap-10 md:px-10 md:py-36">
        <div className="md:col-span-5">
          <h2 id="liefer-h" className="display text-[clamp(3rem,6.5vw,6.5rem)] leading-[0.9] font-[560]">
            Wohin wir liefern.
          </h2>
          <p className="mt-6 max-w-[40ch] text-[17px] leading-relaxed text-kohle/80">
            Wir fahren mit dem Lastenrad, deshalb bleibt unser Gebiet bewusst klein. Gib deine Postleitzahl ein, dann siehst du Gebühr und Lieferzeit.
          </p>
          <form onSubmit={submit} className="mt-10 flex max-w-md flex-col gap-3" noValidate>
            <label htmlFor={id} className="text-[15px] font-medium">
              Deine Postleitzahl
            </label>
            <div className="flex gap-2">
              <input
                id={id}
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                value={plz}
                onChange={(e) => setPlz(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="50823"
                aria-describedby={`${id}-r`}
                aria-invalid={check ? !check.ok : undefined}
                className="tabular h-12 min-w-0 flex-1 rounded-full border border-kohle/20 bg-mehl px-5 text-lg focus-visible:border-pomodoro focus-visible:outline-none aria-invalid:border-destructive"
              />
              <Button type="submit" variant="brand" size="cta">
                Prüfen
              </Button>
            </div>
            <div id={`${id}-r`} aria-live="polite" className="min-h-[3.5rem] text-[15px]">
              {check?.ok && (
                <p>
                  Passt. {check.zone.fee ? `${formatEuro(check.zone.fee)} Liefergebühr` : 'Lieferung kostenlos'}, Mindestbestellwert {formatEuro(check.zone.min)}, ca.{' '}
                  {check.zone.eta[0]}–{check.zone.eta[1]} Minuten.{' '}
                  <Link href="/bestellen/" className="font-medium text-pomodoro underline underline-offset-4">
                    Jetzt bestellen
                  </Link>
                </p>
              )}
              {check && !check.ok && <p className="text-destructive">{zoneMessage(check)}</p>}
            </div>
          </form>
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <table className="w-full text-left text-[15px]">
            <caption className="sr-only">Liefergebiete mit Gebühr, Mindestbestellwert und Lieferzeit</caption>
            <thead>
              <tr className="border-b border-kohle/20 text-[13px] text-kohle/70">
                <th scope="col" className="py-3 pr-4 font-normal">Gebiet</th>
                <th scope="col" className="py-3 pr-4 font-normal">Gebühr</th>
                <th scope="col" className="py-3 pr-4 font-normal max-sm:hidden">Ab</th>
                <th scope="col" className="py-3 font-normal">Zeit</th>
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr
                  key={z.id}
                  className={cn(
                    'border-b border-kohle/12 align-top transition-colors duration-300',
                    check?.ok && check.zone.id === z.id && 'bg-mehl',
                    !z.active && 'opacity-50',
                  )}
                >
                  <th scope="row" className="py-5 pr-4 font-normal">
                    <span className="display block text-[1.45rem] leading-tight font-[600]">{z.name.split(',')[0]}</span>
                    <span className="mt-1 block text-[13px] text-kohle/70">
                      {z.name.includes(',') ? z.name.split(',').slice(1).join(',').trim() + ', ' : ''}
                      {z.plz.join(', ')}
                    </span>
                  </th>
                  <td className="tabular py-5 pr-4">{z.fee ? formatEuro(z.fee) : 'frei'}</td>
                  <td className="tabular py-5 pr-4 max-sm:hidden">{formatEuro(z.min)}</td>
                  <td className="tabular py-5 whitespace-nowrap">
                    {z.eta[0]}–{z.eta[1]} Min.
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-6 text-[15px] text-kohle/75">Abholen geht aus ganz Köln, meist in 15 bis 20 Minuten.</p>
        </div>
      </div>
    </section>
  );
}
