import type { Zone } from '../delivery';
import type { MenuItem } from '../menu';
import type { WeekHours } from '../site';

export const ORDER_STATUSES = ['neu', 'zubereitung', 'ofen', 'unterwegs', 'geliefert'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number] | 'storniert';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  neu: 'Neu',
  zubereitung: 'In Zubereitung',
  ofen: 'Im Ofen',
  unterwegs: 'Unterwegs',
  geliefert: 'Geliefert',
  storniert: 'Storniert',
};

/** Bei Abholung heißen die letzten beiden Schritte anders. */
export const statusLabel = (s: OrderStatus, mode: OrderMode) =>
  mode === 'abholung' && s === 'unterwegs' ? 'Abholbereit' : mode === 'abholung' && s === 'geliefert' ? 'Abgeholt' : STATUS_LABEL[s];

export type OrderMode = 'lieferung' | 'abholung';
export type PaymentMethod = 'karte' | 'paypal' | 'bar';

export type OrderLine = { itemId: string; name: string; qty: number; unit: number; details: string };

export type Order = {
  id: string;
  code: string;
  createdAt: number;
  mode: OrderMode;
  lines: OrderLine[];
  subtotal: number;
  fee: number;
  total: number;
  customer: { name: string; email: string; phone: string };
  address?: { street: string; plz: string; city: string; floor: string; zoneId: string };
  note: string;
  when: { value: string; label: string };
  /** Geplante Ankunft / Abholzeit */
  etaAt: number;
  payment: { method: PaymentMethod; ref: string };
  status: OrderStatus;
  log: { status: OrderStatus; at: number }[];
  /** Demo: Status läuft automatisch weiter, bis die Küche ihn von Hand setzt. */
  autopilot: boolean;
};

export type NewOrder = Omit<Order, 'id' | 'code' | 'createdAt' | 'status' | 'log' | 'autopilot' | 'payment'> & {
  payment: { method: PaymentMethod };
};

export type Settings = { hours: WeekHours; zones: Zone[]; paused: boolean };

export type Customer = { key: string; name: string; email: string; phone: string; orders: number; revenue: number; last: number; plz?: string };

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export interface DataAdapter {
  kind: 'local' | 'supabase';
  getMenu(): Promise<MenuItem[]>;
  updateMenuItem(id: string, patch: Partial<Pick<MenuItem, 'name' | 'desc' | 'price' | 'available'>>): Promise<Result<MenuItem>>;
  getSettings(): Promise<Settings>;
  saveSettings(s: Settings): Promise<Result<Settings>>;
  placeOrder(o: NewOrder): Promise<Result<Order>>;
  getOrder(id: string): Promise<Order | null>;
  listOrders(): Promise<Order[]>;
  setOrderStatus(id: string, status: OrderStatus): Promise<Result<Order>>;
  /** Historische Umsätze (Demo: generiert) für Statistiken */
  history(): Promise<Order[]>;
  login(email: string, password: string): Promise<Result<{ email: string; name: string }>>;
  logout(): Promise<void>;
  session(): Promise<{ email: string; name: string } | null>;
}
