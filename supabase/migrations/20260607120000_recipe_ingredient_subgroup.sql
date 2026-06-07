-- TKT-0200: 材料・調味料のサブグループ番号（group_index）を新設する。
-- 0=未グループ。既存の recipe_ingredients 行ポリシー（auth.uid() = user_id）で参照・更新は
-- 自分の行に限定されるため、新規 RLS ポリシーは追加しない。既存行は default 0 で後方互換。
alter table public.recipe_ingredients
  add column if not exists group_index integer not null default 0 check (group_index >= 0);

-- item_type → group_index → sort_order の複合取得順を支える索引（任意）。
create index if not exists recipe_ingredients_user_recipe_group_idx
  on public.recipe_ingredients (user_id, recipe_id, item_type, group_index, sort_order);
