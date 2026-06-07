---
id: TKT-0199-cooking-reorder-confirm-dialog
title: 全画面ビュー「並び替えを確定」に確認メッセージを追加
status: completed
verified_at: 2026-06-07T11:14:02+09:00
goal: レシピ本体の並びを書き換える確定保存の前に確認を挟み、全画面ビューでの誤操作による上書きを防ぐ。
acceptance:
  - `並び替えを確定` を押すと、保存前に確認メッセージが表示される
  - 確認でOK（確定）を選ぶと、従来どおり `saveCookingReorder` でレシピ本体へ保存される
  - 確認でキャンセルを選ぶと、保存されず未確定の並び替えがそのまま残る
  - 未確定の並び替えが無い時は確定ボタンが従来どおり無効のまま（確認も出ない）
  - 確認UIはアプリ既存の確認パターン（TKT-0197 の調理完了前確認と同方式）に揃える
  - 既存のUndo/Redo・料理完了フローは壊れない
  - DB schema変更はしない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0199-cooking-reorder-confirm-dialog/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0199-cooking-reorder-confirm-dialog
related_artifacts:
  - artifacts/TKT-0199-cooking-reorder-confirm-dialog/verify.json
  - artifacts/TKT-0199-cooking-reorder-confirm-dialog/report.md
owner_role: implementer
owner_notes:
  - 現役正本はWeb版。Canvas版 `app.html` は編集しない。GAS/Spreadsheet/Driveを使わない。
  - 対象は確定ボタン（`web/src/components/recipe-meal-workspace.tsx` ~L2105）と `saveCookingReorder`（~L1703）。
  - 確認UIは新規ダイアログ機構を作らず、TKT-0197 で導入済みの「未確定のまま料理完了しようとした時の確認」と同じパターンを流用する。実装前にその既存確認の実体（state名・描画箇所）を読んで揃えること。
  - 確認OK時のみ `saveCookingReorder` を呼ぶ。キャンセル時は state を変更しない（未確定の並び替えを保持）。
  - 確定保存後の挙動（Undo/Redo履歴クリア等）は既存どおり維持する。
  - テストでは、確定ボタン押下で確認が出ること、OKで `saveCookingReorder` 相当の保存が走ること、キャンセルで保存されないことを確認する。
  - `/check-gates` が文言（`recipes` 等）で schema/Storage 系evalを過剰検出する場合は、report で「migration追加なし・保存対象カラム変更なし」を静的に示す。
  - verify は `/verify TKT-0199-cooking-reorder-confirm-dialog`。
---

# Summary

全画面ビューの「並び替えを確定」を押した時、保存前に確認メッセージを挟む。確認OKで既存 `saveCookingReorder` を実行し、キャンセルで未確定状態を保持する。確認UIは既存パターンを流用し、保存ロジック・対象カラムは変えない。

## 実装メモ

- 既存の確定ボタン `onClick` を、直接 `saveCookingReorder` を呼ぶ形から「確認 → OK時に `saveCookingReorder`」へ変更する。
- 確認の表現・実装方式は TKT-0197 の調理完了前確認に合わせる（同じ state / 同じ描画コンポーネント）。
- 文言は「レシピ本体の並びを更新します」等、何が起きるか分かる内容にする。

## 非対象

- 並び替えロジック・保存対象カラムの変更
- 編集画面側の確認
- DB schema変更

## 依存チケット

- なし（独立して着手可。TKT-0197 の確認パターンを参照する）
