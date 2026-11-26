import manifest from './media.generated.json';
import { asset } from './asset';
import { isCoarsePointer } from './frame-sequence';

type Variant = keyof typeof manifest.film;

/** Kapitel des Scrollfilms als Anteil der Gesamtlänge (28,8 s Film, Überblendungen bei 9,4 s und 18,8 s). */
export const CHAPTERS = [
  { id: 'belegen', label: 'Belegen', from: 0, to: 0.335 },
  { id: 'ofen', label: 'Ofen', from: 0.335, to: 0.66 },
  { id: 'schneiden', label: 'Schneiden', from: 0.66, to: 1 },
] as const;

const frameUrl = (v: Variant, i: number) => asset(`/media/film/${v}/${String(i + 1).padStart(3, '0')}.webp`);

/** Wählt die kleinste Frame-Variante, die das Canvas scharf füllt; Hochformat bekommt den eigenen 9:16-Film. */
export function filmSource(cssWidth: number, cssHeight: number) {
  const coarse = isCoarsePointer();
  const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
  let v: Variant;
  if (cssHeight > 0 && cssWidth / cssHeight <= 0.8) v = 'p720';
  else v = cssWidth * dpr * 0.85 > 1280 ? 'd1920' : 'd1280';
  return { variant: v, count: manifest.film[v], urlFor: (i: number) => frameUrl(v, i) };
}

export const posterUrl = (v: Variant, ext: 'avif' | 'webp') =>
  asset(ext === 'avif' ? `/media/film/${v}/poster.avif` : `/media/film/${v}/001.webp`);
