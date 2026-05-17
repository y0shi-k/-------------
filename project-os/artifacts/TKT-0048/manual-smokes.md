# TKT-0048 Manual Smokes

status: done

## Static Smokes

- [x] `syncPendingChanges()` 内の `readSchedule()` が8列構造で `schedule` を返すことを確認。
- [x] `handleInit()` の献立読み込みと `loadSchedule()` の週指定読み込みと同じ列対応であることを確認。
- [x] 個別書き込み用の新規 `executeGAS(payload...)` が増えていないことを確認。
- [x] `alert(` / `confirm(` / `prompt(` が残っていないことを確認。

## Canvas Manual Smoke

- [ ] Canvas上でスケジュール画面から `+` で献立を追加し、同期前に未同期バーが出ることを確認。
- [ ] `同期する` 実行後、追加した献立が同じ週・同じ食事枠に残ることを確認。
- [ ] Google Spreadsheet の `献立スケジュール` に8列構造で行が保存されていることを確認。

## Notes

実GAS/Spreadsheet通信はローカル静的検証では実行できないため、Canvas Manual Smoke は人手確認項目として残す。
