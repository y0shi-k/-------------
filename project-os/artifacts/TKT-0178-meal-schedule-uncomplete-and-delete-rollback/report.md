---
ticket_id: TKT-0178-meal-schedule-uncomplete-and-delete-rollback
status: implemented_verify_passed
---

# Report

## 変更目的

完了済みの献立を安全に「未完了」へ戻し、完了時に減らした在庫と作成した料理履歴・消費記録を巻き戻せるようにした。あわせて全ての献立カードに `×` 削除ボタンを追加した。

## 変更内容

- `web/src/lib/cooking-history/rollback.ts`
  - `cooking_consumption_events` の `stock_item_id` / `consumed_amount` から、在庫へ足し戻す数量を計算する純関数を追加。
  - `stock_item_id` が `null` / 空、または不正数量の行はスキップ。

- `web/src/components/recipe-meal-workspace.tsx`
  - 完了済み献立のメニューに「完了を外す」を追加。
  - 完了解除時は、在庫復元、消費記録削除、料理履歴削除、献立の `未完了` 化を順番に実行。
  - 完了済み削除時は、在庫復元、消費記録削除、料理履歴削除の後に献立予定を削除。
  - 未完了削除は従来どおり献立予定のみ削除。
  - 全献立カードに `×` 削除ボタンを追加。

- `web/src/components/delete-confirm-panel.tsx`
  - `confirmLabel` / `tone` / `title` を任意propsとして追加し、削除以外の確認にも流用可能にした。
  - 削除確認をインライン表示ではなく、背景つき中央モーダルとして表示するようにした。

- `web/src/app/globals.css`
  - 確認パネルの通常トーンと、スケジュールカード右上の `×` ボタンを追加。
  - 削除確認モーダルの背景・中央配置・最大幅を追加。
  - スマホ幅でボタンがカード外へ出ないよう、カード内に固定配置。

## セキュリティとデータ安全

- APIキーやSupabase秘密鍵の直書きなし。
- スキーマ、RLS、Storage policy の変更なし。
- GAS、Google Spreadsheet、Google Drive は不使用。
- すべての対象DB操作に `user_id` 条件を付けた。
- 完成写真の Storage 実体と `photos` 行は削除しない。

## 実施した確認

- `harness/bin/verify_web.sh TKT-0178-meal-schedule-uncomplete-and-delete-rollback`: `VERIFY_PASSED`
  - lint: pass
  - typecheck: pass
  - test: pass（30 files / 203 tests）
  - build: pass
  - policy: no_gas_dependency / no_hardcoded_secret / supabase_rls_present / backlog_focus_lean すべて pass
- in-app Browser:
  - `localhost:3001` でアプリ表示確認。
  - 献立スケジュールで全カードの `×` 表示確認。
  - 完了済みカードの「完了を外す」表示確認。
  - 完了済み削除の確認文言確認。
  - 在庫画面の食材削除確認が中央モーダルになることを確認。
  - 390px幅で `×` ボタンのはみ出しなし。

## 残リスク

- 実DBを変更する手動確定操作は未実施。実データ破壊を避けるため、テスト用データでの確認を推奨。
- 在庫復元の途中失敗時は一部復元が残る可能性がある。現状はエラー通知で再読込・状態確認を促す。
- 完了後に在庫を手動編集してから完了解除した場合、現在の在庫数量に消費量を足し戻す仕様。
