import { LinkButton } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-5 pt-40 pb-40">
      <h1 className="display text-7xl font-[560]">Hier ist nichts im Ofen.</h1>
      <p className="text-lg text-muted-foreground">Diese Seite gibt es nicht. Die Karte schon.</p>
      <LinkButton variant="brand" size="cta" href="/bestellen/">
        Zur Karte
      </LinkButton>
    </main>
  );
}
