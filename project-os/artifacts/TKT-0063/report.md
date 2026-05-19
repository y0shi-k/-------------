---
ticket_id: TKT-0063-recipe-card-actions-and-genre-width
status: ready_for_user_browser_test
---

# Report Draft

## 変更目的

レシピ一覧カードでジャンルチップの文字が見えにくい問題を改善する。

## 今回追加した安全装置

- 操作ボタンを1行目右側へ移動し、2行目のジャンル表示領域を拡張。
- ジャンルの最大3件 + `+N` 要約は維持。
- GAS通信、Spreadsheetスキーマ、pendingSync処理は変更なし。

## 実施した確認

- 標準verify: `VERIFY_PASSED`
- JavaScript構文チェック: `JS_SYNTAX_PASSED 2`
- ネイティブダイアログ残存チェック
- GAS通信/`executeGAS(payload...)` の新規追加なし確認

## 残リスク

- 実ブラウザ操作確認はユーザー実施予定。
- 狭い幅ではタイトルまたはメタ情報の省略量が増える可能性がある。

## 次の依頼や人判断

- Canvas上で、ボタン位置、ジャンルチップの読める幅、`+N` 表示、各ボタンのクリック動作を確認する。
