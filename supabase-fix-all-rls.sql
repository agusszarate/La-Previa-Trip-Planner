-- ===========================================
-- NUCLEAR FIX: Drop ALL policies and recreate
-- Run this in Supabase SQL Editor
-- ===========================================

-- Drop every single policy
do $$
declare
  r record;
begin
  for r in (
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
  ) loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- Drop old functions if they exist
drop function if exists public.get_user_trip_ids(uuid);
drop function if exists public.get_user_owned_trip_ids(uuid);

-- Helper functions (security definer = bypasses RLS)
create or replace function public.get_my_trip_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select trip_id from public.trip_members where user_id = auth.uid();
$$;

create or replace function public.get_my_owned_trip_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select trip_id from public.trip_members where user_id = auth.uid() and role = 'owner';
$$;

-- ===========================================
-- PROFILES
-- ===========================================
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update" on public.profiles
  for update to authenticated using (id = auth.uid());

-- ===========================================
-- TRIPS
-- ===========================================
create policy "trips_select" on public.trips
  for select to authenticated
  using (id in (select public.get_my_trip_ids()));

create policy "trips_insert" on public.trips
  for insert to authenticated
  with check (true);

create policy "trips_update" on public.trips
  for update to authenticated
  using (id in (select public.get_my_owned_trip_ids()));

create policy "trips_delete" on public.trips
  for delete to authenticated
  using (id in (select public.get_my_owned_trip_ids()));

-- ===========================================
-- TRIP MEMBERS
-- ===========================================
create policy "trip_members_select" on public.trip_members
  for select to authenticated
  using (trip_id in (select public.get_my_trip_ids()));

create policy "trip_members_insert" on public.trip_members
  for insert to authenticated
  with check (true);

create policy "trip_members_delete" on public.trip_members
  for delete to authenticated
  using (
    user_id = auth.uid()
    or trip_id in (select public.get_my_owned_trip_ids())
  );

-- ===========================================
-- EXPENSES
-- ===========================================
create policy "expenses_select" on public.expenses
  for select to authenticated
  using (trip_id in (select public.get_my_trip_ids()));

create policy "expenses_insert" on public.expenses
  for insert to authenticated
  with check (trip_id in (select public.get_my_trip_ids()));

create policy "expenses_update" on public.expenses
  for update to authenticated
  using (paid_by = auth.uid());

create policy "expenses_delete" on public.expenses
  for delete to authenticated
  using (paid_by = auth.uid());

-- ===========================================
-- EXPENSE SPLITS
-- ===========================================
create policy "splits_select" on public.expense_splits
  for select to authenticated
  using (expense_id in (
    select id from public.expenses where trip_id in (select public.get_my_trip_ids())
  ));

create policy "splits_insert" on public.expense_splits
  for insert to authenticated
  with check (expense_id in (
    select id from public.expenses where trip_id in (select public.get_my_trip_ids())
  ));

create policy "splits_update" on public.expense_splits
  for update to authenticated
  using (expense_id in (
    select id from public.expenses where trip_id in (select public.get_my_trip_ids())
  ));

-- ===========================================
-- FLIGHTS WATCHLIST
-- ===========================================
create policy "flights_select" on public.flights_watchlist
  for select to authenticated
  using (trip_id in (select public.get_my_trip_ids()));

create policy "flights_insert" on public.flights_watchlist
  for insert to authenticated
  with check (trip_id in (select public.get_my_trip_ids()));

create policy "flights_update" on public.flights_watchlist
  for update to authenticated
  using (created_by = auth.uid());

create policy "flights_delete" on public.flights_watchlist
  for delete to authenticated
  using (created_by = auth.uid());

-- ===========================================
-- ACCOMMODATIONS
-- ===========================================
create policy "accommodations_select" on public.accommodations
  for select to authenticated
  using (trip_id in (select public.get_my_trip_ids()));

create policy "accommodations_insert" on public.accommodations
  for insert to authenticated
  with check (trip_id in (select public.get_my_trip_ids()));

create policy "accommodations_update" on public.accommodations
  for update to authenticated
  using (created_by = auth.uid());

create policy "accommodations_delete" on public.accommodations
  for delete to authenticated
  using (created_by = auth.uid());

-- ===========================================
-- CHECKLIST ITEMS
-- ===========================================
create policy "checklist_select" on public.checklist_items
  for select to authenticated
  using (trip_id in (select public.get_my_trip_ids()));

create policy "checklist_insert" on public.checklist_items
  for insert to authenticated
  with check (trip_id in (select public.get_my_trip_ids()));

create policy "checklist_update" on public.checklist_items
  for update to authenticated
  using (trip_id in (select public.get_my_trip_ids()));

create policy "checklist_delete" on public.checklist_items
  for delete to authenticated
  using (created_by = auth.uid());

-- ===========================================
-- TRIP INVITES
-- ===========================================
create policy "invites_select" on public.trip_invites
  for select to authenticated
  using (is_active = true);

create policy "invites_insert" on public.trip_invites
  for insert to authenticated
  with check (trip_id in (select public.get_my_owned_trip_ids()));
