# TKT-0012 Manual Smokes

- [x] 手動追加フォーム保存時に `calculateInventoryShortage()` を通ることを静的確認。
- [x] 同じ品名+単位の在庫合計を差し引いて `item.qty` を不足分に置き換えることを確認。
- [x] 在庫で足りている場合は `queueShoppingCreate()` を呼ばず、買い物リストへ追加しないことを確認。
- [x] 単位が違う在庫は `filter(item.name === name && item.unit === unit)` により差し引かないことを確認。
- [x] 即時GAS通信は追加していないことを確認。
- [ ] Gemini Canvas実機で、在庫あり/不足/単位違いの手動追加を確認する。

## Notes

ローカル環境ではGAS・Spreadsheet実機同期は未実行。
