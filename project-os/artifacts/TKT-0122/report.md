# TKT-0122 Report

## Summary

Web版に作りたい候補キューを追加し、候補登録、理由チップ表示、献立追加、解除を実装した。

## Changed

- `supabase/migrations/20260524190000_cook_candidates.sql`
  - `cook_candidates` table
  - RLS policies
  - indexes and updated_at trigger
- `web/src/lib/recipes/types.ts`
  - `CookCandidate` type
- `web/src/app/page.tsx`
  - 候補データ読み込み
- `web/src/components/recipe-meal-workspace.tsx`
  - 作りたい候補UIと保存/解除/献立追加
- `web/src/app/globals.css`
  - 候補カードと理由チップのスタイル
- `web/src/__tests__/recipe-meal-workspace.test.tsx`
  - 候補登録、献立追加、解除のテスト

## CSV Migration Format

Target table: `cook_candidates`

| CSV column | Supabase column | Required | Notes |
| --- | --- | --- | --- |
| `user_id` | `user_id` | yes | Import時に対象ユーザーIDへ置換する |
| `recipe_id` | `recipe_id` | no | 既存レシピと照合できる場合だけ入れる |
| `recipe_name` | `recipe_name` | yes | `recipe_id` がない場合の表示名として使う |
| `reasons` | `reasons` | no | CSVでは `期限が近い|家族リクエスト` のように `|` 区切りで保持し、Import時に `text[]` へ変換する |
| `status` | `status` | yes | 通常は `候補`。解除済み履歴を移す場合のみ `解除` |
| `created_at` | `created_at` | no | 元データの登録日時があれば保持する |

## Verify

- `npm run test -- recipe-meal-workspace`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
