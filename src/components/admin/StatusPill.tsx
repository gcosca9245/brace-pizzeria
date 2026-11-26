import type { OrderStatus } from '@/lib/data';
import { cn } from '@/lib/utils';

const TONE: Record<OrderStatus, string> = {
  neu: 'bg-pomodoro text-white',
  zubereitung: 'bg-glut/25 text-kohle',
  ofen: 'bg-glut text-kohle',
  unterwegs: 'bg-kohle text-mehl',
  geliefert: 'bg-secondary text-muted-foreground',
  storniert: 'bg-secondary text-muted-foreground line-through',
};

export function StatusPill({ status, label, className }: { status: OrderStatus; label: string; className?: string }) {
  return <span className={cn('inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[12px] font-medium whitespace-nowrap', TONE[status], className)}>{label}</span>;
}
