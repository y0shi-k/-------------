---
ticket_id: TKT-0190-fractional-inventory-quantity
status: ready
---

# Report Draft

## 変更目的

在庫数量で `1/2`・`1/3`・`2 1/2`（帯分数）のような分数を、`/` や空白を打たなくても**端数ピッカー**（分数エリアをクリックで
ポップオーバーが開き、候補から選ぶ。単位ピッカーと同じUI）で入れられるようにした。新しい分数（例 `3/8`）はタグのように端末内へ記憶し、
次回から候補に出る。キャベツ1個から1/3個使ったら残り「2/3個」と直感的に分かるようにするのが目的。
DB（`inventory_items.quantity`）は既存の数値型のまま使い、入力の解釈・表示・減算だけを改善した。

要望に合わせて次も満たす:
- 分数入力は **g / cc(ml) 以外**（個・本・枚など数えられる単位）に限定。g/cc は従来どおり小数のみ。
- 「分数で入力したら分数、小数で入力したら小数」で表示する（**形式追従**）。減らす操作でも同じ。
- 再読込後も「最後に入力した形式」を保つため、形式を**端末内（localStorage）に記憶**（schema は変更しない）。

## 今回追加した安全装置

- 数量ヘルパー `web/src/lib/format/numeric.ts`
  - `parseQuantityInput`: 整数・小数・分数・**帯分数 "2 1/2"**（全角空白も）を number へ。分母0・空・不正形式は
    「原因・影響・修正方法」付きエラーで保存前に停止。
  - `sanitizeQuantityInput`: 分数・帯分数入力を許可（数字・`.`1つ・`/`1つ・区切り空白1つ）。g/cc 用は従来の `sanitizeDecimalInput`。
  - `isFractionalUnit(unit)`: g/ml/cc を分数対象外と判定。
  - `detectNotation` / `displayQuantity` / `formatQuantityDecimal` / `formatQuantity` / `formatQuantityForInput`:
    形式（分数/小数）に応じた表示と編集欄初期値。`quantityToNumber` / `roundQuantity` で減算・丸めを集約。
  - `formatQuantity` / `displayQuantity` は追加の分数候補（例 `3/8`）も渡せば帯分数で表示できる。
- 分数候補メモリ `web/src/lib/format/fraction-candidates.ts`（新規）
  - 既定候補（1/4,1/3,1/2,2/3,3/4）＋ユーザー追加分を localStorage に保存/取得。真分数のみ追加。`window` ガードで SSR 安全。
- 端数ピッカー `web/src/components/fraction-picker.tsx`（新規）
  - 単位ピッカーと同じポップオーバーUI。候補から選択し、検索欄で新しい分数（真分数）を追加するとタグのように記憶。
- 表示形式メモリ `web/src/lib/format/quantity-notation.ts`（新規）
  - `item_id → "fraction" | "decimal"` を localStorage に保存/取得/削除。`window` ガードで SSR 安全。失敗時は console.error で握りつぶし、表示は既定ルールにフォールバック。
- 入力欄 `web/src/components/number-field.tsx`
  - `allowFraction` を追加。true のとき分数入力＋端数ピッカー（選んだ分数を整数部に帯分数として組み立て、3/8 等も正確に保持）。false（g/cc）は小数のみ・ピッカーなし。
- 在庫 `web/src/components/inventory-board.tsx`
  - 追加/編集の数量欄に `allowFraction={isFractionalUnit(unit)}`。
  - 保存時に入力形式を判定して localStorage に記憶（g/cc は decimal 固定）。削除時は記憶も消す。
  - 一覧の数量は記憶した形式で表示（SSR不一致回避のためマウント後に state へ読み込み）。
  - 編集フォーム初期値・AI候補も単位/記憶に応じて分数 or 小数で表示。
- 献立/調理 `web/src/components/recipe-meal-workspace.tsx`
  - 消費量・レシピ材料の数量欄に `allowFraction`（g/cc 以外）。既定消費量も単位に応じた形式に。
  - 消費確認の在庫表示は各アイテムの記憶形式に追従。
  - **調理完了で減らしたとき**、使った形式（分数/小数）を記憶 → 在庫一覧の残量が同じ形式（例 残り 2/3）で出る。
- CSS `web/src/app/globals.css`: 端数ボタンのチップUI・数量欄の縦並びを追加。

## 実施した確認

- `harness/bin/verify_web.sh TKT-0190-fractional-inventory-quantity`: pass
  - lint / typecheck / test / build すべて pass、policy も pass。結果は同ディレクトリ `verify.json`。
- 追加/更新テスト:
  - `numeric-input.test.ts`（44件）: 帯分数 `2 1/2`→2.5、全角 `１２ １／２`→12.5、`2 1/0`/`2 5`/`1/0`/`abc`/空 のエラー、
    `isFractionalUnit`(g/ml/cc 除外)、`detectNotation`、`displayQuantity`、`formatQuantityDecimal`、形式別の編集欄初期値、`1 - 1/3 = 2/3` の減算。
  - `number-field.test.tsx`（10件）: 端数ピッカーから `1/2` 選択で `1 → 1 1/2`、新分数 `3/8` 追加で `1 → 1 3/8`、帯分数入力の保持、g/cc 相当でのスラッシュ/空白除去。
  - `quantity-notation.test.ts`（5件・新規）: 保存/取得/上書き/削除/空ID。
  - `fraction-candidates.test.ts`（4件・新規）: 追加/重複排除/既定除外。
  - 既存 inventory-board(24) / recipe-meal-workspace(30) も非回帰で pass。合計117件 pass。

## 残リスク

- 形式の記憶は **端末内（localStorage）**。別端末・別ブラウザでは「最後の形式」を復元できず、既定ルール（代表端数は分数）で表示する（仕様どおり。完全な共有は schema 変更が必要で今回スコープ外）。
- 単位を分数対象（個）→ g に切り替えても、欄に残った「2 1/2」は自動整形しない。保存時に `2.5` として正しく解釈されるが、見た目の自動クリーンは未実装（再入力で解消）。
- 分数入力欄は `inputMode="text"` にしたため、スマホで数字以外のキーも出る。代わりに端数ボタンで `/`・空白を打たずに端数指定できる。
- `photo_upload_storage`（🔴危険eval）が語彙（`photo|image|写真|画像`）で過剰マッチした。写真・Storage・schema・RLS・auth は未変更（`inventory-board.tsx` に写真機能コードが同居するための誤マッチ）。実体は数値入力・表示・減算と localStorage 表示メモリのみ。軽量プロセス方針（実危険変更でなければ verify.json + report.md）に従い manual-smokes / review は作成していない（TKT-0189 と同方針）。

## 次の依頼や人判断

- スマホ実機での目視確認（任意）:
  - 個の在庫で「2」入力→端数ピッカーで `1/2` 選択→「2 1/2」保存→一覧で「2 1/2個」表示。新分数 `3/8` を追加して次回候補に出ること。
  - 1個から 1/3 消費（調理完了）→ 在庫一覧で残り「2/3個」。
  - g の食材では端数ボタンが出ず、小数のみで入力できる。
- 別端末でも形式を揃えたい要望が出たら、表示用テキスト列の追加（schema 変更）を別チケットで検討。
