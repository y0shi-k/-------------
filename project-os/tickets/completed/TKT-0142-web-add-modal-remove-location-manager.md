---
id: TKT-0142-web-add-modal-remove-location-manager
title: Web版 食材追加モーダルから保存場所管理を削除
status: done
goal: Web版の「食材をリストへ」モーダル上部にあった保存場所管理UIを削除し、Canvas版と同じ構成に合わせる
acceptance:
  - 「食材をリストへ」モーダル内に保存場所管理セクション（追加input・チップリスト・削除ボタン）が表示されない
  - 保存場所の選択はフォーム内のdatalist入力のみで完結する
  - addStorageLocation / deleteStorageLocation 関数が削除されている
  - newLocationName state / storageLocationUsage memo が削除されている
  - 関連テストが削除・更新されている
  - Web版verify（lint / typecheck / test / build）が通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/src/components/inventory-board.tsx
  - web/src/__tests__/inventory-board.test.tsx
  - project-os/artifacts/TKT-0142/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - review_ready
  - report_ready
related_specs: []
related_artifacts:
  - artifacts/TKT-0142/verify.json
  - artifacts/TKT-0142/review.md
  - artifacts/TKT-0142/report.md
owner_role: implementer
owner_notes:
  - Canvas版 app.html は変更しない
  - 保存場所の追加・削除機能はCanvas版側で管理する
  - Web版はSupabaseの storage_locations テーブルへの書き込みを削除
---

# Summary

Web版 inventory-board.tsx の「食材をリストへ」モーダル（`addFlow === "manual"` かつ `!editing` 時）に表示されていた保存場所管理セクションを削除。Canvas版のUI構成に合わせ、フォーム内の保存場所datalist入力のみを残す。

## 実装メモ

- `location-manager compact-location-manager` セクション全体を削除
- `addStorageLocation` / `deleteStorageLocation` 関数を削除
- `newLocationName` state / `storageLocationUsage` memo を削除
- `setStorageLocations` を `const [storageLocations]` に変更（読み取り専用）
- 関連テスト2件（保存場所追加テスト、保存場所削除制限テスト）を削除
- `StorageLocation` 型のimportをテストから削除
