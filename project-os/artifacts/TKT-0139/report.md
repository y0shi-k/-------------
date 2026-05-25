# TKT-0139 Report

## Summary

Web版の献立・レシピ画面をCanvas版スクショのレシピ集レイアウトへ寄せた。

## Changes

- レシピ集の検索、検索対象、AND/OR、並び順、件数表示をCanvas版構造へ寄せた。
- レシピ一覧を薄青コンテナ内の横長カードへ変更した。
- レシピカード右側に料理する、編集、削除の小アイコン操作を配置した。
- Canvas版と同じく、レシピ詳細カードを常時主表示しない構造へ寄せた。
- 見出し順を「献立・レシピ」→「RECIPE COLLECTION」に寄せた。
- Supabase保存処理、AI API、削除/編集処理は既存関数を維持した。

## Verification

- lint: passed
- typecheck: passed
- test: 57 passed
- build: passed
