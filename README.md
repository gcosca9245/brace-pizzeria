# Brace – Pizzeria-Demo mit Lieferservice und Küchen-Dashboard

Testprojekt von GC OneSolution. Brace ist erfunden, alle Daten sind Demo-Daten, es wird nichts bezahlt.

- Website: Startseite mit Scroll-Film, Karte mit Konfigurator, Kasse (Lieferung/Abholung, Zeitfenster, PLZ-Prüfung, Demo-Zahlung), Statusseite.
- Küche unter `/admin/`: Live-Board, Kennzahlen und Charts, Speisekarte, Öffnungszeiten und Liefergebiete, Kunden.
- Zugang: siehe `docs/DEMO-ZUGANG.md`.

## Technik
Next.js 16 (App Router, statischer Export), TypeScript strict, Tailwind 4, shadcn/ui (Base UI), React Hook Form + Zod,
Recharts, GSAP + Lenis, Magic UI (Number Ticker, Animated List, Blur Fade), React Bits (Split Text), Aceternity (Tracing Beam).

Daten laufen ohne Server im Browser (`src/lib/data/local.ts`). Mit `NEXT_PUBLIC_SUPABASE_URL` und
`NEXT_PUBLIC_SUPABASE_ANON_KEY` schaltet `src/lib/data/index.ts` auf Supabase; Schema mit RLS in `supabase/schema.sql`.

```bash
npm ci
npm run dev
npm run typecheck && npm run lint
NEXT_PUBLIC_BASE_PATH=/brace-pizzeria npm run build   # statischer Export nach out/
```

Die Film-Einzelbilder und Fotos (`public/media`) entstehen aus den Quellvideos mit `scripts/build-assets.mjs`.
Mehr zu Gestaltung und Entscheidungen: `docs/DESIGN.md`.
