import manifest from './media.generated.json';
import { asset } from './asset';
import { isCoarsePointer } from './frame-sequence';

type Variant = keyof typeof manifest.film;

/** Kapitel des Scrollfilms als Anteil der Gesamtlänge (3 × 10 s, harte Schnitte bei 1/3 und 2/3). */
export const CHAPTERS = [
  { id: 'belegen', label: 'Belegen', from: 0, to: 1 / 3 },
  { id: 'ofen', label: 'Ofen', from: 1 / 3, to: 2 / 3 },
  { id: 'schneiden', label: 'Schneiden', from: 2 / 3, to: 1 },
] as const;

const SIZE: Record<Variant, { w: number; h: number }> = {
  d1920: { w: 1920, h: 1080 },
  d1280: { w: 1280, h: 720 },
  p640: { w: 640, h: 1138 },
};

const frameUrl = (v: Variant, i: number) => asset(`/media/film/${v}/${String(i + 1).padStart(3, '0')}.webp`);

/** Wählt die kleinste Frame-Variante, die das Canvas scharf füllt; Hochformat bekommt den eigenen 9:16-Film. */
export function filmSource(cssWidth: number, cssHeight: number) {
  const coarse = isCoarsePointer();
  const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
  let v: Variant;
  if (cssHeight > 0 && cssWidth / cssHeight <= 0.8) v = 'p640';
  else v = cssWidth * dpr * 0.85 > 1280 ? 'd1920' : 'd1280';
  return {
    variant: v,
    count: manifest.film[v],
    frameWidth: SIZE[v].w,
    frameHeight: SIZE[v].h,
    urlFor: (i: number) => frameUrl(v, i),
  };
}

export const posterUrl = (v: Variant, ext: 'avif' | 'webp') =>
  asset(ext === 'avif' ? `/media/film/${v}/poster.avif` : `/media/film/${v}/001.webp`);
