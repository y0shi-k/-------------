---
ticket_id: TKT-0040-activity-statusbar-blur-exclude
status: ready
---

# Report

## 変更目的

全画面ぼかしオーバーレイ表示時に、画面下部の常設ステータスバー（`#activityStatusBar`）が `backdrop-filter` によってぼかされてしまう問題を解消する。

## 実装内容

- `app.html` line 67: `#activityStatusBar` の z-index を `z-[55]` から `z-[90]` に変更。

## 調査で確認した影響を受けるケース

| 要素 | z-index | backdrop-blur |
|---|---|---|
| `#processingOverlay` | z-[65] | あり |
| `#purchaseConfirmOverlay`（動的） | z-[75] | あり |
| `#recipeModal` | z-[60] | あり |
| `#cookingRecordModal` | z-[60] | あり |
| その他モーダル15個 | z-50 | あり |

`z-[90]` は全てのぼかしオーバーレイを上回り、ステータスバーがぼかされなくなる。

## 実施した確認

- 既存verify: `VERIFY_PASSED`
- `alert/` `confirm/` `prompt` 残存チェック: 0件
- `showToast` 関数存在確認: OK
- `git diff --check`: passed
- 変更行数: 1行（z-index のみ）
