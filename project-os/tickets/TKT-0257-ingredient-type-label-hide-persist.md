---
id: TKT-0257-ingredient-type-label-hide-persist
title: 「種別ラベルを隠す」をレシピごとに永続化する（recipes に bool 列追加・schema変更）
status: draft
goal: 食材/調味料を混在させたレシピで、種別ラベル（行バッジ＋セクション見出し）を隠す設定をレシピ単位で保存・復元できるようにする
acceptance:
  - migration で `recipes.hide_ingredient_type_label boolean not null default false` が追加され、`supabase db push`（または migration up）で適用できる
  - 編集モーダルと調理ビューに「種別ラベルを隠す」トグルがあり、ONにすると行の種別バッジとセクション見出し（材料/調味料ラベル）が非表示になる
  - トグル状態がレシピ単位で保存され、レシピを保存→再読込しても保持される
  - 既存レシピは default false（従来どおりラベル表示）で、表示が壊れない
  - recipes の RLS/権限は既存ポリシーを踏襲し、他ユーザーのレシピ設定を読み書きできない
  - `/verify` が通り、manual-smokes.md / review.md を作成して全 required_gates が閉じる
required_evals:
  - supabase_schema_change
eval_selection_mode: auto
changed_paths:
  - supabase/migrations/
  - web/src/app/page.tsx
  - web/src/lib/recipes/types.ts
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0255-ingredient-cross-type-reorder-mobile
related_artifacts:
  - artifacts/TKT-0257-ingredient-type-label-hide-persist/verify.json
  - artifacts/TKT-0257-ingredient-type-label-hide-persist/report.md
  - artifacts/TKT-0257-ingredient-type-label-hide-persist/manual-smokes.md
  - artifacts/TKT-0257-ingredient-type-label-hide-persist/review.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0257`。コマンド正本は `harness/registry.json`
  - **危険変更（supabase_schema_change）**。manual-smokes.md / review.md 必須。required_gates に manual_smokes_done / review_ready を含む
  - **DB破壊禁止**: `supabase db reset` は使わない。migration を**追加**して up で適用する（memory: supabase-db-reset-denied 参照）
  - 本番Supabaseへの適用は明示依頼があるときだけ。未適用デプロイでも default false で動くこと（NOT NULL DEFAULT を付ける）
---

# Summary

`recipes` に「種別ラベルを隠す」bool 列を追加し、編集モーダル/調理ビューのトグルからレシピ単位で永続化する。`is_favorite`（TKT-0167）と同じ「recipes に bool 列を1本足す」前例パターンを踏襲する。

## 実装メモ

### 前例（必ず参照）
- TKT-0167（`is_favorite` 追加）の migration / 型 / 読み書き経路をなぞる。`Recipe` 型に `is_favorite`（`web/src/lib/recipes/types.ts:29`）がある。同じ位置に `hide_ingredient_type_label: boolean` を追加する。

### migration
- `supabase/migrations/<timestamp>_recipe_hide_ingredient_type_label.sql` を新設。
  ```sql
  alter table public.recipes
    add column if not exists hide_ingredient_type_label boolean not null default false;
  ```
- RLS は recipes の既存ポリシーがそのまま列に効く（列追加のみ・ポリシー変更なし）。新規ポリシーは作らない（auth_and_rls_policy を誘発しない）。

### 読み（load）
- `web/src/app/page.tsx:61` の `.from("recipes").select(...)` に `hide_ingredient_type_label` を追加。
- `Recipe` 型（`web/src/lib/recipes/types.ts:19`）に列追加。`toRecipeFormValues`（130行付近）/ `emptyRecipeFormValues`（99行付近）/ `RecipeFormValues`（82行）にも反映（default false）。

### 書き（save）
- `web/src/components/recipe-meal-workspace.tsx` の recipe insert/update payload（1399行付近の `.from("recipes")` 経路）に `hide_ingredient_type_label` を含める。

### UI
- 編集モーダルと調理ビューの材料ペインに「種別ラベルを隠す」トグル（state ＋ recipeValues 連動）。
- ON時: 行の種別バッジ（編集側の表示／調理側 `cooking-type-badge` = 4522行）と、ALL時のセクション見出し・タブ上のラベルではなく**行レベルのラベル**を非表示にする。CSS の data 属性 or 条件描画で出し分け。
- TKT-0255/0256 で ALL は単一混在リストになっている前提。ラベル隠しは主に「混在ALL表示」で意味を持つが、フィルタ表示でも一貫してバッジを消してよい。

### テスト
- 読み書きのラウンドトリップ（保存→再取得で値が保持）を `web/src/__tests__/recipe-meal-workspace.test.tsx` 系に追加。

### manual-smokes（必須・危険変更）
- ①ラベル隠しOFFレシピ＝従来どおりバッジ表示 ②ONにして保存→再読込で非表示が保持 ③別ユーザーのレシピ設定を読み書きできない（RLS）。

### 注意・ポリシー
- `supabase db reset` 禁止。migration 追加で適用。APIキー/秘密鍵は env 管理。Canvas版 `app.html` は触らない。

## 非ゴール

- 端末/ブラウザ単位やグローバルの表示設定（今回は**レシピ単位**のみ）。
- 混在並び替えそのもの（→ TKT-0255 / TKT-0256）。

## 依存チケット

- TKT-0255・TKT-0256（混在表示が前提。ラベル隠しはその上で意味を持つ）。

## 残リスク

- 未適用 migration のままデプロイすると insert/update で列不明エラーになりうる。`db push` 適用とデプロイ順を report/manual-smokes に明記する。default false なので読みは安全。
