-- ============================================
-- SKI TRIP PLANNER - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
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
-- TRIPS
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
-- TRIP MEMBERS
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
-- EXPENSES
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
  split_type text default 'equal' not null, -- 'equal', 'custom', 'percentage'
  receipt_url text,
  created_at timestamptz default now() not null
);

-- ============================================
-- EXPENSE SPLITS (who owes what)
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
-- FLIGHTS WATCHLIST
-- ============================================
create table public.flights_watchlist (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  origin text not null, -- IATA code e.g. 'EZE'
  destination text not null, -- IATA code e.g. 'BRC'
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
-- ACCOMMODATIONS (Airbnb tracking)
-- ============================================
create table public.accommodations (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  url text not null,
  platform text default 'airbnb', -- 'airbnb', 'booking', 'manual'
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
-- CHECKLIST
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
-- TRIP INVITES (shareable invite links)
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
-- ROW LEVEL SECURITY (RLS)
-- ============================================
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.flights_watchlist enable row level security;
alter table public.accommodations enable row level security;
alter table public.checklist_items enable row level security;
alter table public.trip_invites enable row level security;

-- Profiles: users can read all profiles, update own
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Trips: members can view their trips
create policy "Trip members can view trips"
  on public.trips for select
  to authenticated
  using (
    id in (select trip_id from public.trip_members where user_id = auth.uid())
  );

create policy "Authenticated users can create trips"
  on public.trips for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Trip owners can update trips"
  on public.trips for update
  to authenticated
  using (
    id in (select trip_id from public.trip_members where user_id = auth.uid() and role = 'owner')
  );

create policy "Trip owners can delete trips"
  on public.trips for delete
  to authenticated
  using (
    id in (select trip_id from public.trip_members where user_id = auth.uid() and role = 'owner')
  );

-- Trip members: members can see other members of their trips
create policy "Members can view trip members"
  on public.trip_members for select
  to authenticated
  using (
    trip_id in (select trip_id from public.trip_members where user_id = auth.uid())
  );

create policy "Trip owners can manage members"
  on public.trip_members for insert
  to authenticated
  with check (
    trip_id in (select trip_id from public.trip_members where user_id = auth.uid() and role = 'owner')
    or user_id = auth.uid()
  );

create policy "Trip owners can remove members"
  on public.trip_members for delete
  to authenticated
  using (
    trip_id in (select trip_id from public.trip_members where user_id = auth.uid() and role = 'owner')
    or user_id = auth.uid()
  );

-- Expenses: trip members can CRUD expenses
create policy "Trip members can view expenses"
  on public.expenses for select
  to authenticated
  using (
    trip_id in (select trip_id from public.trip_members where user_id = auth.uid())
  );

create policy "Trip members can create expenses"
  on public.expenses for insert
  to authenticated
  with check (
    trip_id in (select trip_id from public.trip_members where user_id = auth.uid())
  );

create policy "Expense creator can update"
  on public.expenses for update
  to authenticated
  using (paid_by = auth.uid());

create policy "Expense creator can delete"
  on public.expenses for delete
  to authenticated
  using (paid_by = auth.uid());

-- Expense splits: same as expenses
create policy "Trip members can view splits"
  on public.expense_splits for select
  to authenticated
  using (
    expense_id in (
      select e.id from public.expenses e
      join public.trip_members tm on tm.trip_id = e.trip_id
      where tm.user_id = auth.uid()
    )
  );

create policy "Trip members can create splits"
  on public.expense_splits for insert
  to authenticated
  with check (
    expense_id in (
      select e.id from public.expenses e
      join public.trip_members tm on tm.trip_id = e.trip_id
      where tm.user_id = auth.uid()
    )
  );

create policy "Trip members can update splits"
  on public.expense_splits for update
  to authenticated
  using (
    expense_id in (
      select e.id from public.expenses e
      join public.trip_members tm on tm.trip_id = e.trip_id
      where tm.user_id = auth.uid()
    )
  );

-- Flights watchlist: trip members
create policy "Trip members can view flights"
  on public.flights_watchlist for select
  to authenticated
  using (
    trip_id in (select trip_id from public.trip_members where user_id = auth.uid())
  );

create policy "Trip members can create flight watches"
  on public.flights_watchlist for insert
  to authenticated
  with check (
    trip_id in (select trip_id from public.trip_members where user_id = auth.uid())
  );

create policy "Creator can update flight watches"
  on public.flights_watchlist for update
  to authenticated
  using (created_by = auth.uid());

create policy "Creator can delete flight watches"
  on public.flights_watchlist for delete
  to authenticated
  using (created_by = auth.uid());

-- Accommodations: trip members
create policy "Trip members can view accommodations"
  on public.accommodations for select
  to authenticated
  using (
    trip_id in (select trip_id from public.trip_members where user_id = auth.uid())
  );

create policy "Trip members can create accommodations"
  on public.accommodations for insert
  to authenticated
  with check (
    trip_id in (select trip_id from public.trip_members where user_id = auth.uid())
  );

create policy "Creator can update accommodations"
  on public.accommodations for update
  to authenticated
  using (created_by = auth.uid());

create policy "Creator can delete accommodations"
  on public.accommodations for delete
  to authenticated
  using (created_by = auth.uid());

-- Checklist: trip members
create policy "Trip members can view checklist"
  on public.checklist_items for select
  to authenticated
  using (
    trip_id in (select trip_id from public.trip_members where user_id = auth.uid())
  );

create policy "Trip members can create checklist items"
  on public.checklist_items for insert
  to authenticated
  with check (
    trip_id in (select trip_id from public.trip_members where user_id = auth.uid())
  );

create policy "Trip members can update checklist items"
  on public.checklist_items for update
  to authenticated
  using (
    trip_id in (select trip_id from public.trip_members where user_id = auth.uid())
  );

create policy "Creator can delete checklist items"
  on public.checklist_items for delete
  to authenticated
  using (created_by = auth.uid());

-- Trip invites: anyone authenticated can read (to join), owners can create
create policy "Anyone can view active invites"
  on public.trip_invites for select
  to authenticated
  using (is_active = true);

create policy "Trip owners can create invites"
  on public.trip_invites for insert
  to authenticated
  with check (
    trip_id in (select trip_id from public.trip_members where user_id = auth.uid() and role = 'owner')
  );
