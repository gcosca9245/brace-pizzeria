'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MenuIcon, ShoppingBagIcon } from 'lucide-react';
import { Button, LinkButton } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '@/lib/cart';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/bestellen/', label: 'Karte & Bestellen' },
  { href: '/#teig', label: 'Unser Teig' },
  { href: '/#liefergebiet', label: 'Liefergebiet' },
];

export function Header() {
  const pathname = usePathname();
  const { count } = useCart();
  const [overFilm, setOverFilm] = useState(pathname === '/');
  const [open, setOpen] = useState(false);
  const over = pathname === '/' && overFilm;

  useEffect(() => {
    const film = document.getElementById('film');
    if (!film) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      setOverFilm(film.getBoundingClientRect().bottom > 64);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', on, { passive: true });
    return () => {
      window.removeEventListener('scroll', on);
      cancelAnimationFrame(raf);
    };
  }, [pathname]);

  if (pathname.startsWith('/admin')) return null;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-[background-color,color,border-color] duration-300 ease-[var(--ease-out)]',
        over ? 'border-b border-transparent text-mehl' : 'border-b border-border bg-mehl/95 text-kohle',
      )}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:rounded-md focus:bg-mehl focus:px-3 focus:py-2 focus:text-kohle">
        Zum Inhalt springen
      </a>
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-5 md:px-10">
        <Link href="/" className="display text-[1.75rem] leading-none font-[650]" aria-label="Brace, zur Startseite">
          Brace
        </Link>
        <nav aria-label="Hauptnavigation" className="ml-6 hidden items-center gap-7 text-[15px] md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="relative py-2 opacity-85 transition-opacity duration-150 hover:opacity-100 aria-[current=page]:opacity-100"
              aria-current={pathname === n.href ? 'page' : undefined}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LinkButton
            variant={over ? 'quiet' : 'brand'}
            size="cta-sm" href={count ? '/kasse/' : '/bestellen/'}
            aria-label={count ? `Warenkorb, ${count} Artikel, zur Kasse` : 'Pizza bestellen'}
          >
            <ShoppingBagIcon data-icon="inline-start" aria-hidden="true" />
            {count ? (
              <span className="tabular">
                {count} <span className="max-sm:hidden">im Warenkorb</span>
              </span>
            ) : (
              'Bestellen'
            )}
          </LinkButton>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon-cta" className="md:hidden" aria-label="Menü öffnen" />}>
              <MenuIcon aria-hidden="true" />
            </SheetTrigger>
            <SheetContent side="right" className="bg-mehl text-kohle">
              <SheetHeader>
                <SheetTitle className="display text-3xl">Brace</SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile Navigation" className="flex flex-col px-4">
                {NAV.map((n) => (
                  <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="border-b border-border py-4 text-xl">
                    {n.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
