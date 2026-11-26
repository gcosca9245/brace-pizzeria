'use client';

/**
 * Vorbereiteter Supabase-Adapter (in dieser Demo NICHT verbunden).
 * Aktiv wird er erst, wenn NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY gesetzt sind
 * und supabase/schema.sql eingespielt wurde. Preise und Statuswechsel prüft dann die Datenbank (RLS + RPC).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { MenuItem } from '../menu';
import type { DataAdapter, Order, Settings } from './types';

let client: Promise<SupabaseClient> | null = null;
const sb = () => {
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
  );
  return client;
};

const fail = (e: { message: string } | null, fallback: string) => ({ ok: false as const, error: e?.message ?? fallback });

export const supabaseAdapter: DataAdapter = {
  kind: 'supabase',
  async getMenu() {
    const { data } = await (await sb()).from('menu_items').select('*').order('sort');
    return (data ?? []) as MenuItem[];
  },
  async updateMenuItem(id, patch) {
    const { data, error } = await (await sb()).from('menu_items').update(patch).eq('id', id).select().single();
    return error ? fail(error, 'Speichern fehlgeschlagen.') : { ok: true, data: data as MenuItem };
  },
  async getSettings() {
    const { data } = await (await sb()).from('settings').select('value').eq('key', 'shop').single();
    return data?.value as Settings;
  },
  async saveSettings(s) {
    const { error } = await (await sb()).from('settings').upsert({ key: 'shop', value: s });
    return error ? fail(error, 'Speichern fehlgeschlagen.') : { ok: true, data: s };
  },
  async placeOrder(o) {
    // place_order() rechnet Preise und Liefergebühr in der Datenbank neu (security definer).
    const { data, error } = await (await sb()).rpc('place_order', { payload: o });
    return error ? fail(error, 'Bestellung fehlgeschlagen.') : { ok: true, data: data as Order };
  },
  async getOrder(id) {
    const { data } = await (await sb()).rpc('order_status', { order_id: id });
    return (data as Order) ?? null;
  },
  async listOrders() {
    const { data } = await (await sb()).from('orders').select('*').order('created_at', { ascending: false }).limit(300);
    return (data ?? []) as Order[];
  },
  async setOrderStatus(id, status) {
    const { data, error } = await (await sb()).rpc('set_order_status', { order_id: id, next: status });
    return error ? fail(error, 'Status konnte nicht gesetzt werden.') : { ok: true, data: data as Order };
  },
  async history() {
    const { data } = await (await sb()).from('orders').select('*').gte('created_at', new Date(Date.now() - 35 * 86_400_000).toISOString());
    return (data ?? []) as Order[];
  },
  async login(email, password) {
    const { data, error } = await (await sb()).auth.signInWithPassword({ email, password });
    return error || !data.user ? fail(error, 'Anmeldung fehlgeschlagen.') : { ok: true, data: { email, name: data.user.email ?? email } };
  },
  async logout() {
    await (await sb()).auth.signOut();
  },
  async session() {
    const { data } = await (await sb()).auth.getUser();
    return data.user ? { email: data.user.email ?? '', name: data.user.email ?? '' } : null;
  },
};
