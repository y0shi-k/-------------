# TKT-0011 Manual Smokes

- [x] 買い物リストに `出自別` / `材料まとめ` の表示切替があることを静的確認。
- [x] `材料まとめ` 表示では `品名 + 単位` でグループ化し、トグル展開で出自別明細を表示する実装を確認。
- [x] 買い物リスト行が在庫行と同じ `p-3 rounded-xl` 系のコンパクト表示になることを静的確認。
- [x] 手動追加は `state.shopping` と `state.pendingSync.shoppingCreates` に積まれ、即時GAS通信しないことを確認。
- [x] 買い物リスト削除は `state.pendingSync.shoppingDeletes` に積まれ、同期時に `deleteRow` されることを確認。
- [x] 出自列 `出自種別`, `予定日`, `食事区分` を初期化・同期時に扱うことを確認。
- [ ] Gemini Canvas実機で、出自別/材料まとめ切替、手動追加、削除、購入済、Spreadsheet反映を確認する。

## Notes

ローカル環境では実際のGASエンドポイント・Spreadsheet書き込みは未実行。
