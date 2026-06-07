---
ticket_id: TKT-0195-recipe-detail-edit-entrypoint
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
- `pwa_mobile_ui`: 詳細パネルの編集ボタン追加がスマホ幅でも押しやすい設計か静的確認。
- `supabase_schema_change`: `/check-gates` の過剰マッチ。実際の migration / schema 変更はないことを確認。
- `photo_upload_storage`: `/check-gates` の過剰マッチ。実際のStorage保存・画像アップロード処理変更はないことを確認。

## executed_checks

- `harness/bin/verify_web.sh TKT-0195-recipe-detail-edit-entrypoint`: pass。
- 静的確認: 変更対象は `recipe-meal-workspace.tsx`、`globals.css`、テスト、project-os成果物のみ。
- 静的確認: `supabase/migrations/`、Storage upload/remove処理、AI/API route、認証/RLSの変更なし。
- 静的確認: 詳細パネルの編集ボタンは既存 `startEditRecipe` を呼ぶだけで、新しい保存経路を作っていない。
- 自動テスト: 詳細パネルの編集ボタンから既存編集モーダルが開くことを確認。

## skipped_checks

- 実機スマホでのタップ確認は未実施。

## open_risks

- 実機での押しやすさは端末差があるため、必要なら人の目視確認を行う。
