---
id: TKT-0011-shopping-list-source-and-actions
title: 買い物リストの出自管理と操作統一
status: ready
goal: 買い物リストに手動追加・削除・出自表示・材料まとめ表示を追加する
acceptance:
  - 買い物リストの行サイズが在庫リストと揃う
  - 出自別表示と材料まとめ表示を切り替えられる
  - 材料まとめ表示では同じ品名+単位を合算し、トグルで出自明細を確認できる
  - 手動追加・一括削除・購入済処理が state.pendingSync 経由で動く
  - 買い物リストシートに出自列が保存される
  - verify がパスする
required_evals:
  - schema_change
  - ui_component_addition
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
  - SPEC-0011-shopping-list-source-and-actions
related_artifacts:
  - artifacts/TKT-0011/verify.json
  - artifacts/TKT-0011/manual-smokes.md
  - artifacts/TKT-0011/review.md
  - artifacts/TKT-0011/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 買い物リストの追加・削除・購入済は即時GAS通信せず、state.pendingSync + syncPendingChanges() で一括同期する
  - 既存買い物リスト行は追加列が空でも読み込み可能にする
---

# Summary

買い物リストに、在庫リストと同じ選択・削除操作、手動追加、出自表示、材料まとめ表示を追加する。

## 実装メモ

- `pendingSync.shoppingDeletes` を追加する。
- 買い物リスト追加データに `sourceType`, `scheduleDate`, `meal` を追加する。
- 同期時の買い物リスト作成は出自別明細を保持する。
- 削除は同期時に買い物リストシートの該当行を `deleteRow` する。
