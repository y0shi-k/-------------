---
ticket_id: TKT-0199-cooking-reorder-confirm-dialog
status: passed
target_evals:
  - pwa_mobile_ui
  - supabase_schema_change
  - web_project_bootstrap
---

# Manual Smokes

> 注: `supabase_schema_change` / `web_project_bootstrap` は差分の語彙（`recipes` 等）による過剰マッチで発火している。
> 本変更は確認ダイアログを挟むのみで、保存ロジック・保存対象カラム・schema/Storage/RLS をいずれも変更していない。

## target_evals

- 全画面ビューの `並び替えを確定` を押すと、保存前に確認メッセージが表示されること
- 確認OK（並びを確定）で従来どおり `saveCookingReorder` がレシピ本体へ保存すること
- 確認キャンセル（やめる）で保存されず未確定の並び替えが残ること
- 未確定の並び替えが無い時は確定ボタンが無効のまま（確認も出ない）こと
- 既存のUndo/Redo・料理完了フローが壊れていないこと
- 確認ダイアログが全画面ビューより前面に出ること（z-index）
- DB schema/Storage/auth/RLS を変更していないこと

## executed_checks

- `recipe-meal-workspace.test.tsx` を拡張（計37件）。追加1件で、確定ボタン押下で確認（`alertdialog`「並び替え確認」）が出ること・「やめる」で保存されず未確定が残ること・再度確定→OKで `sort_order` が保存されることを検証。既存の並び替え保存テスト3件（手順・材料・グループ間移動）も確認OK（「並びを確定」）を挟む形へ更新し全て成功。
- `npm run lint` / `npm run typecheck` / `npm run test` / `npm run build` を含むWeb版verify（`harness/bin/verify_web.sh TKT-0199-cooking-reorder-confirm-dialog`）が pass。
- 差分確認で、`saveCookingReorder` の保存本体・対象カラム（`prep_steps`/`steps`/`sort_order`/`item_type`）は未変更で、追加分は確認を挟む `requestSaveCookingReorder` とボタン `onClick` の差し替え、`.delete-confirm-backdrop` の z-index 引き上げのみであることを確認した。
- Supabase migration、Storage bucket、RLS、auth、API route、環境変数の変更がないことを確認した。
- Canvas版 `app.html` を編集していないことを確認した。

## skipped_checks

- 実ブラウザでの「確定→確認→OKで保存／やめるで未確定保持」の最終目視は、ユーザー実機で確認済み（z-index 修正後に確認ダイアログが正しく前面表示されることを確認）。当初の「無反応」「表示が遅い」報告は z-index 競合が原因で、修正により解消した。

## open_risks

- 確認文言・ボタン名は既存 `DeleteConfirmPanel`（tone="default"）を流用。専用デザインが必要なら別チケットで調整する。
- `supabase_schema_change` / `web_project_bootstrap` は語彙マッチによる発火で、実schema/migration/Storage/RLS/保存対象カラムは変更していない。
