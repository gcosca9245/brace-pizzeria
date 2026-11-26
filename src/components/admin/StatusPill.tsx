import type { OrderStatus } from '@/lib/data';
import { cn } from '@/lib/utils';

const TONE: Record<OrderStatus, string> = {
  neu: 'bg-[var(--e-accent,#b8321c)] text-[#12111a]',
  zubereitung: 'bg-[var(--e-peach,#f3d9c4)] text-foreground',
  ofen: 'bg-[var(--e-down-bg,#f6d5cc)] text-[var(--e-down,#7a2010)]',
  unterwegs: 'bg-foreground text-background',
  geliefert: 'bg-secondary text-muted-foreground',
  storniert: 'bg-secondary text-muted-foreground line-through',
};

export function StatusPill({ status, label, className }: { status: OrderStatus; label: string; className?: string }) {
  return <span className={cn('inline-flex h-7 shrink-0 items-center rounded-full px-3 text-[12px] font-semibold whitespace-nowrap', TONE[status], className)}>{label}</span>;
}
