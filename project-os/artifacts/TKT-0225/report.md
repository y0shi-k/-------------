---
ticket_id: TKT-0225-consumption-modal-wide
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

PC で細長く表示され材料行が縦に長く積まれて見にくかった「実際の消費量を調整」モーダルを、PC 幅を活かしたレイアウトにして確認・修正の手間を減らす。

- `web/src/app/globals.css` のみ変更（マークアップ変更なし）。既存の `@media (min-width: 1024px)` ブロック末尾に追記:
  - `.consumption-modal`: `width: min(960px, 94vw)`（従来 `min(640px, 100%)`）。
  - `.consumption-list`: `grid-template-columns: repeat(2, minmax(0, 1fr))` の2カラム化＋`align-items: start`。
  - `.consumption-row-label strong` / `.consumption-check strong`: `overflow-wrap: break-word; word-break: break-all` で長い材料名のはみ出し防止。

## 今回追加した安全装置

- 変更は `@media (min-width: 1024px)` 内のみで、スマホ幅（375px）は従来の1カラムを完全維持。
- `minmax(0, 1fr)` でグリッドアイテムのはみ出し（横スクロール誘発）を防止。
- マークアップ無変更のため、調理完了時モーダル（recipe-meal-workspace.tsx）と履歴編集モーダル（cooking-record-edit-modal.tsx）の両方に CSS だけで効き、既存テスト・直近の optgroup（TKT-0223）/ ツールチップ（TKT-0221改）を壊さない。
- 履歴編集側の料理記録パネル（写真・評価・コメント）は `.consumption-list` の外のため2カラム化の対象外（チケットの非対象指定どおり）。

## 実施した確認

- `/verify TKT-0225`: lint / typecheck / test（38ファイル・377件全パス）/ build すべて pass。policy も pass。`verify.json` 参照。

## 残リスク

- 960px 幅での sticky 閉じるボタン・form-actions の見え方は実機目視が未実施（CSSのみの変更で機能影響なし）。
- 非常に長い連続文字列の材料名は `word-break: break-all` で途中改行される（はみ出し防止を優先）。

## 次の依頼や人判断

- なし。eval の過剰マッチ（photo/テーブル名トークン）は作業ツリー上の他チケット由来で、本チケットは CSS のみ（manual-smokes.md / review.md に記録）。
