# TKT-0059 Report

## Summary

料理完了時の消費量調整で、レシピ単位と在庫単位が違う場合でも在庫側の単位で減算できるようにした。

## Changes

- 食材在庫シートに `単位換算JSON` 列を追加するGASヘッダー移行を実装。
- 食材登録・編集フォームに `1 パック = 150 g` 形式の換算入力を追加。
- `unitConversion` を `pendingSync.inventoryCreates` / `inventoryUpdates` に含め、同期後の読み戻しにも対応。
- 消費量調整画面で、同一単位、換算あり、換算なし手入力の3パターンを処理。
- 換算は双方向対応。`1パック=150g` なら `150g→1パック` と `1パック→150g` の両方を扱う。
- 代替設定中の消費行は、元の材料と数量 → 代替品と在庫消費数量の縦フロー表示に変更。

## Verification

- `VERIFY_PASSED`
- `node --check` passed
- `UNIT_CONVERSION_PASSED`
- `alert` / `confirm` / `prompt` なし
- 新規の個別 `executeGAS(payload...)` 書き込みなし
- 代替表示変更後も `VERIFY_PASSED` / `node --check` passed

## Notes

- 換算未設定の単位違いは推測しない。今回だけの在庫単位入力欄から減算する。
- 同名の複数在庫行がある場合は、選択された代替品、同一単位、換算可能、期限順の優先で消費する。
