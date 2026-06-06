---
ticket_id: TKT-0178-meal-schedule-uncomplete-and-delete-rollback
status: partial_pass
execution_mode: automated_plus_browser_ui
---

# Manual Smokes

## executed_checks

- [x] `harness/bin/verify_web.sh TKT-0178-meal-schedule-uncomplete-and-delete-rollback` が `VERIFY_PASSED`。
- [x] 対象テスト `cooking-history-rollback.test.ts` / `recipe-meal-workspace.test.tsx` が通過。
- [x] in-app Browser で `http://localhost:3001` を開き、ログイン済みアプリ画面が表示され、console error が無いことを確認。
- [x] 献立スケジュール画面で全カードに `×` 削除ボタンが表示されることを確認。
- [x] 完了済みカードのスロットメニューに「完了を外す」が表示されることを確認。
- [x] 完了済みカードの `×` 削除で、確認パネルに「在庫を戻す」「料理履歴と消費記録も削除」「完成写真は残る」旨が表示されることを確認。
- [x] スマホ幅 390px で、スケジュールカード 6件に `×` が表示され、ボタンの画面外はみ出しが無いことを確認。
- [x] 在庫画面で食材削除を押し、削除確認が画面中央のモーダルとして表示されることを確認。確定削除は押さず「やめる」で閉じた。

## automated_behavior_checks

- [x] 完了解除で `cooking_consumption_events` を読み、在庫を加算復元し、消費記録・料理履歴を削除して、献立を `未完了` / `completed_at: null` に戻すことをテストで確認。
- [x] 完了済み削除で、在庫復元後に消費記録・料理履歴・献立予定を削除することをテストで確認。
- [x] `stock_item_id: null` の消費行は在庫復元対象から除外されることをテストで確認。
- [x] 未完了削除は既存どおり献立予定のみ削除するテストが継続通過。
- [x] 在庫削除と献立削除の既存コンポーネントテストが、モーダル化後も継続通過。

## skipped_checks

- [ ] 実Supabaseデータを使った「完了を外す」「完了済み削除」の確定操作は未実施。理由: 実データの在庫・料理履歴・献立予定を変更/削除するため、ユーザー確認なしには実行しない。
- [ ] `photos.cooking_history_id` が FK により `null` 化され、Storage実体が残ることの実DB確認は未実施。理由: 上記と同じく実データ破壊を避けたため。FK仕様は migration とテスト設計で確認。

## open_risks

- 実DBの破壊的手動確認は未実施のため、必要であればテスト用データを作ってからユーザー立ち会いで確認する。
- 在庫復元途中で通信失敗した場合、一部だけ復元される可能性は残る。失敗時はエラーメッセージで再読込と状態確認を促す。
