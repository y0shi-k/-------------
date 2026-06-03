---
ticket_id: TKT-0167-recipe-favorite-flag
status: passed
execution_mode: live_db_plus_static
target_evals:
  - supabase_schema_change
  - auth_and_rls_policy
---

# Manual Smokes

> 危険変更の本体（schema + RLS + 後方互換）は hosted DB で実検証済み。UI の happy-path（ハート操作・絞り込みの見た目）はユーザーのブラウザ確認に委ねる。

## 環境メモ

- このマシンに Docker 未導入のため真のローカル Supabase（`supabase start`）は不可。
- ユーザー明示承認のもと、linked プロジェクト `wwtompvneobysieofxkl`（hosted）へ `supabase db push` で適用した（2026-06-04）。
- schema / RLS / 後方互換は CLI（`supabase db query --linked`）で実検証。UI 操作は実ブラウザでユーザー実施。

## target_evals

- supabase_schema_change … `recipes.is_favorite` 列の追加。
- auth_and_rls_policy … 既存行ポリシーで is_favorite の参照・更新が自分の行に限定されること。

## executed_checks

- migration 適用: `supabase db push` で `20260603120000_recipe_is_favorite.sql` を適用。直後の `db push --dry-run` が "Remote database is up to date" を返す（適用済み）。→ **pass**
- 列定義: `information_schema.columns` で `is_favorite` = boolean / `column_default = false` / `is_nullable = NO`。→ **pass**
- 後方互換: 既存 `public.recipes` 6 行で `is_favorite is null` = 0 件、`is_favorite = true` = 0 件（既存レシピは全て default false で正常・欠損なし）。→ **pass**
- RLS 有効: `pg_class.relrowsecurity = true`。→ **pass**
- 行ポリシー: `pg_policies` で select/insert/update/delete の 4 ポリシーが全て `qual = (auth.uid() = user_id)`。is_favorite の参照・更新は新規ポリシー無しで自分の行に限定される。→ **pass**
- コード verify: lint / typecheck / test / build pass、policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present）pass（`verify.json`）。→ **pass**

## skipped_checks

UI happy-path はユーザーのブラウザで確認（自動ブラウザ操作は実 DB 相手のため未実施）。`web/` で dev サーバ（hosted DB 接続）を起動して以下を確認する想定:

- ハート切替 → リロード後も状態保持（hosted DB へ永続）。
- オフライン時（DevTools offline 等）の楽観的更新ロールバック＋「お気に入りを更新できませんでした。」トースト。
- ハート押下でカード選択が切り替わらない（`stopPropagation`）。
- 「お気に入り」チップで is_favorite=true のみ表示、検索/並び替えと AND 両立。
- 未選択=rose アウトライン / 選択=`--favorite` 塗り。スマホ幅（<=640px）でも破綻なし。
- 別アカウントでの RLS 越境テストは、ポリシー定義（auth.uid()=user_id）で論理担保されるため DB 定義確認で代替（実越境確認は任意）。

## open_risks

- hosted（実運用）DB へ適用済み。ロールバックは別 migration（`alter table public.recipes drop column is_favorite;`）が必要。
- カードのハート SVG は当初パスが非対称で崩れたため対称パス（Material Design favorite）へ修正済み。最終的な見た目はユーザーのブラウザ確認に依存。
- UI happy-path（実保存・絞り込み・モバイル）の最終確認はユーザー操作待ち。
