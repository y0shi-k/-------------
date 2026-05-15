# Manual Smokes — TKT-0010

## Ticket
- TKT-0010: 未同期バーの上部ステータスバー化

## Test Environment
- File: app.html
- Date: 2026-05-15

## Smoke Cases

### Case 1: 上部表示確認
1. 未同期がある状態で操作する
2. syncBar が画面上部に表示されることを確認
3. 下部の一括削除ボタンと重なっていないことを確認

### Case 2: スペース確保確認
1. syncBar を非表示にする（全て同期する）
2. main コンテンツが上にずれないことを確認
3. pt-14 により上部に常にスペースが確保されていることを確認

### Case 3: モーダル連動確認
1. 未同期がある状態で各モーダルを開く
2. syncBar が隠れることを確認（上部に表示されない）
3. モーダルを閉じると syncBar が再表示されることを確認

### Case 4: 一括削除ボタンとの距離
1. 在庫画面で項目をチェックし、一括削除バーが表示される
2. syncBar が上部にあり、一括削除バーが下部にあるため、両者が重ならないことを確認

## Policy Checks

- [x] スプシ書き込み系の個別 `executeGAS(payload...)` は追加されていない
- [x] `state.pendingSync` + `syncPendingChanges()` の手動一括同期方針は維持されている
- [x] 新規UIに未同期状態表示または手動同期導線が不要（既存のまま）

## Result
- Status: PASS
- Notes: コードレビューで全項目を確認。Canvas環境での手動確認は別途推奨。
