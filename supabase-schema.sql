-- nokonoko POS — Supabase SQL Editor
-- Safe to run multiple times (all statements are idempotent)

-- ── Tables ────────────────────────────────────────────────────────────────

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

-- ── Migration: price overrides + custom product support ───────────────────
-- Adds columns for editing prices and adding new products from the app.
-- Run this section once after the initial setup (or just re-run the whole file).

alter table public.menu_items
  add column if not exists name                text,
  add column if not exists modifier            text,
  add column if not exists description         text,
  add column if not exists category            text,
  add column if not exists has_temperature     boolean,
  add column if not exists hot_price           integer,
  add column if not exists iced_price          integer,
  add column if not exists fixed_price         integer,
  add column if not exists unit                text,
  add column if not exists low_stock_threshold integer,
  add column if not exists is_custom           boolean not null default false,
  add column if not exists sort_order          integer not null default 100;

-- ── Row Level Security ────────────────────────────────────────────────────

alter table public.orders      enable row level security;
alter table public.order_items  enable row level security;
alter table public.menu_items   enable row level security;

drop policy if exists "pos_orders_all"      on public.orders;
drop policy if exists "pos_order_items_all" on public.order_items;
drop policy if exists "pos_menu_items_all"  on public.menu_items;

create policy "pos_orders_all"      on public.orders      for all using (true) with check (true);
create policy "pos_order_items_all" on public.order_items  for all using (true) with check (true);
create policy "pos_menu_items_all"  on public.menu_items   for all using (true) with check (true);
