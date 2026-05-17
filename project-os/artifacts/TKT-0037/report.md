---
ticket_id: TKT-0037-ai-selected-ingredient-required-toggle
status: ready
---

# Report

## 変更目的

AIレシピ考案の「指定食材から」で、選択した食材を必須材料と任意材料に分けてプロンプトへ反映できるようにした。

## 今回追加した内容

- 選択状態を `Map` 化し、食材IDごとに `required` を保持するようにした。
- 選択済みバッジをクリックすると `必須` / `任意` が切り替わるようにした。
- バッジ内の `×` は選択解除専用として維持した。
- 指定食材プロンプトを必須食材と任意食材に分けて生成するようにした。

## 実施した確認

- 既存verify: `VERIFY_PASSED`
- `git diff --check`: passed
- `aiIngredientSelectedIds` の残存なし。
- Spreadsheet書き込み・GAS通信・スキーマ変更なし。

## 残リスク

- Canvas実機でのタップ確認と実Gemini通信は未実施。
