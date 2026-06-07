---
ticket_id: TKT-0197-cooking-step-reorder-save
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
- `pwa_mobile_ui`: 行左側の3本線ハンドル、Undo / Redo、変更行の色枠があることを確認。
- `supabase_schema_change`: `/check-gates` の過剰マッチ。実際の migration / schema 変更はないことを確認。
- `photo_upload_storage`: `/check-gates` の過剰マッチ。実際のStorage保存・画像アップロード処理変更はないことを確認。

## executed_checks

- `harness/bin/verify_web.sh TKT-0197-cooking-step-reorder-save`: pass。
- 静的確認: 手順保存対象は既存 `recipes.prep_steps` / `recipes.steps`。
- 静的確認: 材料保存対象は既存 `recipe_ingredients.sort_order` / `recipe_ingredients.item_type`。
- 静的確認: 献立、料理履歴、消費履歴、在庫減算の保存処理は変更していない。
- 静的確認: `supabase/migrations/`、Storage upload/remove処理、AI/API route、認証/RLSの変更なし。
- 自動テスト: 下ごしらえから調理工程へ移動後、`並び替えを確定` で期待どおりupdateされることを確認。
- 自動テスト: 材料・調味料をまたいだ移動、Undo / Redo、変更行の色枠、`sort_order` / `item_type` 保存を確認。
- 自動テスト: 既存の調理完了、消費量確認、料理履歴保存、在庫減算のテストがpass。

## skipped_checks

- 実機スマホでのD&D操作の目視確認は未実施。

## open_risks

- HTML5 D&Dはスマホブラウザで操作しづらい場合がある。3本線ハンドルはあるが、実機での操作感確認は残る。
