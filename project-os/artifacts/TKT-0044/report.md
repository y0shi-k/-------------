---
ticket_id: TKT-0044-recipe-seasoning-group-prompt-fix
status: completed
---

# Report

## 変更目的

テキスト解析・AI考案時に「合わせ調味料」「下味」「たれ」「衣」などのまとまり項目が `seasonings`（調味料）として正しく認識されない不具合を修正する。

TKT-0042（レシピ4区分分離）実装後の残リスク。プロンプト内で「合わせ調味料」等の見出し項目を `seasonings` に含めるよう明示的に指示していなかったため、AI が誤って `ingredients`（材料）に分類したりスキップしたりしていた。

## 今回追加した安全装置

- プロンプトに「合わせ調味料」「下味」「たれ」「衣」「薬味」等の見出し項目も `seasonings` に含める指示を追加
- 「合わせ調味料」にまとめられている項目は必ず `seasonings` に含める強制指示を追加
- `ingredients` の定義を「主材料（野菜・肉・魚・豆腐・卵・麺・米・パンなど）」に明確化し、調味料混入を防ぐ
- `saveRecipe()` に `seasonings` と `prepSteps` のコピー漏れを修正（TKT-0042 実装時の欠落）
- `cleanRecipeItem()` は既に `seasonings` / `prepSteps` のフォールバックを持ち、GAS側も J/K 列書き込み対応済み

## 実施した確認

1. HTML構文チェック: `python3 -c "import html.parser; ..."` → PASSED
2. GAS通信パターン確認: `grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html` → PASSED
3. Canvas環境チェック:
   - `alert(` / `confirm(` / `prompt(` なし → PASSED
   - `showToast` 関数あり → PASSED
   - 個別 `executeGAS(payload...)` なし → PASSED
4. スキーマ変更なし（スプレッドシート列追加・変更なし）
5. GASコード変更なし
6. UIコンポーネント追加なし
7. `saveRecipe()` から `seasonings` / `prepSteps` のコピー漏れを確認・修正
8. `cleanRecipeItem()` で `seasonings` / `prepSteps` のフォールバックを確認済み
9. GAS側 `recipeCreates` / `recipeUpdates` で J/K 列への書き込みを確認済み

## 残リスク

- Canvas環境での実際のAI通信による出力精度は未検証（プロンプトは強化済み）
- AI が新しい指示を完全に遵守するかはモデル（gemini-2.0-flash）依存
- `updateRecipe()` は `Object.assign` で上書きするため、編集時に `seasonings`/`prepSteps` が意図せず消えるリスクは理論上あるが、フロー上編集モーダルから保存する際は `getRecipeFormData()` で再収集されるため実害なし

## 次の依頼や人判断

- Canvas環境で実際のテキスト解析とAI考案レシピ生成を実行し、「合わせ調味料」項目が正しく `seasonings` に入るか検証してほしい
- 検証時に問題が残る場合は、プロンプトのさらなる強化（例: 具体例を列挙する、 few-shot を追加する）を検討する
