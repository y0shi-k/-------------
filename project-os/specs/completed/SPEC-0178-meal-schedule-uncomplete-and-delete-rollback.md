---
id: SPEC-0178-meal-schedule-uncomplete-and-delete-rollback
title: 献立の完了解除・完了済み削除（在庫と料理履歴の巻き戻し）
status: spec_ready
scope:
  - web/src/components/recipe-meal-workspace.tsx（7日スケジュールの完了解除・削除・×ボタン）
  - web/src/lib/cooking-history/rollback.ts（在庫巻き戻しの純関数・新規）
  - web/src/components/delete-confirm-panel.tsx（確認パネルの汎用化）
  - web/src/__tests__/
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - スキーマ変更（テーブル/カラム/RLS/Storage policy）はしない。既存テーブル・FKのみで成立させる
  - 完成写真（Storage実体・photos行）は削除しない
  - 全DBクエリに user_id 条件を付け、本人限定の既存RLSで充足させる。Service Role keyをブラウザで使わない
  - FK巻き戻し順序（events→cooking_history→meal_schedules）を守る
acceptance:
  - 完了済み献立の「完了を外す」で status="未完了"・completed_at=null に戻る
  - 完了解除/完了削除で、cooking_consumption_events を根拠に在庫が元数量へ加算復元される
  - 完了解除/完了削除で cooking_history 行と cooking_consumption_events 行が削除される
  - 完成写真は残る（photos.cooking_history_id は FK で null 化）
  - 全カードに×削除ボタンがあり、完了済みは巻き戻し付き・未完了は在庫不変で削除される
  - stock_item_id が null の消費行は復元対象からスキップしエラーにならない
  - 巻き戻し純関数と挙動テストが追加され、Web版verifyが通る
related_tickets:
  - TKT-0178-meal-schedule-uncomplete-and-delete-rollback
---

# Summary

完了にした献立を「調理していない状態」へ戻す導線（完了解除）と、完了済みを直接削除する×ボタンを追加する。
いずれも完了時の在庫減算を `cooking_consumption_events` を根拠に復元し、`cooking_history` と
`cooking_consumption_events` を削除して巻き戻す。完成写真だけは残す。

## 背景

7日献立スケジュールには完了を取り消す手段が無く、誤完了すると在庫が減ったまま戻せない。
既存の削除（`deleteSchedule`）も完了時に減らした在庫を戻さず、消費イベント・料理履歴も巻き戻さないため、
完了済みを消すと在庫と履歴がズレる。削除導線もスロットメニュー内のみでカードから直接消せない。

## 仕様

### データ前提（既存スキーマ）
- `meal_schedules.status`（'未完了'|'完了'）, `completed_at`。
- `cooking_consumption_events`（stock_item_id, consumed_amount, meal_schedule_id, cooking_history_id）が完了時の消費の正本。
- FK は全て `on delete set null`（cascade ではない）。`photos.cooking_history_id` も同様。

### 在庫巻き戻し（純関数）
- 入力: 消費イベント配列（stock_item_id, consumed_amount）と現在在庫。
- stock_item_id ごとに consumed_amount を合算し、null/空はスキップ。各在庫 `nextQuantity = quantity + 合算consumed`。
- 既存 `web/src/lib/cooking-history/edit.ts` の集約パターンを踏襲。

### 巻き戻し手続き（順序厳守）
1. events を meal_schedule_id + user_id で取得
2. 在庫を加算復元（inventory_items.quantity を update）
3. events を削除
4. cooking_history を削除（→ photos.cooking_history_id 自動 null 化、photos行・Storageは残す）
5. 完了解除: meal_schedules を未完了へ update / 完了削除: meal_schedules を delete

### UI
- スロットメニューに status="完了" のときだけ「完了を外す」を追加。確認パネル経由。
- 全献立カードに×削除ボタン。完了済みは巻き戻し付き削除、未完了は在庫不変削除。確認文言を状態で出し分け。
- `DeleteConfirmPanel` に confirmLabel/tone を追加して完了解除にも流用（後方互換）。

## 非対象

- 1スロット複数献立表示（SPEC-0179）。
- 完成写真の候補化（SPEC-0180）。
- スキーマ変更、料理履歴画面側の改修。

## 実装メモ

- 在庫減算の対称処理は `completeSchedule`（recipe-meal-workspace.tsx ≈line 1298, 在庫減算 1348-1360）。
- 確認機構は `requestDelete`/`pendingDelete`（≈line 711, 1660）と `DeleteConfirmPanel` を再利用。
- 部分失敗時は以降を中止し、再読込を促すトーストを出す。

## 残リスク

- 在庫復元の途中失敗で一部のみ復元される可能性（まとめ更新＋再読込誘導で軽減、report に記録）。
- 完了→手動在庫編集→完了解除の場合、編集後の値に consumed_amount を足し戻す仕様であること（glossary/report に記録）。
