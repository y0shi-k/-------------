---
id: TKT-0211-recipe-schedule-add-inventory-shortage
title: レシピ→スケジュール登録時の在庫不足チェック→買い物リスト追加を接続
status: completed
goal: TKT-0210 のレシピ→スケジュール登録フローの登録完了後に在庫不足を判定し、不足があれば既存の不足選択モーダルから買い物リストへ追加できるようにして、Canvas版相当の「登録時に在庫を確認」UXを再現する。
acceptance:
  - TKT-0210 のフローでスケジュール登録が成立した直後に `compareRecipeWithInventory` で不足材料を判定する
  - 不足がある場合、既存の不足選択モーダル（shortage モーダル）が開き、不足材料が表示される
  - 不足選択モーダルでチェックした材料を既存 `confirmRecipeShortageSelection` 経由で `shopping_items` に追加できる
  - 不足が無い場合は不足モーダルを開かず、スケジュール登録の成功フィードバックのみ出す
  - 既存の「買い物へ」導線（`addCurrentRecipeToShopping`）の挙動を壊さない
  - 不足モーダルのタブ（ALL/食材/調味料）・全選択・個別選択の既存挙動を壊さない
  - スケジュール登録自体は不足モーダルの結果に関わらず成立している（買い物追加をキャンセルしても献立は登録済み）
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0211-recipe-schedule-add-inventory-shortage/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs: []
related_artifacts:
  - artifacts/TKT-0211-recipe-schedule-add-inventory-shortage/verify.json
  - artifacts/TKT-0211-recipe-schedule-add-inventory-shortage/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0211`。コマンドの正本は `harness/registry.json`
  - 非危険変更。必須成果物は verify.json + report.md のみ
  - 着手前提: TKT-0210 のレシピ→スケジュール登録フローが存在すること
  - 買い物リスト書き込みは既存 `confirmRecipeShortageSelection`（`shopping_items` INSERT）を再利用し、新規DB導線・新規スキーマを作らない
---

# Summary

Canvas版では献立登録時にレシピの不足材料を確認し買い物リストへ追加できる。Web版には既に同等の仕組みが揃っている（在庫比較・不足モーダル・買い物INSERT）。本チケットは TKT-0210 の登録フローに、それら**既存実装の呼び出し**を結線するだけで、新規のDB書き込み導線やスキーマは作らない。

`required_evals` は active eval と変更範囲から決める。既存関数の結線によるUI挙動追加で、DBスキーマ・auth/RLS・Storage・AIルート・CSV移行に該当しない（非危険）。

## 実装メモ

- 対象: `web/src/components/recipe-meal-workspace.tsx`
- 再利用する既存資産（**新規実装しない／既存を呼ぶ**）:
  - 在庫比較: `compareRecipeWithInventory(recipe, inventoryItems)` `:424`
  - 在庫データ: 呼び出しパターンは `addCurrentRecipeToShopping`（`:1788-1815`）が参考。`compareRecipeWithInventory(recipe, inventoryItemsForMeals)` の形（`:1806`）
  - 不足モーダル状態: `shortageSelectionItems` / `shortageSelectionRecipeName` / `shortageSelectionTab`（`:519-521`）と setter
  - 不足モーダルUI: `shortageSelectionItems.length > 0 ? (...)` ブロック `:2961` 以降
  - 買い物追加: `confirmRecipeShortageSelection()` `:1817`（`shopping_items` へ INSERT）/ クローズ `closeShortageSelectionModal` `:846`
- 結線箇所: TKT-0210 で実装した「食事選択→登録」確定後（`addScheduleEntry` 成功後）に、対象 `recipe` で `compareRecipeWithInventory` を実行し、不足があれば `setShortageSelectionItems(shortages)` / `setShortageSelectionRecipeName(recipe.name)` / `setShortageSelectionTab("all")` で既存モーダルを開く。Canvas版 `assignScheduleFromViewer` 末尾の在庫チェック分岐が参考
- スケジュール登録の成否と買い物追加は独立させる（買い物追加をキャンセルしても献立は登録済みのまま）
- イミュータブル更新を徹底。秘密直書き禁止。GAS/Spreadsheet/Drive 不使用。Canvas `app.html` 非編集
- **danger eval 誤検出回避**: 買い物INSERTは既存 `confirmRecipeShortageSelection` を呼ぶだけにし、本diffに `.from("shopping_items")` 等のテーブル直叩きを新規に書かない

## 非ゴール

- スケジュール登録フロー自体の実装（TKT-0210で完了済み前提）
- 不足判定ロジック・不足モーダルUIの変更（既存をそのまま使う）
- 在庫データ取得方法の変更
- 既存スケジュール画面「＋」からの登録に在庫チェックを追加すること（本チケットは TKT-0210 のレシピ起点フロー限定）

## 依存チケット

- TKT-0210（レシピ→スケジュール登録フロー）に依存

## 残リスク

- 登録直後にモーダルを重ねて開くタイミング制御（スケジュール追加モーダルを閉じてから不足モーダルを開く順序）→ 手動スモークで確認
