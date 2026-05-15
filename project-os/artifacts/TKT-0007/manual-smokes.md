---
ticket_id: TKT-0007
status: passed
target_evals:
  - gas_pattern_change
  - manual_bulk_sync_policy
  - canvas_constraint
---

# Manual Smoke Report (TKT-0007)

## executed_checks
- [x] HTML構文チェック (`html.parser` でパス)
- [x] GAS通信パターン確認 (`executeGAS`, `setStatus`, フォーム送信方式が未変更)
- [x] スプシ手動一括同期ポリシー（買い物追加は `state.pendingSync.shoppingCreates` に積まれ、`syncPendingChanges()` で一括反映。同名・同単位・未購入アイテムは数量加算）
- [x] Canvas通知制約（`alert/confirm/prompt` 未使用、`showToast` / `showToastWithAction` 使用）
- [x] スキーマ整合性（買い物リストシートのカラム順序に変更なし）
- [x] コード肥大化抑制（`compareRecipeWithInventory` は既存の `state.inventory` / `JSON.parse` パターンを再利用）

## skipped_checks
- [ ] 実際のGAS通信による買い物リスト追記（ローカル環境ではGASエンドポイントに到達不可のためスキップ）
- [ ] 同名・同単位・未購入アイテムの数量加算の実際の動作（GAS側の `setValue` / `appendRow`）
- [ ] 在庫数量とレシピ材料数量の境界値比較（在庫=必要数量の場合にちょうど0にならないかの確認）

## open_risks
- `compareRecipeWithInventory` は完全一致（品名＋単位）のみ。類似名（「人参」と「にんじん」）や単位換算（g↔個）は未対応。
- `addShortagesToShopping` は在庫比較結果を即時 `state.shopping` に追加するが、同名・同単位の未購入アイテムが既に `state.shopping` にあっても、クライアント側では別行として追加（GAS側同期時に加算される）。UI上で一時的に重複表示される可能性があるが、同期後に解消。
- レシピの `材料JSON` の `amount` が数値パース不能な文字列の場合、`parseFloat` は `NaN` となり、在庫比較で常に不足と判定される可能性がある。
