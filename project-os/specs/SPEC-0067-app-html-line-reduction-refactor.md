---
id: SPEC-0067-app-html-line-reduction-refactor
title: app.html 行数削減リファクタ
status: spec_ready
scope:
  - `app.html` 内のフロント側レシピ配列パース
  - 空状態HTML表示
  - レシピプレビューリスト描画
  - レシピ編集モーダルの入力行描画
constraints:
  - 単一HTML構成を維持し、外部JS/CSSへ分離しない
  - Spreadsheetスキーマ、GASペイロード、`executeGAS()`、`pendingSync` 一括同期モデルは変更しない
  - 既存UIの表示文言と操作導線を変えない
  - `majinCopy` / `geminiCopyBtn` / `convId` は承認・共有系の既存文脈があるため削除しない
acceptance:
  - `parseJsonArray()` / `getRecipeItems()` / `getCookingRecipeParts()` を使い、フロント側の直接JSON配列パースが減る
  - 空状態は `emptyStateHtml()` 経由になり、改行は安全に `<br>` 表示される
  - レシピ編集モーダルの4種類の入力行は `renderRecipeItemInputRow()` / `renderRecipeStepInputRow()` で生成される
  - レシピプレビューの材料・調味料・下ごしらえ・調理工程リストは共通ヘルパで描画される
  - verify、JS構文チェック、Canvas制約 grep がパスする
related_tickets:
  - TKT-0067-app-html-line-reduction-refactor
---

# Summary

機能追加ではなく、単一HTML内の重複を減らすためのリファクタ仕様。行数削減を目的にするが、minify、単純な空行削除、同期・保存契約の変更は行わない。

## 背景

`app.html` は単一ファイル制約の中で成長しており、レシピ配列の安全パース、空状態表示、レシピ編集フォーム行、レシピプレビューリストに同型の重複が残っている。既存の小さなヘルパへ寄せることで、今後の変更時の差分を小さくする。

## 仕様

- `emptyStateHtml(text, options)` をCore寄りに追加し、既存の空表示HTMLを安全に生成する。
- フロント側のレシピ配列パースは、既存の `parseJsonArray()` とレシピ部品ヘルパを優先して使う。
- レシピ編集フォームは、材料/調味料の入力行と下ごしらえ/調理工程の入力行をそれぞれ共通テンプレートから生成する。
- レシピプレビューは、材料/調味料リストと手順リストを共通関数で描画する。
- verify: `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`

## 非対象

- 汎用 `renderCardRow` 化
- GAS通信方式、Spreadsheetスキーマ、保存形式、同期契約の変更
- `majinCopy` / `geminiCopyBtn` / `convId` の削除
- minify、機械的な空行削除だけの変更
