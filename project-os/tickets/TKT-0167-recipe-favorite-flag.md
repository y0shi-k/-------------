---
id: TKT-0167-recipe-favorite-flag
title: レシピのお気に入り（is_favorite）新設＋カードのハート＋カテゴリ絞り込み連動
status: completed
goal: レシピに「お気に入り」を新設し、PCレシピカード（TKT-0166）のハートで切替・表示できるようにする。カテゴリ絞り込みチップ「お気に入り」と連動させ、docs/design/pc-design-language.md §3.3/§3.5 のトーンに合わせる。
acceptance:
  - recipes に is_favorite（boolean not null default false）を追加する migration がある
  - 既存レシピは is_favorite=false で動作し、欠損やエラーが出ない（後方互換）
  - PCレシピカードのフッタにお気に入りハートが表示され、クリックで切替が保存される（楽観的更新＋失敗時ロールバック）
  - 未選択はアウトライン、選択時は --favorite 塗りで表示される
  - カテゴリ絞り込みに「お気に入り」を追加し、選択時に is_favorite=true のレシピのみ表示される
  - スマホ幅（<=640px）でもお気に入り切替が破綻なく動作する（最低限の表示・操作）
  - RLS: recipes の既存行ポリシー（user_id 一致）で is_favorite の参照・更新が自分の行に限定される。新規ポリシーは不要なら追加しない
  - AI route / 写真Storage / 他テーブル schema は変更しない
required_evals:
  - supabase_schema_change
  - auth_and_rls_policy
eval_selection_mode: auto
changed_paths:
  - supabase/migrations/
  - web/src/lib/recipes/types.ts
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/page.tsx
  - web/src/app/globals.css
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0159-web-desktop-recipe-meal-layout
related_artifacts:
  - artifacts/TKT-0167-recipe-favorite-flag/verify.json
  - artifacts/TKT-0167-recipe-favorite-flag/report.md
  - artifacts/TKT-0167-recipe-favorite-flag/manual-smokes.md
  - artifacts/TKT-0167-recipe-favorite-flag/review.md
owner_role: implementer
owner_notes:
  - 設計正本は docs/design/pc-design-language.md（§3.3 フィルタチップ / §3.5 レシピカードのハート / §2.1 --favorite）。
  - 危険変更（supabase_schema_change + auth_and_rls_policy）。manual-smokes.md / review.md が必須。
  - 本番適用（`supabase db push`）は明示依頼があるときだけ。ローカル/CI verify と migration ファイル整備までを既定とし、本番DB操作は別判断。
  - verify は `/verify TKT-0167-recipe-favorite-flag`。RLS/秘密直書き/GAS漏れの policy チェックも通すこと。
  - Web版ではGAS/Spreadsheet/Driveを使わない。APIキー直書きなし。
---

# Summary

レシピに boolean のお気に入りフラグを足し、TKT-0166 の縦型カードにハートを載せ、カテゴリ絞り込みと連動させる。schema 変更を伴う危険変更のため、RLS と後方互換を必ず確認する。

## 実装メモ（次セッション向けの具体手順）

### 1. migration（supabase/migrations/）
- 新規ファイル例: `supabase/migrations/2026XXXXXXXXXX_recipe_is_favorite.sql`（命名は既存のタイムスタンプ連番に合わせる。直近は `20260602120000_ai_usage_events.sql`）。
- 内容:
  ```sql
  alter table public.recipes
    add column if not exists is_favorite boolean not null default false;
  ```
- recipes は既に RLS 有効＋行ポリシー（select/insert/update/delete が `auth.uid() = user_id`）があるため、**列追加だけでお気に入りの参照・更新も自分の行に限定される**。新規ポリシーは不要（不要なら足さない）。
- 既存の `schema_v1.sql` は編集しない（追記 migration で進める）。

### 2. 型（web/src/lib/recipes/types.ts）
- `Recipe` 型に `is_favorite: boolean;` を追加。

### 3. 取得マッピング（web/src/app/page.tsx）
- recipes は `select("*")` のためカラムは流れてくる。`recipesWithIngredients` のマップで `is_favorite: Boolean(recipe.is_favorite)` を明示し、未定義を false に正規化（後方互換）。

### 4. トグル保存（web/src/components/recipe-meal-workspace.tsx）
- カードに `onToggleFavorite(recipe)` を追加。
- 楽観的更新: 先に `setRecipes` でフラグ反転 → `supabase.from("recipes").update({ is_favorite }).eq("id", recipe.id).eq("user_id", userId)`。失敗時は前状態へロールバックし、レイアウトを動かさないトースト（既存 `showToast`）で通知。
- 既存の保存処理（saveRecipe 等）は壊さない。is_favorite は recipePayload に含めない（トグル専用更新にして責務分離）か、含めるなら既定値に注意。

### 5. カードUI（globals.css + JSX）
- カードのフッタ行にハートボタンを置く（§3.5）。未選択=アウトライン、選択=`--favorite` 塗り。
- ハートクリックは `event.stopPropagation()` でカード選択と分離。
- TKT-0166 の縦型カード構造（`.recipe-card` flex column）に収める。スマホでも最低限表示・操作できること。

### 6. カテゴリ絞り込み（JSX + globals.css）
- 既存の検索/並び替えに加え、§3.3 のチップ「お気に入り」を追加（active=`--accent` 塗り）。
- フィルタロジック: お気に入り選択時は `recipe.is_favorite === true` のみ。既存の `filterAndSortRecipes` と両立させる（お気に入り条件を AND で前段適用が無難）。
- 「よく作る」を出す場合は cook_count 由来で導出（schema変更不要・任意）。

## 残リスク

- 危険変更（schema + RLS 確認対象）。本番適用前に manual-smokes で「自分のレシピだけ切替可能・他ユーザー行は不可（RLS）」「既存レシピが false で正常」「楽観的更新の失敗ロールバック」を確認する。
- スマホでのハート配置は TKT-0166 がPC専用だったため、モバイル表示の最小対応を別途検討（過度に作り込まない）。
- 本番 `supabase db push` のタイミングは要ユーザー判断（decisions.md 参照）。
