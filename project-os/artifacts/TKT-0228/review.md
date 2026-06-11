---
ticket_id: TKT-0228-auth-profiles-foundation
status: passed
review_scope:
  - SPEC-0228-production-auth-onboarding
  - TKT-0228-auth-profiles-foundation
---

# Review Record

## checked_diff_paths

- supabase/migrations/20260611120000_auth_profiles.sql（新規）
- docs/runbook/Supabaseの反映と運用ガイド.md（§10b 追記: 初代 admin 昇格 SQL・承認/無効化の緊急時 SQL）

## checked_artifacts

- project-os/artifacts/TKT-0228/verify.json（status=pass）
- project-os/artifacts/TKT-0228/manual-smokes.md（static_only・skipped を hosted 適用時に消化）
- project-os/specs/SPEC-0228-production-auth-onboarding.md（設計正本との一致確認）

## subagent_usage

- 実装: impl-deep（Opus）サブエージェント。オーケストレーター（メインセッション）は委譲・監査・修正のみ。
- レビュー: メインセッションが migration 全文を読み、SPEC-0228「仕様」節と突合。

## findings

1. **[修正済み・中]** `handle_new_user` トリガーが `new.email` を直接 insert しており、email が null の場合
   NOT NULL 制約違反で **signup 全体が失敗**する経路があった（backfill 側のみ coalesce 済みの非対称）。
   → オーケストレーターが `coalesce(new.email, '')` へ修正。
2. **[許容・低]** anon クライアントの profiles select は `is_admin()` の execute 権限がないためエラーになる
   （0行ではない）。拒否としては機能し、アプリは認証後にのみ照会するため許容。
3. **[後続チケットで担保・中]** `profiles_update_admin` は列単位制御不可のため、admin は profiles の
   任意列（email 含む）を更新できる。TKT-0231 の UI で許可列（status/role/approved_at/approved_by）に
   限定し、同チケットの review で再確認する。
4. **[確認済み]** security definer 関数2つとも `set search_path = public, pg_temp` 固定（search_path 乗っ取り対策）。
   is_admin は anon/public から revoke 済み。秘密情報・個人メールの直書きなし。
5. **[確認済み]** 既存テーブル・既存 RLS・web/ コードへの変更なし。Canvas `app.html` 不変。
   GAS/Spreadsheet/Drive 依存なし。

## open_risks

- 実DB（hosted）未適用・未検証。manual-smokes.md の skipped_checks を TKT-0233 適用ゲートで消化するまで、
  本チケットの「完了」はコード成果物としての完了であり、本番有効化の完了ではない。

## verdict

passed — 設計は SPEC-0228 に一致し、危険変更（schema/auth・RLS）として必要な安全装置
（check 制約・RLS・definer 関数の権限絞り・null 耐性）を確認した。指摘1件は修正済み。
