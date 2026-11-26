'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRightIcon } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { formatEuro } from '@/lib/format';
import { cn } from '@/lib/utils';

/**
 * Schwebende Bestellleiste. Auf der Startseite erscheint sie, sobald der Bestell-Einstieg aus dem
 * ersten Bild verschwunden ist – Bestellen ist so auf jeder Scrollhöhe einen Tipp entfernt.
 */
export function CartBar() {
  const pathname = usePathname();
  const { count, subtotal } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const home = pathname === '/';

  useEffect(() => {
    if (!home) return;
    // Im Film gibt es Bestell-Einstieg und Kopfzeile; die Leiste kommt erst danach, damit sie nichts verdeckt.
    const film = document.getElementById('film');
    const on = () => setScrolled(film ? film.getBoundingClientRect().bottom < window.innerHeight * 0.6 : window.scrollY > window.innerHeight * 0.35);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [home]);

  const hidden = pathname.startsWith('/admin') || pathname.startsWith('/kasse') || pathname.startsWith('/bestellung') || pathname.startsWith('/bestellen');
  const visible = !hidden && (home ? scrolled : count > 0);
  if (hidden) return null;

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-[opacity,transform] duration-300 ease-[var(--ease-out)] md:justify-end md:px-10 md:pb-8',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0',
        // Auf dem Handy hat die Kopfzeile schon „Bestellen“; die Leiste kommt dort erst mit Inhalt im Warenkorb.
        !count && 'max-md:hidden',
      )}
    >
      <Link
        href={count ? '/kasse/' : '/bestellen/'}
        tabIndex={visible ? 0 : -1}
        className="group flex h-14 w-full max-w-md items-center gap-4 rounded-full bg-pomodoro pr-2 pl-6 text-[15px] text-[#fff8f1] shadow-[0_18px_40px_-18px_rgb(29_23_20/0.7)] transition-transform duration-150 active:scale-[0.98] md:w-auto"
      >
        {count ? (
          <>
            <span className="tabular">
              {count} {count === 1 ? 'Artikel' : 'Artikel'}
            </span>
            <span aria-hidden="true" className="h-4 w-px bg-white/30" />
            <span className="tabular font-medium">{formatEuro(subtotal)}</span>
            <span className="ml-auto flex h-10 items-center gap-2 rounded-full bg-white/12 px-4">
              Zur Kasse <ArrowRightIcon aria-hidden="true" className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </span>
          </>
        ) : (
          <>
            <span>Hunger? Heute ab 15 € liefern wir.</span>
            <span className="ml-auto flex h-10 items-center gap-2 rounded-full bg-white/12 px-4">
              Bestellen <ArrowRightIcon aria-hidden="true" className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </span>
          </>
        )}
      </Link>
    </div>
  );
}
