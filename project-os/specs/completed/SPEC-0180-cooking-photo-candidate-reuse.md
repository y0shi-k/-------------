---
id: SPEC-0180-cooking-photo-candidate-reuse
title: 完成写真の候補化（レシピ画像・料理写真の登録で過去の完成写真から選ぶ）
status: spec_ready
scope:
  - web/src/components/photo-candidate-picker.tsx（候補ピッカー・新規）
  - web/src/lib/photos/use-cooking-photo-candidates.ts（候補取得・新規）
  - web/src/lib/photos/recipe-image-upload.ts（候補からの設定経路を追加）
  - web/src/components/recipe-meal-workspace.tsx（レシピ画像・料理写真の両導線）
  - web/src/app/globals.css
  - web/src/__tests__/
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 写真は非公開 `photos` バケットへ保存し、表示は署名付きURLを使う。公開URLをDB/コードに保存しない
  - 候補は本人（user_id一致）の usage_type='cooking_history' に限定する
  - 候補設定時は Storage object をコピーして独立させる（同一object共有は禁止）
  - Service Role keyをブラウザで使わない。全クエリに user_id 条件
acceptance:
  - レシピ画像登録・差し替えUIに「過去の完成写真から選ぶ」導線とサムネ一覧が出る
  - 候補から選ぶと recipes.image_storage_path に設定され一覧/詳細で表示される
  - 料理写真（献立完了時）でも新規撮影に加え候補から選んで設定できる
  - 候補は本人の cooking_history 用途写真に限定され他人の写真は出ない（孤立写真=cooking_history_id null も含む）
  - 候補設定写真は独立し、元写真や別レシピ画像を削除しても壊れない
  - 候補0件で空状態を示しUIが崩れない
  - 候補取得とコピー経路のテストが追加され、Web版verifyが通る
related_tickets:
  - TKT-0180-cooking-photo-candidate-reuse
---

# Summary

完了解除/削除で残った完成写真や過去の調理完成写真を、レシピ画像登録と料理写真登録の両方で
「過去の完成写真から選ぶ」候補として再利用する。候補設定時は Storage object をコピーして独立させる。

## 背景

TKT-0178 で完了解除/削除しても完成写真は残す方針にした。これらの写真（および過去の調理完成写真）を
捨てずに、レシピ画像や料理写真の登録で再利用できると便利。ただし同一 object を複数用途で共有すると
一方の削除で他方が壊れるため、設定時はコピーして独立させる。

## 仕様

### 候補ソース
- `photos` で user_id 一致 + usage_type='cooking_history' を新しい順に取得（cooking_history_id が null の孤立写真も含む）。署名付きURLでサムネ表示。

### レシピ画像への適用
- 候補の storage_path を `buildRecipeImageStoragePath(userId, recipeId, ext)` の新パスへ Storage copy（不可なら download→upload）。
- `recipes.image_storage_path` を更新。差し替え時は旧 object を後始末（既存 `uploadRecipeImage` の `staleRemovalFailed` 方針）。

### 料理写真への適用
- 完了モーダル（completeSchedule の写真欄、≈line 1436-1468）に「候補から選ぶ」を追加。選択時は upload せず、候補 object をコピーして cooking_history 用の photos 行（usage_type='cooking_history', cooking_history_id=作成履歴ID）を作る。新規撮影と排他。

### UI
- `modal-backdrop`+`role="dialog"` のピッカーをサムネグリッドで新規コンポーネント化。0件は空状態。スマホ幅で崩れない。

## 非対象

- 完了解除・削除のロジック（SPEC-0178）。
- 1スロット複数献立表示（SPEC-0179）。
- 候補（孤立写真）の自動削除・容量管理（将来課題）。
- 食材画像（inventory_items/user_ingredient_images）への候補適用。
- 高度な切り抜き/編集UI。

## 実装メモ

- 既存資産: `recipe-image-upload.ts`（`uploadRecipeImage`, `RecipeImageClient`）, `use-recipe-image-urls.ts`（署名URL）, `compress.ts`（`buildRecipeImageStoragePath`）, `user-image.ts`（`PHOTOS_BUCKET`）。
- 純粋なデータ取得と署名URL発行を分離して単体テストしやすくする。

## 残リスク

- 候補が増え続けるとStorage容量増（自動削除は将来課題）。
- Storage copy API の可用性差（不可ならdownload→再uploadにフォールバック）。
- 写真は個人情報を含みうるため非公開Storage・署名付きURL・本人限定を必須確認。
