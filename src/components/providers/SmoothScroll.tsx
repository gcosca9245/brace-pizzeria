'use client';

import Lenis from 'lenis';
import { useEffect } from 'react';
import { getGsap } from '@/lib/gsap';

/**
 * Lenis nur auf Desktop (feiner Zeiger). Touch-Geräte scrollen nativ – flüssiger und ohne
 * Konflikt mit der iOS-Trägheit. Bei „Bewegung reduzieren“ bleibt alles nativ.
 */
export function SmoothScroll() {
  useEffect(() => {
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (coarse || reduced) return;
    const { gsap, ScrollTrigger } = getGsap();
    const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, autoRaf: false, anchors: { offset: -72 } });
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
  return null;
}
