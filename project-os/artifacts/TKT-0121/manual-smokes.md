# TKT-0121 Manual Smokes

- Browser smoke: blocked by the in-app browser security policy for `http://localhost:3001`.
- Automated coverage used instead:
  - 7日献立エリアが表示される
  - 予定なしの日が表示される
  - 献立を翌日に移動できる
  - 献立を削除できる
  - 既存の献立追加、調理完了、買い物追加が通る

## Notes

ブラウザ安全ポリシーにより実画面操作は未実施。UI崩れは次にブラウザ許可がある環境で確認する。
