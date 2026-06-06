---
ticket_id: TKT-0191-ai-scan-candidate-edit-flow
status: ready
---

# 実装レポート

## 変更目的

AI解析で出た複数候補のうち1件を編集しても、残り候補と選択状態を失わず、最後にまとめて在庫へ追加できるようにした。

## 今回追加した安全装置

- 候補編集中のIDを `editingScanCandidateId` として分け、通常の在庫編集・手動追加と保存先を分離した。
- 候補編集の保存時は `inventory_items` へ即登録せず、`scanCandidates` の該当候補だけを更新する。
- 候補編集キャンセル時は候補一覧へ戻し、候補と選択チェックを維持する。
- 候補編集では食材画像欄を非表示にし、保存されない画像操作をユーザーに見せないようにした。

## 実施した確認

- `npm test -- inventory-board`: pass
- `harness/bin/verify_web.sh TKT-0191-ai-scan-candidate-edit-flow`: pass
- verify結果は `project-os/artifacts/TKT-0191-ai-scan-candidate-edit-flow/verify.json` に保存済み。

## 残リスク

- 実機スマホでの写真撮影から候補編集までの手動確認は未実施。自動テストでは候補3件、1件編集、3件まとめて登録の主要フローを確認済み。
- lint/build で既存の `_removed` 未使用 warning が2件出ているが、verify全体は pass。

## 次の依頼や人判断

- 実機でAI画像スキャン後、候補編集画面からキャンセル・更新・まとめて追加を確認すると安心。
