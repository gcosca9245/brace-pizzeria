import { DeliveryArea } from '@/components/home/DeliveryArea';
import { DoughStory } from '@/components/home/DoughStory';
import { Film } from '@/components/home/Film';
import { SignatureMenu } from '@/components/home/SignatureMenu';

export default function Home() {
  return (
    <main id="main">
      <Film />
      <SignatureMenu />
      <DoughStory />
      <DeliveryArea />
    </main>
  );
}
