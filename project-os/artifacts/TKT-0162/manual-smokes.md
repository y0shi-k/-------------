---
ticket_id: TKT-0162-web-desktop-home-dashboard
status: passed
execution_mode: static_only
target_evals:
  - supabase_schema_change
---

# Manual Smokes

## target_evals

- `supabase_schema_change` 🔴（check-gates が自動点灯）。
  ただし本変更は schema/RLS/Storage を一切変更していない。点灯は `diff_regex_any` の
  テーブル名トークン（`recipes` / `cooking_history`(=`cookingHistoryWithPhotos`) 等）が
  TypeScript 識別子・既存語へ過剰マッチしたもの（TKT-0160/0166 と同種）。
  そのため required_manual_smokes（web_auth_guard / web_storage_security）は静的確認に留める。

## executed_checks

- diff 全体を確認し、`supabase/` 配下の migration / SQL を一切変更していないことを確認した
  （変更は `web/` のUI 4ファイル＋テスト2ファイルのみ）。
- ホームに渡すデータは page.tsx が既に取得済みの値の再利用のみで、新規 Supabase クエリ・
  Storage 署名URL生成・auth 経路の追加が無いことを確認した。
- `/verify TKT-0162` の policy チェック `supabase_rls_present` が pass（既存RLSの欠落なし）。
- typecheck / build pass（required_verify: web_typecheck / web_build）。

## skipped_checks

- web_auth_guard / web_storage_security のブラウザ実機スモーク … 認証・Storage 権限ロジックに
  変更が無いため省略（静的確認で代替）。新たな保護対象データ・公開バケット導入は無い。

## open_risks

- UI happy-path（PC初回ホーム表示・カード遷移、スマホ食材管理起点・ホーム非表示）の
  ブラウザ目視はユーザー残課題。データ保護面の追加リスクは無い。
