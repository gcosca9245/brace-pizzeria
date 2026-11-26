'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { data } from '@/lib/data';
import { minutesToClock } from '@/lib/format';
import { useLive } from '@/lib/hooks';
import { DEFAULT_HOURS, SITE, WEEKDAYS } from '@/lib/site';

export function Footer() {
  const pathname = usePathname();
  const [settings] = useLive(() => data.getSettings());
  if (pathname.startsWith('/admin')) return null;
  const hours = settings?.hours ?? DEFAULT_HOURS;
  return (
    <footer className="dark bg-ofen text-mehl">
      <div className="mx-auto grid max-w-[1600px] gap-14 px-5 pt-24 pb-32 md:grid-cols-12 md:px-10 md:pb-16">
        <div className="md:col-span-5">
          <p className="display text-[clamp(4rem,10vw,9rem)] leading-[0.8] font-[650]">Brace</p>
          <p className="mt-6 max-w-[36ch] text-mehl/80">
            Pizzeria in {SITE.district}. Holzofen, Teig mit 48 Stunden Ruhe, Lieferung mit eigenem Fahrrad-Team.
          </p>
        </div>
        <div className="md:col-span-3">
          <h2 className="text-[13px] text-mehl/70">Öffnungszeiten</h2>
          <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-[15px]">
            {hours.map((h, i) => (
              <div key={WEEKDAYS[i]} className="contents">
                <dt className="text-mehl/80">{WEEKDAYS[i].slice(0, 2)}</dt>
                <dd className="tabular">{h.closed ? 'Ruhetag' : `${minutesToClock(h.open)}–${minutesToClock(h.close)}`}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="md:col-span-2">
          <h2 className="text-[13px] text-mehl/70">Kontakt</h2>
          <address className="mt-4 flex flex-col gap-1.5 text-[15px] not-italic">
            <span>{SITE.street}</span>
            <span>{SITE.city}</span>
            <span>{SITE.phone}</span>
            <a className="underline-offset-4 hover:underline" href={`mailto:${SITE.email}`}>
              {SITE.email}
            </a>
          </address>
        </div>
        <div className="md:col-span-2">
          <h2 className="text-[13px] text-mehl/70">Seiten</h2>
          <ul className="mt-4 flex flex-col gap-1.5 text-[15px]">
            <li><Link className="underline-offset-4 hover:underline" href="/bestellen/">Karte & Bestellen</Link></li>
            <li><Link className="underline-offset-4 hover:underline" href="/impressum/">Impressum</Link></li>
            <li><Link className="underline-offset-4 hover:underline" href="/datenschutz/">Datenschutz</Link></li>
            <li><Link className="underline-offset-4 hover:underline" href="/admin/">Küchen-Login</Link></li>
          </ul>
        </div>
        <p className="border-t border-mehl/10 pt-6 text-[13px] text-mehl/70 md:col-span-12">
          Demo-Projekt von GC OneSolution. Brace ist ein erfundenes Restaurant, Bestellungen und Zahlungen werden nur simuliert.
          Bilder und Film sind KI-generiert.
        </p>
      </div>
    </footer>
  );
}
