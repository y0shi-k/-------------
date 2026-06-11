---
id: TKT-0228-auth-profiles-foundation
title: profiles テーブル新設（承認status/adminロール）＋自動作成トリガー＋backfill
status: completed
goal: 「誰が承認済みか・誰が管理者か」をDBで表現できない状態を解消し、承認制ログインの土台を作る
acceptance:
  - migration に `public.profiles`（id/email/status/role/approved_at/approved_by/created_at/updated_at、SPEC-0228 のcheck制約どおり）が定義されている
  - `auth.users` AFTER INSERT トリガーで profiles 行が `status='pending', role='member'` で自動作成される（email コピー込み）
  - migration 内 backfill で既存 auth.users 全員の profiles が `status='approved', role='member'` で作成される
  - profiles の RLS が有効で、本人=自分の行 select のみ / admin=`public.is_admin()` 経由で全行 select・update 可 / クライアントからの insert・delete 不可
  - `public.is_admin()` が security definer で定義され、RLS 再帰なしに role='admin' を判定できる
  - 初代 admin 昇格用の SQL 手順が docs/runbook/ に追記されている（migration に個人メールを直書きしない）
  - Web版 verify が通る（既存ログイン・既存画面に影響なし）
required_evals:
  - supabase_schema_change
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - supabase/migrations/
  - docs/runbook/
  - project-os/artifacts/TKT-0228/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0228-production-auth-onboarding
related_artifacts:
  - artifacts/TKT-0228/verify.json
  - artifacts/TKT-0228/manual-smokes.md
  - artifacts/TKT-0228/review.md
  - artifacts/TKT-0228/report.md
owner_role: implementer
owner_notes:
  - 危険変更（supabase_schema_change + auth_and_rls_policy）。manual-smokes.md / review.md 必須
  - ローカル Docker / ローカル Supabase なし（decisions.md 既知制約）。hosted への `supabase db push` は**ユーザー明示承認後のみ**。このチケットでは migration ファイル作成までを実装範囲とし、適用は TKT-0233 の本番適用ゲートで行ってよい
  - APIキー・秘密鍵・個人メールアドレスを migration / docs に直書きしない
---

# Summary

承認制ログインのDB土台。`public.profiles` を新設し、status（pending/approved/disabled）と
role（member/admin）でユーザー状態を表現する。設計の正本は SPEC-0228「仕様」節。

## 実装メモ

- 配置: `supabase/migrations/<timestamp>_auth_profiles.sql`（命名は既存 migration に倣う。例: `20260523094705_schema_v1.sql`）
- 既存 RLS パターンの参照: `supabase/migrations/20260523094705_schema_v1.sql`（`auth.uid() = user_id` 方式）と
  `20260602120000_ai_usage_events.sql`（security definer 関数＋クライアント書き込み遮断の前例。decisions.md 2026-06-02 付近参照）
- トリガー関数は `security definer set search_path = public` を付ける（Supabase 標準パターン。
  auth スキーマのトリガーから public への insert に必要）
- `is_admin()` は `stable` で定義し、profiles を definer 権限で読む（呼び出し元 RLS の再帰を回避）
- admin update ポリシーは `using (public.is_admin())`。update 対象列の制限（status/role/approved_at/approved_by）は
  DB では列単位制御できないため、UI 側ガード（TKT-0231）＋review で担保する方針を review.md に明記
- backfill は `insert ... select id, email, 'approved', 'member' from auth.users on conflict do nothing`
- runbook 追記先: `docs/runbook/`（TKT-0149 が作った既存の Supabase 手順ファイルがあれば同居させる）
- GAS/Spreadsheet/Drive 不使用。Storage 権限は触らない

## 非ゴール

- web/ 側のUI・middleware 変更（TKT-0229/0230）
- 承認操作のUI（TKT-0231）
- hosted DB への適用そのもの（ユーザー承認後、TKT-0233 ゲートで実施可）

## 依存チケット

- なし（イニシアチブの土台。TKT-0229〜0232 はこれに依存）

## 手動確認（manual-smokes の観点）

- 新規 auth ユーザー作成 → profiles 行が pending/member で自動作成される
- 一般ユーザーのセッションで他人の profiles select → 0行、update → エラー/0行
- admin ユーザーで全行 select / status update が通る
- 既存テストユーザーが従来どおりログイン・データ閲覧できる（backfill 済み approved）

## 残リスク

- hosted 適用までローカルで実DB検証ができない（既知制約）。適用時の manual-smokes で実機確認する
- `supabase_schema_change` の diff_regex は既存テーブル名にも過剰マッチするが、本チケットは実 schema 変更ありのため正当マッチ
