---
ticket_id: TKT-0228-auth-profiles-foundation
status: passed
execution_mode: static_only
target_evals:
  - supabase_schema_change
  - auth_and_rls_policy
---

# Manual Smokes

## target_evals

- supabase_schema_change（profiles テーブル新設 migration）
- auth_and_rls_policy（profiles の RLS ポリシー・is_admin 関数）

## executed_checks

実DBなし（ローカル Docker/ローカル Supabase 不在の既知制約）のため static_only で実施:

- migration SQL の机上トレース: 新規 signup → トリガー → pending/member 行作成、
  backfill → 既存ユーザー approved 化、の2経路で profiles 行が必ず1つになる（on conflict do nothing）。
- RLS ポリシーの机上トレース:
  - member セッション: `profiles_select_own` で自分の行のみ。他人行 update は `profiles_update_admin` 不成立で 0行。
  - admin セッション: `is_admin()`=true で全行 select / update 可。
  - クライアント insert/delete: ポリシー不在のため不可（行作成はトリガーのみ）。
- `is_admin()` の RLS 再帰なし（security definer・definer 権限で profiles を読む）と
  anon からの execute 不可（revoke + authenticated のみ grant）をSQL上で確認。
- migration の適用順依存: `set_updated_at()` は `20260523094705_schema_v1.sql` で定義済み・
  本 migration（20260611120000）が後順のため参照可能。
- 既存ログインへの影響: web/ コード無変更・既存テーブル/ポリシー無変更を diff で確認。

## skipped_checks

hosted 適用時（TKT-0233 の本番適用ゲート）に実機で消化する:

- 新規 auth ユーザー作成 → profiles 行が pending/member・email コピー付きで自動作成される
- 既存テストユーザーが従来どおりログイン・全画面動作（backfill approved の実確認）
- member セッションの devtools から: 他人行 select → 0行 / 他人行 update → 失敗
- admin 昇格（runbook SQL）→ 全行 select・status update が通る
- signup 失敗ケース: トリガー例外で signup が巻き添えにならないこと（重複再試行）

## open_risks

- 実DB未検証のまま後続チケット（0229〜0232）の実装が進む。適用時に profiles 設計の不備が
  見つかった場合は追加 migration で修正する（既存 migration の書き換えはしない）。
- admin update の列単位制限なし → TKT-0231 の UI ガード＋review で担保（report.md 参照）。
