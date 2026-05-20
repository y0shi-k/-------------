---
ticket_id: TKT-0068-activity-statusbar-top-relocation
status: ready
---

# Report Draft

## 変更目的

GeminiCanvas 更新後に画面最上部のボタンが押せない不具合を避けるため、押下不要の `activityStatusBar` を最上部へ移設し、押下が必要な `syncBar` をその直下へ下げた。あわせてステータス文言の表示幅を少し広げた。

## 今回追加した安全装置

- `activityStatusBar` の `pointer-events-none` を維持し、最上部移設後もタップ対象にならないようにした
- `syncBar` を `activityStatusBar` の直下へ移し、`破棄` / `同期する` ボタンを最上部のクリック不能領域から外した
- `syncBar` の非表示時は最上部に残らないよう上方向へ完全退避させた
- `bottomNav` の押し上げをやめ、下部ナビの固定位置を通常化した
- `main#app` の上下余白を新しいステータスバー配置に合わせて調整した

## 実施した確認

- HTML parser による構文確認
- `executeGAS` と `GAS_URL` の存在確認
- Canvas向け禁止パターンの静的確認
- スプシ書き込み系通信を追加していないことの確認

## 残リスク

- GeminiCanvas 実機での固定レイヤー挙動は手動確認が必要。

## 次の依頼や人判断

- Canvasに `app.html` を貼り付け、`破棄` / `同期する` とアプリ上部ボタンが押せることを確認する。
