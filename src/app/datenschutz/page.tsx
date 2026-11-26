import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Datenschutz' };

export default function Page() {
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pt-36 pb-32">
      <h1 className="display text-6xl font-[560]">Datenschutz</h1>
      <div className="mt-10 flex flex-col gap-4 text-[17px] leading-relaxed">
        <p>
          In dieser Demo verlassen keine Daten deinen Browser. Warenkorb, Bestellungen und Einstellungen der Küchenansicht liegen im lokalen Speicher (localStorage) dieses Geräts und lassen sich jederzeit über die Browser-Einstellungen löschen.
        </p>
        <p>Es werden keine Cookies gesetzt, keine Tracking-Dienste geladen und keine Zahlungen ausgeführt. Schriften und Bilder liegen auf demselben Server wie die Seite.</p>
        <p>Für einen echten Betrieb wird diese Seite durch eine vollständige Datenschutzerklärung ersetzt.</p>
      </div>
    </main>
  );
}
