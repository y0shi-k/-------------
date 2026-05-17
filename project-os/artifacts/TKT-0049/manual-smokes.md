# TKT-0049 Manual Smokes

status: done

## Static Smokes

- [x] スケジュールカードの「開始」が `returnTo: 'schedule'` を渡すことを確認。
- [x] レシピ集カードの料理ボタンが `returnTo: 'recipes'` を渡すことを確認。
- [x] 料理履歴の「もう一度作る」が `returnTo: 'cookingHistory'` を渡すことを確認。
- [x] `closeCookingViewer()` が保存した戻り先に応じて `switchMode()` で復帰することを確認。
- [x] Spreadsheet/GAS/pendingSync を変更していないことを確認。

## Canvas Manual Smoke

- [ ] スケジュールタブから「開始」→戻るボタンでスケジュールタブへ戻る。
- [ ] レシピ集タブから料理ボタン→戻るボタンでレシピ集タブへ戻る。
- [ ] 料理履歴から「もう一度作る」→戻るボタンで料理履歴へ戻る。

## Notes

画面遷移の実操作はCanvasプレビューで確認する。
