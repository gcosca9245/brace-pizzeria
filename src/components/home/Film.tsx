'use client';

import { useEffect, useRef, useState } from 'react';
import { LinkButton } from '@/components/ui/button';
import { OrderDock } from '@/components/home/OrderDock';
import { CHAPTERS, filmSource, posterUrl } from '@/lib/film';
import { FrameSequence } from '@/lib/frame-sequence';
import { useReducedMotion } from '@/lib/hooks';
import { asset } from '@/lib/asset';
import { cn } from '@/lib/utils';

const COPY = [
  {
    title: 'Belegen.',
    text: 'San-Marzano-Tomaten, die wir selbst passieren. Fior di Latte aus Agerola, von Hand gezupft. Fünf Blätter Basilikum, nicht mehr.',
  },
  {
    title: 'Ofen.',
    text: 'Buchenholz, 485 Grad am Boden. Neunzig Sekunden, einmal gedreht. Der Rand geht auf und bekommt seine dunklen Flecken.',
  },
  {
    title: 'Schneiden.',
    text: 'Acht Stücke, direkt in die Box. Bei dir ist sie in rund 35 Minuten, noch so warm, dass der Käse Fäden zieht.',
  },
] as const;

/**
 * Der Scrollfilm: Teig → Belegen → Ofen → Schneiden. Ein Canvas, das komprimierte Frames
 * streamt und nur wenige dekodiert hält (siehe FrameSequence). Eine GSAP-Timeline steuert
 * Film, Kapiteltexte und Fortschrittsleiste gemeinsam, damit alles exakt synchron bleibt.
 */
export function Film() {
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = section.current;
    const cv = canvas.current;
    if (!el || !cv || reduced) return;
    const src = filmSource(cv.clientWidth, cv.clientHeight);
    const seq = new FrameSequence({
      urlFor: src.urlFor,
      count: src.count,
      frameWidth: src.frameWidth,
      frameHeight: src.frameHeight,
      focusX: src.variant === 'p640' ? 0.5 : 0.62,
      focusY: 0.5,
      onReady: () => setReady(true),
    });
    seq.attach(cv);
    const ro = new ResizeObserver(() => seq.resize());
    ro.observe(cv);

    // Bytes erst laden, wenn die Startseite steht (LCP ist das Poster).
    const start = () => seq.load();
    const hasIdle = typeof window.requestIdleCallback === 'function';
    const idle = hasIdle ? window.requestIdleCallback(start, { timeout: 1500 }) : setTimeout(start, 600);

    // GSAP erst nachladen, wenn die Seite steht – hält das Start-JS klein.
    let ctx: { revert: () => void } | null = null;
    let cancelled = false;
    void import('@/lib/gsap').then(({ getGsap }) => {
      if (cancelled) return;
      const { gsap, ScrollTrigger } = getGsap();
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      const q = gsap.utils.selector(el);
      ctx = gsap.context(() => {
        // Film: ungeglätteter Scrollfortschritt; die Dämpfung macht der Player selbst pro Bild.
        const film = ScrollTrigger.create({
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          invalidateOnRefresh: true,
          onUpdate: (self) => seq.setProgress(self.progress),
          onRefresh: (self) => seq.setProgress(self.progress),
        });
        seq.setProgress(film.progress);
        // Texte und Leiste: gleiche Strecke, leicht nachgezogen wie der Film
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: coarse ? 0.25 : true, invalidateOnRefresh: true },
        });
        // Intro raus
        tl.to(q('[data-intro]'), { autoAlpha: 0, y: -40, duration: 0.05, ease: 'power1.in' }, 0.015);
        tl.to(q('[data-shade]'), { opacity: 0.55, duration: 0.05 }, 0.02);
        // Kapitel
        CHAPTERS.forEach((c, i) => {
          const cap = q(`[data-chapter="${i}"]`);
          const inAt = c.from + (i === 0 ? 0.05 : 0.02);
          tl.fromTo(cap, { autoAlpha: 0, y: 48 }, { autoAlpha: 1, y: 0, duration: 0.04, ease: 'power2.out' }, inAt);
          tl.to(cap, { autoAlpha: 0, y: -36, duration: 0.035, ease: 'power2.in' }, c.to - (i === 2 ? 0.1 : 0.05));
          tl.fromTo(q(`[data-bar="${i}"]`), { scaleX: 0 }, { scaleX: 1, duration: c.to - c.from }, c.from);
        });
        // Abschluss
        tl.fromTo(q('[data-outro]'), { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.05, ease: 'power2.out' }, 0.93);
        tl.fromTo(q('[data-rail]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.03 }, 0.03);
        tl.to(q('[data-rail]'), { autoAlpha: 0, duration: 0.03 }, 0.95);
        tl.set({}, {}, 1); // Timeline-Länge exakt 1
      }, el);
      ScrollTrigger.refresh();
    });

    return () => {
      cancelled = true;
      ctx?.revert();
      ro.disconnect();
      if (hasIdle) window.cancelIdleCallback(idle as number);
      else clearTimeout(idle);
      seq.dispose();
    };
  }, [reduced]);

  if (reduced) return <StaticFilm />;

  return (
    <section
      ref={section}
      id="film"
      aria-label="Wie eine Brace-Pizza entsteht"
      className="dark relative h-[560svh] bg-ofen text-mehl max-md:h-[460svh]"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Poster = LCP; das Canvas legt sich darüber, sobald der erste Frame dekodiert ist. */}
        <picture>
          <source media="(max-aspect-ratio: 4/5)" type="image/avif" srcSet={posterUrl('p640', 'avif')} />
          <source media="(max-aspect-ratio: 4/5)" srcSet={posterUrl('p640', 'webp')} />
          <source type="image/avif" srcSet={posterUrl('d1920', 'avif')} />
          <img
            src={posterUrl('d1920', 'webp')}
            alt=""
            width={1920}
            height={1080}
            fetchPriority="high"
            className="absolute inset-0 size-full object-cover object-[62%_50%] [@media(max-aspect-ratio:4/5)]:object-center"
          />
        </picture>
        <canvas
          ref={canvas}
          aria-hidden="true"
          className={cn('absolute inset-0 size-full transition-opacity duration-500', ready ? 'opacity-100' : 'opacity-0')}
        />
        {/* Ruhige Abdunklung links unten für Lesbarkeit – kein Farbverlauf als Deko */}
        <div
          data-shade
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_0%_100%,rgb(15_12_10/0.85),transparent_60%)] opacity-90 max-md:bg-[linear-gradient(to_top,rgb(15_12_10/0.92)_0%,rgb(15_12_10/0.55)_45%,transparent_72%)]"
        />

        {/* Intro */}
        <div data-intro className="absolute inset-x-0 bottom-0 px-5 pb-6 md:px-10 md:pb-10">
          <div className="mx-auto grid max-w-[1600px] items-end gap-6 md:grid-cols-[1fr_auto] md:gap-10">
            <div>
              <p className="mb-3 max-w-[34ch] text-[15px] leading-relaxed text-mehl/85 md:mb-5 md:text-base">
                Neapolitanische Pizza aus dem Holzofen. Geliefert in Ehrenfeld und den Veedeln drumherum.
              </p>
              <h1 className="sr-only">Brace – Pizzeria in Köln-Ehrenfeld</h1>
              <div aria-hidden="true">
              <p className="display -ml-[0.04em] text-[clamp(5.5rem,22vw,21rem)] leading-[0.78] font-[650] text-mehl">
                {'Brace'.split('').map((ch, i) => (
                  <span key={i} className="inline-block overflow-hidden pb-[0.06em] align-bottom">
                    <span className="wordmark-rise inline-block" style={{ animationDelay: `${i * 55}ms` }}>
                      {ch}
                    </span>
                  </span>
                ))}
              </p>
              </div>
            </div>
            <OrderDock />
          </div>
        </div>

        {/* Kapitel */}
        {COPY.map((c, i) => (
          <div
            key={c.title}
            data-chapter={i}
            className="invisible absolute inset-x-0 bottom-[16svh] px-5 opacity-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:px-10"
          >
            <div className="mx-auto max-w-[1600px]">
              <p className="tabular mb-3 text-[13px] text-mehl/70">
                {i + 1} von 3
              </p>
              <h2 className="display text-[clamp(3.25rem,8vw,7.5rem)] leading-[0.9] font-[560]">{c.title}</h2>
              <p className="mt-5 max-w-[38ch] text-base leading-relaxed text-mehl/85 md:text-lg">{c.text}</p>
            </div>
          </div>
        ))}

        {/* Fortschritt */}
        <div data-rail aria-hidden="true" className="invisible absolute inset-x-0 bottom-6 px-5 opacity-0 md:bottom-9 md:px-10">
          <div className="mx-auto grid max-w-[1600px] grid-cols-[1fr_1fr_1fr] gap-2 md:max-w-[1600px] md:gap-4">
            {CHAPTERS.map((c, i) => (
              <div key={c.id} className="flex flex-col gap-2">
                <span className="text-[13px] text-mehl/70">{c.label}</span>
                <span className="relative block h-px overflow-hidden bg-mehl/20">
                  <span data-bar={i} className="absolute inset-0 origin-left scale-x-0 bg-glut" />
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Abschluss */}
        <div data-outro className="invisible absolute inset-x-0 bottom-[12svh] px-5 opacity-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:px-10">
          <div className="mx-auto max-w-[1600px]">
            <h2 className="display max-w-[11ch] text-[clamp(3rem,7.5vw,7rem)] leading-[0.92] font-[560]">Deine ist gleich dran.</h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton variant="brand" size="cta" href="/bestellen/">
                Pizza bestellen
              </LinkButton>
              <LinkButton variant="quiet" size="cta" href="/#karte">
                Karte ansehen
              </LinkButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** „Bewegung reduzieren“: drei ruhige Standbilder statt Film. */
function StaticFilm() {
  const frames = [56, 146, 236];
  return (
    <section id="film" aria-label="Wie eine Brace-Pizza entsteht" className="dark bg-ofen text-mehl">
      <div className="relative min-h-[100svh]">
        <img
          src={posterUrl('d1920', 'webp')}
          alt="Ausgerollter Pizzateig auf einer bemehlten Holzplatte"
          width={1920}
          height={1080}
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,rgb(15_12_10/0.9),transparent)] px-5 pt-24 pb-8 md:px-10">
          <div className="mx-auto grid max-w-[1600px] items-end gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <h1 className="sr-only">Brace – Pizzeria in Köln-Ehrenfeld</h1>
              <p aria-hidden className="display text-[clamp(5rem,20vw,18rem)] leading-[0.8] font-[650]">
                Brace
              </p>
            </div>
            <OrderDock />
          </div>
        </div>
      </div>
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-24 md:grid-cols-3 md:px-10">
        {COPY.map((c, i) => (
          <figure key={c.title} className="flex flex-col gap-5">
            <img
              src={asset(`/media/film/d1280/${String(frames[i]).padStart(3, '0')}.webp`)}
              alt=""
              width={1280}
              height={720}
              loading="lazy"
              className="aspect-[4/3] w-full rounded-xl object-cover"
            />
            <figcaption>
              <h2 className="display text-4xl">{c.title}</h2>
              <p className="mt-3 text-mehl/85">{c.text}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
