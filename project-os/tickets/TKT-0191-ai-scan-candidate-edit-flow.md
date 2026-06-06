---
id: TKT-0191-ai-scan-candidate-edit-flow
title: AI解析候補の個別編集フロー修正
status: implementation_ready
goal: AI解析で複数候補が出た後、1件だけ編集しても残り候補を失わず、確認・編集・登録を継続できるようにする。
acceptance:
  - AI候補3件のうち1件を編集しても残り2件が候補一覧に残る
  - 編集確定で在庫へ即登録されず、候補一覧の該当候補だけが更新される
  - 編集済み候補と未編集候補をまとめて在庫へ追加できる
  - 編集キャンセルで候補一覧へ戻り、候補が消えない
  - 選択チェック状態が意図せず変わらない
  - 既存の手動追加・在庫編集フローが壊れない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/inventory-board.tsx
  - web/src/__tests__/inventory-board.test.tsx
  - project-os/artifacts/TKT-0191-ai-scan-candidate-edit-flow/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0191-ai-scan-candidate-edit-flow
related_artifacts:
  - artifacts/TKT-0191-ai-scan-candidate-edit-flow/verify.json
  - artifacts/TKT-0191-ai-scan-candidate-edit-flow/report.md
owner_role: implementer
owner_notes:
  - 現状 `editScanCandidate` は候補を `scanCandidates` から削除し、手動追加フォームへ移す。これが問題の中心。
  - 候補編集用の state（例: `editingScanCandidateId`）を追加し、保存時は `scanCandidates` の該当要素を更新する。
  - 既存の `saveInventory` に候補編集を混ぜる場合は、通常の手動追加・在庫編集と分岐を明確にする。
  - 候補編集後は `addFlow` を `photo` に戻し、候補一覧を表示し続ける。
  - Storage/schema/API は触らない。写真解析の仕組み自体は変えない。
  - verify は `/verify TKT-0191-ai-scan-candidate-edit-flow`。
---

# Summary

AI解析候補を1件編集した時に、残り候補を見失わないようにする。編集は在庫登録ではなく候補内容の更新として扱い、最後に選択候補をまとめて登録する。

## 実装メモ

- 対象は `InventoryBoard` の `scanCandidates` / `selectedScanCandidateIds` / `editScanCandidate` / `saveInventory` 周辺。
- テストでは、3件候補から1件編集して候補数が3件のまま維持されること、最後に3件登録できることを見る。

## 非対象

- 複数画像解析（TKT-0193）
- 分数量の解釈（TKT-0190）
