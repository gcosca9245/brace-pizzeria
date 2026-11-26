'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PlusIcon } from 'lucide-react';
import { ItemConfigurator } from '@/components/order/ItemConfigurator';
import { Picture } from '@/components/Picture';
import { BlurFade } from '@/components/ui/blur-fade';
import { Button } from '@/components/ui/button';
import { data } from '@/lib/data';
import { formatEuro } from '@/lib/format';
import { useLive } from '@/lib/hooks';
import { MENU, type MenuItem } from '@/lib/menu';

const TAG_LABEL = { vegetarisch: 'vegetarisch', vegan: 'vegan', scharf: 'scharf', neu: 'neu auf der Karte' } as const;

/** Editoriale Auswahl: eine Pizza groß, der Rest als ruhige Liste mit Preisen. */
export function SignatureMenu() {
  const [menu] = useLive(() => data.getMenu());
  const [open, setOpen] = useState<MenuItem | null>(null);
  const pizzas = (menu ?? MENU).filter((m) => m.category === 'pizza');
  const [feature, ...rest] = pizzas;

  return (
    <section id="karte" aria-labelledby="karte-h" className="bg-mehl text-kohle">
      <div className="mx-auto max-w-[1600px] px-5 py-24 md:px-10 md:py-36">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <h2 id="karte-h" className="display text-[clamp(3.25rem,8vw,8.5rem)] leading-[0.88] font-[560] md:col-span-8">
            Heute aus dem Ofen.
          </h2>
          <div className="flex flex-col gap-5 md:col-span-4 md:pb-3">
            <p className="max-w-[40ch] text-[17px] leading-relaxed text-kohle/80">
              Acht Pizzen, jede Woche dieselben, dazu ein paar Antipasti und zwei Dolci. Jede Pizza lässt sich anpassen.
            </p>
            <Link href="/bestellen/" className="w-fit text-[15px] font-medium underline decoration-kohle/30 underline-offset-[6px] transition-colors hover:decoration-kohle">
              Ganze Karte mit Getränken
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-12 md:mt-24 md:grid-cols-12 md:gap-x-10">
          {feature && (
            <article className="md:col-span-7">
              <BlurFade inView offset={16} blur="6px" duration={0.6}>
                <div className="group relative overflow-hidden rounded-[1.75rem] bg-kohle">
                  <Picture
                    name={feature.image!}
                    alt={`${feature.name} von oben, frisch aus dem Holzofen`}
                    widths={[480, 960]}
                    sizes="(max-width: 768px) 100vw, 56vw"
                    width={960}
                    height={960}
                    className="aspect-square w-full object-cover transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.025]"
                  />
                </div>
              </BlurFade>
              <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <h3 className="display text-[2.5rem] leading-none font-[600]">{feature.name}</h3>
                  <p className="mt-2 max-w-[44ch] text-[15px] text-kohle/75">{feature.desc}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="tabular text-xl">{formatEuro(feature.price)}</span>
                  <Button variant="brand" size="cta" onClick={() => setOpen(feature)} disabled={!feature.available}>
                    {feature.available ? 'Auswählen' : 'Ausverkauft'}
                  </Button>
                </div>
              </div>
            </article>
          )}

          <ul className="flex flex-col md:col-span-5 md:mt-28" aria-label="Weitere Pizzen">
            {rest.map((p) => (
              <li key={p.id} className="border-t border-kohle/12 last:border-b">
                <button
                  type="button"
                  onClick={() => setOpen(p)}
                  disabled={!p.available}
                  className="group grid w-full grid-cols-[64px_1fr_auto] items-center gap-4 py-4 text-left transition-colors duration-150 disabled:opacity-50 md:grid-cols-[76px_1fr_auto] md:gap-5"
                >
                  <span className="overflow-hidden rounded-full bg-kohle">
                    <Picture
                      name={p.image!}
                      alt=""
                      widths={[480, 960]}
                      sizes="76px"
                      width={480}
                      height={480}
                      className="aspect-square w-full scale-[1.18] object-cover transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.24]"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="display block text-[1.55rem] leading-tight font-[600]">{p.name}</span>
                    <span className="mt-0.5 block truncate text-[14px] text-kohle/70">
                      {p.available ? p.desc : 'Heute ausverkauft'}
                    </span>
                    {p.tags.length > 0 && (
                      <span className="mt-1 block text-[13px] text-pomodoro">{p.tags.map((t) => TAG_LABEL[t]).join(', ')}</span>
                    )}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="tabular text-[17px]">{formatEuro(p.price)}<span className="sr-only">, auswählen</span></span>
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
        </div>
      </div>
      <ItemConfigurator item={open} onClose={() => setOpen(null)} />
    </section>
  );
}
