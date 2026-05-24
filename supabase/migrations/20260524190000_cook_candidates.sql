create table if not exists public.cook_candidates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid,
  recipe_name text not null default '',
  reasons text[] not null default '{}',
  status text not null default '候補' check (status in ('候補', '解除')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (recipe_id, user_id) references public.recipes(id, user_id) on delete set null
);

create index if not exists cook_candidates_user_created_idx on public.cook_candidates (user_id, created_at desc);
create index if not exists cook_candidates_user_recipe_idx on public.cook_candidates (user_id, recipe_id);

drop trigger if exists set_cook_candidates_updated_at on public.cook_candidates;
create trigger set_cook_candidates_updated_at
before update on public.cook_candidates
for each row execute function public.set_updated_at();

alter table public.cook_candidates enable row level security;

drop policy if exists "cook_candidates_select_own" on public.cook_candidates;
drop policy if exists "cook_candidates_insert_own" on public.cook_candidates;
drop policy if exists "cook_candidates_update_own" on public.cook_candidates;
drop policy if exists "cook_candidates_delete_own" on public.cook_candidates;
create policy "cook_candidates_select_own" on public.cook_candidates for select using (auth.uid() = user_id);
create policy "cook_candidates_insert_own" on public.cook_candidates for insert with check (auth.uid() = user_id);
create policy "cook_candidates_update_own" on public.cook_candidates for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cook_candidates_delete_own" on public.cook_candidates for delete using (auth.uid() = user_id);
