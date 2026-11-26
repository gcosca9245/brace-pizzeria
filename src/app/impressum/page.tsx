import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Impressum' };

export default function Page() {
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 pt-36 pb-32">
      <h1 className="display text-6xl font-[560]">Impressum</h1>
      <div className="mt-10 flex flex-col gap-4 text-[17px] leading-relaxed">
        <p>Diese Seite ist ein Demo-Projekt von GC OneSolution. Brace ist ein erfundenes Restaurant, es gibt keinen Geschäftsbetrieb.</p>
        <p>Für einen echten Auftritt stehen hier Name, Anschrift, Vertretungsberechtigte, Kontakt, Registereintrag und Umsatzsteuer-ID nach § 5 DDG.</p>
      </div>
    </main>
  );
}
