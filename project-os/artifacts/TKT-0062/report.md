---
ticket_id: TKT-0062-recipe-list-genre-layout-and-order
status: ready_for_user_browser_test
---

# Report Draft

## 変更目的

ジャンルが多いレシピでも一覧カードが縦に伸びないようにし、編集画面でジャンルの表示優先順を調整できるようにする。

## 今回追加した安全装置

- 一覧表示は先頭3ジャンル + `+N` に要約。
- ジャンルの並び順は既存の `genre` JSON配列順を利用し、保存形式は変更しない。
- GAS通信、Spreadsheetスキーマ、pendingSync処理は変更なし。

## 実施した確認

- 標準verify: `VERIFY_PASSED`
- JavaScript構文チェック: `JS_SYNTAX_PASSED 2`
- ネイティブダイアログ残存チェック
- GAS通信/`executeGAS(payload...)` の新規追加なし確認

## 残リスク

- 実ブラウザ操作確認はユーザー実施予定。
- HTML5 D&D のタッチ端末挙動はブラウザ依存。

## 次の依頼や人判断

- Canvas上で、一覧2行固定、`+N` 表示、編集画面ジャンルD&D、保存後の一覧順序反映を確認する。
