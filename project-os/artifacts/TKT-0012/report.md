# TKT-0012 Report

## Summary

買い物リストの手動追加で、入力数量から現在在庫を差し引き、不足分だけ追加するようにした。

## Changes

- `calculateInventoryShortage()` を追加。
- `handleShoppingManualSave()` で同じ品名+単位の在庫合計を差し引くように変更。
- 在庫で足りる場合は追加せず、トーストで通知する。

## Verification

- HTML parse / `executeGAS` / `GAS_URL`: PASS
- JavaScript parse: PASS
- 即時GAS通信増加なし: PASS
