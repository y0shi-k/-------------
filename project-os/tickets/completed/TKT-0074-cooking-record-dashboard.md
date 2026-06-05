---
id: TKT-0074-cooking-record-dashboard
title: モードC料理記録ダッシュボード
status: ready
goal: モードCを料理履歴一覧から、カレンダー・タイムライン・振り返りで記録を活用できる画面にする
acceptance:
  - モードCトップに今月/今週/写真あり率/よく作る料理のサマリーが表示される
  - `カレンダー / タイムライン / 振り返り` の3ビューを切り替えられる
  - カレンダーの日付セルで記録日、写真あり、高評価、予定ありの日が判別できる
  - 日付タップで該当日の履歴が下部に表示される
  - タイムラインは日付グループ化され、期間・評価・写真・ジャンル・献立枠で絞り込める
  - 振り返りに頻出料理、高評価、しばらく作っていない料理、今月の写真、ジャンル傾向が表示される
  - 記録保存後のローカル即時反映と `syncPendingChanges()` 経由の同期を維持する
required_evals:
  - ui_component_addition
  - manual_bulk_sync_policy
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0074-cooking-record-dashboard.md
  - project-os/tickets/TKT-0074-cooking-record-dashboard.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0074-cooking-record-dashboard
related_artifacts:
  - artifacts/TKT-0074/verify.json
  - artifacts/TKT-0074/manual-smokes.md
  - artifacts/TKT-0074/review.md
  - artifacts/TKT-0074/report.md
owner_role: implementer
owner_notes:
  - spec_ready: true
  - implementation_ready: true
  - 料理履歴シートのスキーマは変更しない
  - 書き込みは既存の `state.pendingSync.cookingHistory` と `syncPendingChanges()` に載せる
---

# Summary

モードC通常表示に料理記録ダッシュボードを実装する。既存の料理履歴カード、写真取得、評価、もう一度作る導線は維持しつつ、カレンダー・タイムライン・振り返りの3ビューへ再構成する。

## 実装メモ

- `state` に表示用のビュー、月、選択日、期間/ジャンル/献立枠フィルタを追加する。
- `mealType` と `tags` は保存せず、既存の献立・レシピ・履歴から表示時に派生する。
- `executeGAS(payload...)` の新規個別書き込みは追加しない。
- 既存 verify に加え、native dialog と新規 direct write の静的確認を行う。

## 残リスク

- Canvas実機での視覚確認はユーザー手動確認が必要。
