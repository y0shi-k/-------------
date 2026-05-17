# TKT-0047 Report

status: ready

## Summary

料理ビューアーに在庫チェックトグルとカテゴリタブを追加した。ビューアーを開いた直後は在庫チェックOFFかつALLタブで、材料・調味料は1列の1行コンパクト表示になる。在庫チェックONでは、従来どおり在庫あり/不足と在庫数量・必要数量を表示する。

## Changes

- 左ペイン: ALL/材料/調味料タブ、在庫チェックトグル、1行/2行表示切替
- 右ペイン: 下ごしらえ/調理工程タブ
- 手順チップクリック: 該当する材料/調味料タブへ切り替えてハイライト

## Verify

- `VERIFY_PASSED`
- JS syntax check passed
- `alert` / `confirm` / `prompt` の追加なし
- 個別書き込み用の新規 `executeGAS(payload...)` 追加なし
