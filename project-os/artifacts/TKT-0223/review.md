---
ticket_id: TKT-0223-consumption-stock-auto-match
status: passed
review_scope:
  - SPEC-0222-ingredient-name-matching
  - TKT-0223-consumption-stock-auto-match
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- web/src/lib/ingredients/name-match.ts（`findMatchingStock` 追加）
- web/src/lib/cooking-history/edit.ts（完全一致→`findMatchingStock`）
- web/src/components/recipe-meal-workspace.tsx（`buildConsumptionDrafts` 置換＋`ConsumptionEditor` スコア降順）
- web/src/components/cooking-record-edit-modal.tsx（`ConsumptionEditList` optgroup 統一）
- web/src/__tests__/cooking-history-edit.test.ts / cooking-record-edit-modal.test.tsx（テスト5件追加）

## checked_artifacts

- project-os/artifacts/TKT-0223/verify.json（status: pass）
- project-os/artifacts/TKT-0223/manual-smokes.md（status: passed）

## subagent_usage

- impl-fast（Sonnet）に実装を委譲（route_model 判定: 非危険 eval のみ → fast）。オーケストレーター（Fable 5）が diff を監査。

## findings

- 自動選択の境界（matches=true＝score>=2 のみ、部分一致除外）が `findMatchingStock` 内で正しく実装され、テストで固定されていることを確認。SPEC-0222 の方針に適合。
- `buildConsumptionDrafts` が `stockOptionsForIngredient` 経由から `inventoryItemsForMeals` 直参照へ変わったが、`findMatchingStock` 内のフィルタ（分類・単位・在庫>0）が同等条件であることをコードで確認。動作差異なし。
- 候補ソートは `[...rawOptions].sort(...)` の新配列生成でイミュータブル規約に適合。`Array.prototype.sort` は安定ソートのため、同スコア時は従来の表示順が維持される。
- 在庫減算・保存経路（`computeInventoryAdjustments` / `.from("cooking_consumption_events")` 等）に変更がないことを確認。

## open_risks

- 実ブラウザでの optgroup 表示の目視は未実施（manual-smokes の skipped_checks 参照）。

## verdict

- passed。危険 eval はテーブル名トークンの過剰マッチで、実 schema・Storage・書き込み経路に変更がないことを diff で確認した。
