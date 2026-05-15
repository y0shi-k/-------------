---
id: SPEC-0012-shopping-manual-shortage-check
title: 買い物リスト手動追加の在庫差分化
status: ready
scope:
  - 買い物リスト手動追加フォーム
  - 在庫数量との差分計算
constraints:
  - スプレッドシート書き込みは state.pendingSync に積み、syncPendingChanges() で一括同期する
  - 単位換算はしない
  - レシピ/献立由来の既存在庫比較フローを壊さない
acceptance:
  - 手動追加時、同じ品名+単位の在庫合計を差し引いた不足分だけ買い物リストに追加される
  - 在庫で足りている場合は買い物リストに追加されない
  - 単位が違う在庫は差し引かない
  - verify がパスする
related_tickets:
  - TKT-0012-shopping-manual-shortage-check
---

# Summary

買い物リストへ手動追加する数量を、現在の在庫と比較して不足分だけにする。例えば牛乳を3本追加しようとして在庫に1本ある場合、買い物リストには2本だけ追加する。

## 非対象

- g/ml/個など異なる単位間の換算
- 既存の未購入買い物リスト数量との差し引き
