---
id: TKT-0048-schedule-sync-readback-schema
title: 献立同期後読み戻しの列ずれ修正
status: implementation_ready
goal: スケジュール追加後の手動一括同期で、同期後レスポンスの列ずれにより献立が画面から消える事故を防ぐ
acceptance:
  - `syncPendingChanges()` 内の `readSchedule()` が8列構造で `schedule` を返す
  - 手動一括同期後に `state.schedule` が旧6列構造の列ずれデータで置換されない
  - 初期読込/週読込/一括同期後読み戻しの献立マッピングが一致する
  - 標準verifyがPASSする
required_evals:
  - gas_schema_readback
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
  - SPEC-0048-schedule-sync-readback-schema
related_artifacts:
  - artifacts/TKT-0048/verify.json
  - artifacts/TKT-0048/manual-smokes.md
  - artifacts/TKT-0048/review.md
  - artifacts/TKT-0048/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - 個別書き込み用の `executeGAS(payload...)` を増やさない
---

# Summary

TKT-0033で `献立スケジュール` は8列構造になったが、`syncPendingChanges()` 内の同期後読み戻し `readSchedule()` が旧6列構造のまま残っている。ここを初期読込/週読込と同じ8列構造へ揃える。

## 実装メモ

- 修正対象は `app.html` の `syncPendingChanges()` 内GASペイロードに限定する。
- 書き込み処理やUI操作は変更しない。
- `schedule` 読み戻しに `id` と `sortOrder` を含める。

## 残リスク

- 実GAS/Spreadsheet通信の手動確認はCanvas上での実行が必要。
