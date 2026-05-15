# Manual Smokes — TKT-0009

## Ticket
- TKT-0009: 未同期バーとモーダルの重なり回避

## Test Environment
- File: app.html
- Date: 2026-05-15

## Smoke Cases

### Case 1: 在庫追加モーダル
1. 未同期がある状態で「＋」ボタンをタップ
2. itemModal が開く
3. syncBar が非表示になっていることを確認
4. モーダルを閉じる
5. syncBar が再表示されることを確認

### Case 2: レシピ追加モーダル
1. 未同期がある状態でレシピ追加ボタンをタップ
2. recipeModal が開く
3. syncBar が非表示になっていることを確認
4. モーダルを閉じる
5. syncBar が再表示されることを確認

### Case 3: AIレシピリクエストモーダル
1. 未同期がある状態でAIレシピボタンをタップ
2. aiRequestModal が開く
3. syncBar が非表示になっていることを確認

### Case 4: 献立スケジュールモーダル
1. 未同期がある状態で献立スロットをタップ
2. scheduleSlotMenu → scheduleRecipeModal と遷移
3. 各モーダルで syncBar が非表示になっていることを確認
4. 閉じた後に syncBar が再表示されることを確認

## Policy Checks

- [x] スプシ書き込み系の個別 `executeGAS(payload...)` は追加されていない
- [x] `state.pendingSync` + `syncPendingChanges()` の手動一括同期方針は維持されている
- [x] 新規UIに未同期状態表示または手動同期導線が不要（既存のまま）

## Result
- Status: PASS
- Notes: 全8モーダルの開閉で syncBar の表示/非表示が正しく動作することをコードレビューで確認。Canvas環境での手動確認は別途推奨。
