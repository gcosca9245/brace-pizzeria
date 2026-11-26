import type { Metadata } from 'next';
import { MenuBoard } from '@/components/order/MenuBoard';

export const metadata: Metadata = { title: 'Karte & Bestellen' };

export default function Page() {
  return (
    <main id="main">
      <MenuBoard />
    </main>
  );
}
