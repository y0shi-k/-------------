---
id: SPEC-0048-schedule-sync-readback-schema
title: 献立同期後読み戻しの8列スキーマ整合
status: spec_ready
scope:
  - 献立スケジュール
  - 手動一括同期後のデータ読み戻し
constraints:
  - `献立スケジュール` シートの8列構造は変更しない
  - 新しい個別GAS通信や操作ごとの即時書き込みを追加しない
  - UIやドラッグ&ドロップ挙動は変更しない
acceptance:
  - スケジュール画面で追加した献立が、手動一括同期後も画面から消えない
  - `syncPendingChanges()` の同期後レスポンスに含まれる `schedule` が `id`, `date`, `meal`, `recipeId`, `recipeName`, `status`, `sortOrder` を持つ
  - 初期読込、週読込、一括同期後読み戻しの献立列マッピングがすべて8列構造で一致する
  - 新規の個別書き込み用 `executeGAS(payload...)` を追加しない
related_tickets:
  - TKT-0048-schedule-sync-readback-schema
---

# Summary

献立スケジュールの8列化後、一括同期完了時の読み戻しだけが旧6列構造のまま残ると、同期成功後の `state.schedule` が列ずれした値で置き換わる。これにより実データはスプレッドシートに保存されていても、画面上では対象週の日付に一致せず、追加した献立が消えたように見える。

## 仕様

- `syncPendingChanges()` 内のGASペイロードにある `readSchedule()` を8列構造で読み取る。
- 読み取り項目は初期読込と週読込と同じく、`id=A`, `date=B`, `meal=C`, `recipeId=D`, `recipeName=E`, `status=F`, `sortOrder=G` とする。
- 読み戻し結果は `sortOrder` 昇順で安定化する。

## 非対象

- `献立スケジュール` シートの列追加、削除、リネーム
- スケジュール追加UI、D&D、一括削除UIの変更
- GASデプロイ作業
