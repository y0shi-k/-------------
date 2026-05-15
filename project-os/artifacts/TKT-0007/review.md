---
ticket_id: TKT-0007
status: passed
review_scope: 買い物リスト連携（在庫比較ロジック + GAS同期拡張 + UI追加）
---

# Review Record (TKT-0007)

## checked_diff_paths
- `app.html`（全変更集中）

## checked_artifacts
- `verify.json`（VERIFY_PASSED 確認済み）
- `manual-smokes.md`（6/9チェック実行済み）

## findings
- **GASパターン**: `executeGAS()` を改変せず、`syncPendingChanges()` のペイロード文字列内に `sShop` 処理を追加
- **スキーマ**: `sShop.appendRow([Utilities.getUuid(), d.name, d.qty, d.unit, '未購入', d.recipeName])` の順序が `買い物リスト` シートのヘッダー（リストID, 品名, 必要数量, 単位, ステータス, 紐づくレシピ名）と厳密に一致
- **同期ポリシー**: `addShortagesToShopping` は `queueShoppingCreate()` で未同期キューに積むのみ。即時GAS通信なし。`syncPendingChanges` 内で同名・同単位・未購入アイテムがあれば数量加算、なければ新規追加。
- **UI追加**: `recipeModal` に「🛒 買い物へ」ボタンを追加。既存ボタンパターン（`bg-emerald-100 text-emerald-700 rounded-2xl`）を踏襲。
- **自動連携**: `assignScheduleRecipe()` 内で `compareRecipeWithInventory()` を自動実行し、不足あれば `showToastWithAction` で遷移導線を提供。

## open_risks
- `compareRecipeWithInventory` は `parseFloat(ing.amount)` を使用。`amount` が空文字・記号等の場合 `NaN` になり、常に不足と判定される可能性がある。実際のレシピデータが数値または数値文字列であることを前提としている。
- `addShortagesToShopping` はクライアント側 `state.shopping` に一時的に重複行を追加する（同期時にGAS側でマージ）。

## verdict
**PASSED** — スキーマ変更なし、GAS通信パターン維持、手動一括同期ポリシー遵守、UI一貫性あり。実装を承認する。
