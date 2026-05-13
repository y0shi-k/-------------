# TKT-0008-manual-bulk-sync.md

---
ticket_id: TKT-0008
related_specs:
  - SPEC-0008-manual-bulk-sync.md
owner_role: ai-implementer
required_evals:
  - gas_pattern_change
  - ui_component_addition
  - schema_change
status: completed
---

## 目的

在庫・レシピ・買い物リスト操作のたびにGAS通信して待たされる状態を解消し、変更を未同期キューに積んで手動で一括同期できるようにする。

## タスク

- [x] `state.pendingSync` と同期済みスナップショットを追加
- [x] 未同期件数と「同期する」「保留を破棄」UIを追加
- [x] 在庫追加・編集・数量変更・削除をローカル反映 + キュー登録に変更
- [x] レシピ追加・編集・削除をローカル反映 + キュー登録に変更
- [x] 買い物購入済処理をローカル反映 + キュー登録に変更
- [x] `syncPendingChanges()` で全保留変更を1回のGAS通信にまとめる
- [x] verify コマンド実行
- [x] artifacts を `project-os/artifacts/TKT-0008/` に作成

## Acceptance

- 初期読込以外のスプレッドシート変更操作で即時GAS通信しない
- 未同期変更が画面に件数と行バッジで表示される
- 同期ボタン1回で在庫、レシピ、買い物処理がシートへ反映される
- 同期成功後に最新一覧で画面状態が置き換わる
- 同期失敗時に未同期キューが残る
- HTML構文チェックが通る
- `executeGAS` と `GAS_URL` が残っている
