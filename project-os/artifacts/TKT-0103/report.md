# Report: TKT-0103

Status: ready

## Summary

Supabase schema v1を作成し、CLIでリンク済みSupabaseプロジェクトへ反映しました。

今回の変更では、Web版で使う主要テーブル、本人だけが読める/書けるRLS、非公開写真Storage bucketを追加しました。Canvas版の `app.html` は変更していません。

## Changed

- `supabase/migrations/20260523094705_schema_v1.sql` にDB/Storage/RLSの初期schemaを追加しました。
- `supabase/migrations/20260523095800_fix_composite_fk_delete_actions.sql` に外部キー削除時の補正を追加しました。
- `supabase/README.md` にschemaの読み方とCLI適用手順を追加しました。
- `web/.env.example` を秘密値なしの見本として復旧しました。
- `project-os/artifacts/TKT-0103/` にverify、manual smoke、review、reportを追加しました。

## DB Contents

- 在庫: `inventory_items`
- 登録待ち: `staging_items`
- 買い物: `shopping_items`
- レシピ: `recipes`
- レシピ材料: `recipe_ingredients`
- 献立: `meal_schedules`
- 料理履歴: `cooking_history`
- 写真メタ情報: `photos`
- 写真Storage: private bucket `photos`

## Verify

- `supabase db push --dry-run`: passed
- `supabase db push`: passed
- `supabase migration list`: passed
- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run test`: passed
- `npm run build`: passed
- 秘密情報の実値検索: passed

## Not Changed

- 認証UIは未実装です。TKT-0104で扱います。
- 在庫/レシピ/献立などの画面実装は未実装です。TKT-0105以降で扱います。
- CSV移行は未実装です。TKT-0110で扱います。
- APIキーやDBパスワードは追加していません。

## Next

TKT-0104-auth-self-user
