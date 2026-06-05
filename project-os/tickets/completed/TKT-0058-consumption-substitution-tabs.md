---
id: TKT-0058-consumption-substitution-tabs
title: 消費量調整画面へのタブ・代替品選択機能実装
status: verify_passed
goal: 料理完了時の消費量調整画面を拡張し、タブ切り替えと在庫からの代替品選択を可能にする
acceptance:
  - consumptionModalにAll/調味料/材料の3タブがあり、初期値はALL
  - タブ切り替え時に入力済み数量が保持される
  - 各行に「代替」ボタンがあり、タップで代替品選択モーダルが開く
  - 代替品モーダルは在庫リストUIを移植（検索・フィルタ・ソート・期限バッジ）
  - 代替設定後は「元に戻す」が可能
  - confirmConsumptionで代替品名で在庫減算が行われる
  - verifyコマンドが通る
  - manual_smokes.mdに確認手順が記載されている
required_evals:
  - verify_html_valid
  - verify_gas_integration
  - verify_showtoast_exists
  - verify_no_native_dialogs
  - manual_bulk_sync_policy
eval_selection_mode: auto
changed_paths:
  - app.html
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0058-consumption-substitution-tabs
related_artifacts:
  - artifacts/TKT-0058/verify.json
  - artifacts/TKT-0058/manual-smokes.md
  - artifacts/TKT-0058/review.md
  - artifacts/TKT-0058/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - スプシ書き込みは既存の confirmConsumption → queueInventoryUpdate/queueInventoryDelete を利用するため、新規即時通信は不要
  - 新規追加コードが既存パターンを再利用して肥大化していないか注意
---

# Summary

消費量調整画面（consumptionModal）に以下を追加する実装タスク：
1. All/調味料/材料タブ
2. 各行への「代替」ボタン
3. 代替品選択モーダル（substitutionModal）
4. 確定時の代替品減算ロジック

## 実装メモ

- 状態変数追加: `_consumptionTabFilter`（'all'|'seasoning'|'ingredient'）
- 状態変数追加: `_substitutionTargetIdx`（選択中の行idx）
- データ拡張: `_consumptionIngredients[idx].substitute = { name, id, originalName }`
- DOM構築: `renderConsumptionList()` を新設し、タブ状態に応じてフィルタ＋復元
- 新規モーダル: `substitutionModal`（検索・フィルタ・ソート付き在庫リスト）
- 既存関数改修: `confirmConsumption()` で substitute 対応
- 既存関数改修: `openConsumptionAdjustmentModal()` でタブ初期化

## 残リスク

- タブ切り替え時のDOM再構築で、フォーカス状態が失われる可能性がある（モバイルでの操作性に注意）
- 代替品選択モーダルが在庫データ量が多い場合に重くなる可能性（state.inventoryを全件レンダリングするため）
