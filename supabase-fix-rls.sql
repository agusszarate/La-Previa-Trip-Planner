-- Fix infinite recursion in trip_members policies
-- Run this in Supabase SQL Editor

-- Drop the problematic policies
drop policy if exists "Members can view trip members" on public.trip_members;
drop policy if exists "Trip owners can manage members" on public.trip_members;
drop policy if exists "Trip owners can remove members" on public.trip_members;

-- Also fix trips policies that reference trip_members
drop policy if exists "Trip members can view trips" on public.trips;
drop policy if exists "Trip owners can update trips" on public.trips;
drop policy if exists "Trip owners can delete trips" on public.trips;

-- Recreate trips policies using a security definer function to avoid recursion
create or replace function public.get_user_trip_ids(uid uuid)
returns setof uuid
language sql
security definer
stable
as $$
  select trip_id from public.trip_members where user_id = uid;
$$;

create or replace function public.get_user_owned_trip_ids(uid uuid)
returns setof uuid
language sql
security definer
stable
as $$
  select trip_id from public.trip_members where user_id = uid and role = 'owner';
$$;

-- Trips: use security definer functions
create policy "Trip members can view trips"
  on public.trips for select
  to authenticated
  using (id in (select public.get_user_trip_ids(auth.uid())));

create policy "Trip owners can update trips"
  on public.trips for update
  to authenticated
  using (id in (select public.get_user_owned_trip_ids(auth.uid())));

create policy "Trip owners can delete trips"
  on public.trips for delete
  to authenticated
  using (id in (select public.get_user_owned_trip_ids(auth.uid())));

-- Trip members: use security definer functions
create policy "Members can view trip members"
  on public.trip_members for select
  to authenticated
  using (trip_id in (select public.get_user_trip_ids(auth.uid())));

create policy "Users can add themselves or owners can add members"
  on public.trip_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or trip_id in (select public.get_user_owned_trip_ids(auth.uid()))
  );

create policy "Owners can remove members or users can leave"
  on public.trip_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or trip_id in (select public.get_user_owned_trip_ids(auth.uid()))
  );

-- Also fix expenses, expense_splits, flights, accommodations, checklist
-- that reference trip_members (same recursion risk)
drop policy if exists "Trip members can view expenses" on public.expenses;
drop policy if exists "Trip members can create expenses" on public.expenses;
drop policy if exists "Trip members can view splits" on public.expense_splits;
drop policy if exists "Trip members can create splits" on public.expense_splits;
drop policy if exists "Trip members can update splits" on public.expense_splits;
drop policy if exists "Trip members can view flights" on public.flights_watchlist;
drop policy if exists "Trip members can create flight watches" on public.flights_watchlist;
drop policy if exists "Trip members can view accommodations" on public.accommodations;
drop policy if exists "Trip members can create accommodations" on public.accommodations;
drop policy if exists "Trip members can view checklist" on public.checklist_items;
drop policy if exists "Trip members can create checklist items" on public.checklist_items;
drop policy if exists "Trip members can update checklist items" on public.checklist_items;

-- Recreate with security definer function
create policy "Trip members can view expenses"
  on public.expenses for select to authenticated
  using (trip_id in (select public.get_user_trip_ids(auth.uid())));

create policy "Trip members can create expenses"
  on public.expenses for insert to authenticated
  with check (trip_id in (select public.get_user_trip_ids(auth.uid())));

create policy "Trip members can view splits"
  on public.expense_splits for select to authenticated
  using (expense_id in (
    select id from public.expenses where trip_id in (select public.get_user_trip_ids(auth.uid()))
  ));

create policy "Trip members can create splits"
  on public.expense_splits for insert to authenticated
  with check (expense_id in (
    select id from public.expenses where trip_id in (select public.get_user_trip_ids(auth.uid()))
  ));

create policy "Trip members can update splits"
  on public.expense_splits for update to authenticated
  using (expense_id in (
    select id from public.expenses where trip_id in (select public.get_user_trip_ids(auth.uid()))
  ));

create policy "Trip members can view flights"
  on public.flights_watchlist for select to authenticated
  using (trip_id in (select public.get_user_trip_ids(auth.uid())));

create policy "Trip members can create flight watches"
  on public.flights_watchlist for insert to authenticated
  with check (trip_id in (select public.get_user_trip_ids(auth.uid())));

create policy "Trip members can view accommodations"
  on public.accommodations for select to authenticated
  using (trip_id in (select public.get_user_trip_ids(auth.uid())));

create policy "Trip members can create accommodations"
  on public.accommodations for insert to authenticated
  with check (trip_id in (select public.get_user_trip_ids(auth.uid())));

create policy "Trip members can view checklist"
  on public.checklist_items for select to authenticated
  using (trip_id in (select public.get_user_trip_ids(auth.uid())));

create policy "Trip members can create checklist items"
  on public.checklist_items for insert to authenticated
  with check (trip_id in (select public.get_user_trip_ids(auth.uid())));

create policy "Trip members can update checklist items"
  on public.checklist_items for update to authenticated
  using (trip_id in (select public.get_user_trip_ids(auth.uid())));
