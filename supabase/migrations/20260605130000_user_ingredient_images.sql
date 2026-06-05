-- TKT-0176: ユーザー別・食材名別の画像記憶。
--
-- 画像本体は非公開 `photos` バケットへ保存し、このテーブルには Storage path だけを保存する。
-- 公開URL・署名付きURLは保存しない。

create table if not exists public.user_ingredient_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  normalized_name text not null,
  display_name text not null,
  image_storage_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_ingredient_images_name_not_blank check (length(trim(normalized_name)) > 0),
  constraint user_ingredient_images_image_path_owned check (split_part(image_storage_path, '/', 1) = user_id::text),
  constraint user_ingredient_images_user_name_unique unique (user_id, normalized_name)
);

alter table public.user_ingredient_images enable row level security;

drop policy if exists user_ingredient_images_select_own on public.user_ingredient_images;
create policy user_ingredient_images_select_own
  on public.user_ingredient_images
  for select
  using (auth.uid() = user_id);

drop policy if exists user_ingredient_images_insert_own on public.user_ingredient_images;
create policy user_ingredient_images_insert_own
  on public.user_ingredient_images
  for insert
  with check (auth.uid() = user_id);

drop policy if exists user_ingredient_images_update_own on public.user_ingredient_images;
create policy user_ingredient_images_update_own
  on public.user_ingredient_images
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists user_ingredient_images_delete_own on public.user_ingredient_images;
create policy user_ingredient_images_delete_own
  on public.user_ingredient_images
  for delete
  using (auth.uid() = user_id);

drop trigger if exists set_user_ingredient_images_updated_at on public.user_ingredient_images;
create trigger set_user_ingredient_images_updated_at
  before update on public.user_ingredient_images
  for each row
  execute function public.set_updated_at();

comment on table public.user_ingredient_images is
  'ユーザーが明示保存した食材名別画像。Storage pathのみ保存し、公開URLは保存しない。';
comment on column public.user_ingredient_images.normalized_name is
  'NFKC正規化、小文字化、空白除去した食材名。';
comment on column public.user_ingredient_images.image_storage_path is
  '非公開 photos バケット内の Storage path（<user_id>/ingredient-images/...）。';
