---
ticket_id: TKT-0228-auth-profiles-foundation
status: ready
---

# Report Draft

## 変更目的

承認制ログイン（SPEC-0228 ログイン本番化イニシアチブ）のDB土台を作る。
これまで「誰が承認済みか・誰が管理者か」をDBで表現できず、新規ユーザーの受け入れが
Supabase Dashboard 手動作成に依存していた。`public.profiles`（status/role）を新設し、
後続の TKT-0229〜0232（signup・承認ゲート・管理画面・PWリセット）の前提を整えた。

## 今回追加した安全装置

- `public.profiles`: status（pending/approved/disabled）・role（member/admin）に check 制約。
- 新規 auth ユーザーは AFTER INSERT トリガー（`handle_new_user`、security definer・search_path 固定）で
  自動的に `pending`/`member` 行が作られる（承認されるまで利用不可の前提をDBが保証）。
- backfill で既存ユーザー全員を `approved`/`member` 化（既存テストユーザーを締め出さない）。
- RLS 有効化: 本人=自分の行 select のみ。admin=`is_admin()`（security definer・RLS再帰回避）で全行 select/update。
  insert/delete ポリシーなし（クライアントから行の作成・削除は不可）。
- `is_admin()` の execute 権限を authenticated のみに限定（anon/public から revoke）。
- トリガーの email は `coalesce(new.email, '')` で null 耐性（null メールで signup 全体が落ちない）。
- service role key は web/ に持ち込まない方針（SPEC-0228 決定）を維持。コード側変更なし。

## 実施した確認

- `/verify TKT-0228`: lint / typecheck / test(449件) / build すべて pass。
  policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present）pass（verify.json 参照）。
- オーケストレーター（メインセッション）による migration の机上レビュー（review.md 参照）。
  指摘1件（トリガー email の null 耐性）を修正済み。
- `set_updated_at()` 再利用の前提確認（schema_v1 で定義済み・migration 順序で先行）。
- 実DBでの動作確認は未実施（下記残リスク）。

## 残リスク

- **hosted 未適用**: ローカル Docker/ローカル Supabase なし（既知制約）のため、実DBでの
  トリガー動作・RLS 実挙動は未検証。適用は TKT-0233 の本番適用ゲートで実施し、
  manual-smokes.md の skipped_checks を実機で消化する。
- admin update ポリシーは列単位制御ができず、admin は profiles の任意列を更新できる。
  許可列（status/role/approved_at/approved_by）の限定は TKT-0231 の UI ガード＋review で担保する。
- 未ログイン（anon）クライアントが profiles を select すると、`is_admin()` の execute 権限がないため
  0行ではなくエラーになる。拒否としては機能するため許容（middleware は認証後にのみ照会する）。
- check-gates の diff 判定で photo_upload_storage / csv_import_migration が表示されるが、これは
  作業ツリーに他チケットの未コミット変更（73パス）が混在しているための過剰マッチ。
  本チケットの実変更は `supabase/migrations/20260611120000_auth_profiles.sql` と
  `docs/runbook/Supabaseの反映と運用ガイド.md` のみで、写真Storage・CSV移行は無変更。

## 次の依頼や人判断

- TKT-0229（signup フロー）以降の実装続行（依存順: 0229→0230→0231→0232→0233）。
- hosted への `supabase db push` のタイミング判断（推奨: TKT-0233 runbook 完成後にまとめて適用）。
- 適用後、runbook の初代 admin 昇格 SQL をユーザー自身が実行（管理者メールの実値はユーザーのみが知る）。
