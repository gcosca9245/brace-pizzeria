import { Suspense } from 'react';
import type { Metadata } from 'next';
import { OrderTracker } from '@/components/order/OrderTracker';

export const metadata: Metadata = { title: 'Deine Bestellung' };

export default function Page() {
  return (
    <main id="main">
      <Suspense fallback={null}>
        <OrderTracker />
      </Suspense>
    </main>
  );
}
