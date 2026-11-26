const eur = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const time = new Intl.DateTimeFormat('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });
const dateTime = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Berlin',
});

/** Preise werden intern in Cent geführt. */
export const formatEuro = (cents: number) => eur.format(cents / 100);
export const formatTime = (ts: number) => time.format(ts);
export const formatDateTime = (ts: number) => dateTime.format(ts);
export const minutesToClock = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
