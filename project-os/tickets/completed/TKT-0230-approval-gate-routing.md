---
id: TKT-0230-approval-gate-routing
title: 承認ゲート（pending/disabled を /pending へ遮断）＋ルーティング4状態化
status: completed
goal: ログインできても未承認・停止ユーザーがデータ画面（在庫・レシピ・写真）へ入れてしまう穴を塞ぐ
acceptance:
  - `getAuthRedirectPath`（web/src/lib/auth/routing.ts）が「未ログイン / pending / disabled / approved」の4状態＋公開パス（/login /signup /auth/* /forgot-password /reset-password）を扱い、ユニットテストで全分岐が網羅されている
  - middleware（web/src/lib/supabase/middleware.ts）が getUser 成功後に profiles.status を1クエリで取得し、pending/disabled を `/pending` へ redirect する（approved は従来どおり）
  - `/pending` ページが承認待ち/利用停止をstatusに応じた文言で表示し、ログアウトボタンが機能する
  - pending ユーザーが `/`・データ画面・AI API route への直接アクセスでもデータへ到達できない（middleware の matcher 対象を確認）
  - profiles 行が無い・取得失敗時は安全側（pending 扱い）に倒れる
  - 既存の承認済みユーザーのログイン〜全画面動作が壊れていない
  - Web版 verify が通る
required_evals:
  - web_project_bootstrap
  - auth_and_rls_policy
eval_selection_mode: manual
changed_paths:
  - web/src/lib/auth/routing.ts
  - web/src/lib/supabase/middleware.ts
  - web/src/app/pending/
  - web/src/__tests__/
  - project-os/artifacts/TKT-0230/
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
  - artifacts/TKT-0230/verify.json
  - artifacts/TKT-0230/manual-smokes.md
  - artifacts/TKT-0230/review.md
  - artifacts/TKT-0230/report.md
owner_role: implementer
owner_notes:
  - 危険変更（auth_and_rls_policy）。manual-smokes.md / review.md 必須
  - ここが承認制の実効性の本体。「DBにstatusがあるがUIだけで隠す」状態にしないこと（middleware/server側で遮断）
  - AI server route（/api/ai/*）も保護対象。route 側の getUser ガードが既にあるか確認し、pending 遮断が効くことをスモークに含める
---

# Summary

middleware とルーティング純関数を4状態（未ログイン/pending/disabled/approved）へ拡張し、
未承認ユーザーを `/pending`（状態表示＋ログアウトのみ）へ固定する。設計は SPEC-0228「承認状態の判定位置」。

## 実装メモ

- 参照: `web/src/lib/auth/routing.ts`（現状2状態の純関数。テスト `web/src/__tests__/auth-routing.test.ts` あり。
  このテストファースト構造を維持して拡張する）
- middleware: `web/src/lib/supabase/middleware.ts` の `updateSession`。`getUser()` 成功後に
  `supabase.from("profiles").select("status").eq("id", user.id).maybeSingle()`（RLSで本人行のみ読める。TKT-0228 のポリシー前提）
- パフォーマンス: 既に毎リクエスト `getUser()`（ネットワーク呼び出し）があるため、+1クエリは許容と判断済み（SPEC-0228）。
  キャッシュ/JWT claim 化はしない
- `/pending` ページ: ログアウトは既存 `web/src/components/logout-button.tsx` を再利用
- 公開パス追加は TKT-0229 と重なる（/signup /auth/*）。実装順は 0229→0230 を推奨し、0230 で4状態化に統合する
- middleware の matcher（`web/src/middleware.ts` か next config）が静的アセット以外を覆っているか確認
- GAS/Spreadsheet/Drive 不使用。秘密鍵直書き禁止

## 非ゴール

- 承認操作のUI（TKT-0231）
- /signup /auth/confirm の新設そのもの（TKT-0229）
- メール通知（承認されたら通知する等は将来検討）

## 依存チケット

- TKT-0228（profiles と RLS が前提）
- TKT-0229（公開パスの整合。同時並行可だがマージ順は 0229 先を推奨）

## 手動確認（manual-smokes の観点）

- pending ユーザー: `/` `/login` 直叩き → `/pending` へ。URL直打ちでデータ画面・/api/ai/* へ到達不可
- disabled ユーザー: 同様に `/pending`（停止文言）
- approved ユーザー: 全画面従来どおり。ログイン→`/`、未ログイン→`/login` の既存挙動維持
- /pending からログアウト → /login へ

## 残リスク

- middleware の profiles 取得が落ちた場合は pending 扱い（安全側）だが、Supabase 障害時に承認済みユーザーも入れなくなる。個人運用では許容
