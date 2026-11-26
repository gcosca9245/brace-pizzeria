/**
 * Stammdaten der Demo-Pizzeria. BRACE ist ein erfundenes Konzept – Adresse, Telefon und
 * E-Mail sind bewusst als Beispieldaten erkennbar (.example, keine Hausnummer).
 */
export const SITE = {
  name: 'Brace',
  claim: 'Neapolitanische Pizza aus dem Holzofen',
  district: 'Köln-Ehrenfeld',
  street: 'Venloer Straße (Demo-Adresse)',
  city: '50823 Köln',
  phone: '0221 000 000 (Demo)',
  email: 'hallo@brace-pizza.example',
  instagram: '@brace.demo',
} as const;

export type DayHours = { open: number; close: number; closed: boolean };
/** Index 0 = Montag. Minuten seit Mitternacht. */
export type WeekHours = DayHours[];

export const WEEKDAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'] as const;

export const DEFAULT_HOURS: WeekHours = [
  { open: 17 * 60, close: 22 * 60, closed: true },
  { open: 17 * 60, close: 22 * 60 + 30, closed: false },
  { open: 17 * 60, close: 22 * 60 + 30, closed: false },
  { open: 17 * 60, close: 22 * 60 + 30, closed: false },
  { open: 12 * 60, close: 23 * 60, closed: false },
  { open: 12 * 60, close: 23 * 60, closed: false },
  { open: 12 * 60, close: 22 * 60, closed: false },
];
