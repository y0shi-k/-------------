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
- レシピ編集モーダルをCanvas版の縦長1カラム構造へ寄せた。
- 材料/調味料を別セクション表示にし、薄グレー入力の横並び行へ変更した。
- 下部アクションを「キャンセル」「買い物へ」「保存/更新」の3ボタン固定表示へ寄せた。
- スマホ幅でボタン文言が折り返さないことをブラウザで確認した。
- 買い物へ押下後、Canvas版と同じく不足材料をチェックボックスで選択してから買い物リストへ追加できるようにした。
- 買い物候補選択に ALL / 食材 / 調味料 タブと「表示中をすべて選択」を追加した。
- 食材管理の買い物リストが `shopping_items` を表示するようにし、レシピ側の追加後に再取得されるようにした。

## Verification

- lint: passed
- typecheck: passed
- test: 53 passed
- build: passed
- browser visual smoke: passed on desktop and 390px mobile viewport
