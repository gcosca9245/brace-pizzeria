export type Zone = {
  id: string;
  name: string;
  /** Postleitzahlen dieser Zone */
  plz: string[];
  /** Liefergebühr in Cent */
  fee: number;
  /** Mindestbestellwert in Cent */
  min: number;
  /** Lieferzeit in Minuten (von–bis) */
  eta: [number, number];
  active: boolean;
};

export const DEFAULT_ZONES: Zone[] = [
  { id: 'a', name: 'Ehrenfeld', plz: ['50823', '50825'], fee: 0, min: 1500, eta: [25, 35], active: true },
  {
    id: 'b',
    name: 'Neuehrenfeld, Bickendorf, Belgisches Viertel, Nippes, Lindenthal',
    plz: ['50827', '50672', '50674', '50733', '50931'],
    fee: 250,
    min: 2000,
    eta: [35, 45],
    active: true,
  },
  {
    id: 'c',
    name: 'Sülz, Klettenberg, Agnesviertel, Riehl, Weidenpesch',
    plz: ['50937', '50939', '50668', '50670', '50735', '50739'],
    fee: 390,
    min: 3000,
    eta: [45, 60],
    active: true,
  },
];

export type ZoneCheck =
  | { ok: true; zone: Zone }
  | { ok: false; reason: 'format' | 'outside' | 'inactive' };

export function checkPlz(plz: string, zones: Zone[]): ZoneCheck {
  const clean = plz.trim();
  if (!/^\d{5}$/.test(clean)) return { ok: false, reason: 'format' };
  const zone = zones.find((z) => z.plz.includes(clean));
  if (!zone) return { ok: false, reason: 'outside' };
  if (!zone.active) return { ok: false, reason: 'inactive' };
  return { ok: true, zone };
}

export const zoneMessage = (r: ZoneCheck) => {
  if (r.ok) return null;
  if (r.reason === 'format') return 'Bitte eine fünfstellige Postleitzahl eingeben.';
  if (r.reason === 'inactive') return 'In dieses Gebiet liefern wir heute nicht. Abholen geht jederzeit.';
  return 'Hierhin liefern wir leider nicht. Du kannst deine Pizza aber in Ehrenfeld abholen.';
};
