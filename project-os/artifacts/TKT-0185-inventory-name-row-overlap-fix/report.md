---
ticket_id: TKT-0185-inventory-name-row-overlap-fix
status: ready
---

# Report Draft

## 変更目的

スマホ幅で食材管理（在庫一覧）の在庫カードの食材名行の文字が、期限/換算チップと重なって読めない崩れを
解消した。ユーザーが最初に挙げた具体的な不具合の一つ。

## 今回追加した安全装置

- 根本原因は `.item-title-row`（flex）の子 `h4` に `min-width` 未指定（既定 `auto`＝テキスト全幅）で flex 縮小できず、`flex: 0 0 auto` のチップと重なっていたこと。
- 対処（`web/src/app/globals.css` のみ。`inventory-board.tsx` はマークアップ変更不要）:
  1. 基底 `.item-main h4` に `min-width: 0` を追加 → flex 内で縮小し ellipsis が機能。
  2. `@media (min-width: 1024px)` 内 `.canvas-inventory-list .item-main h4` に `min-width: 0` を追加 → デスクトップの `white-space: normal` + `flex-wrap` でも適切に縮小/折返し。
  3. `@media (max-width: 719px)` ブロック（TKT-0184 が作った末尾ブロック）に在庫カード用スタイルを追記: `.stock-item` を 3列グリッド＋grid-areas で再定義し `item-main` に十分幅を確保、`.item-title-row { flex-wrap: nowrap }`、`.item-main h4 { min-width:0; white-space:nowrap; text-overflow:ellipsis }`。

## 実施した確認

- `/verify TKT-0185`: lint / typecheck / test / build すべて **pass**。policy 4項目すべて **pass**。`verify.json` に記録。
- required_gates（spec_ready / implementation_ready / verify_passed / report_ready）を充足。
- **eval 過剰マッチについて**: check-gates は作業ツリーに並行存在する TKT-0189（料理記録の写真ビューア）の未コミット diff を巻き込み、`photo_upload_storage` 等を🔴表示しうるが、**本チケットの実変更は `web/src/app/globals.css` のみ**で Storage/schema/Auth/RLS に触れていない（TKT-0178/0179/0184 と同じ語彙過剰マッチ＝report 記録運用）。manual-smokes.md / review.md は不要。

## 残リスク

- **目視確認が未実施**（実機/DevTools 375px 幅）。長い食材名（20文字超）＋チップ付き在庫で重ならず読めること、数量ステッパー/編集/削除と非干渉であることをユーザー目視で最終確認したい。
- ellipsis により長い食材名の末尾が省略される（タップ→編集モーダルで全文確認可。チケット記載の既知許容リスク）。
- 基底 `.item-main h4` への `min-width: 0` 追加で PC幅（720–1023px）でも ellipsis が正しく効くようになる（従来意図どおりの挙動で崩れではない）。
- 作業ツリーに TKT-0189 の変更が混在。**コミット時は TKT-0185 分（globals.css の在庫カード関連）と TKT-0189 分を分けること**。

## 次の依頼や人判断

- スマホ実機/DevTools 375px での目視確認（上記残リスク）。
- 続けて TKT-0186（主要操作ボタンの sticky 固定）へ。
