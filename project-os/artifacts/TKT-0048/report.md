# TKT-0048 Report

status: ready

## 今回の変更目的

スケジュール画面で `+` から献立を追加し、手動一括同期した直後に献立が画面から消える問題を防ぐ。

## これまで不足していた点

`献立スケジュール` シートは8列構造へ移行済みだったが、`syncPendingChanges()` の同期後レスポンスを作る `readSchedule()` だけが旧6列構造のまま残っていた。そのため同期成功後、`state.schedule` が列ずれしたデータで置き換わっていた。

## 今回追加した安全装置

一括同期後の読み戻しを、初期読込と週読込と同じ8列マッピングに揃えた。`id`, `date`, `meal`, `recipeId`, `recipeName`, `status`, `sortOrder` を返し、`sortOrder` で並べる。

## 実施した確認

- HTML構文チェックと `executeGAS` / `GAS_URL` 存在確認: PASS
- `alert` / `confirm` / `prompt` 残存確認: なし
- 個別書き込み用 `executeGAS(payload...)` の増加確認: なし
- 同期後読み戻しの8列構造確認: PASS

## まだ人判断が必要な残リスク

実GAS/Spreadsheet通信はローカルでは実行していないため、Canvas上で `+` 追加から同期後に献立が残ることを確認する必要がある。
