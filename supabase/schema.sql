-- Brace · Supabase-Schema (vorbereitet, in der Demo NICHT verbunden)
-- Gäste dürfen Karte und Einstellungen lesen und über place_order bestellen.
-- Bestellungen sehen Gäste nur über order_status(id). Alles andere nur für Küche (Rolle in app_metadata).

create extension if not exists pgcrypto;

create or replace function public.is_staff() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('kueche', 'admin'), false)
$$;

create table public.menu_items (
  id text primary key,
  category text not null check (category in ('pizza', 'antipasti', 'dolci', 'getraenke')),
  name text not null check (char_length(name) between 2 and 60),
  description text not null check (char_length(description) <= 160),
  price_cents integer not null check (price_cents between 0 and 100000),
  image text,
  tags text[] not null default '{}',
  removable text[] not null default '{}',
  available boolean not null default true,
  sort integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.settings (
  id boolean primary key default true check (id), -- genau eine Zeile
  hours jsonb not null,  -- [{open, close, closed}] Mo–So, Minuten seit Mitternacht
  zones jsonb not null,  -- [{id, name, plz[], fee, min, eta[2], active}]
  paused boolean not null default false,
  updated_at timestamptz not null default now()
);

create type public.order_status as enum ('neu', 'zubereitung', 'ofen', 'unterwegs', 'geliefert', 'storniert');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_at timestamptz not null default now(),
  mode text not null check (mode in ('lieferung', 'abholung')),
  lines jsonb not null,
  subtotal_cents integer not null check (subtotal_cents >= 0),
  fee_cents integer not null default 0 check (fee_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  customer jsonb not null,
  address jsonb,
  note text not null default '' check (char_length(note) <= 300),
  when_label text not null,
  eta_at timestamptz not null,
  payment_method text not null check (payment_method in ('karte', 'paypal', 'bar')),
  payment_ref text not null,
  status public.order_status not null default 'neu',
  log jsonb not null default '[]'
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_open_idx on public.orders (status) where status not in ('geliefert', 'storniert');

alter table public.menu_items enable row level security;
alter table public.settings enable row level security;
alter table public.orders enable row level security;

create policy "Karte lesen" on public.menu_items for select using (true);
create policy "Karte pflegen" on public.menu_items for update using (public.is_staff()) with check (public.is_staff());
create policy "Einstellungen lesen" on public.settings for select using (true);
create policy "Einstellungen pflegen" on public.settings for update using (public.is_staff()) with check (public.is_staff());
create policy "Bestellungen Küche" on public.orders for select using (public.is_staff());
-- Kein insert/update für anon: Bestellen und Status laufen nur über die Funktionen unten.

-- Bestellung anlegen. Preise, Gebühr und Mindestwert rechnet der Server neu.
create or replace function public.place_order(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s public.settings; z jsonb; l jsonb; item public.menu_items;
  sub integer := 0; fee integer := 0; extra integer; mode text := payload ->> 'mode';
  o public.orders;
begin
  select * into s from settings where id;
  if s.paused then raise exception 'Bestellannahme pausiert'; end if;
  for l in select * from jsonb_array_elements(payload -> 'lines') loop
    select * into item from menu_items where id = l ->> 'itemId' and available;
    if not found then raise exception 'Nicht verfügbar: %', l ->> 'itemId'; end if;
    extra := coalesce((l ->> 'extraCents')::int, 0);
    if extra < 0 or extra > 2000 then raise exception 'Ungültige Extras'; end if;
    sub := sub + (item.price_cents + extra) * greatest(1, least(20, (l ->> 'qty')::int));
  end loop;
  if mode = 'lieferung' then
    select zz into z from jsonb_array_elements(s.zones) zz
      where (zz ->> 'active')::boolean and zz -> 'plz' ? (payload -> 'address' ->> 'plz');
    if z is null then raise exception 'PLZ außerhalb des Liefergebiets'; end if;
    if sub < (z ->> 'min')::int then raise exception 'Mindestbestellwert nicht erreicht'; end if;
    fee := (z ->> 'fee')::int;
  end if;
  insert into orders (code, mode, lines, subtotal_cents, fee_cents, total_cents, customer, address, note, when_label, eta_at,
                      payment_method, payment_ref, log)
  values ('B-' || lpad((floor(random() * 9000) + 1000)::text, 4, '0'), mode, payload -> 'lines', sub, fee, sub + fee,
          payload -> 'customer', payload -> 'address', coalesce(payload ->> 'note', ''), payload ->> 'whenLabel',
          (payload ->> 'etaAt')::timestamptz, payload ->> 'payment', 'DEMO-' || upper(substr(md5(random()::text), 1, 6)),
          jsonb_build_array(jsonb_build_object('status', 'neu', 'at', now())))
  returning * into o;
  return jsonb_build_object('id', o.id, 'code', o.code);
end $$;

-- Status für Gäste: nur mit der (unratbaren) UUID, ohne Kontaktdaten.
create or replace function public.order_status(order_id uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('code', code, 'mode', mode, 'status', status, 'log', log, 'eta_at', eta_at,
                            'lines', lines, 'total_cents', total_cents, 'fee_cents', fee_cents, 'when_label', when_label)
  from orders where id = order_id
$$;

create or replace function public.set_order_status(order_id uuid, next public.order_status) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Keine Berechtigung'; end if;
  update orders set status = next, log = log || jsonb_build_object('status', next, 'at', now()) where id = order_id;
end $$;

revoke all on function public.set_order_status(uuid, public.order_status) from public, anon;
grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.order_status(uuid) to anon, authenticated;
grant execute on function public.set_order_status(uuid, public.order_status) to authenticated;

-- Realtime für das Küchen-Board
alter publication supabase_realtime add table public.orders;
