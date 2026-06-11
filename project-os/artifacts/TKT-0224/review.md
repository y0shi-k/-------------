---
ticket_id: TKT-0224-shopping-shortage-name-match
status: passed
review_scope:
  - SPEC-0222-ingredient-name-matching
  - TKT-0224-shopping-shortage-name-match
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- web/src/components/recipe-meal-workspace.tsx（`inventoryAmountByNameAndUnit` の name 条件のみ置換＋import）
- web/src/__tests__/recipe-meal-workspace.test.tsx（テスト4件追加）

## checked_artifacts

- project-os/artifacts/TKT-0224/verify.json（status: pass）
- project-os/artifacts/TKT-0224/manual-smokes.md（status: passed）

## subagent_usage

- impl-fast（Sonnet）に実装を委譲（route_model 判定: 非危険 eval のみ → fast）。オーケストレーター（Fable 5）が diff を監査。

## findings

- 変更は実質1行（フィルタ条件の name 側のみ）で、unit 一致条件・reduce 集計・シグネチャは不変。チケットの「変更の本体は `inventoryAmountByNameAndUnit` のフィルタ条件のみ」の想定どおり。
- 部分一致を合算しない性質は `matchesIngredientName` の仕様（score>=2 のみ true）に由来し、テストで固定済み。SPEC-0222 の買い忘れ防止方針に適合。
- 3箇所（スケジュール起点モーダル/調理ビュー起点モーダル/材料カードバッジ）への波及は同一関数経由であることをコードで確認。
- INSERT 経路（`confirmRecipeShortageSelection`）・schema・Storage に変更なし。

## open_risks

- なし。

## verdict

- passed。危険 eval はテーブル名トークンの過剰マッチで、実 schema・書き込み経路に変更がないことを diff で確認した。
