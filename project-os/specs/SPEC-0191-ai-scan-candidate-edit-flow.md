---
id: SPEC-0191-ai-scan-candidate-edit-flow
title: AI解析候補を1件編集しても残り候補を継続編集・登録できる
status: draft
scope:
  - 食材追加の画像スキャン後に表示されるAI候補一覧
  - AI候補1件の編集・確定フロー
constraints:
  - AI解析API、Storage保存、DB schema は変更しない
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - APIキーや写真URLを直書きしない
acceptance:
  - AI候補が3件ある状態で1件を編集しても、残り2件が候補一覧に残る
  - 編集した候補は在庫へ即登録されず、候補一覧内の内容が更新される
  - 編集後に、未編集候補と編集済み候補をまとめて在庫へ追加できる
  - 編集キャンセル時は候補一覧へ戻り、元の候補が失われない
  - 選択チェック状態が意図せず全解除・全登録されない
  - Web版verifyが通る
related_tickets:
  - TKT-0191-ai-scan-candidate-edit-flow
---

# Summary

AI解析候補の個別編集を、手動追加とは別の「候補編集」として扱う。1件編集しただけで残り候補の確認機会が消える問題を防ぐ。

## 仕様

- 対象は `web/src/components/inventory-board.tsx`。
- 候補編集は候補リストの状態を更新するだけにする。
- 「在庫に追加」は、ユーザーが最後に選択した候補だけをまとめて登録する。
- 編集UIは既存の在庫フォームを再利用してもよいが、保存先は `inventory_items` ではなく `scanCandidates` state にする。

## 非対象

- AI解析精度の改善
- 複数画像解析（TKT-0193）
- 分数入力全般（TKT-0190）
