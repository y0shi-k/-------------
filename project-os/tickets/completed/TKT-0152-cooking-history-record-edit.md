---
id: TKT-0152-cooking-history-record-edit
title: 料理履歴カードに編集ボタンを追加し、消費量・写真・コメント・評価を後から編集できるようにする
status: ready
goal: 料理履歴（タイムライン/カレンダー）の記録を、作成後でも消費量・写真・コメント・評価を修正できるようにし、入力ミスや後からの追記に対応する
acceptance:
  - タイムライン/カレンダーの各料理履歴カードの右上に「編集」ボタンが表示される（recipe_id の有無に関わらず全カード）
  - 編集ボタンを押すと「消費量調整モーダル」と同等のUIのモーダルが開き、その記録の既存値（消費量・写真・コメント・評価）が初期表示される
  - 既存の消費量（cooking_consumption_events）を編集でき、確定すると新旧消費量の「差分」だけ在庫数量（inventory_items.quantity）に反映される（消費を増やせば在庫減、減らせば在庫戻し）
  - 消費する在庫品目（stock_item）の付け替え・行の削除ができ、付け替え時は旧品目へ返却・新品目から減算される
  - 既存写真をサムネイル表示して個別に削除でき、新規写真を追加できる（Storage と photos テーブルの双方を更新）
  - コメント（note）と評価（rating ★1〜5）を編集でき、cooking_history が UPDATE される
  - 保存後は router.refresh() で一覧と在庫に反映される。失敗時は原因/影響/修正方法を含むエラーメッセージを出す
  - `/verify` が通る（lint/typecheck/test/build + policyチェック）。新規の純関数（在庫差分計算・ドラフト生成）に単体テストがある
required_evals:
  - web_project_bootstrap
  - photo_upload_storage
  - supabase_schema_change
eval_selection_mode: auto
changed_paths:
  - web/src/components/cooking-history-board.tsx
  - web/src/components/cooking-record-edit-modal.tsx
  - web/src/lib/cooking-history/edit.ts
  - web/src/lib/cooking-history/types.ts
  - web/src/app/page.tsx
  - web/src/app/globals.css
  - web/src/__tests__/cooking-history-board.test.tsx
  - web/src/__tests__/cooking-history-edit.test.ts
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0152-cooking-history-record-edit
related_artifacts:
  - artifacts/TKT-0152-cooking-history-record-edit/verify.json
  - artifacts/TKT-0152-cooking-history-record-edit/report.md
  - artifacts/TKT-0152-cooking-history-record-edit/manual-smokes.md
  - artifacts/TKT-0152-cooking-history-record-edit/review.md
owner_role: implementer
owner_notes:
  - 実装は Codex で行う想定。本チケットはその実装仕様書。
  - verify は `/verify TKT-0152`（= `harness/bin/verify_web.sh`）。コマンドの正本は `harness/registry.json`。
  - required_evals は最終的に `/check-gates TKT-0152` の diff 自動判定で確定する。スキーマ変更は無いが、diff に `cooking_history|photos|inventory_items` 等のテーブル名と `upload(`/`Storage`/`写真` が含まれるため `supabase_schema_change` と `photo_upload_storage` が match する見込み（→ 危険変更ゲート）。
  - 危険変更のため manual-smokes.md / review.md も必須。required_gates に manual_smokes_done / review_ready を含む。
  - Web版ではGAS/Spreadsheet/Driveを使わない。APIキー・秘密情報は直書きしない。RLS/Storage権限の前提を実装メモで確認済み。
---

# Summary

料理履歴（料理・記録タブのタイムライン/カレンダー）のカードは現状「レシピを見る」ボタンしか持たず、一度作成した記録（消費量・写真・コメント・評価）を後から修正できない。各カード右上に「編集」ボタンを追加し、押すと**新規作成時の「消費量調整モーダル」と同等のUI**で既存記録を編集できるようにする。

ユーザー確定済みの仕様判断:
- **在庫の扱い = 差分を在庫に反映する**（記録修正のみではなく、新旧消費量の差分を inventory_items に反映）
- **写真 = 既存写真の削除＋新規追加**
- **評価 = 編集可能にする**

前提（調査済み）:
- 編集対象テーブルはすべて owner 向け **UPDATE/DELETE の RLS ポリシーが既に存在**する（`supabase/migrations/20260523094705_schema_v1.sql`, `.../20260524193000_cooking_consumption_events.sql`）。Storage `photos` バケットも owner パスの update/delete ポリシーあり。**→ スキーマ/RLSマイグレーションは新規追加しない。**
- 変更は `web/` のクライアント実装に閉じる。

---

## 背景・現状コード

- **カード（表示専用）**: `web/src/components/cooking-history-board.tsx`
  - `HistoryDateGroup`（339-389行）が `CookingHistoryItem` をカード（`.history-item`）として描画。`.history-item-topline` 右に星評価、下部 `.history-card-actions` に `recipe_id` がある時だけ「レシピを見る」ボタン。
  - `CookingHistoryBoard`（87行〜）は `initialHistory` を受け取るだけの stateless 表示。現状 Supabase クライアントも `cooking_consumption_events` の取得も持たない。
  - ナビは `useShellNavigation().requestViewRecipe`（既存「レシピを見る」用）。
- **新規作成時の消費量調整モーダル（流用元のUI/CSS）**: `web/src/components/recipe-meal-workspace.tsx`
  - モーダル本体 1355-1444行（`.modal-backdrop.consumption-backdrop` > `.canvas-modal.consumption-modal`、見出し「実際の消費量を調整」）。
  - `ConsumptionEditor`（2360-2486行）= 消費量リスト（`.consumption-editor` / `.consumption-item`）。**ただし `recipe.ingredients` 前提で書かれており、編集用途では `Recipe` を必要としない**ため、そのままの共有ではなく CSS クラスを流用した編集専用リストを作る方が素直。
  - 料理記録パネル `.cooking-record-panel`（写真ピッカー `.cooking-photo-picker` / 評価 `.cooking-rating-picker` / コメント `.cooking-comment-field`）1376-1433行。
  - 保存ロジック（**新規INSERT**）`completeSchedule`（1113-1301行）: 在庫減算→meal_schedules完了→cooking_history INSERT→cooking_consumption_events INSERT→photos Storage upload + insert。エラーメッセージは「原因/影響/修正方法」形式。**編集用にはこの一括INSERTは流用せず、UPDATE/DELETE系を新規実装する。**
- **データ取得**: `web/src/app/page.tsx`
  - cooking_history を最新30件取得（36-41行）、関連 photos に signed URL（30分）を付与してカードへ（87-106行）。`inventoryItems` は既に取得済み（31-35行、現状 InventoryBoard / RecipeMealWorkspace へ渡している）。
- **型**: `web/src/lib/cooking-history/types.ts`（`CookingHistoryItem` / `CookingHistoryPhoto`）。
- **写真ヘルパ**: `web/src/lib/photos/compress.ts`（`compressImageFile`, `buildCookingHistoryPhotoStoragePath`）。
- **Supabaseクライアント（ブラウザ）**: `import { createBrowserSupabaseClient } from "@/lib/supabase/browser";`（recipe-meal-workspace.tsx 26行と同じものを使う）。

---

## 実装方針

### 1. カードに「編集」ボタンを追加（cooking-history-board.tsx）
- `HistoryDateGroup` の各 `.history-item` 右上に「編集」ボタンを追加（全カードに表示。recipe_id が無い「その他」記録でも note/写真/評価は編集可能）。
- ボタン押下で編集対象 `CookingHistoryItem` を state に持ち、編集モーダルを開く。`CookingHistoryBoard` 側に `const [editingItem, setEditingItem] = useState<CookingHistoryItem | null>(null)` を追加（filter等の既存stateは immutable に保つ）。
- 「レシピを見る」ボタンは現状維持。
- CSS は `web/src/app/globals.css` に追加（`.history-item` を `position: relative` にして右上に小さめの編集ボタン、または `.history-item-topline` 右の星評価の並びに配置）。既存ボタン配色・トークンに合わせる。

### 2. 編集モーダル（新規: web/src/components/cooking-record-edit-modal.tsx）
- props 例: `{ item: CookingHistoryItem; inventoryItems: StockItem[]; userId: string; onClose: () => void; onSaved: () => void }`。
- `"use client"`。`createBrowserSupabaseClient()` を内部で生成。
- **開いた時に消費量明細をオンデマンド取得**:
  `supabase.from("cooking_consumption_events").select("*").eq("user_id", userId).eq("cooking_history_id", item.id)`。
  取得行から「消費量ドラフト」を生成（下記 edit.ts）。
- UI（既存 `.consumption-modal` のCSSを流用）:
  - 見出し「料理記録を編集」。
  - 消費量リスト: 行ごとに `ingredient_name`（表示）、減らす在庫 select（在庫品目）、消費量 number input、行の削除（チェックOFF=減算対象外/削除）。`.consumption-item` 構造を踏襲。
  - 料理記録パネル: 既存写真サムネイル一覧（各写真に削除トグル `✕`）、新規写真追加（`<input type="file" accept="image/*" capture="environment">` + `compressImageFile`）、評価 ★1〜5、コメント textarea。
  - フッタ: 「キャンセル」「保存」。保存中は `disabled`。
- 入力検証: 消費量は 0 以上の数値、評価は 1〜5 の整数 or 未設定。create フローと同じメッセージ様式。

### 3. 純関数 + 型（新規: web/src/lib/cooking-history/edit.ts、型は types.ts へ追記）
テスト容易性のため、DB非依存の純関数を切り出す:
- `CookingConsumptionEvent` 型（cooking_consumption_events の行: id, ingredient_name, requested_amount, requested_unit, consumed_amount, consumed_unit, stock_item_id, stock_item_name, substitute_for ...）を types.ts に追加。
- `buildEditDrafts(events: CookingConsumptionEvent[]): ConsumptionEditDraft[]` … 既存イベントから編集ドラフトを生成（id, ingredientName, requestedAmount/Unit, originalConsumedAmount, consumedUnit, stockItemId(初期=元の stock_item_id), amount(文字列, 初期=元consumed), selected(初期true)）。
- `computeInventoryAdjustments(drafts, originalEventsById): Map<stockItemId, deltaQuantity>` … **差分計算（コア）**:
  - 行が残る・同一 stock item: `delta(S) += -(A_new - A_old)`（消費増で在庫減、消費減で在庫戻し）。
  - 行が残る・stock item 変更: `delta(S_old) += +A_old`（返却）, `delta(S_new) += -A_new`。
  - 行を削除/選択解除: `delta(S_old) += +A_old`（返却）。
  - stock item 単位で集約（同一品目が複数行に出る可能性）。
- `applyAdjustmentsToQuantities(items: StockItem[], adjustments): {id, nextQuantity}[]` … 現在数量 + delta。**減算側は `Math.max(0, ...)` で0クランプ**（create フロー 1159行と整合）。返却側は上限クランプなし。0クランプにより厳密な可逆性は保証されない点は許容（後述リスク）。
  - 対象 stock item が在庫一覧に存在しない（削除済み）場合は在庫更新をスキップし、警告メッセージ用にフラグを返す。
- 新規食材行の「追加」は本チケットの範囲外（既存明細の編集・削除・付け替えのみ）。スコープ拡大時は別チケット。

### 4. 保存処理（モーダル内、UPDATE/DELETE 系）
Supabase にクライアントトランザクションは無いため、create フロー同様の逐次実行 + 明示エラーメッセージで best-effort。順序例:
1. 入力検証。
2. `computeInventoryAdjustments` → `applyAdjustmentsToQuantities`。
3. 在庫 UPDATE: 影響 stock item ごとに `inventory_items.update({ quantity }).eq("id", ...).eq("user_id", userId)`。
4. 消費明細: 残る行は `cooking_consumption_events.update({ consumed_amount, consumed_unit, stock_item_id, stock_item_name, substitute_for }).eq("id", ...).eq("user_id", userId)`。削除/選択解除行は `.delete().eq("id", ...).eq("user_id", userId)`。
5. `cooking_history.update({ note, rating, updated_at: now })`。
6. 写真: 削除対象は `supabase.storage.from(bucket_id).remove([storage_path])` → `photos.delete().eq("id", ...).eq("user_id", userId)`。新規は `compressImageFile` → `buildCookingHistoryPhotoStoragePath(userId)` → `storage.upload` → `photos.insert({... cooking_history_id: item.id, usage_type:"cooking_history" ...})`（create フロー 1251-1283行と同形、insert失敗時は upload した object を remove でロールバック）。
7. `onSaved()`（呼び出し側で `router.refresh()`）+ 成功トースト。途中失敗時は原因/影響/修正方法メッセージ。

### 5. page.tsx の配線
- `CookingHistoryBoard` に `userId={user.id}` と `initialInventoryItems={(inventoryItems ?? []) as StockItem[]}` を渡す（133行付近）。`CookingHistoryBoardProps` を拡張。
- 保存後 `router.refresh()` でサーバー再フェッチ → カード・在庫が最新化。

---

## 在庫差分のロジック（例）

```
元: 牛肉 200g 消費(stockItem=A, A_old=200)
編集後パターン:
  (a) 150g に変更, 同一A     → delta(A)= -(150-200)= +50  → 在庫 +50（戻し）
  (b) 300g に変更, 同一A     → delta(A)= -(300-200)= -100 → 在庫 -100（追加減算, 0クランプ）
  (c) 牛肉を別在庫Bへ付け替え(150g) → delta(A)= +200（全返却）, delta(B)= -150
  (d) 行を削除               → delta(A)= +200（全返却）
```

---

## ファイル別 TODO

- `web/src/lib/cooking-history/types.ts`: `CookingConsumptionEvent` 型と編集ドラフト型を追記。
- `web/src/lib/cooking-history/edit.ts`（新規）: `buildEditDrafts` / `computeInventoryAdjustments` / `applyAdjustmentsToQuantities` の純関数。
- `web/src/components/cooking-record-edit-modal.tsx`（新規）: 編集モーダル本体 + 取得/保存。200-400行目安、肥大化したらヘルパへ分割。
- `web/src/components/cooking-history-board.tsx`: 編集ボタン追加、`editingItem` state、モーダル描画、props 拡張（userId / initialInventoryItems）。
- `web/src/app/page.tsx`: 上記 props を board へ受け渡し。
- `web/src/app/globals.css`: 編集ボタンのスタイル（既存トークン流用）。モーダルは既存 `.consumption-modal` 系を流用。
- `web/src/__tests__/cooking-history-edit.test.ts`（新規）: 差分計算・ドラフト生成の単体テスト（増/減/付け替え/削除/0クランプ/在庫消失）。
- `web/src/__tests__/cooking-history-board.test.tsx`: 編集ボタンが描画されモーダルが開くテストを追記（既存 Supabase モック方針は recipe-meal-workspace.test.tsx を参照）。

---

## 残リスク・確認事項

- **非トランザクション**: 在庫/明細/履歴/写真の各更新は逐次のため、途中失敗で部分更新が起こり得る。create フロー同様の best-effort + 明示メッセージで対応。完全な原子性が必要なら Supabase RPC（関数）化を別チケットで検討。
- **0クランプの非可逆性**: 在庫が既に0付近だと差分の戻しが厳密に一致しないことがある。create フローの0クランプと整合させ、許容する。
- **stock item 削除済み**: 付け替え/返却先の在庫が存在しないと在庫反映をスキップ。明細・履歴・写真の更新は継続し、警告を出す。
- **RLS/Storage**: 4テーブル + Storage の owner update/delete ポリシーは存在確認済み（マイグレーション不要）。手動スモークで実DB上の update/delete/storage remove が owner で通ることを確認する。
- **編集対象範囲**: 本チケットは「既存明細の編集・削除・在庫付け替え」「写真の削除/追加」「コメント・評価」のみ。新規食材行の追加・cooked_at/recipe_name の変更は範囲外。
- **手動スモーク観点（manual-smokes.md）**: 消費量増→在庫減、消費量減→在庫戻し、在庫付け替え、行削除での返却、写真削除（Storage実体も消えるか）、写真追加、コメント/評価更新、リロード後の永続化、他ユーザーデータに触れないこと。
