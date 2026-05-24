# TKT-0124 Manual Smokes

- Browser smoke: blocked by the in-app browser security policy for `http://localhost:3001`.
- Automated coverage used instead:
  - レシピから調理ビューを開ける
  - 材料/調味料タブを切り替えられる
  - 在庫不足が表示される
  - 調理手順内の材料チップを押せる

## Notes

ブラウザ安全ポリシーにより実画面操作は未実施。UI崩れは次にブラウザ許可がある環境で確認する。
