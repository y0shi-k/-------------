-- TKT-0228: Approval-based login foundation (profiles table).
-- Adds public.profiles to express "who is approved" (status) and
-- "who is an admin" (role). New auth.users get a profiles row via an
-- AFTER INSERT trigger (pending/member). Existing users are backfilled as
-- approved so they are not locked out. Admin reads/writes go through RLS
-- using a SECURITY DEFINER is_admin() helper to avoid policy recursion.
-- Do not place API keys, service role keys, or personal emails here.
-- The first admin is promoted manually via the runbook SQL.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'disabled')),
  role text not null default 'member' check (role in ('member', 'admin')),
  approved_at timestamptz,
  approved_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_status_idx on public.profiles (status);
create index if not exists profiles_role_idx on public.profiles (role);

-- Keep updated_at fresh on every update (reuses the shared trigger fn).
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- handle_new_user: auto-create a profiles row when an auth user is created.
-- SECURITY DEFINER + fixed search_path is required to insert from a trigger
-- on the auth schema into public. New users start as pending/member; an admin
-- must approve them before they can use the app.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, status, role)
  -- coalesce: a null email (e.g. future social login) must not abort signup
  values (new.id, coalesce(new.email, ''), 'pending', 'member')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill: existing auth.users become approved/member so the current
-- (manually created) test users keep logging in. on conflict guards against
-- rows already created by the trigger or a re-run of this migration.
insert into public.profiles (id, email, status, role, approved_at)
select u.id, coalesce(u.email, ''), 'approved', 'member', now()
from auth.users u
on conflict (id) do nothing;

-- is_admin: SECURITY DEFINER + stable. Reads profiles with definer
-- privileges so admin RLS policies can call it without recursing into the
-- profiles RLS policies they are evaluating.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

alter table public.profiles enable row level security;

-- select: a user can read their own row; admins can read every row.
-- update: admins only (member self-update of status/role is not allowed).
-- No insert/delete policies => clients cannot insert or delete; rows are
-- created exclusively by the handle_new_user trigger (and the backfill).
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- is_admin() must be callable by logged-in users only (RLS policy evaluation
-- runs as the caller). Keep it closed to anon/public.
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
