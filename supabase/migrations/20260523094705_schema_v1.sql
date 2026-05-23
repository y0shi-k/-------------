-- TKT-0103: Stock Master Web schema v1.
-- This migration defines user-owned data tables, RLS policies, and a private
-- photo storage bucket. Do not place API keys or database passwords here.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default '食材' check (category in ('食材', '調味料')),
  name text not null,
  quantity numeric not null default 0 check (quantity >= 0),
  unit text not null default '',
  purchased_on date,
  opened_on date,
  display_expires_on date,
  effective_expires_on date,
  storage_location text not null default 'その他',
  status_note text not null default '',
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.staging_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default '食材' check (category in ('食材', '調味料')),
  name text not null,
  quantity numeric not null default 0 check (quantity >= 0),
  unit text not null default '',
  display_expires_on date,
  effective_expires_on date,
  storage_location text not null default 'その他',
  status_note text not null default '',
  source text not null default 'manual',
  raw_text text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  required_quantity numeric not null default 0 check (required_quantity >= 0),
  unit text not null default '',
  status text not null default '未購入' check (status in ('未購入', '購入済')),
  linked_recipe_name text not null default '',
  source_type text not null default 'manual',
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  source text not null default '',
  genre jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  prep_steps jsonb not null default '[]'::jsonb,
  cook_count integer not null default 0 check (cook_count >= 0),
  cooked_on_history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null,
  item_type text not null default '食材' check (item_type in ('食材', '調味料')),
  name text not null,
  amount numeric not null default 0 check (amount >= 0),
  unit text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (recipe_id, user_id) references public.recipes(id, user_id) on delete cascade
);

create table if not exists public.meal_schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  scheduled_on date not null,
  meal_type text not null default 'その他' check (meal_type in ('朝', '昼', '晩', 'その他')),
  recipe_id uuid,
  recipe_name text not null default '',
  status text not null default '未完了' check (status in ('未完了', '完了')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (recipe_id, user_id) references public.recipes(id, user_id) on delete set null
);

create table if not exists public.cooking_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cooked_at timestamptz not null default now(),
  recipe_id uuid,
  recipe_name text not null default '',
  meal_schedule_id uuid,
  note text not null default '',
  rating integer check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (recipe_id, user_id) references public.recipes(id, user_id) on delete set null,
  foreign key (meal_schedule_id, user_id) references public.meal_schedules(id, user_id) on delete set null
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bucket_id text not null default 'photos',
  storage_path text not null,
  usage_type text not null default 'cooking_history',
  cooking_history_id uuid,
  content_type text,
  byte_size integer check (byte_size is null or byte_size >= 0),
  width integer check (width is null or width > 0),
  height integer check (height is null or height > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (bucket_id, storage_path),
  foreign key (cooking_history_id, user_id) references public.cooking_history(id, user_id) on delete set null
);

create index if not exists inventory_items_user_location_idx on public.inventory_items (user_id, storage_location);
create index if not exists inventory_items_user_expiry_idx on public.inventory_items (user_id, effective_expires_on, display_expires_on);
create index if not exists staging_items_user_created_idx on public.staging_items (user_id, created_at desc);
create index if not exists shopping_items_user_status_idx on public.shopping_items (user_id, status, created_at desc);
create index if not exists recipes_user_name_idx on public.recipes (user_id, name);
create index if not exists recipe_ingredients_user_recipe_idx on public.recipe_ingredients (user_id, recipe_id, sort_order);
create index if not exists meal_schedules_user_date_idx on public.meal_schedules (user_id, scheduled_on, meal_type);
create index if not exists cooking_history_user_cooked_idx on public.cooking_history (user_id, cooked_at desc);
create index if not exists photos_user_history_idx on public.photos (user_id, cooking_history_id);

drop trigger if exists set_inventory_items_updated_at on public.inventory_items;
create trigger set_inventory_items_updated_at
before update on public.inventory_items
for each row execute function public.set_updated_at();

drop trigger if exists set_staging_items_updated_at on public.staging_items;
create trigger set_staging_items_updated_at
before update on public.staging_items
for each row execute function public.set_updated_at();

drop trigger if exists set_shopping_items_updated_at on public.shopping_items;
create trigger set_shopping_items_updated_at
before update on public.shopping_items
for each row execute function public.set_updated_at();

drop trigger if exists set_recipes_updated_at on public.recipes;
create trigger set_recipes_updated_at
before update on public.recipes
for each row execute function public.set_updated_at();

drop trigger if exists set_recipe_ingredients_updated_at on public.recipe_ingredients;
create trigger set_recipe_ingredients_updated_at
before update on public.recipe_ingredients
for each row execute function public.set_updated_at();

drop trigger if exists set_meal_schedules_updated_at on public.meal_schedules;
create trigger set_meal_schedules_updated_at
before update on public.meal_schedules
for each row execute function public.set_updated_at();

drop trigger if exists set_cooking_history_updated_at on public.cooking_history;
create trigger set_cooking_history_updated_at
before update on public.cooking_history
for each row execute function public.set_updated_at();

drop trigger if exists set_photos_updated_at on public.photos;
create trigger set_photos_updated_at
before update on public.photos
for each row execute function public.set_updated_at();

alter table public.inventory_items enable row level security;
alter table public.staging_items enable row level security;
alter table public.shopping_items enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.meal_schedules enable row level security;
alter table public.cooking_history enable row level security;
alter table public.photos enable row level security;

drop policy if exists "inventory_items_select_own" on public.inventory_items;
drop policy if exists "inventory_items_insert_own" on public.inventory_items;
drop policy if exists "inventory_items_update_own" on public.inventory_items;
drop policy if exists "inventory_items_delete_own" on public.inventory_items;
create policy "inventory_items_select_own" on public.inventory_items for select using (auth.uid() = user_id);
create policy "inventory_items_insert_own" on public.inventory_items for insert with check (auth.uid() = user_id);
create policy "inventory_items_update_own" on public.inventory_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "inventory_items_delete_own" on public.inventory_items for delete using (auth.uid() = user_id);

drop policy if exists "staging_items_select_own" on public.staging_items;
drop policy if exists "staging_items_insert_own" on public.staging_items;
drop policy if exists "staging_items_update_own" on public.staging_items;
drop policy if exists "staging_items_delete_own" on public.staging_items;
create policy "staging_items_select_own" on public.staging_items for select using (auth.uid() = user_id);
create policy "staging_items_insert_own" on public.staging_items for insert with check (auth.uid() = user_id);
create policy "staging_items_update_own" on public.staging_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "staging_items_delete_own" on public.staging_items for delete using (auth.uid() = user_id);

drop policy if exists "shopping_items_select_own" on public.shopping_items;
drop policy if exists "shopping_items_insert_own" on public.shopping_items;
drop policy if exists "shopping_items_update_own" on public.shopping_items;
drop policy if exists "shopping_items_delete_own" on public.shopping_items;
create policy "shopping_items_select_own" on public.shopping_items for select using (auth.uid() = user_id);
create policy "shopping_items_insert_own" on public.shopping_items for insert with check (auth.uid() = user_id);
create policy "shopping_items_update_own" on public.shopping_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "shopping_items_delete_own" on public.shopping_items for delete using (auth.uid() = user_id);

drop policy if exists "recipes_select_own" on public.recipes;
drop policy if exists "recipes_insert_own" on public.recipes;
drop policy if exists "recipes_update_own" on public.recipes;
drop policy if exists "recipes_delete_own" on public.recipes;
create policy "recipes_select_own" on public.recipes for select using (auth.uid() = user_id);
create policy "recipes_insert_own" on public.recipes for insert with check (auth.uid() = user_id);
create policy "recipes_update_own" on public.recipes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recipes_delete_own" on public.recipes for delete using (auth.uid() = user_id);

drop policy if exists "recipe_ingredients_select_own" on public.recipe_ingredients;
drop policy if exists "recipe_ingredients_insert_own" on public.recipe_ingredients;
drop policy if exists "recipe_ingredients_update_own" on public.recipe_ingredients;
drop policy if exists "recipe_ingredients_delete_own" on public.recipe_ingredients;
create policy "recipe_ingredients_select_own" on public.recipe_ingredients for select using (auth.uid() = user_id);
create policy "recipe_ingredients_insert_own" on public.recipe_ingredients for insert with check (auth.uid() = user_id);
create policy "recipe_ingredients_update_own" on public.recipe_ingredients for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "recipe_ingredients_delete_own" on public.recipe_ingredients for delete using (auth.uid() = user_id);

drop policy if exists "meal_schedules_select_own" on public.meal_schedules;
drop policy if exists "meal_schedules_insert_own" on public.meal_schedules;
drop policy if exists "meal_schedules_update_own" on public.meal_schedules;
drop policy if exists "meal_schedules_delete_own" on public.meal_schedules;
create policy "meal_schedules_select_own" on public.meal_schedules for select using (auth.uid() = user_id);
create policy "meal_schedules_insert_own" on public.meal_schedules for insert with check (auth.uid() = user_id);
create policy "meal_schedules_update_own" on public.meal_schedules for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "meal_schedules_delete_own" on public.meal_schedules for delete using (auth.uid() = user_id);

drop policy if exists "cooking_history_select_own" on public.cooking_history;
drop policy if exists "cooking_history_insert_own" on public.cooking_history;
drop policy if exists "cooking_history_update_own" on public.cooking_history;
drop policy if exists "cooking_history_delete_own" on public.cooking_history;
create policy "cooking_history_select_own" on public.cooking_history for select using (auth.uid() = user_id);
create policy "cooking_history_insert_own" on public.cooking_history for insert with check (auth.uid() = user_id);
create policy "cooking_history_update_own" on public.cooking_history for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cooking_history_delete_own" on public.cooking_history for delete using (auth.uid() = user_id);

drop policy if exists "photos_select_own" on public.photos;
drop policy if exists "photos_insert_own" on public.photos;
drop policy if exists "photos_update_own" on public.photos;
drop policy if exists "photos_delete_own" on public.photos;
create policy "photos_select_own" on public.photos for select using (auth.uid() = user_id);
create policy "photos_insert_own" on public.photos for insert with check (auth.uid() = user_id);
create policy "photos_update_own" on public.photos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "photos_delete_own" on public.photos for delete using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "photos_storage_select_own_path" on storage.objects;
drop policy if exists "photos_storage_insert_own_path" on storage.objects;
drop policy if exists "photos_storage_update_own_path" on storage.objects;
drop policy if exists "photos_storage_delete_own_path" on storage.objects;

create policy "photos_storage_select_own_path"
on storage.objects for select
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "photos_storage_insert_own_path"
on storage.objects for insert
with check (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "photos_storage_update_own_path"
on storage.objects for update
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "photos_storage_delete_own_path"
on storage.objects for delete
using (
  bucket_id = 'photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
