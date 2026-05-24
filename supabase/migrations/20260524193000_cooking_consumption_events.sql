create table if not exists public.cooking_consumption_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cooking_history_id uuid,
  meal_schedule_id uuid,
  recipe_id uuid,
  ingredient_name text not null default '',
  requested_amount numeric not null default 0 check (requested_amount >= 0),
  requested_unit text not null default '',
  consumed_amount numeric not null default 0 check (consumed_amount >= 0),
  consumed_unit text not null default '',
  stock_item_id uuid,
  stock_item_name text not null default '',
  substitute_for text not null default '',
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (cooking_history_id, user_id) references public.cooking_history(id, user_id) on delete set null,
  foreign key (meal_schedule_id, user_id) references public.meal_schedules(id, user_id) on delete set null,
  foreign key (recipe_id, user_id) references public.recipes(id, user_id) on delete set null,
  foreign key (stock_item_id, user_id) references public.inventory_items(id, user_id) on delete set null
);

create index if not exists cooking_consumption_events_user_history_idx on public.cooking_consumption_events (user_id, cooking_history_id);
create index if not exists cooking_consumption_events_user_schedule_idx on public.cooking_consumption_events (user_id, meal_schedule_id);

alter table public.cooking_consumption_events enable row level security;

drop policy if exists "cooking_consumption_events_select_own" on public.cooking_consumption_events;
drop policy if exists "cooking_consumption_events_insert_own" on public.cooking_consumption_events;
drop policy if exists "cooking_consumption_events_update_own" on public.cooking_consumption_events;
drop policy if exists "cooking_consumption_events_delete_own" on public.cooking_consumption_events;
create policy "cooking_consumption_events_select_own" on public.cooking_consumption_events for select using (auth.uid() = user_id);
create policy "cooking_consumption_events_insert_own" on public.cooking_consumption_events for insert with check (auth.uid() = user_id);
create policy "cooking_consumption_events_update_own" on public.cooking_consumption_events for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cooking_consumption_events_delete_own" on public.cooking_consumption_events for delete using (auth.uid() = user_id);
