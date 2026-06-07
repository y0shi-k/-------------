---
ticket_id: TKT-0196-cooking-step-amount-chips
status: passed
execution_mode: automated_and_static
target_evals:
  - web_project_bootstrap
  - supabase_schema_change
  - photo_upload_storage
  - pwa_mobile_ui
---

# Manual Smokes

## target_evals

- `web_project_bootstrap`: Web版全体の lint / typecheck / test / build を確認。
- `pwa_mobile_ui`: 手順チップ内の分量表示がスマホ幅でも崩れにくい設計か静的確認。
- `supabase_schema_change`: `/check-gates` の過剰マッチ。実際の migration / schema 変更はないことを確認。
- `photo_upload_storage`: `/check-gates` の過剰マッチ。実際のStorage保存・画像アップロード処理変更はないことを確認。

## executed_checks

- `harness/bin/verify_web.sh TKT-0196-cooking-step-amount-chips`: pass。
- 静的確認: 手順本文は書き換えず、React要素の材料名チップと分量チップを表示している。
- 静的確認: 本文に `大さじ1` / `小さじ1` がある場合は本文由来の分量を色付き表示し、本文に量がない場合は登録済み量を補う。
- 静的確認: 本文に分量が続く場合は登録済み量を重複表示しない。
- 静的確認: `dangerouslySetInnerHTML` やHTML文字列の直接差し込みは使っていない。
- 静的確認: `supabase/migrations/`、Storage upload/remove処理、AI/API route、認証/RLSの変更なし。
- 自動テスト: 手順に `2個`、`大さじ1` が表示され、`1大さじ` が表示されないことと、材料名チップの押下が従来どおり動くことを確認。

## skipped_checks

- 実機スマホでの表示確認は未実施。

## open_risks

- 表示量は登録済み総量であり、工程ごとの分量ではない。
- 実機でのチップ内分量の読みやすさは端末差がある。
