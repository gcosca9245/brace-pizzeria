'use client';

import { useEffect, useMemo, useState } from 'react';
import { PlusIcon, ShoppingBagIcon } from 'lucide-react';
import { toast } from 'sonner';
import { CartPanel } from '@/components/order/CartPanel';
import { ItemConfigurator } from '@/components/order/ItemConfigurator';
import { Picture } from '@/components/Picture';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cart, useCart } from '@/lib/cart';
import { data } from '@/lib/data';
import { checkPlz } from '@/lib/delivery';
import { formatEuro } from '@/lib/format';
import { useLive } from '@/lib/hooks';
import { openingLine } from '@/lib/hours';
import { CATEGORIES, MENU, type Category, type MenuItem } from '@/lib/menu';
import { usePrefs } from '@/lib/prefs';
import { cn } from '@/lib/utils';

const TAG = { vegetarisch: 'vegetarisch', vegan: 'vegan', scharf: 'scharf', neu: 'neu' } as const;

export function MenuBoard() {
  const [liveMenu] = useLive(() => data.getMenu());
  // Statische Karte als Startwert: der Inhalt steht schon im HTML, Änderungen aus der Küche kommen danach.
  const menu = liveMenu ?? MENU;
  const [settings] = useLive(() => data.getSettings());
  const [open, setOpen] = useState<MenuItem | null>(null);
  const [active, setActive] = useState<Category>('pizza');
  const [sheet, setSheet] = useState(false);
  const prefs = usePrefs();
  const { count, subtotal } = useCart();

  const zoneCheck = settings && prefs.plz ? checkPlz(prefs.plz, settings.zones) : null;
  const zone = zoneCheck?.ok ? zoneCheck.zone : null;
  const status = settings ? openingLine(settings.hours) : null;

  // Scrollspy für die Kategorie-Leiste
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id.replace('k-', '') as Category);
      },
      { rootMargin: '-140px 0px -60% 0px' },
    );
    CATEGORIES.forEach((c) => {
      const el = document.getElementById(`k-${c.id}`);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [menu]);

  const grouped = useMemo(() => CATEGORIES.map((c) => ({ ...c, items: (menu ?? []).filter((m) => m.category === c.id) })), [menu]);

  const quickAdd = (item: MenuItem) => {
    cart.add(item, undefined);
    toast.success(`${item.name} liegt im Warenkorb`);
  };

  return (
    <div className="mx-auto max-w-[1600px] px-5 pt-28 pb-32 md:px-10 md:pt-36">
      <div className="grid gap-6 md:grid-cols-12 md:items-end">
        <h1 className="display text-[clamp(3.5rem,9vw,8rem)] leading-[0.86] font-[560] md:col-span-7">Karte.</h1>
        <div className="flex flex-col gap-2 text-[15px] md:col-span-5 md:pb-2">
          <p className="flex items-center gap-2">
            <span aria-hidden="true" className={cn('size-1.5 rounded-full', status?.open ? 'bg-pomodoro' : 'bg-asche')} />
            {status?.text ?? '…'}
            {status && !status.open && ', du kannst schon vorbestellen.'}
          </p>
          <p className="text-muted-foreground">
            {prefs.mode === 'abholung'
              ? 'Abholung an der Venloer Straße.'
              : zone
                ? `Lieferung nach ${prefs.plz} ${zone.name.split(',')[0]}: ${zone.fee ? formatEuro(zone.fee) : 'kostenlos'}, ca. ${zone.eta[0]}–${zone.eta[1]} Min.`
                : 'Postleitzahl gibst du an der Kasse ein.'}
          </p>
        </div>
      </div>

      <nav
        aria-label="Kategorien"
        className="sticky top-16 z-20 -mx-5 mt-12 border-b border-border bg-mehl/95 px-5 md:-mx-10 md:px-10"
      >
        <ul className="flex gap-1 overflow-x-auto py-3 [scrollbar-width:none]">
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <a
                href={`#k-${c.id}`}
                aria-current={active === c.id ? 'true' : undefined}
                className="block rounded-full px-4 py-2 text-[15px] whitespace-nowrap transition-colors duration-150 hover:bg-secondary aria-[current=true]:bg-kohle aria-[current=true]:text-mehl"
              >
                {c.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col gap-20 lg:col-span-8">
          {grouped.map((g) => (
              <section key={g.id} id={`k-${g.id}`} aria-labelledby={`h-${g.id}`} className="scroll-mt-36">
                <h2 id={`h-${g.id}`} className="display text-[2.75rem] leading-none font-[560]">
                  {g.label}
                </h2>
                <ul className={cn('mt-8 grid gap-x-10', g.id === 'pizza' ? 'md:grid-cols-2' : 'md:grid-cols-2')}>
                  {g.items.map((it) => (
                    <li key={it.id} className="border-t border-border">
                      <button
                        type="button"
                        disabled={!it.available}
                        onClick={() => (it.category === 'pizza' ? setOpen(it) : quickAdd(it))}
                        className="group grid w-full grid-cols-[1fr_auto] items-start gap-4 py-5 text-left disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <span className="flex min-w-0 gap-4">
                          {it.image && (
                            <span className="size-[88px] shrink-0 overflow-hidden rounded-2xl bg-kohle">
                              <Picture
                                name={it.image}
                                alt=""
                                widths={[480, 960]}
                                sizes="88px"
                                width={480}
                                height={480}
                                className="size-full scale-[1.12] object-cover transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.18]"
                              />
                            </span>
                          )}
                          <span className="min-w-0">
                            <span className="display block text-[1.5rem] leading-tight font-[600]">{it.name}</span>
                            <span className="mt-1 block text-[14px] leading-snug text-muted-foreground">
                              {it.available ? it.desc : 'Heute ausverkauft'}
                            </span>
                            {it.tags.length > 0 && <span className="mt-1.5 block text-[13px] text-pomodoro">{it.tags.map((t) => TAG[t]).join(', ')}</span>}
                          </span>
                        </span>
                        <span className="flex flex-col items-end gap-3">
                          <span className="tabular text-[17px]">{formatEuro(it.price)}</span>
                          <span className="sr-only">{it.category === 'pizza' ? 'anpassen und hinzufügen' : 'hinzufügen'}</span>
                          <span
                            aria-hidden="true"
                            className="flex size-10 items-center justify-center rounded-full border border-kohle/20 transition-[background-color,border-color,color] duration-150 group-hover:border-pomodoro group-hover:bg-pomodoro group-hover:text-white"
                          >
                            <PlusIcon className="size-4" />
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
        <aside aria-label="Dein Warenkorb" className="hidden lg:col-span-4 lg:block">
          <div className="sticky top-36 rounded-[1.6rem] bg-card p-6 ring-1 ring-border">
            <h2 className="display mb-5 text-3xl font-[560]">Dein Warenkorb</h2>
            <CartPanel zone={zone} mode={prefs.mode} />
          </div>
        </aside>
      </div>

      {/* Mobil: Warenkorb als Leiste + Sheet */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
          <Button variant="brand" size="cta" className="h-14 w-full justify-between pr-5 pl-6" onClick={() => setSheet(true)}>
            <span className="flex items-center gap-2">
              <ShoppingBagIcon data-icon="inline-start" aria-hidden="true" />
              Warenkorb ansehen
            </span>
            <span className="tabular">
              {count} · {formatEuro(subtotal)}
            </span>
          </Button>
        </div>
      )}
      <Sheet open={sheet} onOpenChange={setSheet}>
        <SheetContent side="bottom" className="max-h-[88svh] overflow-y-auto rounded-t-[1.6rem] bg-mehl px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <SheetHeader className="px-0">
            <SheetTitle className="display text-3xl">Dein Warenkorb</SheetTitle>
          </SheetHeader>
          <CartPanel zone={zone} mode={prefs.mode} onCheckout={() => setSheet(false)} />
        </SheetContent>
      </Sheet>
      <ItemConfigurator item={open} onClose={() => setOpen(null)} />
    </div>
  );
}
