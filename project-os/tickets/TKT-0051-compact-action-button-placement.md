---
id: TKT-0051-compact-action-button-placement
title: 詳細・一覧画面の操作ボタン配置調整
status: ready
goal: 下部にある操作ボタンを上部の文脈に近い場所へ移し、操作しやすい小型ボタンにする
acceptance:
  - レシピ詳細では「スケジュール追加」が上部 X ボタン横に表示され、下部には表示されない
  - AI生成プレビューでは上部の「スケジュール追加」が表示されない
  - 在庫行チェック時に上部へ小型の「選択削除」ボタンが出る
  - 買い物リスト行またはグループチェック時に上部へ小型の「購入済み」「選択削除」ボタンが出る
  - 未選択時は上部の一括操作ボタンが表示されない
  - verify がパスする
required_evals:
  - ui_component_adjustment
  - manual_bulk_sync_policy
eval_selection_mode: auto
changed_paths:
  - app.html
  - project-os/specs/SPEC-0051-compact-action-button-placement.md
  - project-os/tickets/TKT-0051-compact-action-button-placement.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0051-compact-action-button-placement
related_artifacts:
  - artifacts/TKT-0051/verify.json
  - artifacts/TKT-0051/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - スプシ書き込み処理は既存の `state.pendingSync` + `syncPendingChanges()` 経路を維持する
  - 既存の `batchDeleteInventory()` / `bulkPurchase()` / `bulkDeleteShopping()` を再利用し、個別GAS通信を増やさない
---

# Summary

レシピ詳細、食材管理、買い物リストのボタン配置のみを調整する。下部に出ていた一括操作は上部コントロール領域へ移し、未選択時は非表示にする。

## 実装メモ

- `app.html` のレシピ詳細ヘッダーに小型の「スケジュール追加」ボタンを追加する。
- `modeSecondaryRow` 内に一括操作用の右寄せスロットを置く。
- チェック状態変更時に一括操作スロットを再描画する。
- GAS通信、schema、pendingSync は変更しない。

## 残リスク

- Canvas 実機での狭幅表示は手動確認が必要。
