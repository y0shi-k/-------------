# TKT-0013: 在庫管理リストの昇順/降順トグル

## 目的
在庫管理リスト（モードA）のソートボタンを押すたびに、昇順 ↔ 降順 をトグル切り替えできるようにする。

## Acceptance Criteria
- [x] 期限順 / 名前順 / 購入日順 の3ボタンを押すと、同じキーなら昇順/降順がトグルする
- [x] 異なるキーを押した場合は、そのキーの昇順から開始する
- [x] アクティブなボタンに ▲（昇順）または ▼（降順）が表示される
- [x] 非アクティブなボタンにはマークが付かない
- [x] verify がパスする

## Required Evals
- `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
- `grep -c 'sortOrder' app.html` >= 3
