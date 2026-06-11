---
ticket_id: TKT-0226-shopping-shortage-modal-wide
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

512px 固定で細長かった「買い物に追加するもの」（不足材料選択）モーダルを、PC 幅を活かしたレイアウトにして候補の確認・選択をしやすくする。

- `web/src/app/globals.css` のみ変更（マークアップ無変更）。`@media (min-width: 1024px)` ブロック末尾（TKT-0225 の直後）に追記:
  - `.shopping-shortage-modal`: `width: min(880px, 94vw)`・`height: auto`・`max-height: calc(100vh - 96px)`（候補数に応じて可変高）。
  - `.shopping-shortage-list`: `repeat(auto-fill, minmax(240px, 1fr))` のグリッド（候補数に応じて2〜3カラム自動調整）。
  - `.shopping-shortage-option strong`: 長い食材名の折返し（省略より視認性優先）。

## 今回追加した安全装置

- 変更は `@media (min-width: 1024px)` 内のみで、スマホ幅（375px）は従来の1カラムを完全維持。
- マークアップ無変更のため、タブ（ALL/食材/調味料）・「表示中をすべて選択」・下部アクション（あとで/選択したものを追加）の DOM・挙動・既存テストに影響なし。チェックボックス＋名前＋不足量＋分類バッジの行構成も維持。
- TKT-0225（consumption-modal ワイド化）と同一メディアクエリブロック内に並置し、パターンを統一。

## 実施した確認

- `/verify TKT-0226`: lint / typecheck / test（38ファイル・377件全パス）/ build すべて pass。policy も pass。`verify.json` 参照。

## 残リスク

- `height: auto` 化により候補数が少ないときモーダルの縦幅が小さくなる（ヘッダー・タブ・アクション行は常時表示で操作性は維持）。見た目の最終確認は実機目視。
- 候補1〜2件時は1〜2カラム表示（auto-fill の仕様どおり）。

## 次の依頼や人判断

- なし。eval の過剰マッチは作業ツリー上の他チケット語彙由来で、本チケットは CSS のみ（manual-smokes.md / review.md に記録）。
