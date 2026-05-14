-- nokonoko POS — run this once in Supabase SQL Editor
-- Dashboard → SQL Editor → New query → paste → Run

create table if not exists public.orders (
  id             text        primary key,
  order_number   integer     not null,
  subtotal       integer     not null,
  total          integer     not null,
  timestamp      timestamptz not null default now()
);

create table if not exists public.order_items (
  id             uuid        primary key default gen_random_uuid(),
  order_id       text        not null references public.orders(id) on delete cascade,
  menu_item_id   text        not null,
  display_name   text        not null,
  temperature    text,
  price          integer     not null,
  quantity       integer     not null
);

create table if not exists public.menu_items (
  id             text        primary key,
  stock          integer     not null default 0
);

-- Allow full access via anon key (POS is a trusted in-house device)
alter table public.orders     enable row level security;
alter table public.order_items enable row level security;
alter table public.menu_items  enable row level security;

create policy "pos_orders_all"      on public.orders      for all using (true) with check (true);
create policy "pos_order_items_all" on public.order_items  for all using (true) with check (true);
create policy "pos_menu_items_all"  on public.menu_items   for all using (true) with check (true);
