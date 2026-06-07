---
id: TKT-0195-recipe-detail-edit-entrypoint
title: レシピ詳細から編集画面へ進む導線追加
status: implementation_ready
goal: レシピカードの「料理する」ボタン、またはスケジュールの「調理開始」から入る全画面の調理ビューで、レシピ一覧カードへ戻らずに既存の編集モーダルを開けるようにする。
acceptance:
  - 全画面の調理ビュー上部に「編集」ボタンが表示される
  - 調理ビュー上部の「編集」ボタンを押すと、選択中レシピの内容が入った既存の編集モーダルが開く
  - レシピカードの「料理する」導線と、スケジュールの「調理開始」導線のどちらから入っても同じ編集ボタンが見える
  - レシピ一覧カード側の既存編集ボタンは従来どおり動く
  - スマホでも押しやすいサイズと配置になっている
  - 新しい編集フローやDB schemaを増やさない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0195-recipe-detail-edit-entrypoint/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0195-recipe-detail-edit-entrypoint
related_artifacts:
  - artifacts/TKT-0195-recipe-detail-edit-entrypoint/verify.json
  - artifacts/TKT-0195-recipe-detail-edit-entrypoint/manual-smokes.md
  - artifacts/TKT-0195-recipe-detail-edit-entrypoint/review.md
  - artifacts/TKT-0195-recipe-detail-edit-entrypoint/report.md
owner_role: implementer
owner_notes:
  - 現役正本はWeb版。Canvas版 `app.html` は編集しない。
  - 既存の `startEditRecipe(recipe)` を流用し、編集モーダルの状態管理を増やさない。
  - 調理ビュー上部のボタンは、テストで既存カード編集ボタンと区別できるようアクセシブル名を具体化する。
  - APIキー・Supabase秘密鍵を直書きしない。GAS/Spreadsheet/Driveを使わない。
  - 先行実装済み差分がある場合は、実装内容がこのチケットの完了条件に収まっているか確認してからreportを書く。
  - `/check-gates` が文言により schema/Storage 系evalを過剰検出する場合は、manual-smokes.md / review.md で実変更なしを静的に証明する。
  - verify は `/verify TKT-0195-recipe-detail-edit-entrypoint`。
---

# Summary

全画面の調理ビュー上部に編集ボタンを追加する。押下時は既存の編集モーダルを開くだけにして、保存処理・DB構造・画像処理は既存実装を使う。

## 実装メモ

- 全画面の調理ビューのヘッダーに「編集」ボタンを追加し、`startEditRecipe(activeCookingRecipe)` と同じ結果にする。
- 編集開始時は調理ビューを閉じ、既存編集モーダルだけを表示する。
- CSSは調理ビューのヘッダー操作としてスマホでも押しやすいサイズにする。
- テストでは、調理ビュー上部の編集ボタンから「レシピを編集」モーダルが開き、レシピ名が入っていることを確認する。

## 非対象

- 編集モーダルの入力項目追加
- レシピ保存ロジック変更
- DB schema変更
