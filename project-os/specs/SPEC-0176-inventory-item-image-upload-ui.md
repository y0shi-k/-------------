---
id: SPEC-0176-inventory-item-image-upload-ui
title: 食材画像の登録・差し替え・削除UI（同名食材の記憶つき）
status: spec_ready
scope:
  - supabase/migrations/
  - web/src/components/inventory-board.tsx
  - web/src/lib/ui/ingredient-image.ts
  - web/src/lib/photos/
  - web/src/lib/
  - web/src/app/globals.css
  - web/src/__tests__/
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - TKT-0173のDB/Storage基盤を前提にする
  - TKT-0175の標準画像カタログを壊さない
  - 画像は非公開Storageへ保存し、表示は署名付きURLを使う
  - 元画像を巨大なまま保存しない
  - 公開URL、署名付きURL、APIキー、Service Role keyをDBやコードに直書きしない
acceptance:
  - 食材/在庫編集画面で画像を選択・プレビュー・保存できる
  - 食材画像を差し替えできる
  - 食材画像を削除でき、削除後は標準画像または絵文字へ戻る
  - 自動では標準画像/絵文字が表示され、ユーザーが変更した場合はユーザー画像が優先表示される
  - ユーザーが画像を保存した食材名は、同じユーザーの同名食材で次回から優先表示される
  - 在庫一覧では、個別在庫画像 → ユーザー食材名画像 → 標準画像 → 絵文字の順で表示される
  - 買い物リスト・候補表示では、明示的に保存済みのユーザー食材名画像がある場合だけ優先表示される
  - 画像なし食材は標準画像または絵文字で崩れない
  - スマホで画像選択・プレビュー・取り消しが操作できる
  - Web版verifyが通る
related_tickets:
  - TKT-0176-inventory-item-image-upload-ui
---

# Summary

食材/在庫ごとにユーザー画像を登録できるUIを追加する。標準画像カタログで足りないものを、ユーザーが自分で補えるようにする。
さらに、ユーザーが画像を変更した食材は「同じ食材名のユーザー標準画像」として記憶し、次回以降の同名食材にも自動適用する。

## 背景

標準画像だけでは家庭ごとの食材名や保存状態を完全には表現できない。ユーザーが個別に画像を登録できることで、冷蔵庫・冷凍・調味料などの視認性が上がる。
また、毎回同じ食材画像を登録し直すのは手間なので、ユーザーが明示的に変更した画像は同じ食材名へ再利用する。

## 仕様

- 在庫編集UIに画像入力を追加する。
- 選択後、保存前にプレビューを出す。
- 保存時にWebP等へ圧縮・リサイズする。
- Storage保存後、`inventory_items.image_storage_path` を更新する。
- 画像入力には「同じ食材名にも使う」を用意し、既定ONにする。
- 「同じ食材名にも使う」がONの場合、Storage保存後に `user_ingredient_images` へも保存する。
- `user_ingredient_images` はユーザー別・正規化食材名別に1件だけ持つ。
- 正規化食材名は、TKT-0175 resolverと同じくNFKC正規化、空白除去、小文字化を基本にする。
- 表示優先順位:
  1. `inventory_items.image_storage_path` の署名付きURL
  2. `user_ingredient_images.image_storage_path` の署名付きURL
  3. TKT-0175標準画像
  4. 既存絵文字
- 個別在庫画像の削除時は `inventory_items.image_storage_path` を `null` に戻し、対象Storage objectを削除する。
- ユーザー食材名画像の削除時は `user_ingredient_images` の該当行を削除または `image_storage_path = null` にし、対象Storage objectを削除する。
- 買い物リストなど `inventory_items` と直接紐づかない表示では、同じユーザーが明示保存した `user_ingredient_images` だけを参照する。

## DB設計

- 新規テーブル: `public.user_ingredient_images`
- 主な列:
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null references auth.users(id) on delete cascade`
  - `normalized_name text not null`
  - `display_name text not null`
  - `image_storage_path text not null`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
- 制約:
  - `unique (user_id, normalized_name)`
  - `split_part(image_storage_path, '/', 1) = user_id::text`
- RLS:
  - `select/insert/update/delete` は `auth.uid() = user_id` の本人限定。
- Storage:
  - 非公開 `photos` バケットを使う。
  - 推奨path: `<user_id>/ingredient-images/<normalized_name>/<uuid>.webp`
  - 先頭フォルダが `user_id` なので、既存のStorage policyで本人限定にする。

## 非対象

- 画像編集の高度な切り抜きUI。
- 標準画像カタログ作成（TKT-0175）。
- 全ユーザー共通の食材画像共有。
- 他人の画像や公開素材からの自動推測。

## 実装メモ

- `inventory_items` は同じ食材名でも複数行ありうるため、個別画像と食材名画像を分ける。
- 個別在庫だけ差し替えたい場合は `inventory_items.image_storage_path` を使う。
- 同じ食材名へ次回も使いたい場合は `user_ingredient_images` を使う。
- UIでは既定で「同じ食材名にも使う」をONにし、ユーザーがOFFにできるようにする。
- 既存の食材スキャン写真や料理記録写真のStorage pathと衝突しないようにする。
- 画像URLは画面表示時に署名付きURLを発行する。DBには署名付きURLを保存しない。

## 残リスク

- 同じ食材名でも別商品・別ブランドの場合、ユーザー食材名画像が期待と違う可能性がある。
- 正規化ルールが強すぎると誤適用が起きるため、まずは安全な文字正規化に留める。
- 写真には個人情報が写る可能性があるため、非公開Storageと署名付きURL確認が必須。
