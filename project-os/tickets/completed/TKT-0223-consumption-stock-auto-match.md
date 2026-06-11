---
id: TKT-0223-consumption-stock-auto-match
title: 消費量調整画面でレシピ材料と在庫を表記ゆれ込みで自動紐付け
status: completed
goal: 調理完了時・履歴編集時の「実際の消費量を調整」で在庫が自動選択されず全件手動選択になっている手間を解消する（たまご/卵も紐付く）。
acceptance:
  - 調理完了時の消費量モーダル（`buildConsumptionDrafts`）で、在庫「卵」がレシピ材料「たまご」に自動選択される（正規化一致・辞書一致。分類一致・単位一致・在庫>0 の既存条件は維持）
  - 履歴編集（`buildDraftsFromRecipeIngredients`）でも同様に自動紐付けされる
  - 一致候補が複数ある場合、生文字列の完全一致 > 正規化一致 > 辞書一致 の優先順で選ぶ
  - 部分一致のみの在庫（例: レシピ「豚肉」×在庫「豚こま切れ肉」）は自動選択されない
  - "`ConsumptionEditor`（recipe-meal-workspace.tsx）と `ConsumptionEditList`（cooking-record-edit-modal.tsx）の在庫プルダウンで、「おすすめ」候補が `ingredientNameMatchScore` 降順に並ぶ。cooking-record-edit-modal 側にも「おすすめ（同分類・同単位）」「その他の在庫」の optgroup を追加し ConsumptionEditor と表示を揃える"
  - 既存テスト（`cooking-history-edit.test.ts` の完全一致ケース）が更新され、表記ゆれ自動紐付け・部分一致は自動選択しない・優先順のテストが追加される
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/lib/cooking-history/edit.ts
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/components/cooking-record-edit-modal.tsx
  - web/src/__tests__/cooking-history-edit.test.ts
  - web/src/__tests__/cooking-record-edit-modal.test.tsx
  - project-os/artifacts/TKT-0223-consumption-stock-auto-match/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0222-ingredient-name-matching
related_artifacts:
  - artifacts/TKT-0223-consumption-stock-auto-match/verify.json
  - artifacts/TKT-0223-consumption-stock-auto-match/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0223`。コマンドの正本は `harness/registry.json`
  - 非危険変更（クライアントロジック＋UI候補並び替えのみ）。DB schema / Auth・RLS / Storage / AI route / CSV移行は触らない
  - `/check-gates` が diff 中の `recipes|cooking_history` 等のテーブル名トークンで supabase_schema_change（danger）を過剰マッチさせる可能性があるが、実 schema は無変更。その旨を report に記録する（TKT-0178 と同じ運用）
  - Canvas版 `app.html` は凍結・参照専用のため編集しない
---

# Summary

消費量調整の在庫自動紐付けが完全一致のみのため、表記ゆれがあると「在庫を選ぶ」のまま全件手動選択になる。
TKT-0222 の `matchesIngredientName` / `ingredientNameMatchScore` を適用し、自動選択と候補並び順を改善する。

## 参照すべき既存実装

- `web/src/lib/cooking-history/edit.ts:49-73` `buildDraftsFromRecipeIngredients()`:
  `item.name === ingredient.name` の完全一致（52行）を置換する箇所。履歴編集の再構築時に使われる。
- `web/src/components/recipe-meal-workspace.tsx:1198-1218`:
  `stockOptionsForIngredient()`（分類・単位・在庫>0 フィルタ）と `buildConsumptionDrafts()`
  （1207行の `find((item) => item.name === ingredient.name)` を置換）。呼び出し元は 2269 行のみ。
- `web/src/components/recipe-meal-workspace.tsx:3847-3993` `ConsumptionEditor`:
  3874-3878 行で「おすすめ（同分類・同単位）」「その他の在庫」の optgroup を組んでいる。
  ここの options をスコア降順ソートする。
- `web/src/components/cooking-record-edit-modal.tsx:469-584` `ConsumptionEditList`:
  現状は optgroup なしの全在庫フラットリスト。ConsumptionEditor と同じ optgroup 構成に揃える。
- TKT-0222 のユーティリティ: `web/src/lib/ingredients/name-match.ts`。

## 実装メモ

- 「一致在庫を探す」ロジックは `lib/ingredients/name-match.ts` か `lib/cooking-history/edit.ts` に
  共通ヘルパー（例: `findMatchingStock(ingredient, items)`）として1箇所にまとめ、
  `buildDraftsFromRecipeIngredients` と `buildConsumptionDrafts` の両方から使う（重複実装しない）。
- 自動選択の閾値は matches=true（正規化一致 or 辞書一致）のみ。部分一致は並び順だけ
  （SPEC-0222 のユーザー確定方針）。
- 自動選択時の消費量は既存ロジック踏襲（`Math.min(必要量, 在庫量)`、selected=true）。
- 並び替えは新配列を作って行う（元配列を mutate しない）。
- `recipe-meal-workspace.test.tsx` に影響が出る場合は既存テストの期待値を確認して更新する。
- APIキー直書き禁止。GAS/Spreadsheet/Drive 不使用。RLS/Storage には触れない。

## 非ゴール

- 買い物不足計算への適用（TKT-0224）。
- モーダルの幅・レイアウト変更（TKT-0225）。
- 在庫減算ロジック（`computeInventoryAdjustments`）の変更。
- 単位換算をまたぐ紐付け。

## 依存チケット

- TKT-0222（土台ユーティリティ）。TKT-0224 とは独立・並行可。
