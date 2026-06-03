-- TKT-0167: レシピのお気に入り（is_favorite）を新設する。
-- 既存の recipes 行ポリシー（auth.uid() = user_id）で参照・更新は自分の行に限定されるため、
-- 新規 RLS ポリシーは追加しない。既存レシピは default false で後方互換。
alter table public.recipes
  add column if not exists is_favorite boolean not null default false;
