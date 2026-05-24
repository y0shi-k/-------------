# TKT-0117 Manual Smokes

AI確認:

- 在庫/登録待ちフォームに単位換算欄が表示されることをブラウザで確認した。
- 不完全な換算設定は `inventory-board` テストで保存前に止まることを確認した。
- 換算情報つき手動登録が `unit_conversion` として保存payloadに入ることを確認した。
- `npm run test` / `typecheck` / `lint` / `build` は通過している。

ユーザー確認が必要:

- Supabaseへ `20260524173000_unit_conversion.sql` を適用した環境で、換算情報つき登録/編集を確認する。
- CSV移行時はCanvas版の `単位換算JSON` を `unit_conversion` にJSONとして移す。
- 調理完了時の実消費は `TKT-0125` で確認する。

補足:

- ブラウザ自動入力は、この環境の仮想クリップボード制限で途中停止した。画面表示は確認済みで、入力検証はテストで担保した。
