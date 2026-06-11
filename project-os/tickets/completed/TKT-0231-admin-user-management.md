---
id: TKT-0231-admin-user-management
title: アプリ内管理者画面（申請承認/拒否・ユーザー一覧・無効化）
status: completed
goal: ユーザー受け入れのたびに Supabase Dashboard を開く運用をなくし、承認操作をアプリ内で完結させる
acceptance:
  - `/admin` ページで pending 申請一覧（メール・申請日時）と全ユーザー一覧（status/role）が表示される
  - 承認（status='approved'＋approved_at/approved_by 記録）・拒否（status='disabled'）・無効化/再有効化がボタン操作ででき、結果が一覧へ即時反映される
  - 非admin（member）が `/admin` へアクセスすると `/` へ redirect される（サーバー側判定。UI隠しだけにしない）
  - admin 自身の行に対する「無効化・降格」操作が UI で抑止されている（自分を締め出さない）
  - 書き込みは RLS admin ポリシー（TKT-0228）経由のクライアント update のみで、service role key を使っていない
  - admin ユーザーにのみ管理画面への導線（ナビ/設定内リンク）が表示される
  - 一覧・承認操作のユニットテストが追加され、Web版 verify が通る
required_evals:
  - web_project_bootstrap
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/src/app/admin/
  - web/src/components/
  - web/src/lib/auth/
  - web/src/lib/navigation.ts
  - web/src/__tests__/
  - project-os/artifacts/TKT-0231/
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
  - artifacts/TKT-0231/verify.json
  - artifacts/TKT-0231/manual-smokes.md
  - artifacts/TKT-0231/review.md
  - artifacts/TKT-0231/report.md
owner_role: implementer
owner_notes:
  - 危険変更（auth_and_rls_policy）。manual-smokes.md / review.md 必須
  - service role key を web/ に持ち込まない（SPEC-0228 で決定済み）。auth.users の削除等が必要になっても本チケットでやらない
  - 権限判定はサーバーコンポーネント/サーバー側で profiles.role を読む。クライアントだけの判定にしない
---

# Summary

admin ロール限定の管理画面。profiles の status/role を RLS admin ポリシー経由で更新する。
設計の正本は SPEC-0228「承認の書き込み経路」「画面・ルート構成」。

## 実装メモ

- 権限判定: `/admin` のサーバーコンポーネント（page.tsx）で自分の profiles.role を取得し、
  非adminは `redirect("/")`。middleware に admin 判定を足すか page 側でやるかは実装者判断
  （middleware の status クエリ（TKT-0230）と二重取得にならない形を優先）
- 一覧/更新: admin セッションなら RLS（`is_admin()`）で profiles 全行 select / update 可能。
  `createBrowserSupabaseClient`（`web/src/lib/supabase/browser.ts`）でクライアント更新→再取得 or 楽観更新
- UI パターン参照: 一覧＋操作ボタンの既存例として `web/src/components/inventory-board.tsx` /
  `web/src/components/settings-panel.tsx`。確認パネルは `web/src/components/delete-confirm-panel.tsx` を再利用
  （拒否・無効化は破壊的操作として確認を挟む）
- ナビ導線: `web/src/lib/navigation.ts` と `web/src/components/web-mode-shell.tsx`（PCサイドバー/設定ギア）。
  admin のみ表示。スマホ導線は設定画面内リンクで足りる（主ナビへ昇格させない。decisions.md のIA方針に従う）
- 文言・トーンは既存日本語UIに合わせる（`data-tooltip` 等の既存作法を踏襲）
- イミュータブル更新（配列の filter/map で新配列）・小さいコンポーネント分割（グローバル規約）
- GAS/Spreadsheet/Drive 不使用

## 非ゴール

- ユーザー削除・auth.users 操作（Dashboard で実施。runbook に記載）
- 承認/拒否のメール通知
- 監査ログ（approved_by/approved_at の記録までで十分とする）
- 招待機能

## 依存チケット

- TKT-0228（profiles＋admin RLS ポリシー）
- TKT-0230（承認ゲート。0230 が無いと「承認」の効果が確認できない）

## 手動確認（manual-smokes の観点）

- admin: pending 申請を承認 → 当該ユーザーが次のアクセスで `/` に入れる
- admin: 拒否/無効化 → 当該ユーザーが `/pending`（停止）へ落ちる。再有効化で復帰
- member: `/admin` 直叩き → `/` へ redirect。導線も非表示
- member セッションの devtools から profiles 全行 select / 他人行 update → RLS で遮断
- admin が自分自身を無効化できないことを確認

## 残リスク

- RLS の update ポリシーは列単位制御ができないため、admin が role 列も更新できる。UI で抑止し review で確認（TKT-0228 owner_notes 参照）
