# TKT-0012 Review

## Findings

- No blocking issues found in static review.

## Checked

- 手動買い物追加は在庫比較後、不足分だけ `state.pendingSync.shoppingCreates` に積まれる。
- 在庫で足りる場合は買い物リスト行を作らない。
- 単位換算は行わず、同じ品名+単位だけを差し引く。

## Residual Risk

- 既存の未購入買い物リスト数量は差し引かない仕様。重複抑制が必要なら別チケットで扱う。
