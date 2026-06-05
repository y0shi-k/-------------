---
id: TKT-0071-schedule-dnd-sync-button-lock
title: スケジュールD&D同期戻り修正と同期ボタンロック
status: implementation_ready
goal: D&D移動した献立が手動同期後に旧日付へ戻る問題を修正し、同期中の二重押下を防ぐ
acceptance:
  - D&Dで別日・別食事区分へ移動した献立が、同期後も移動先に残る
  - 同ブロック内のD&D並び替えが、同期後も保持される
  - 同期中は上部同期ボタンがスピナー付きで disabled になる
  - 同期失敗時は未同期内容が保持され、同期ボタンが再操作可能に戻る
  - 標準verifyがPASSする
required_evals:
  - bug_fix
  - manual_bulk_sync_policy
  - ui_component_update
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
  - SPEC-0071-schedule-dnd-sync-button-lock
related_artifacts:
  - artifacts/TKT-0071/verify.json
  - artifacts/TKT-0071/manual-smokes.md
  - artifacts/TKT-0071/review.md
  - artifacts/TKT-0071/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 個別書き込み用の `executeGAS(payload...)` を増やさない
  - `献立スケジュール` の既存8列スキーマは変更しない
---

# Summary

`syncPendingChanges()` 内の `scheduleUpdates` 書き込みを8列構造へ揃え、D&D移動後の `date` / `meal` がSpreadsheetへ保存されるようにする。あわせて同期中の上部同期ボタンをロックする。

## 実装メモ

- 修正対象は `app.html`。
- `state.pendingSync.scheduleUpdates` の既存データ形を維持する。
- 同期バーUIは既存の `state.isSyncing` を使って制御する。

## 残リスク

- 実Spreadsheet同期の最終確認はCanvas実行環境での手動スモークが必要。
