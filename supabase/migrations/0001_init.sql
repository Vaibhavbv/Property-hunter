-- Property Hunter — initial schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- properties: one row per listing, deduped on (source, source_listing_id).
-- ---------------------------------------------------------------------------
create table if not exists public.properties (
  id                uuid primary key default gen_random_uuid(),
  source            text not null,
  source_listing_id text not null,
  url               text not null,
  title             text,
  description       text,
  transaction_type  text check (transaction_type in ('rent', 'sale')),
  property_type     text,
  price             numeric,
  price_period      text check (price_period in ('month', 'total')),
  bhk               integer,
  area_sqft         numeric,
  city              text,
  locality          text,
  latitude          double precision,
  longitude         double precision,
  posted_by         text not null default 'unknown'
                      check (posted_by in ('owner', 'broker', 'unknown')),
  owner_name        text,
  owner_contact     text,
  images            jsonb not null default '[]'::jsonb,
  amenities         jsonb not null default '[]'::jsonb,
  raw               jsonb,
  first_seen_at     timestamptz not null default now(),
  last_seen_at      timestamptz not null default now(),
  is_active         boolean not null default true,
  constraint properties_source_listing_uniq unique (source, source_listing_id)
);

create index if not exists properties_first_seen_idx on public.properties (first_seen_at desc);
create index if not exists properties_city_idx on public.properties (city);
create index if not exists properties_txn_idx on public.properties (transaction_type);
create index if not exists properties_source_idx on public.properties (source);

-- ---------------------------------------------------------------------------
-- scrape_runs: one row per source per daily run, for logging + spend visibility.
-- ---------------------------------------------------------------------------
create table if not exists public.scrape_runs (
  id           uuid primary key default gen_random_uuid(),
  source       text not null,
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  items_found  integer not null default 0,
  items_new    integer not null default 0,
  status       text not null default 'running'
                 check (status in ('running', 'success', 'error')),
  error        text,
  apify_run_id text
);

create index if not exists scrape_runs_started_idx on public.scrape_runs (started_at desc);

-- ---------------------------------------------------------------------------
-- favorites: your personal shortlist. Single-user app, so no user_id column;
-- RLS below simply requires an authenticated session.
-- ---------------------------------------------------------------------------
create table if not exists public.favorites (
  property_id uuid primary key references public.properties (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
--   * properties / scrape_runs: readable by any authenticated user.
--   * favorites: full access for authenticated users.
--   * All writes to properties/scrape_runs happen server-side with the
--     service-role key, which bypasses RLS — so no write policy is needed.
-- ---------------------------------------------------------------------------
alter table public.properties enable row level security;
alter table public.scrape_runs enable row level security;
alter table public.favorites enable row level security;

drop policy if exists "properties readable by authenticated" on public.properties;
create policy "properties readable by authenticated"
  on public.properties for select
  to authenticated
  using (true);

drop policy if exists "scrape_runs readable by authenticated" on public.scrape_runs;
create policy "scrape_runs readable by authenticated"
  on public.scrape_runs for select
  to authenticated
  using (true);

drop policy if exists "favorites full access by authenticated" on public.favorites;
create policy "favorites full access by authenticated"
  on public.favorites for all
  to authenticated
  using (true)
  with check (true);
