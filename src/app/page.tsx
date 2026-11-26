import { Film } from '@/components/home/Film';
import { LazySections } from '@/components/home/LazySections';

export default function Home() {
  return (
    <main id="main">
      <Film />
      <LazySections />
    </main>
  );
}
