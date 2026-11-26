import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/order/CheckoutForm';

export const metadata: Metadata = { title: 'Kasse' };

export default function Page() {
  return (
    <main id="main">
      <CheckoutForm />
    </main>
  );
}
