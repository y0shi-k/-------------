---
id: TKT-0180-cooking-photo-candidate-reuse
title: 完成写真の候補化（レシピ画像・料理写真の登録で過去の完成写真から選ぶ）
status: implementation_ready
goal: 完了解除/削除で残った完成写真や過去の調理完成写真を捨てず、レシピ画像登録と料理写真登録で「過去の完成写真から選ぶ」候補として再利用できるようにする。
acceptance:
  - レシピ画像の登録・差し替えUIに「過去の完成写真から選ぶ」導線が追加され、候補写真の一覧（サムネ）が表示される。
  - 候補から1枚選ぶと、そのレシピの画像（recipes.image_storage_path）に設定され、一覧/詳細で表示される。
  - 調理後の料理写真（献立完了時の写真）でも、新規撮影に加えて候補から選んで設定できる。
  - 候補一覧は本人（user_id一致）の cooking_history 用途写真（usage_type='cooking_history'）に限定され、他人の写真は出ない。
  - 候補から設定した写真は元写真とは独立して扱われ、片方（元の完成写真や別レシピ）を削除しても設定先の画像が壊れない。
  - 候補が0件のときは導線が空状態を示し、UIが崩れない。
  - 候補取得とコピー経路の単体テストが追加され、Web版verifyが通る。
required_evals:
  - photo_upload_storage
eval_selection_mode: auto
changed_paths:
  - web/src/components/photo-candidate-picker.tsx
  - web/src/lib/photos/use-cooking-photo-candidates.ts
  - web/src/lib/photos/recipe-image-upload.ts
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/
  - project-os/artifacts/TKT-0180-cooking-photo-candidate-reuse/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0180-cooking-photo-candidate-reuse
related_artifacts:
  - artifacts/TKT-0180-cooking-photo-candidate-reuse/verify.json
  - artifacts/TKT-0180-cooking-photo-candidate-reuse/manual-smokes.md
  - artifacts/TKT-0180-cooking-photo-candidate-reuse/review.md
  - artifacts/TKT-0180-cooking-photo-candidate-reuse/report.md
owner_role: implementer
owner_notes:
  - 危険度: 写真Storage操作のため `photo_upload_storage`（danger）。manual-smokes/review 必須。
  - 候補ソース: `photos` テーブルで `user_id` 一致かつ `usage_type='cooking_history'` の行。TKT-0178 の巻き戻しで `cooking_history_id` が null 化した孤立写真もここに含まれる（除外しない）。新しい順に並べる。
  - **コピー方針（重要）**: 候補写真をレシピ画像に設定する際は、Storage object を**新パスへコピーして独立させる**（同一 object 参照の共有は、一方の削除で他方が壊れるため禁止）。Supabase Storage の copy（同バケット内）または download→再upload を使う。新パスは `web/src/lib/photos/compress.ts` の `buildRecipeImageStoragePath(userId, recipeId, ext)` を使う。コピー後に `recipes.image_storage_path` を更新（既存 `web/src/lib/photos/recipe-image-upload.ts` の `uploadRecipeImage` と同じ後始末＝差し替え時は旧object削除）。
  - 既存資産を再利用: レシピ画像登録の本体ロジックは `web/src/lib/photos/recipe-image-upload.ts`（`uploadRecipeImage` line ≈54〜, `RecipeImageClient` 型）。署名付きURL取得は `web/src/lib/photos/use-recipe-image-urls.ts` を参照して候補サムネ用フックを作る。バケット定数は `web/src/lib/photos/user-image.ts` の `PHOTOS_BUCKET`。
  - 完了時の料理写真導線は recipe-meal-workspace.tsx の `completeSchedule` 内の写真アップロード（≈line 1436-1468）。ここに「候補から選ぶ」分岐を追加（候補選択時は upload せず、選んだ photo の storage_path をコピーして cooking_history 用 photos 行を作る／または直接参照）。料理写真は cooking_history に紐づくため、レシピ画像とは別経路。詳細は SPEC-0180 に従う。
  - ピッカーUIは既存 `modal-backdrop` パターン（recipe-meal-workspace.tsx ≈line 2007 や inventory-board.tsx のモーダル）を踏襲し、新規 `web/src/components/photo-candidate-picker.tsx` に切り出す。
  - 公開URLを保存しない（DBには Storage path のみ）。表示は署名付きURL。Service Role key をブラウザで使わない。全クエリに user_id 条件。RLS は既存の本人限定 policy（photos/recipes）で充足し、新規RLSは作らない想定。
  - Canvas版 `app.html` は触らない。GAS/Spreadsheet/Drive 不使用。
---

# Summary

完了解除/削除で残した完成写真や過去の調理完成写真（`photos.usage_type='cooking_history'`）を、
レシピ画像登録と料理写真登録の両方で「過去の完成写真から選ぶ」候補として再利用できるようにする。
候補から設定するときは Storage object をコピーして独立させ、元写真の削除に影響されないようにする。

## 実装メモ（前提なしで着手できるよう詳述）

### 1. 候補取得フック（新規 `web/src/lib/photos/use-cooking-photo-candidates.ts`）
- `photos` を `user_id` 一致 + `usage_type='cooking_history'` で新しい順に取得し、各 storage_path から署名付きURLを発行（`use-recipe-image-urls.ts` の発行パターンを踏襲）。
- 返り値: `{ id, storagePath, signedUrl, createdAt }[]` と loading/error。
- 純粋なデータ取得は薄い関数に分け、署名URL発行と分離して単体テストしやすくする。

### 2. ピッカーUI（新規 `web/src/components/photo-candidate-picker.tsx`）
- `modal-backdrop` + `role="dialog"` のモーダルでサムネをグリッド表示。選択→`onSelect(candidate)`、閉じる→`onClose`。
- 0件時は空状態メッセージ。スマホ幅でサムネが崩れないCSSを `globals.css` に追加。

### 3. レシピ画像への適用（`web/src/lib/photos/recipe-image-upload.ts` に経路追加）
- 新関数（例 `setRecipeImageFromCandidate`）: 候補の storage_path を `buildRecipeImageStoragePath` の新パスへ Storage copy（同バケット内コピー or download→upload）→ `recipes.image_storage_path` を更新 → 差し替え時は旧 object を後始末（既存 `uploadRecipeImage` と同じ `staleRemovalFailed` 方針）。
- レシピ画像登録UI（TKT-0174 由来。recipe-meal-workspace.tsx 内のレシピ画像ピッカー導線）に「過去の完成写真から選ぶ」ボタンを追加し、ピッカー→`setRecipeImageFromCandidate` を呼ぶ。

### 4. 料理写真への適用（recipe-meal-workspace.tsx `completeSchedule` 周辺）
- 完了モーダルの写真欄に「過去の完成写真から選ぶ」を追加。選択時は新規 upload を行わず、候補 object をコピーして cooking_history 用の photos 行（usage_type='cooking_history', cooking_history_id=作成した履歴ID）を作る。
- 既存の新規撮影パス（line 1436-1468）と排他にし、どちらか一方が使われるようにする。

### 5. テスト（web/src/__tests__/）
- 候補取得（user_id絞り込み・新しい順・cooking_history_id=nullの孤立写真も含む）。
- コピー経路（新パス生成・recipes 更新・旧object後始末。元写真削除後も設定先が独立して残る想定の検証）。

## 検証メモ

- `/verify TKT-0180-cooking-photo-candidate-reuse`。
- manual-smokes（必須）: レシピ画像/料理写真で候補ピッカーから過去の完成写真を選んで設定できる・他人写真が出ない・候補設定後に元の完成写真（や別レシピ画像）を削除しても設定先画像が壊れない（コピー独立の確認）・候補0件時の空状態・スマホUI。
- review（必須）: Storage が非公開のままか・公開URLを保存していないか・user_id 絞り込み・Service Role key 非使用・copy 後始末の整合。

## 非ゴール

- 完了解除・削除のロジック（→ TKT-0178。本チケットはその結果生じる孤立写真を候補として使うだけ）。
- 1スロット複数献立表示（→ TKT-0179）。
- 候補（孤立写真）の自動削除・容量管理（将来課題として decisions.md に記録）。
- 食材画像（inventory_items / user_ingredient_images）への候補適用（今回はレシピ画像と料理写真のみ。必要なら別チケット）。
- 高度な切り抜き/編集UI。

## 依存チケット

- TKT-0178（完了解除・削除の巻き戻し）= 先行依存。完成写真を残す挙動と、cooking_history_id が null 化した孤立写真の発生が本チケットの候補ソース。
- TKT-0174（レシピ画像の登録・差し替え・削除UI、完了済み）= レシピ画像側の土台。`recipe-image-upload.ts` を拡張する。

## 残リスク

- 候補が増え続けるとStorage容量が増える。本チケットでは自動削除しない（将来課題）。
- コピー方式（Storage copy API vs download→upload）の可用性差。実装時にSupabase Storageのcopy対応を確認し、不可ならdownload→再uploadにフォールバック。
- 写真は個人情報を含みうるため、非公開Storage・署名付きURL・本人限定を必須確認。
