---
ticket_id: TKT-0199-cooking-reorder-confirm-dialog
status: passed
review_scope:
  - SPEC-0199-cooking-reorder-confirm-dialog
  - TKT-0199-cooking-reorder-confirm-dialog
---

# Review Record

## checked_diff_paths

- `web/src/components/recipe-meal-workspace.tsx`
- `web/src/app/globals.css`
- `web/src/__tests__/recipe-meal-workspace.test.tsx`
- `project-os/artifacts/TKT-0199-cooking-reorder-confirm-dialog/verify.json`
- `project-os/artifacts/TKT-0199-cooking-reorder-confirm-dialog/report.md`
- `project-os/artifacts/TKT-0199-cooking-reorder-confirm-dialog/manual-smokes.md`
- `project-os/artifacts/TKT-0199-cooking-reorder-confirm-dialog/review.md`

## checked_artifacts

- `project-os/artifacts/TKT-0199-cooking-reorder-confirm-dialog/verify.json`
- `project-os/artifacts/TKT-0199-cooking-reorder-confirm-dialog/report.md`
- `project-os/artifacts/TKT-0199-cooking-reorder-confirm-dialog/manual-smokes.md`

## findings

- Blocking finding はありません。
- `requestSaveCookingReorder(recipe)` は `hasCookingReorderChanges` が無ければ何もせず、ある場合のみ既存の `requestDelete` / `DeleteConfirmPanel` を流用して確認を出す実装で、新規ダイアログ機構を増やしていません。TKT-0197 の調理完了前確認と同方式です。
- 確認OK（「並びを確定」）時のみ既存 `saveCookingReorder` を呼び、やめる時は state を一切変えず未確定の並び替えを保持します。保存ロジック・対象カラム（`prep_steps`/`steps`/`sort_order`/`item_type`）は未変更です。
- 実機フィードバックで判明した「確定ボタンが無反応／表示が遅い」は、`.delete-confirm-backdrop`（z-index:80）が全画面ビュー `.cooking-overlay`（z-index:85）の裏に隠れていたことが原因。`.delete-confirm-backdrop` を z-index:100 に引き上げ、消費量/不足選択モーダル(90)も含め最前面に出るよう修正済み。同機構を使う TKT-0197 の料理完了前確認も併せて前面化されます。
- Undo/Redo・料理完了フローへの変更はありません。
- APIキー、Service Role Key の直書きはありません。`console.log` の残置もありません。
- Canvas版 `app.html` は変更されていません。

## open_risks

- 確認文言・ボタン名は既存 `DeleteConfirmPanel`（tone="default"）を流用。専用デザインが必要なら別チケットで調整。
- `check-gates` は差分語彙により `supabase_schema_change`・`web_project_bootstrap` を検出しましたが、実際には schema/migration/Storage/RLS/auth/保存対象カラムは変更していません。

## verdict

- TKT-0199の実装は、静的レビュー・自動verify（lint/typecheck/test/build）・追加/更新テストを含む計37件、および実機での確認表示の確認をもって受け入れ可能です。
