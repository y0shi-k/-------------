-- TKT-0173: ユーザー登録画像（レシピ・食材）のDB/Storage基盤。
--
-- 方針:
--   - 画像本体は既存の非公開バケット `photos` を再利用し、path prefix で用途を分ける。
--       レシピ:   <user_id>/recipe-images/<recipe_id>/<uuid>.webp
--       在庫食材: <user_id>/inventory-images/<item_id>/<uuid>.webp
--   - DB には公開URLではなく Storage path（テキスト）だけを保存する。表示は署名付きURLで行う。
--   - 既存レコードは image_storage_path = null のまま維持する（削除・上書きしない）。
--
-- Storage policy / RLS について:
--   - `photos` バケットの storage.objects policy（schema_v1）は
--     `(storage.foldername(name))[1] = auth.uid()::text` で本人の領域に限定済み。
--     新しい prefix（recipe-images / inventory-images）も先頭フォルダが user_id のため
--     既存ポリシーでそのまま本人限定になる。→ 新規 storage policy は不要。
--   - recipes / inventory_items の RLS（*_select_own 等）は列追加の影響を受けない。
--     新列も同じ行ベースの本人限定ポリシーで保護される。→ 新規 table policy は不要。
--   - 公開バケット化・公開URL保存は行わない。Service Role key もここには書かない。

alter table public.recipes
  add column if not exists image_storage_path text;

alter table public.inventory_items
  add column if not exists image_storage_path text;

-- 防御的制約: path を持つ場合、先頭フォルダは必ず所有者の user_id であること。
-- （Storage policy と二重化し、他人領域を指す path の混入を DB 側でも防ぐ）
alter table public.recipes
  drop constraint if exists recipes_image_path_owned;
alter table public.recipes
  add constraint recipes_image_path_owned
  check (
    image_storage_path is null
    or split_part(image_storage_path, '/', 1) = user_id::text
  );

alter table public.inventory_items
  drop constraint if exists inventory_items_image_path_owned;
alter table public.inventory_items
  add constraint inventory_items_image_path_owned
  check (
    image_storage_path is null
    or split_part(image_storage_path, '/', 1) = user_id::text
  );

comment on column public.recipes.image_storage_path is
  'ユーザー登録レシピ画像の Storage path（photos バケット内 <user_id>/recipe-images/...）。公開URLではない。null=画像なし。';
comment on column public.inventory_items.image_storage_path is
  'ユーザー登録食材画像の Storage path（photos バケット内 <user_id>/inventory-images/...）。公開URLではない。null=画像なし。';
