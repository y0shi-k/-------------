-- TKT-0212: スケジュール登録時に追加した買い物リスト項目を、そのスケジュール削除時に
-- 連動削除できるよう、shopping_items にスケジュールへの紐付け meal_schedule_id を新設する。
-- 既存の shopping_items 行ポリシー（auth.uid() = user_id）で参照・削除・更新・挿入は自分の行に
-- 限定されるため、新規 RLS ポリシーは追加しない。既存行・手動追加・レシピ詳細からの追加は
-- meal_schedule_id = null（後方互換）。
alter table public.shopping_items
  add column if not exists meal_schedule_id uuid;

-- 既存の複合FKパターン（id, user_id）に合わせる。アプリ側は削除前に明示削除するが、
-- 取りこぼし時の孤児FK違反を防ぐ保険として on delete set null（user_id は not null のため
-- 列指定 SET NULL で meal_schedule_id のみ null にする）。
alter table public.shopping_items
  drop constraint if exists shopping_items_meal_schedule_id_user_id_fkey,
  add constraint shopping_items_meal_schedule_id_user_id_fkey
  foreign key (meal_schedule_id, user_id)
  references public.meal_schedules(id, user_id)
  on delete set null (meal_schedule_id);

create index if not exists shopping_items_user_meal_schedule_idx
  on public.shopping_items (user_id, meal_schedule_id);
