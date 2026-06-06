---
ticket_id: TKT-0186-mobile-sticky-action-buttons
status: ready
---

# Report Draft

## 変更目的

スクロールで主要操作ボタンが画面外に消えて押せなくなる問題を解消した。要望どおり「sticky追従で常時表示」
にし、特にユーザーが明示した「モーダルの×がスクロールで消えると戻せない」を直した。

## 今回追加した安全装置

`web/src/app/globals.css` のみの変更（JSX は無変更）。3ボタンを sticky 化:

1. **上部「＋」追加ボタン（食材管理ヘッダー）**: `.inventory-canvas-header` をスマホで `position: sticky; top: 32px; z-index: 40; background; padding-bottom`。`top:32px` は固定ヘッダー `.canvas-status-bar`(fixed, min-height:32px, z-index:60) の直下に潜らない値、z-index:40 は status-bar より下・本文カードより上。**PC(>=720px) では `position: static` に戻す**（デスクトップトップバーとの z-index 競合回避＝従来どおり）。
2. **手動追加モーダルの「在庫に追加」ボタン**: `.canvas-modal .form-actions` に `position: sticky; bottom: 0; background; border-top; z-index:5`。`.canvas-modal`(overflow:auto) 内でモーダル下端に固定。全幅共通（PC は短いフォームで sticky が動かないだけ）。
3. **全モーダル共通「×」閉じるボタン（案a: sticky 採用）**: `.modal-close-button` を `position: absolute` → `position: sticky; top: 14px; align-self:start; justify-self:end; z-index:10; margin-bottom:-40px`。`.canvas-modal`(grid+overflow:auto) のグリッドアイテムとしてスクロール中も上端14pxに固定し右上に残す。`margin-bottom:-40px` でトラック高さを潰し従来の見た目を維持。既存の個別上書き（recipe-editor/inventory-editor は top/width のみ＝position継承、photo-scan の2カラム時は absolute へ戻す）と整合。全幅共通。

## 実施した確認

- `/verify TKT-0186`: lint / typecheck / test / build すべて **pass**。policy 4項目すべて **pass**。`verify.json` に記録。
- required_gates（spec_ready / implementation_ready / verify_passed / report_ready）を充足。
- 「×」の sticky 化を目視レビュー: `.canvas-modal` が単一のスクロールコンテナ＋grid であり、その先頭グリッドアイテムを `sticky top:14px` にすることでスクロール追従が成立することを確認。
- **eval 過剰マッチ**: check-gates は作業ツリーに並行する TKT-0189 の diff を巻き込み危険evalを🔴表示しうるが、**本チケットの実変更は `globals.css` のみ**で Storage/schema/Auth/RLS 無変更（TKT-0184/0185 と同じ語彙過剰マッチ＝report 記録運用）。manual-smokes.md / review.md は不要。

## 残リスク

- **目視確認が未実施**（実機/DevTools 375px 幅）。要確認: (1)在庫リスト最下部スクロールで＋が残る、(2)手動追加モーダル最下部スクロールで「在庫に追加」が残る、(3)各モーダル本文スクロールで×が右上に残る、(4)PC幅で各ボタンが従来どおり。
- 「×」の `margin-bottom: -40px` ハック: トラック高さは潰れるが gap(14px) 分のタイトル上余白が元(0px)より増える可能性。視覚的に小差で許容と判断したが目視推奨。崩れる場合は案(b)モーダル2段構造（固定ヘッダー＋本文スクロール）へ切替を検討。
- `body { overflow-x: hidden }`(TKT-0184) と sticky の相互作用は縦方向のみのため影響低と判断。問題が出れば `.app-shell` の `overflow-x: clip` へ。
- 作業ツリーに TKT-0189 の変更が混在。**コミット時は TKT-0186 分（globals.css の sticky 関連）と TKT-0189 分を分けること**。

## 次の依頼や人判断

- スマホ実機/DevTools 375px での目視確認（上記4点）。
- これでスマホレイアウト崩れイニシアチブ（TKT-0184/0185/0186）の3チケットが実装完了。残るは全体の実機目視と、TKT-0184/0185/0186 と TKT-0189 を分けたコミット。
