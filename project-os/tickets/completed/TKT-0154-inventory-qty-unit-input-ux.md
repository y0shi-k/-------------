---
id: TKT-0154-inventory-qty-unit-input-ux
title: 数量・単位入力のUX改善（単位ピッカー選択／単位換算を上の単位に連動／数量スピン1刻み／数値欄IMEオフ）
status: ready
goal: 食材追加などの数量・単位入力を、単位はトグル選択・換算は上の単位に連動・スピンは1刻み・数値欄はIMEオフにして、入力を速く正確にする
acceptance:
  - 在庫追加/編集モーダルで単位が候補ピッカー（検索ポップオーバー）で選べ、候補に無い単位は手入力追加できる
  - 単位換算の換算元が「1 + 上で選んだ単位」を自動表示し、上の単位に追従する（換算元は手入力しない）
  - 換算は換算先（数量・単位）だけ入力すれば「1本 = 1000 ml」のように保存され、DB保存形 `{fromQty,fromUnit,toQty,toUnit}` は不変
  - 数量(type=number)のスピンボタンが1刻みで増減し、小数は手入力できフォーム送信がブロックされない
  - 単位ピッカーと数量1刻みが買い物リスト追加・レシピ材料編集にも適用される（換算は在庫のみ）
  - 数値欄が `inputMode="decimal"` で数値キーパッド表示・日本語IMEが立ち上がらない
  - 既存の在庫・買い物・レシピ材料・単位換算の保存内容が壊れない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/unit-picker.tsx
  - web/src/lib/inventory/units.ts
  - web/src/components/inventory-board.tsx
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/lib/inventory/types.ts
  - web/src/app/globals.css
  - web/src/__tests__/
  - project-os/artifacts/TKT-0154-inventory-qty-unit-input-ux/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0154-inventory-qty-unit-input-ux
related_artifacts:
  - artifacts/TKT-0154-inventory-qty-unit-input-ux/verify.json
  - artifacts/TKT-0154-inventory-qty-unit-input-ux/report.md
owner_role: implementer
owner_notes:
  - 非危険変更（UIのみ）。Supabase schema / Auth・RLS / 写真Storage / AI route / CSV移行は触らない。`unit_conversion` のDB保存形・双方向換算ロジックも変更しない。
  - `inventory-board.tsx` / `recipe-meal-workspace.tsx` は「写真/画像/Storage/generateContent」等の語を含むため、`/check-gates` の diff 自動判定で `photo_upload_storage` / `ai_server_route` に過剰マッチする可能性がある。実際の diff にそれらのロジック変更が無いことを確認し、最終 required_evals は `/check-gates TKT-0154` で確定する。過剰マッチが残る場合は manual-smokes.md / review.md を追加して required_gates を満たす。
  - verify は `/verify TKT-0154`（= `harness/bin/verify_web.sh`）。
  - Canvas版 `app.html` は触らない。対象は `web/` のみ（`supabase/` も触らない）。
  - APIキー・秘密情報を直書きしない。
  - 既存テスト（`inventory-board.test.tsx` / `recipe-meal-workspace.test.tsx` 等）は単位入力がテキスト→ピッカーに変わるため更新が必要。
---

# Summary

数量・単位入力のUXを4点改善する。詳細仕様・確定済み設計は `SPEC-0154-inventory-qty-unit-input-ux` を正本とする。

1. **単位は検索ポップオーバーのピッカーで選ぶ**（候補に無い単位は手入力追加可）。
2. **単位換算を上の数量・単位に連動**（換算元 = 「1 + 上の単位」固定。ユーザーは換算先だけ入力。例: 上で「本」→「1本 = 1000 ml」）。
3. **数量スピンを1刻み**（`step="any"`。小数は手入力可で送信ブロックなし）。
4. **数値欄はIMEオフ**（`type=number` + `inputMode="decimal"`）。

適用範囲（ユーザー確定）: 在庫 追加/編集モーダル ＋ 買い物リスト追加 ＋ レシピ材料編集。**単位換算は在庫のみ**。

## 実装メモ

> 行番号は調査時点（参考）。実装時は対象要素を確認して編集する。

### 1. 単位候補の定数（新規 `web/src/lib/inventory/units.ts`）
- `export const COMMON_UNITS = ["個","本","袋","パック","缶","枚","玉","束","g","kg","ml","L","大さじ","小さじ","カップ","cc","切れ","丁","尾","房"] as const;`（順序・粒度はSPEC準拠。後で調整可）

### 2. 共通 単位ピッカー（新規 `web/src/components/unit-picker.tsx`）
- `inventory-board.tsx` の `LocationTagPicker`（L1280〜、`.genre-picker`/`.genre-popover` CSS流用の単一選択 検索ポップオーバー）を参考に `UnitPicker` を実装。
- props: `{ value, candidates=COMMON_UNITS, onSelect, ariaLabel="単位", eyebrow="UNIT" }`。
- 候補に無い文字列は「＋『◯◯』を追加」で `onSelect` 確定（永続化 `onCreate` は不要）。
- パレット色は不要。既存 `.genre-*` クラスを流用し新規クラスは最小限。
- 外側クリック/Esc/Enterの挙動は `LocationTagPicker` を踏襲。

### 3. 在庫 追加/編集モーダル（`inventory-board.tsx`）
- 数量（現 L848-855）: `step="0.1"`→`step="any"`、`inputMode="decimal"` 付与。
- 単位（現 L856-862）: テキスト input → `UnitPicker`（onSelect=`updateValue("unit", u)`）。
- 単位換算（現 L870-908）:
  - 換算元の数量・単位 input を削除し、読み取り専用ラベル `1{values.unit || "—"}` を表示。
  - `=`、換算先数量（`type=number`/`step="any"`/`inputMode="decimal"`/`conversion_to_qty`）、換算先単位（`UnitPicker`/`conversion_to_unit`）を並べる。
  - 例示文を「例: 1本 = 1000ml。…」に更新。
- `normalizeUnitConversion`（L83-101）:
  - 有無判定を換算先のみに（`conversion_to_qty || conversion_to_unit`）。
  - `fromQty = 1`、`fromUnit = values.unit.trim()`、`toQty = Number(conversion_to_qty)`、`toUnit = conversion_to_unit.trim()`。
  - バリデーション: `fromUnit` 必須・`toQty>0`・`toUnit` 必須。エラー文言は換算先を促す内容に更新。
  - 返り値の形は不変。

### 4. 既存データのロード（`web/src/lib/inventory/types.ts` `toFormValues` L68-84）
- `conversion_to_unit = unit_conversion.toUnit`。
- 比率保存: `conversion_to_qty = toQty / fromQty`（`fromQty>0`）。整数でなければ小数2〜3桁程度に整形。
- `conversion_from_*` はUI未使用のため空でよい（型には残してよい）。

### 5. 買い物リスト・レシピ材料（換算なし）
- 買い物（`inventory-board.tsx` 数量 L1064-1072 / 単位 L1073-1078）: 数量 `step="any"`+`inputMode="decimal"`、単位 → `UnitPicker`（`updateShoppingValue("unit", u)`）。
- レシピ材料（`recipe-meal-workspace.tsx` 材料行 / `web/src/lib/recipes/types.ts` の `RecipeIngredientFormValues`）: amount を `step="any"`+`inputMode="decimal"`、単位 → `UnitPicker`。複数行で各行のポップオーバー開閉が独立することを確認。

### 6. CSS（`web/src/app/globals.css`）
- `.qty-unit-wrap`（L5158-5172）: 数値input（flex:1）＋ `UnitPicker` が並ぶよう調整。連結角丸は無理に維持しない。
- `.conversion-row` / `.inventory-editor-modal .conversion-row`（L1775-1786 / L5194-5204）: `[1◯ラベル] = [数量] [単位ピッカー]` のレイアウトに簡素化。
- 単位ピッカーは既存 `.genre-picker` 系を流用するため新規CSSは最小限。

### 7. テスト（`web/src/__tests__/`）
- 単位入力がテキスト→ピッカーになるため、`inventory-board.test.tsx` / `recipe-meal-workspace.test.tsx` の該当操作を更新。
- 追加が望ましいケース: 単位ピッカーで候補選択／手入力追加できる、上の単位変更で換算元ラベルが追従、換算先だけ入力で `unit_conversion` が `{fromQty:1, fromUnit:上の単位, toQty, toUnit}` になる、既存換算ありデータの編集ロードで比率が保たれる。

### 共通方針
- Web版でGAS/Spreadsheet/Driveを使わない。APIキー・秘密情報を直書きしない。
- 既存のコード規約・命名・import エイリアス（`@/`）・immutable patterns に合わせる。console.log を残さない。
- `step="any"` でスピンが1刻みにならない環境があれば、`step="1"` ＋ 小数手入力許容（`required`/`pattern` を足さず既存 `Number()` 検証のまま）にフォールバックしてよい。

## 残リスク

- 大きいファイル2つ（`inventory-board.tsx` / `recipe-meal-workspace.tsx`）の入力欄差し替えと既存テスト更新が必要。
- `step="any"` のスピン刻みはブラウザ挙動依存（要実機/各ブラウザ確認、フォールバック方針あり）。
- 既存 `unit_conversion` で `fromQty != 1` の行を編集ロードする際、比率換算（`toQty/fromQty`）で表示が小数になりうる（意味は保たれる）。
- `/check-gates` の diff 自動判定で危険eval（`photo_upload_storage`/`ai_server_route`）へ過剰マッチした場合、manual-smokes.md / review.md の追加が必要。
