---
ticket_id: TKT-0042-recipe-prep-seasoning-separation
status: completed
---

# Report

## 変更目的

レシピデータを「材料」「調味料」「下ごしらえ」「調理工程」の4区分に分離し、AI生成・テキスト解析・UI表示・在庫連携の全フローで扱えるようにする。

従来の `ingredients`（材料+調味料混在）と `steps`（下ごしらえ+調理工程混在）では、料理中の手順追いや買い物リストの整理がしにくかった。

## 今回追加した安全装置

- 後方互換: 既存レシピの `seasonings` / `prepSteps` が空の場合、今まで通り `ingredients` / `steps` のみで表示
- GASコード（`app.html` 内の payload）でスプレッドシート列追加時に既存ヘッダーを上書きしない `ensureRecipeHeader` ロジックを維持
- `cleanRecipeItem` で新プロパティを `'[]'` でフォールバック
- 個別即時GAS通信は行わず、すべて `state.pendingSync` + `syncPendingChanges()` の流れを維持

## 実施した確認

1. HTML構文チェック: `python3 -c "import html.parser; ..."` → PASSED
2. GAS通信パターン確認: `grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html` → PASSED
3. 追加Canvas環境チェック:
   - `alert(` / `confirm(` / `prompt(` なし → PASSED
   - `showToast` 関数あり → PASSED
   - 個別 `executeGAS(payload...)` なし → PASSED
4. スプレッドシート列構造変更（GASコード内）:
   - `ensureRecipeHeader` で J/K 列ヘッダー追加
   - `readRecipes` で `rr[9]` / `rr[10]` 読み込み
   - `recipeCreates` / `recipeUpdates` で J/K 列書き込み
5. AIプロンプト強化:
   - `generateAiRecipeFromPlan` と `parseRecipeTextWithAI` に4区分スキーマを追加
   - 各項目の定義を明確に指示

## 残リスク

- Canvas環境での実際のAI通信による4区分出力精度は未検証（プロンプトは強化済み）
- 既存レシピの `steps` に下ごしらえが混在している場合、手動で分離する必要がある（自動移行は未実装）
- 調味料の在庫未登録時、買い物リストに常に追加されるため、塩・醤油などの常備品がリストに出続ける可能性がある

## 次の依頼や人判断

- Canvas環境でAI考案レシピ生成とテキスト解析の実際の出力を確認し、4区分が正しく分離されるか検証してほしい
- 既存レシピの `steps` に下ごしらえが含まれる場合、手動で `prepSteps` に移動する必要があるか判断してほしい
