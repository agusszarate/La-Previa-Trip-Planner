-- ============================================
-- LA PREVIA - Complete Database Schema
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- 2. TRIPS
-- ============================================
create table public.trips (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  destination text,
  start_date date,
  end_date date,
  cover_image text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- ============================================
-- 3. TRIP MEMBERS
-- ============================================
create type member_role as enum ('owner', 'member');

create table public.trip_members (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role member_role default 'member' not null,
  joined_at timestamptz default now() not null,
  unique(trip_id, user_id)
);

-- ============================================
-- 4. EXPENSES
-- ============================================
create type expense_category as enum (
  'alojamiento', 'transporte', 'comida', 'equipamiento',
  'skipass', 'actividades', 'otros'
);

create type currency_type as enum ('ARS', 'USD', 'EUR', 'BRL');

create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  description text not null,
  amount numeric(12, 2) not null,
  currency currency_type default 'ARS' not null,
  category expense_category default 'otros' not null,
  paid_by uuid references public.profiles(id) on delete set null not null,
  split_type text default 'equal' not null,
  receipt_url text,
  created_at timestamptz default now() not null
);

-- ============================================
-- 5. EXPENSE SPLITS (who owes what)
-- ============================================
create table public.expense_splits (
  id uuid default uuid_generate_v4() primary key,
  expense_id uuid references public.expenses(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount numeric(12, 2) not null,
  is_settled boolean default false not null,
  settled_at timestamptz,
  unique(expense_id, user_id)
);

-- ============================================
-- 6. FLIGHTS WATCHLIST
-- ============================================
create table public.flights_watchlist (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  origin text not null,
  destination text not null,
  date_from date not null,
  date_to date,
  max_price numeric(10, 2),
  currency currency_type default 'ARS',
  last_checked_at timestamptz,
  last_price numeric(10, 2),
  lowest_price numeric(10, 2),
  alert_email text,
  is_active boolean default true not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- ============================================
-- 7. ACCOMMODATIONS (Airbnb/Booking tracking)
-- ============================================
create table public.accommodations (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  url text not null,
  platform text default 'airbnb',
  name text,
  price_per_night numeric(10, 2),
  currency currency_type default 'USD',
  total_price numeric(10, 2),
  location text,
  rating numeric(3, 2),
  max_guests integer,
  image_url text,
  last_scraped_at timestamptz,
  price_history jsonb default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- ============================================
-- 8. CHECKLIST
-- ============================================
create table public.checklist_items (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  text text not null,
  assigned_to uuid references public.profiles(id) on delete set null,
  is_done boolean default false not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- ============================================
-- 9. TRIP INVITES (shareable invite links)
-- ============================================
create table public.trip_invites (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  code text unique not null,
  is_active boolean default true not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- ============================================
-- 10. TRIP OPTIONS (combo builder)
-- ============================================
create type option_category as enum (
  'alojamiento', 'transporte_ida', 'transporte_vuelta',
  'skipass', 'equipamiento', 'comida', 'actividades', 'otros'
);

create table public.trip_options (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  category option_category not null,
  name text not null,
  description text,
  url text,
  price numeric(12, 2),
  currency text default 'ARS',
  price_per_person numeric(12, 2),
  is_per_person boolean default false not null,
  image_url text,
  notes text,
  votes uuid[] default '{}',
  is_selected boolean default false not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- ============================================
-- 11. COMBO SELECTIONS (user preferences)
-- ============================================
create table public.combo_selections (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  option_id uuid references public.trip_options(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(trip_id, user_id, option_id)
);

-- ============================================
-- DISABLE RLS ON ALL TABLES
-- (app is for friends, auth is handled by Supabase Auth)
-- ============================================
alter table public.profiles disable row level security;
alter table public.trips disable row level security;
alter table public.trip_members disable row level security;
alter table public.expenses disable row level security;
alter table public.expense_splits disable row level security;
alter table public.flights_watchlist disable row level security;
alter table public.accommodations disable row level security;
alter table public.checklist_items disable row level security;
alter table public.trip_invites disable row level security;
alter table public.trip_options disable row level security;
alter table public.combo_selections disable row level security;
