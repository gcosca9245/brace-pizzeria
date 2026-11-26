'use client';

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { animate, motion, useInView, useReducedMotion, type Variants } from 'motion/react';
import { ArrowDownRightIcon, ArrowUpRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/* Bausteine des Küchen-Dashboards: Bento-Karten, Deltas, Zähler, Tacho, Gebietskarte. */

export const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } } };
export const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 30 } },
};

/** Bento-Grid mit gestaffeltem Auftritt. */
export function Bento({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.div initial="hidden" animate="show" variants={stagger} className={cn('grid gap-4', className)}>
      {children}
    </motion.div>
  );
}

type CardProps = Omit<ComponentProps<typeof motion.section>, 'children'> & { children?: ReactNode; tone?: 'white' | 'accent' | 'dark'; lift?: boolean };

/** Karte: weiß auf Fläche, sehr runde Ecken, kein Schatten – Tiefe nur über Kontrast. */
export function Card({ className, children, tone = 'white', lift = true, ...rest }: CardProps) {
  return (
    <motion.section
      variants={rise}
      whileHover={lift ? { y: -4, transition: { type: 'spring', stiffness: 400, damping: 28 } } : undefined}
      className={cn(
        'relative min-w-0 rounded-[28px] p-5 md:p-6',
        tone === 'white' && 'bg-card text-card-foreground',
        tone === 'accent' && 'bg-[var(--e-accent)] text-white',
        tone === 'dark' && 'bg-[var(--e-pop)] text-white',
        className,
      )}
      {...rest}
    >
      {children}
    </motion.section>
  );
}

export function CardTitle({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} className={cn('text-[19px] leading-tight font-semibold tracking-[-0.01em]', className)}>
      {children}
    </h2>
  );
}

/** Runder Icon-Knopf wie in der Vorlage (weiß auf Fläche, oder dunkel). */
export function RoundButton({ className, dark, ...rest }: ComponentProps<'button'> & { dark?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'relative inline-grid size-11 shrink-0 place-items-center rounded-full transition-[background-color,transform] duration-150 ease-out active:scale-[0.96] [&_svg]:size-[18px]',
        dark ? 'bg-[var(--e-ink)] text-[var(--e-canvas)] hover:opacity-90' : 'bg-secondary text-foreground hover:bg-accent',
        className,
      )}
      {...rest}
    />
  );
}

/** +12 % / −5 % als Pille. */
export function Delta({ now, before, className }: { now: number; before: number; className?: string }) {
  if (!before) return <span className={cn('inline-flex h-6 items-center rounded-full bg-secondary px-2 text-[12px] font-semibold text-muted-foreground', className)}>neu</span>;
  const d = Math.round(((now - before) / before) * 100);
  const up = d >= 0;
  return (
    <span
      className={cn(
        'tabular inline-flex h-6 items-center gap-0.5 rounded-full px-2 text-[12px] font-semibold',
        up ? 'bg-[var(--e-up-bg)] text-[var(--e-up)]' : 'bg-[var(--e-down-bg)] text-[var(--e-down)]',
        className,
      )}
    >
      {up ? <ArrowUpRightIcon className="size-3" aria-hidden="true" /> : <ArrowDownRightIcon className="size-3" aria-hidden="true" />}
      {up ? '+' : '−'}
      {Math.abs(d)} %<span className="sr-only"> zum Vorwochentag</span>
    </span>
  );
}

const nf = (d: number) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });

/** Zählt einmal beim Erscheinen hoch; bei „Bewegung reduzieren“ sofort der Endwert. */
export function Ticker({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const shown = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fmt = nf(decimals);
    if (reduced) {
      shown.current = value;
      el.textContent = fmt.format(value);
      return;
    }
    if (!inView) return;
    // Immer vom gerade sichtbaren Wert aus weiterzählen – auch wenn neue Daten mitten hinein kommen.
    const c = animate(shown.current, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        shown.current = v;
        el.textContent = fmt.format(v);
      },
      onComplete: () => {
        shown.current = value;
        el.textContent = fmt.format(value);
      },
    });
    return () => c.stop();
  }, [value, inView, reduced, decimals]);
  return (
    <span ref={ref} className={cn('tabular', className)}>
      {nf(decimals).format(reduced ? value : 0)}
    </span>
  );
}

/** Halbkreis-Tacho mit Nadel. `value` 0..1 (darf über 1 gehen, die Nadel stoppt am Ende). */
export function Gauge({ value, label }: { value: number; label: string }) {
  const reduced = useReducedMotion();
  const [anim, setAnim] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const c = animate(0, value, { duration: 1.4, ease: [0.16, 1, 0.3, 1], onUpdate: setAnim });
    return () => c.stop();
  }, [value, reduced]);
  const p = Math.max(0, Math.min(1, reduced ? value : anim));
  const R = 86;
  const C = Math.PI * R;
  const a = Math.PI * (1 - p); // 180° → 0°
  const tx = 110 + Math.cos(a) * 60;
  const ty = 104 - Math.sin(a) * 60;
  const px = Math.sin(a) * 9;
  const py = Math.cos(a) * 9;
  return (
    <svg viewBox="0 0 220 118" className="w-full max-w-[260px]" role="img" aria-label={label}>
      <defs>
        <linearGradient id="g-arc" x1="0" x2="1">
          <stop offset="0" stopColor="var(--e-accent)" stopOpacity="0.75" />
          <stop offset="1" stopColor="var(--e-accent)" />
        </linearGradient>
      </defs>
      <path d="M24 104 A86 86 0 0 1 196 104" fill="none" stroke="var(--secondary)" strokeWidth="30" />
      <path d="M24 104 A86 86 0 0 1 196 104" fill="none" stroke="url(#g-arc)" strokeWidth="30" strokeDasharray={`${C * p} ${C}`} />
      {/* Nadel vom Mittelpunkt zur Skala */}
      <path d={`M${tx} ${ty} L${110 + px} ${104 + py} L${110 - px} ${104 - py} Z`} fill="var(--e-ink)" strokeLinejoin="round" />
      <circle cx="110" cy="104" r="9" fill="var(--e-ink)" />
      <circle cx="110" cy="104" r="3.5" fill="var(--card)" />
    </svg>
  );
}

/** Stilisierte Karte des Liefergebiets (keine Kacheln von außen): Straßenraster + Zonen um Ehrenfeld. */
export function ZoneMap({ active, className }: { active: boolean[]; className?: string }) {
  const zones = [
    'M70 18 L196 10 L250 70 L238 168 L150 196 L52 170 L28 92 Z',
    'M96 48 L176 42 L212 84 L204 140 L150 160 L86 144 L66 96 Z',
    'M118 74 L160 70 L180 98 L172 126 L140 134 L108 120 L100 96 Z',
  ];
  return (
    <svg viewBox="0 0 280 210" className={cn('h-full w-full', className)} aria-hidden="true">
      <g stroke="var(--border)" strokeWidth="1.5" fill="none">
        <path d="M0 40 L280 58 M0 118 L280 96 M0 176 L280 188 M60 0 L82 210 M150 0 L132 210 M226 0 L248 210" />
        <path d="M0 80 C60 70 120 130 280 140" strokeWidth="6" stroke="var(--secondary)" />
        <path d="M20 0 C90 60 120 150 110 210" strokeWidth="4" stroke="var(--secondary)" />
      </g>
      {zones.map((d, i) =>
        active[2 - i] === false ? null : (
          <path key={i} d={d} fill="var(--e-accent)" fillOpacity={[0.07, 0.12, 0.2][i]} stroke="var(--e-accent)" strokeOpacity="0.35" strokeDasharray={i === 0 ? '4 5' : undefined} />
        ),
      )}
      <circle cx="140" cy="102" r="18" fill="var(--e-accent)" fillOpacity="0.18" />
      <circle cx="140" cy="102" r="7" fill="var(--e-accent)" stroke="white" strokeWidth="3" />
    </svg>
  );
}
