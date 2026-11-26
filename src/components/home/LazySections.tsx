'use client';

import dynamic from 'next/dynamic';

/*
 * Alles unterhalb des Films lädt erst nach dem ersten Bild: das hält Motion, Formulare und Dialoge
 * aus dem kritischen Pfad. Der Film ist mehrere Bildschirmhöhen lang, die Abschnitte sind lange vorher da.
 */
const Placeholder = () => <div className="min-h-svh bg-mehl" aria-hidden="true" />;
const SignatureMenu = dynamic(() => import('./SignatureMenu').then((m) => m.SignatureMenu), { ssr: false, loading: Placeholder });
const DoughStory = dynamic(() => import('./DoughStory').then((m) => m.DoughStory), { ssr: false });
const DeliveryArea = dynamic(() => import('./DeliveryArea').then((m) => m.DeliveryArea), { ssr: false });

export function LazySections() {
  return (
    <>
      <SignatureMenu />
      <DoughStory />
      <DeliveryArea />
    </>
  );
}
