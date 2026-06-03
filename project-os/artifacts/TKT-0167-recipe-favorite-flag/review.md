---
ticket_id: TKT-0167-recipe-favorite-flag
status: passed
review_scope:
  - SPEC-0159-web-desktop-recipe-meal-layout
  - TKT-0167-recipe-favorite-flag
---

# Review Record

> 危険変更（supabase_schema_change + auth_and_rls_policy）。schema/RLS/後方互換とアプリ実装をレビューした。

## checked_diff_paths

- `supabase/migrations/20260603120000_recipe_is_favorite.sql`（新規・列追加のみ）
- `web/src/lib/recipes/types.ts`（Recipe 型に is_favorite 追加）
- `web/src/app/page.tsx`（取得マッピングで Boolean 正規化）
- `web/src/components/recipe-meal-workspace.tsx`（トグル関数・絞り込み state/ロジック・チップ・カードフッタのハート・RecipeList props）
- `web/src/app/globals.css`（フィルタチップ・ハートボタン・PC幅フッタ）
- `web/src/__tests__/recipe-meal-workspace.test.tsx`（fixture に is_favorite 追加）
- `harness/bin/hook_decisions_reminder.py`（Stop hook の出力スキーマ修正・本チケットと別件の付随修正）

## checked_artifacts

- `verify.json`（lint/typecheck/test/build pass、policy 3 種 pass）
- `manual-smokes.md`（hosted DB での schema/RLS/後方互換の実検証結果）

## subagent_usage

- なし（単一セッションで実装・検証）。

## findings

### Schema / RLS（危険変更の本体）
- 加算的単一変更のみ: `alter table public.recipes add column if not exists is_favorite boolean not null default false;`。`schema_v1.sql` は無改変、追記 migration で進めた。
- 新規 RLS ポリシーを追加していない。既存 recipes 行ポリシー（select/insert/update/delete = `auth.uid() = user_id`）が列にも効くため is_favorite は自分の行に限定される。hosted で `pg_policies` 4 ポリシーが全て `auth.uid() = user_id`、`relrowsecurity = true` を確認。
- 後方互換: hosted 既存 6 行が null 0 件 / true 0 件（全て default false）。加えて `page.tsx` の `Boolean(recipe.is_favorite)` 正規化で取得側でも未定義を false に倒す二重の後方互換。

### アプリ実装
- トグルは専用更新 `toggleRecipeFavorite` に分離し、既存 `saveRecipe` payload に is_favorite を混ぜていない（保存処理の回帰回避・責務分離）。
- 楽観的更新＋失敗ロールバックは既存 `moveScheduleToSlot` と同型（previous 退避→即時 immutable 更新→失敗時復元＋非破壊トースト）。
- 更新クエリに `.eq("user_id", userId)` を明示し RLS と二重で自分の行限定。
- 絞り込みは `filterAndSortRecipes` を変更せず入力を前段 AND フィルタ（`favoriteFilteredRecipes`）。検索/並び替えと両立。
- ハートは `event.stopPropagation()` でカード選択と分離。
- AI route / 写真Storage / 他テーブル schema は無改変（写真系 eval は誤マッチで、本変更は写真に触れていない）。

### UI / トーン
- `--favorite` は既存 `:root` トークンを使用（新規追加なし）。未選択=アウトライン / 選択=塗り（§3.5）。チップは pill・active=`--accent`（§3.3）。スマホはフッタ 1 行追加の最小対応で既存レイアウト温存。
- ハート SVG は当初の非対称パスで崩れたため対称パスへ修正済み。

### verify
- lint/typecheck/test/build pass。typecheck で初回検出したテスト fixture の型不足を修正済み。

## open_risks

- hosted（実運用）DB へ適用済み。ロールバックは別 migration（`drop column is_favorite`）が必要。
- UI happy-path（実保存・絞り込み・モバイル表示・ハート最終見た目）の確認はユーザーのブラウザ操作待ち（manual-smokes.md の skipped_checks）。

## verdict

合格（pass）。危険変更の本体（schema + RLS + 後方互換）は hosted DB で実検証済みでブロッキング指摘なし。UI happy-path のみユーザーのブラウザ確認を残す。
