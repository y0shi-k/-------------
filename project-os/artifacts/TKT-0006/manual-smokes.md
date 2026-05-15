---
ticket_id: TKT-0006
status: passed
target_evals:
  - ui_component_addition
  - gas_pattern_change
  - manual_bulk_sync_policy
---

# Manual Smoke Report (TKT-0006)

## executed_checks
- [x] HTML構文チェック (`html.parser` でパス)
- [x] GAS通信パターン確認 (`executeGAS`, `setStatus`, フォーム送信方式が未変更)
- [x] スプシ手動一括同期ポリシー（献立の割り当て・削除は `state.pendingSync` に積まれ、`syncPendingChanges()` で一括反映）
- [x] UI表示整合性（Tailwindクラスが既存パターンと一致：カード/モーダル/スロットボタン）
- [x] Canvas通知制約（`alert/confirm/prompt` 未使用、`showToast` 使用）
- [x] 新規UIコンポーネントの disabled 制御（`setStatus` 内でグローバル制御）
- [x] 献立スケジュールシートのスキーマ整合性（ヘッダー順序: 予定日, 食事区分, レシピID, レシピ名, ステータス）

## skipped_checks
- [ ] 実際のGAS通信による献立シート読み書き（ローカル環境ではGASエンドポイントに到達不可のためスキップ）
- [ ] モバイル実機での週切り替え・スロットタップ確認（デスクトップブラウザのみ）
- [ ] 「前の週」「次の週」ボタン連打時の競合確認

## open_risks
- `loadSchedule()` は読み取り専用のGAS通信。書き込みはすべて `syncPendingChanges()` 経由。
- 献立の割り当て変更時、同じ日付＋食事区分への複数回連続更新は、未同期キュー内で最後の値で上書きされるが、GAS側の競合は `syncPendingChanges` 内で updateRow / appendRow の順序で解決。
- レシピ選択モーダルの検索はクライアント側フィルタ（`state.recipes`）のみ。レシピ数が多い場合のパフォーマンスは未検証。
