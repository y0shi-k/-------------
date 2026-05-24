-- TKT-0116: user-owned storage location master.
-- Locations are editable by each user and used as selectable candidates in the Web UI.

create table if not exists public.storage_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists storage_locations_user_sort_idx on public.storage_locations (user_id, sort_order, name);

drop trigger if exists set_storage_locations_updated_at on public.storage_locations;
create trigger set_storage_locations_updated_at
before update on public.storage_locations
for each row execute function public.set_updated_at();

alter table public.storage_locations enable row level security;

drop policy if exists "storage_locations_select_own" on public.storage_locations;
drop policy if exists "storage_locations_insert_own" on public.storage_locations;
drop policy if exists "storage_locations_update_own" on public.storage_locations;
drop policy if exists "storage_locations_delete_own" on public.storage_locations;
create policy "storage_locations_select_own" on public.storage_locations for select using (auth.uid() = user_id);
create policy "storage_locations_insert_own" on public.storage_locations for insert with check (auth.uid() = user_id);
create policy "storage_locations_update_own" on public.storage_locations for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "storage_locations_delete_own" on public.storage_locations for delete using (auth.uid() = user_id);
