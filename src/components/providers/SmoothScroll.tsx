'use client';

import { useEffect } from 'react';

/**
 * Lenis nur auf Desktop (feiner Zeiger). Touch-Geräte scrollen nativ – flüssiger und ohne
 * Konflikt mit der iOS-Trägheit. Bei „Bewegung reduzieren“ bleibt alles nativ.
 * Lenis und GSAP werden erst nach dem ersten Rendern nachgeladen (kleines Start-JS).
 */
export function SmoothScroll() {
  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (coarse || reduced) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    void Promise.all([import('lenis'), import('@/lib/gsap')]).then(([{ default: Lenis }, { getGsap }]) => {
      if (cancelled) return;
      const { gsap, ScrollTrigger } = getGsap();
      const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, autoRaf: false, anchors: { offset: -72 } });
      lenis.on('scroll', ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      stop = () => {
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, []);
  return null;
}
