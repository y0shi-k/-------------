---
id: TKT-0224-shopping-shortage-name-match
title: 買い物不足計算に表記ゆれマッチングを適用（スケジュール追加起点ほか）
status: completed
goal: 在庫に「卵」があるのにレシピ「たまご」が不足扱いで買い物候補に出る誤判定（買わなくていい物を買う）をなくす。
acceptance:
  - "`inventoryAmountByNameAndUnit` が正規化一致・辞書一致する在庫の量を合算する（単位一致の条件は維持。部分一致は合算に使わない）"
  - 在庫「卵 3個」がある状態でレシピ「たまご 2個」をスケジュール追加しても、「買い物に追加するもの」モーダルに たまご が出ない
  - 在庫「卵 1個」×レシピ「たまご 3個」では不足 2個 として出る（差分計算が正しい）
  - 辞書外・部分一致のみの組（在庫「豚こま切れ肉」×レシピ「豚肉」）は従来どおり不足として出る
  - スケジュール追加起点（`openShortageModalForScheduledRecipe`）と調理ビュー起点の不足モーダル、調理ビュー材料カードの在庫不足バッジ（`renderIngredientCard` の `data-shortage`）の3箇所すべてに同じ判定が効く
  - 上記の表記ゆれ合算・部分一致除外のユニットテストが追加される
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0224-shopping-shortage-name-match/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0222-ingredient-name-matching
related_artifacts:
  - artifacts/TKT-0224-shopping-shortage-name-match/verify.json
  - artifacts/TKT-0224-shopping-shortage-name-match/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0224`。コマンドの正本は `harness/registry.json`
  - 非危険変更（クライアント側の不足判定のみ）。shopping_items への INSERT 経路・スキーマは変更しない
  - `/check-gates` が diff 中の `recipes|meal_schedules` 等のトークンで supabase_schema_change（danger）を過剰マッチさせる可能性があるが、実 schema は無変更。その旨を report に記録する
  - Canvas版 `app.html` は凍結・参照専用のため編集しない
---

# Summary

買い物不足計算（`compareRecipeWithInventory` → `inventoryAmountByNameAndUnit`）が在庫名の完全一致のみで
集計しているため、表記ゆれがあると在庫があっても不足扱いになる。TKT-0222 の `matchesIngredientName` を
集計フィルタに適用する。部分一致は合算に使わない（誤マッチで本当に不足している物が買い物リストから
漏れる=買い忘れを防ぐ。SPEC-0222 のユーザー確定方針）。

## 参照すべき既存実装

- `web/src/components/recipe-meal-workspace.tsx:399-403` `inventoryAmountByNameAndUnit()`:
  401行の `item.name === name && item.unit === unit` の name 側を `matchesIngredientName` に置換する箇所。
- 同 `:435-451` `compareRecipeWithInventory()`: 不足候補の生成。利用箇所は
  1504行（スケジュール追加起点 `openShortageModalForScheduledRecipe`）と 1917 行（調理ビュー起点）。
- 同 `:4148-4149` `renderIngredientCard`: 調理ビューの材料カード在庫不足バッジも
  `inventoryAmountByNameAndUnit` を使っており、関数の修正だけで自動的に直る（acceptance の3箇所目）。
- 買い物追加の確定処理: 同 `:1930-1971` `confirmRecipeShortageSelection()`（**変更しない**。
  不足候補の中身が正しくなるだけで INSERT 経路は従来どおり）。
- TKT-0222 のユーティリティ: `web/src/lib/ingredients/name-match.ts`。

## 実装メモ

- 変更の本体は `inventoryAmountByNameAndUnit` のフィルタ条件のみで済む想定。
  `compareRecipeWithInventory` 側のシグネチャは変えない。
- テストは `inventoryAmountByNameAndUnit` / `compareRecipeWithInventory` を export するか、
  既存の `recipe-meal-workspace.test.tsx` のパターン（コンポーネント経由）に合わせる。
  export する場合は既存の関数配置・命名規約に従う。
- 単位不一致（卵「個」×たまご「g」）は従来どおり別物扱い（合算しない）ことをテストで固定する。
- APIキー直書き禁止。GAS/Spreadsheet/Drive 不使用。RLS/Storage には触れない。

## 非ゴール

- 消費量調整の自動紐付け（TKT-0223）。
- `shopping_items` テーブル・INSERT 処理・買い物リスト画面の変更。
- 買い物追加モーダルの幅・レイアウト変更（TKT-0226）。
- 単位換算をまたぐ合算（個↔g）。

## 依存チケット

- TKT-0222（土台ユーティリティ）。TKT-0223 とは独立・並行可。
