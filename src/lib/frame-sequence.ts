/**
 * Scroll-Bildsequenz ohne Ruckeln:
 * - Ein eigener rAF-Loop zieht den angezeigten Frame gedämpft zum Scroll-Ziel (exponentielle
 *   Glättung, Höchsttempo pro Bild). Gezeichnet wird nur, wenn sich der Frame-Index ändert –
 *   immer genau ein ganzes Bild, keine Überblendung.
 * - Bytes kommen als Blobs: zuerst das erste Kapitel dicht, danach grob → fein, und jederzeit
 *   bevorzugt die fehlenden Frames vor der aktuellen Position in Scrollrichtung.
 * - Dekodiert wird vorausschauend in Scrollrichtung (Prioritätsliste, begrenzte Parallelität)
 *   per `createImageBitmap`. Fehlt ein Frame noch, steht der nächstliegende dekodierte –
 *   das Canvas ist nie leer.
 */
export interface FrameSequenceOptions {
  urlFor: (index: number) => string;
  count: number;
  /** Pixelmaße der Frames – das Canvas wird nie größer als nötig. */
  frameWidth: number;
  frameHeight: number;
  /** Horizontaler Fokuspunkt beim Zuschneiden (0 = links, 1 = rechts). */
  focusX?: number;
  focusY?: number;
  /** Wird einmal aufgerufen, sobald der erste Frame auf dem Canvas liegt. */
  onReady?: () => void;
}

type Drawable = ImageBitmap | HTMLImageElement;

const canBitmap = typeof window !== 'undefined' && 'createImageBitmap' in window;

/** Grobe Gerätewahl: Touch-Geräte bekommen geringere Pixeldichte und kleineren Cache. */
export function isCoarsePointer() {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}

interface Tuning {
  maxDpr: number;
  cache: number;
  ahead: number;
  decoders: number;
  fetchers: number;
  /** Zeitkonstante der Dämpfung in Sekunden. */
  tau: number;
  /** Höchstens so viele Frames pro 60-Hz-Bild – schnelle Wischer überspringen nichts. */
  maxStep: number;
}

const TUNING: Record<'touch' | 'desktop', Tuning> = {
  touch: { maxDpr: 1.5, cache: 12, ahead: 8, decoders: 2, fetchers: 4, tau: 0.12, maxStep: 2.5 },
  desktop: { maxDpr: 2, cache: 32, ahead: 12, decoders: 3, fetchers: 6, tau: 0.07, maxStep: 3 },
};

export class FrameSequence {
  private readonly blobs: (Blob | null)[];
  private readonly fetching = new Set<number>();
  /** Fehlversuche je Frame – nach zwei Fehlern übernimmt der Nachbar. */
  private readonly failed = new Map<number, number>();
  private readonly cache = new Map<number, Drawable>();
  private readonly decoding = new Set<number>();
  private readonly opts: Required<FrameSequenceOptions>;
  private readonly t: Tuning;
  private readonly staticOrder: number[];
  private staticPos = 0;
  private ctx: CanvasRenderingContext2D | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private target = 0;
  private current = 0;
  private dir = 1;
  private shown = -1;
  private raf = 0;
  private lastT = 0;
  private ready = false;
  private disposed = false;
  private started = false;
  private abort = new AbortController();

  constructor(opts: FrameSequenceOptions) {
    this.t = TUNING[isCoarsePointer() ? 'touch' : 'desktop'];
    this.opts = { focusX: 0.5, focusY: 0.5, onReady: () => {}, ...opts };
    this.blobs = Array.from({ length: opts.count }, () => null);
    // Erstes Kapitel dicht (dort startet jeder Besuch), danach grob → fein über den Rest.
    const n = opts.count;
    const seen = new Set<number>();
    const order: number[] = [];
    const push = (i: number) => {
      if (i >= 0 && i < n && !seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    };
    for (let i = 0; i < Math.ceil(n / 3); i++) push(i);
    for (const step of [8, 4, 2, 1]) for (let i = 0; i < n; i += step) push(i);
    push(n - 1);
    this.staticOrder = order;
  }

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.resize();
  }

  /** Startet das Laden der Bytes (Dekodieren passiert im Loop, nahe der Position). */
  load() {
    if (this.started || this.disposed) return;
    this.started = true;
    for (let k = 0; k < this.t.fetchers; k++) void this.fetchWorker();
  }

  /** Canvas = CSS-Größe × gedeckelte Pixeldichte, aber nie größer als die Frames selbst. */
  resize() {
    const c = this.canvas;
    if (!c) return;
    const cw = c.clientWidth;
    const ch = c.clientHeight;
    if (!cw || !ch) return;
    const useful = Math.min(this.opts.frameWidth / cw, this.opts.frameHeight / ch);
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, this.t.maxDpr, useful));
    const w = Math.round(cw * dpr);
    const h = Math.round(ch * dpr);
    if (c.width === w && c.height === h) return;
    c.width = w;
    c.height = h;
    this.clearCache(); // Bitmaps passen zur alten Größe
    this.kick();
  }

  /** progress 0..1 → Ziel-Frame (gleitend). */
  setProgress(progress: number) {
    const p = Math.min(1, Math.max(0, progress));
    const next = p * (this.opts.count - 1);
    if (next !== this.target) this.dir = next > this.target ? 1 : -1;
    this.target = next;
    if (!this.ready) this.current = next; // vor dem ersten Bild: direkt springen
    this.kick();
  }

  private kick() {
    if (this.raf || this.disposed) return;
    this.lastT = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  private tick = (now: number) => {
    this.raf = 0;
    if (this.disposed) return;
    const dt = this.lastT ? Math.min(0.1, (now - this.lastT) / 1000) : 1 / 60;
    this.lastT = now;
    const gap = this.target - this.current;
    if (Math.abs(gap) < 0.02) this.current = this.target;
    else {
      const step = gap * (1 - Math.exp(-dt / this.t.tau));
      const cap = this.t.maxStep * dt * 60;
      this.current += Math.max(-cap, Math.min(cap, step));
    }
    const want = Math.round(this.current);
    this.scheduleDecodes(want);
    this.render(want);
    // Weiterlaufen, solange wir gleiten oder auf den richtigen Frame warten.
    if (this.current !== this.target || this.shown !== want) this.raf = requestAnimationFrame(this.tick);
  };

  /** Prioritätsliste: Ziel, dann voraus in Scrollrichtung, dann zwei dahinter. */
  private priority(want: number): number[] {
    const list = [want];
    for (let d = 1; d <= this.t.ahead; d++) {
      list.push(want + this.dir * d);
      if (d <= 2) list.push(want - this.dir * d);
    }
    return list.filter((i) => i >= 0 && i < this.opts.count);
  }

  private scheduleDecodes(want: number) {
    for (const i of this.priority(want)) {
      if (this.decoding.size >= this.t.decoders) break;
      if (this.cache.has(i) || this.decoding.has(i) || !this.blobs[i]) continue;
      this.decode(i);
    }
  }

  private decode(i: number) {
    const blob = this.blobs[i];
    const c = this.canvas;
    if (!blob || !c) return;
    this.decoding.add(i);
    const size = `${c.width}x${c.height}`;
    void this.decodeBlob(blob, c)
      .then((d) => {
        this.decoding.delete(i);
        if (!d) return;
        if (this.disposed || !this.canvas || `${this.canvas.width}x${this.canvas.height}` !== size) {
          if ('close' in d) d.close();
          return;
        }
        this.cache.set(i, d);
        this.evict(Math.round(this.current));
        this.kick();
      })
      .catch(() => this.decoding.delete(i));
  }

  private async decodeBlob(blob: Blob, c: HTMLCanvasElement): Promise<Drawable | null> {
    if (canBitmap) {
      const { frameWidth: fw, frameHeight: fh } = this.opts;
      const scale = Math.min(1, Math.max(c.width / fw, c.height / fh));
      // Meist passt das Canvas exakt – dann ohne Skalierung (schnellster Pfad).
      if (scale > 0.98) return createImageBitmap(blob);
      return createImageBitmap(blob, {
        resizeWidth: Math.max(1, Math.round(fw * scale)),
        resizeHeight: Math.max(1, Math.round(fh * scale)),
        resizeQuality: 'medium',
      });
    }
    const img = new Image();
    img.decoding = 'async';
    img.src = URL.createObjectURL(blob);
    try {
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(img.src);
    }
  }

  /** Nächster zu ladender Frame: fehlende vor der Position zuerst, sonst die feste Reihenfolge. */
  private nextFetch(): number {
    const want = Math.round(this.current);
    const n = this.opts.count;
    for (let d = 0; d <= 24; d++) {
      for (const i of d <= 3 ? [want + this.dir * d, want - this.dir * d] : [want + this.dir * d]) {
        if (i >= 0 && i < n && this.missing(i)) return i;
      }
    }
    while (this.staticPos < this.staticOrder.length) {
      const i = this.staticOrder[this.staticPos];
      if (this.missing(i)) return i;
      this.staticPos++;
    }
    return -1;
  }

  private missing(i: number) {
    return !this.blobs[i] && !this.fetching.has(i) && (this.failed.get(i) ?? 0) < 2;
  }

  private async fetchWorker() {
    while (!this.disposed) {
      const i = this.nextFetch();
      if (i < 0) return;
      this.fetching.add(i);
      try {
        const res = await fetch(this.opts.urlFor(i), { signal: this.abort.signal });
        if (res.ok) {
          this.blobs[i] = await res.blob();
          if (Math.abs(i - this.current) <= this.t.ahead) this.kick();
        } else this.failed.set(i, (this.failed.get(i) ?? 0) + 1);
      } catch {
        if (this.abort.signal.aborted) return;
        this.failed.set(i, (this.failed.get(i) ?? 0) + 1);
      } finally {
        this.fetching.delete(i);
      }
    }
  }

  private clearCache() {
    for (const d of this.cache.values()) if ('close' in d) d.close();
    this.cache.clear();
    this.shown = -1;
  }

  /** Wirft die Frames weg, die am weitesten weg (und hinter der Scrollrichtung) liegen. */
  private evict(want: number) {
    if (this.cache.size <= this.t.cache) return;
    const cost = (k: number) => {
      const d = k - want;
      return Math.abs(d) * (Math.sign(d) === this.dir ? 1 : 2.5);
    };
    const keys = [...this.cache.keys()].filter((k) => k !== this.shown).sort((a, b) => cost(b) - cost(a));
    for (const k of keys) {
      if (this.cache.size <= this.t.cache) break;
      const d = this.cache.get(k);
      if (d && 'close' in d) d.close();
      this.cache.delete(k);
    }
  }

  /** Bester verfügbarer Frame: das Ziel, sonst der nächste dekodierte – bevorzugt zwischen Bild und Ziel. */
  private pick(want: number): number {
    if (this.cache.has(want)) return want;
    let best = -1;
    let bestCost = Infinity;
    for (const k of this.cache.keys()) {
      const between = this.shown >= 0 && (k - this.shown) * (want - k) >= 0;
      const c = Math.abs(k - want) + (between ? 0 : 0.5);
      if (c < bestCost) {
        bestCost = c;
        best = k;
      }
    }
    return best;
  }

  private render(want: number) {
    const { ctx, canvas } = this;
    if (!ctx || !canvas || canvas.width === 0) return;
    const index = this.pick(want);
    if (index < 0 || index === this.shown) return;
    const img = this.cache.get(index)!;
    const w = img instanceof HTMLImageElement ? img.naturalWidth : img.width;
    const h = img instanceof HTMLImageElement ? img.naturalHeight : img.height;
    const scale = Math.max(canvas.width / w, canvas.height / h);
    const dw = w * scale;
    const dh = h * scale;
    ctx.drawImage(img, (canvas.width - dw) * this.opts.focusX, (canvas.height - dh) * this.opts.focusY, dw, dh);
    this.shown = index;
    if (!this.ready) {
      this.ready = true;
      this.opts.onReady();
    }
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.abort.abort();
    this.clearCache();
    this.canvas = null;
    this.ctx = null;
  }
}
