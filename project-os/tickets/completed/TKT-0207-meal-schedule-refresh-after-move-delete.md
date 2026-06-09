---
id: TKT-0207-meal-schedule-refresh-after-move-delete
title: 献立スケジュール移動・削除後に画面復帰で古い表示へ戻る不具合修正
status: draft
goal: スケジュール画面で献立を移動または削除したあと、別画面へ移って戻っても変更後の状態が表示され続けるようにする。
acceptance:
  - スケジュール画面で献立カードを別の日付/食事枠へドラッグ移動したあと、別画面へ移動して再度スケジュール画面へ戻っても移動後の枠に表示される
  - スケジュール画面で献立カードを削除したあと、別画面へ移動して再度スケジュール画面へ戻っても削除済みの献立が復活表示されない
  - 移動/削除のDB保存成功後に `router.refresh()` が呼ばれ、`web/src/app/page.tsx` のサーバ取得データが最新化される
  - 操作直後のローカル即時反映（楽観的更新）と成功トーストは維持する
  - DB保存に失敗した場合は既存どおりローカル表示を戻し、エラートーストを出す
  - 献立追加、レシピ差し替え、調理完了、完了解除、買い物/在庫/料理履歴の既存挙動を壊さない
  - スマホ/PCのスケジュール表示で同じ挙動になる
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - web_project_bootstrap
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0207-meal-schedule-refresh-after-move-delete/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs: []
related_artifacts:
  - artifacts/TKT-0207-meal-schedule-refresh-after-move-delete/verify.json
  - artifacts/TKT-0207-meal-schedule-refresh-after-move-delete/report.md
owner_role: implementer
owner_notes:
  - 現役正本はWeb版。Canvas版 `app.html` は編集しない。GAS/Spreadsheet/Driveを使わない。
  - APIキー、Supabase秘密鍵、service role key は直書きしない。本チケットはクライアント表示更新の修正のみで、DBスキーマ/RLS/auth/Storage/環境変数は変更しない。
  - 原因: `WebModeShell` は現在の画面だけを描画するため、別画面へ移ると `RecipeMealWorkspace` が外れ、戻ると `initialMealSchedules` から再初期化される。移動/削除はDB更新とローカルstate更新はしているが `router.refresh()` を呼んでいないため、親の `page.tsx` が持つサーバ取得データが古いまま残る。リロードで直るのは、リロード時だけSupabaseから最新の `meal_schedules` を取り直すため。
  - 主な該当箇所:
    - `web/src/components/recipe-meal-workspace.tsx` `moveScheduleToSlot`（DB update 成功後に `setMealSchedules(...data...)` して終了している）
    - `web/src/components/recipe-meal-workspace.tsx` `deleteSchedule`（DB delete 成功後に `setMealSchedules(...filter...)` して終了している）
    - `web/src/app/page.tsx` は `meal_schedules` をサーバ側で取得して `initialMealSchedules` として渡している
  - 実装方針: `moveScheduleToSlot` のDB更新成功後、最新dataをローカルstateへ反映した直後に `router.refresh()` を呼ぶ。`deleteSchedule` のDB削除成功後、ローカルstate/選択状態/在庫巻き戻し反映の直後に `router.refresh()` を呼ぶ。
  - 失敗時の挙動は変えない。移動失敗時は `previousSchedules` に戻し、削除失敗時は既存のエラーフィードバックを維持する。失敗時に `router.refresh()` は呼ばない。
  - 既に完了解除/調理完了/レシピ並び替え系のテストでは `router.refresh()` 期待があるため、同じ粒度で移動/削除テストにも期待を追加する。
  - 対象テストの目安:
    - `moves a scheduled meal to another slot via drag and drop`: DB update と成功トーストに加えて `expect(refresh).toHaveBeenCalled()` を確認する
    - `deletes a meal schedule`: DB delete と成功フィードバックに加えて `expect(refresh).toHaveBeenCalled()` を確認する
    - 完了済み献立削除のテストがある場合は、在庫/履歴巻き戻し後にも `router.refresh()` が呼ばれることを確認する
  - 手動確認: スケジュール画面で移動→完了トースト→食材管理など別画面へ移動→スケジュールへ戻る。移動後の枠に残ること。削除も同じ手順で復活しないこと。最後にブラウザリロードしても同じ状態であること。
  - verify は `/verify TKT-0207-meal-schedule-refresh-after-move-delete`。
---

# Summary

献立スケジュールの移動/削除はSupabaseへの保存自体は成功しているが、成功後に `router.refresh()` を呼ばないため、
画面を離れて戻ったときに親の古い `initialMealSchedules` で再表示され、変更が戻ったように見える。
リロードすると正しく見えるため、保存処理ではなく Next.js 側のサーバ取得データ更新漏れを直す。

## 実装メモ

- `moveScheduleToSlot`: DB update 成功後、`setMealSchedules` で返却dataを反映したあと `router.refresh()`。
- `deleteSchedule`: DB delete 成功後、ローカルstate/選択状態/在庫巻き戻し反映のあと `router.refresh()`。
- 既存の楽観的更新、トースト、失敗時ロールバックは維持。
- テストは既存の `refresh` mock を使い、移動/削除成功時だけ呼ばれることを追加確認する。

## 非対象

- DBスキーマ/RLS/auth/Storageの変更
- Canvas版 `app.html` の変更
- 献立追加やレシピ差し替えの仕様変更
- 画面デザイン変更

## 既知リスク

- `router.refresh()` はサーバデータを取り直すため、写真など他領域の再取得に影響する可能性がある。ただし既存の完了解除/調理完了でも同じ仕組みを使っており、本修正はその方針に合わせる。
