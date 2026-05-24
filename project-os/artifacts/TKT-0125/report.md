# TKT-0125 Report

## Summary

調理完了前の消費量確認、同カテゴリ/同単位の代替在庫選択、在庫減算、料理履歴作成、消費履歴保存を実装した。

## Changed

- `supabase/migrations/20260524193000_cooking_consumption_events.sql`
  - `cooking_consumption_events` table
  - RLS policies
  - history/schedule/recipe/stock references
- `web/src/components/recipe-meal-workspace.tsx`
  - 消費量確認UI
  - 在庫減算
  - 料理履歴作成後の消費履歴保存
- `web/src/app/globals.css`
  - 消費確認カードのスマホ向け表示
- `web/src/__tests__/recipe-meal-workspace.test.tsx`
  - 消費確認、在庫減算、履歴作成、消費履歴保存のテスト

## CSV Migration Format

Target table: `cooking_consumption_events`

| CSV column | Supabase column | Required | Notes |
| --- | --- | --- | --- |
| `user_id` | `user_id` | yes | Import時に対象ユーザーIDへ置換する |
| `cooking_history_id` | `cooking_history_id` | no | 料理履歴と照合できる場合だけ入れる |
| `meal_schedule_id` | `meal_schedule_id` | no | 献立由来の場合だけ入れる |
| `recipe_id` | `recipe_id` | no | レシピ照合できる場合だけ入れる |
| `ingredient_name` | `ingredient_name` | yes | レシピ上の材料名 |
| `requested_amount` | `requested_amount` | yes | レシピ上の必要量 |
| `requested_unit` | `requested_unit` | yes | レシピ上の単位 |
| `consumed_amount` | `consumed_amount` | yes | 実際に減算した量 |
| `consumed_unit` | `consumed_unit` | yes | 減算単位 |
| `stock_item_id` | `stock_item_id` | no | 在庫と照合できる場合だけ入れる |
| `stock_item_name` | `stock_item_name` | no | 代替品選択時の実在庫名 |
| `substitute_for` | `substitute_for` | no | 代替した場合の元材料名 |
| `created_at` | `created_at` | no | 元データの消費日時があれば保持する |

## Verify

- `npm run test -- recipe-meal-workspace`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
