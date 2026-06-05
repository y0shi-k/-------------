---
id: SPEC-0154-inventory-qty-unit-input-ux
title: 数量・単位入力のUX改善（単位は候補ピッカー選択／単位換算を上の単位に連動／数量スピンは1刻み）
status: spec_ready
scope:
  - web/src/components/inventory-board.tsx
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/components/unit-picker.tsx (新規)
  - web/src/lib/inventory/units.ts (新規)
  - web/src/lib/inventory/types.ts
  - web/src/app/globals.css
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - Supabase schema / RLS / Storage / AI route のロジックは変更しない（DB保存形 `unit_conversion = {fromQty, fromUnit, toQty, toUnit}` は不変）
  - 既存のAI写真解析・レシピ生成・在庫保存フローを壊さない
  - 単位は自由入力（任意の単位）も引き続き可能にする（候補に無い単位を捨てない）
constraints_notes:
  - DB列・型・RLSは無変更。フォーム上の入力UIと、フォーム値→保存値の組み立てだけを変える。
acceptance:
  - 在庫「食材をリストへ追加」/編集モーダルで、単位がテキスト手入力ではなく候補ピッカー（検索ポップオーバー）で選べる
  - 単位ピッカーは候補に無い単位を手入力で追加でき、選択した単位がフォームに反映される
  - 単位換算の左側（換算元）が「1 + 上で選んだ単位」を自動表示し、上の単位を変えると換算元の単位も追従する（換算元の単位欄は手入力しない）
  - 単位換算はユーザーが右側（換算先の数量・単位）だけ入力すれば成立し、「1本 = 1000 ml」のように保存される
  - 数量の数値入力（type=number）のスピンボタンが1刻みで増減し、小数は手入力で入れられる（小数入力でフォーム送信がブロックされない）
  - 上記（単位ピッカー・数量スピン1刻み）が買い物リスト追加とレシピ材料編集の数量・単位にも適用される（単位換算は在庫のみ）
  - 数値入力欄はモバイルで数値キーパッドが出る（`inputMode="decimal"`）／日本語IMEが立ち上がらない
  - 既存の在庫・買い物・レシピ材料の保存内容（数量・単位・換算）が壊れない
  - Web版verifyが通る
related_tickets:
  - TKT-0154-inventory-qty-unit-input-ux
---

# Summary

「食材をリストへ追加」画面（在庫の手動追加/編集モーダル）を中心に、数量・単位入力のUXを次の4点で改善する。買い物リスト追加・レシピ材料編集の数量/単位にも同じ単位ピッカーと数量スピン挙動を適用する（単位換算は在庫のみ）。

1. **単位はトグル（検索ポップオーバー）で候補から選ぶ** — 単位のテキスト手入力をやめ、共通の単位ピッカーで選択。候補に無い単位は手入力追加もできる。
2. **単位換算を上の数量・単位に連動** — 換算の左側（換算元）を「1 + 上で選んだ単位」に固定表示し、上の単位を変えると追従。ユーザーは右側（換算先の数量・単位）だけ入力する（例: 上で「本」を選ぶと「1本 = [1000] [ml]」と入力できる）。これにより現状の「換算元の単位欄が狭くて入力しづらい」問題も解消する。
3. **数量スピンは1刻み** — `type=number` のスピンボタン（上下矢印）を0.1刻みから1刻み（1, 2, 3…）にする。小数は手入力で入れられるようにする。
4. **数値欄のIME（日本語入力オフ）** — 数値欄は `type=number` + `inputMode="decimal"` で実質的にIMEが立ち上がらないようにする。

## 背景

- 在庫追加/編集モーダル（`inventory-board.tsx` の `addFlow === "manual"`、おおむね L820-L908）は、数量(`type=number`, `step="0.1"`)＋単位(`type=text`, placeholder「個」)＋単位換算(換算元数量/単位 = 換算先数量/単位 の5入力)で構成。
- 単位換算の現UIは `.conversion-row` を5カラムグリッド（在庫モーダルでは `4.5rem 1fr auto 4.5rem 1fr`）で並べており、狭幅では「換算元の単位欄」が極端に狭くなり入力しづらい。さらに換算元の単位は本来「上で選んだ在庫の単位」と一致すべきで、別途手入力させているのは冗長。
- 単位はマスター定数が無く全箇所フリーテキスト（`emptyStockItemFormValues.unit = "個"` ほか）。トグルで選べると入力が速く誤記も減る。
- 数量スピンが `step="0.1"` のため、矢印クリックで 1→1.1→1.2 と動く。ユーザーは整数を素早く増減したい（小数はたまに手入力で足りる）。
- 単位選択UIは既に `LocationTagPicker`（`inventory-board.tsx` L1280〜、`.genre-picker`/`.genre-popover` CSSを流用した単一選択の検索ポップオーバー）があり、これと同型のUIを単位に流用する（ユーザー確定済み）。

## 仕様

### A. 単位の候補定数（新規 `web/src/lib/inventory/units.ts`）

- `export const COMMON_UNITS: readonly string[]` を定義する。料理在庫向けの初期候補（順序は使用頻度順を意識）:
  `["個", "本", "袋", "パック", "缶", "枚", "玉", "束", "g", "kg", "ml", "L", "大さじ", "小さじ", "カップ", "cc", "切れ", "丁", "尾", "房"]`
  - 候補は後で調整可。実装者は順序・粒度を大きく変えず、上記をベースにする。
- import エイリアスは既存に合わせ `@/lib/inventory/units` で参照できるようにする。

### B. 共通 単位ピッカー（新規 `web/src/components/unit-picker.tsx`）

- `inventory-board.tsx` の `LocationTagPicker` を参考に、**汎用の単一選択 検索ポップオーバー** `UnitPicker` を実装する。
- props:
  ```ts
  type UnitPickerProps = {
    value: string;
    candidates?: readonly string[]; // 既定は COMMON_UNITS
    onSelect: (unit: string) => void;
    ariaLabel?: string;             // 既定「単位」
    eyebrow?: string;               // popover右上ラベル。既定「UNIT」
  };
  ```
- 挙動:
  - タップで開き、`candidates` をリスト表示。検索入力で絞り込み。
  - 候補に無い文字列は「＋『◯◯』を追加」で**手入力の単位として確定**できる（`LocationTagPicker` の `canCreate`/`create` と同じ。ただし永続化用の `onCreate` は不要 — 単位は都度値として `onSelect` するだけでよい）。
  - Enterで先頭候補 or 新規確定、Escで閉じる、外側クリックで閉じる（`LocationTagPicker` と同じ実装を踏襲）。
  - パレット色（`locationPaletteIndex`）は単位には不要。色分けしないシンプルなタグ表示にする。
- CSSは既存の `.genre-picker` / `.genre-field` / `.genre-input` / `.genre-popover` / `.genre-option` を流用する（新規クラスは最小限）。
- `LocationTagPicker` を `UnitPicker` で置き換える必要は無い（保存場所はそのまま）。共通化が容易なら内部ヘルパを共有してもよいが、必須ではない。

### C. 在庫追加/編集モーダルの数量・単位（`inventory-board.tsx` L844-L864 周辺）

- 数量入力（現 L848-855）:
  - `step="0.1"` → `step="any"` に変更（スピンは1刻みで動き、小数手入力でも `stepMismatch` でフォーム送信がブロックされない）。
  - `inputMode="decimal"` を付与（現状この欄だけ未付与）。
  - 実装者は `step="any"` でスピンが1刻みになることをブラウザで確認すること。もし環境差でスピン刻みが意図通りでない場合は、`step="1"` + 小数手入力を許容するための独自バリデーション回避（フォームの `Number()` 検証は既存のままで、`required`/`pattern` を足さない）にフォールバックしてよい。
- 単位入力（現 L856-862 のテキスト `<input>`）:
  - `UnitPicker`（value=`values.unit`, onSelect=`(u)=>updateValue("unit", u)`）に置き換える。
- レイアウト（`.qty-unit-wrap`）:
  - 現状は数値input＋テキストinputを左右連結（角丸 `12px 0 0 12px` / `0 12px 12px 0`）。ピッカーに変わるため、数値input（flex:1）＋ `UnitPicker`（固定〜最小幅）が横に並ぶよう `globals.css` の `.qty-unit-wrap` 関連（L5158-5172）を調整する。連結角丸にこだわらず、自然に並べばよい。

### D. 単位換算の連動（`inventory-board.tsx` L870-L908 と `normalizeUnitConversion` L83-101）

確定方針: **換算元 = 「1」固定 ＋ 上で選んだ単位（`values.unit`）に追従。ユーザーは換算先（数量・単位）だけ入力。**

- UI（`.conversion-row`）:
  - 換算元の数量・単位の2入力を削除し、**読み取り専用ラベル `1{values.unit || "—"}`** を表示する。
  - 続けて `=`、換算先数量（`type=number`, `step="any"`, `inputMode="decimal"`, value=`conversion_to_qty`）、換算先単位（`UnitPicker`, value=`conversion_to_unit`）を並べる。
  - 例示テキストは「例: 1本 = 1000ml。料理完了時に双方向で換算します。」のように更新。
  - `globals.css` の `.conversion-row` / `.inventory-editor-modal .conversion-row`（L1775-1786, L5194-5204）のグリッドを、`[1◯ラベル] = [数量] [単位ピッカー]` のレイアウトに合わせて簡素化する。
- フォーム値（`StockItemFormValues`、`web/src/lib/inventory/types.ts` L36-66）:
  - `conversion_from_qty` / `conversion_from_unit` のフィールド自体は型に残してよいが、**UIからは入力させない**。保存時に `from` 側を `values.unit` 基準で組み立てる（下記）。
  - 既定値 `emptyStockItemFormValues` は現状維持で問題ない（from系は空文字でよい）。
- `normalizeUnitConversion` の変更:
  - 換算の有無判定を**換算先のみ**で行う: `hasAnyConversionValue = values.conversion_to_qty || values.conversion_to_unit`。
  - `fromQty = 1`、`fromUnit = values.unit.trim()` とする（上の在庫単位を流用）。
  - `toQty = Number(values.conversion_to_qty)`, `toUnit = values.conversion_to_unit.trim()`。
  - バリデーション: `fromUnit` 必須（＝上の単位が未入力なら換算は作らない/エラー文言は既存トーンに合わせる）、`toQty>0` かつ `toUnit` 必須。満たさなければ `{ error: "単位換算は「1 本 = 1000 ml」のように換算先の数量と単位を入力してください。" }`。
  - 返り値の形 `{ fromQty, fromUnit, toQty, toUnit }` は不変（DB保存形を変えない）。
- 既存データの編集ロード（`toFormValues`、types.ts L68-84）:
  - 換算先は既存 `toUnit` を `conversion_to_unit` に入れる。
  - **比率保存**のため、`conversion_to_qty = toQty / fromQty`（`fromQty>0` のとき。割り切れない/桁が増える場合は丸めず文字列化、もしくは `Number.isInteger` でなければ小数2〜3桁程度に整形）。例: 旧「2パック=300g」→「1{単位}=150g」相当に正規化して表示。
  - `conversion_from_*` はUIで使わないので空のままでよい。

### E. 買い物リスト・レシピ材料への適用（単位換算は対象外）

- 買い物リスト追加（`inventory-board.tsx` の `shoppingValues`、数量 L1064-1072 / 単位 L1073-1078）:
  - 数量: `step="0.1"` → `step="any"`、`inputMode="decimal"` 付与。
  - 単位: テキスト `<input>` を `UnitPicker`（value=`shoppingValues.unit`, onSelect=`updateShoppingValue("unit", u)`）に置換。
- レシピ材料編集（`recipe-meal-workspace.tsx` の材料行。`RecipeIngredientFormValues { amount, unit }`、`emptyRecipeIngredientFormValues.unit = "個"`、`web/src/lib/recipes/types.ts`）:
  - 数量(amount)入力の `type=number` を `step="any"` ＋ `inputMode="decimal"` に。
  - 単位入力を `UnitPicker` に置換。
  - 材料は複数行・動的追加されるため、各行に `UnitPicker` を配置しても破綻しないことを確認（ポップオーバーの開閉が行単位で独立すること）。
- 単位換算（conversion）は在庫のみ。買い物・レシピには追加しない。

### F. IME（日本語入力オフ）方針 — ユーザー質問への回答も兼ねる

- 純粋な数値欄（数量・換算先数量）は `type="number"` + `inputMode="decimal"` で、主要ブラウザで日本語IMEが立ち上がらない（実質オフ）。本チケットでこれを全数値欄に揃える。
- CSS `ime-mode` は非標準・多くのブラウザで廃止のため使わない。
- 単位欄はピッカー化により通常はタップ選択になり、日本語のフリーテキスト入力が不要になる（候補に無い単位を手入力するときだけ、ピッカーの検索欄で日本語入力が必要 — ここはIMEを許容する）。
- 結論: 「数値の場所は日本語オフ」は `type=number`＋`inputMode` で達成。テキスト欄ごとのIME強制オフは標準手段が無いため、単位はピッカー化で“そもそも日本語入力させない”形にする。

## 非対象

- Supabase schema / RLS / Storage / AI route の変更
- `unit_conversion` のDB保存形・双方向換算の計算ロジック（料理完了時の消費換算）の変更
- 料理履歴の消費量編集モーダル（`cooking-record-edit-modal.tsx`）の数量入力（今回の適用範囲外）
- 単位のサーバー側マスター化・永続化（候補はフロント定数 `COMMON_UNITS` でよい）

## 手動確認

- 在庫追加モーダルで単位をピッカーから選べる／候補に無い単位を手入力追加できる。
- 上で「本」を選ぶと換算が「1本 = [   ] [単位]」になり、右側に 1000 / ml を入れて保存→ `unit_conversion = {fromQty:1, fromUnit:"本", toQty:1000, toUnit:"ml"}`。
- 上の単位を「本」→「パック」に変えると換算左側ラベルも「1パック」に追従。
- 数量スピンの上下矢印が 1, 2, 3 と1刻みで動く。手入力で `1.5` を入れて保存できる（送信がブロックされない）。
- 既存（換算ありの）在庫を編集で開くと、換算が「1{単位} = 比率換算後の数量 {単位}」で表示され、保存しても意味が壊れない。
- 買い物リスト追加・レシピ材料編集でも単位ピッカー＆数量1刻みが効く。
- モバイル幅で数量欄に数値キーパッドが出て、日本語IMEが出ない。

## Acceptance Example

- `project-os/artifacts/TKT-0154-inventory-qty-unit-input-ux/verify.json` が pass。
- `report.md` に、上記「手動確認」の主要項目（単位ピッカー／換算連動／スピン1刻み／既存データ編集の非破壊）の確認結果を残す。
