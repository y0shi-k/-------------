---
ticket_id: TKT-0154-inventory-qty-unit-input-ux
status: ready
---

# TKT-0154 report

## 変更目的

在庫追加/編集、買い物リスト追加、レシピ材料編集の数量・単位入力を速く正確にする。単位は候補ピッカーから選び、候補に無い単位はその場で追加できるようにした。単位換算は在庫フォームだけで、左側を「1 + 上で選んだ単位」に固定して入力負担を減らした。

## 変更内容

- `web/src/lib/inventory/units.ts`
  - 料理在庫向けの共通単位候補 `COMMON_UNITS` を追加。
- `web/src/components/unit-picker.tsx`
  - 検索ポップオーバー式の共通 `UnitPicker` を追加。
  - 候補選択、候補外単位の追加、Enter/Esc、外側クリック閉じに対応。
- `web/src/components/inventory-board.tsx`
  - 在庫の数量入力を `step="any"` + `inputMode="decimal"` に変更。
  - 在庫単位、換算先単位、買い物単位を `UnitPicker` に変更。
  - 単位換算の換算元を `1{values.unit}` の読み取り表示に変更。
  - 保存形 `{fromQty, fromUnit, toQty, toUnit}` は維持し、`fromQty=1`、`fromUnit=在庫単位` で組み立てる。
- `web/src/lib/inventory/types.ts`
  - 既存換算データの編集ロード時、`toQty / fromQty` を表示して意味を保つように変更。
- `web/src/components/recipe-meal-workspace.tsx`
  - レシピ材料/調味料の数量を `step="any"` + `inputMode="decimal"` に変更。
  - レシピ材料/調味料の単位を `UnitPicker` に変更。
- `web/src/app/globals.css`
  - 数量+単位、単位換算行、レシピ材料行、買い物追加行のレイアウトを調整。
  - 在庫モーダル幅を `460px` から `720px` 上限へ広げ、単位ピッカーが詰まらないように調整。
  - 在庫モーダルの数量・単位欄は、単位ピッカー内の折り返しを止めて1行表示に調整。
- `web/src/__tests__/`
  - 新しいピッカー操作に合わせて在庫・買い物・レシピのテストを更新。

## セキュリティと非対象

- APIキー、Supabase秘密鍵、写真URLなどの秘匿情報は追加していない。
- Supabase schema / RLS / Storage / AI route は変更していない。
- Canvas版 `app.html` は未編集。
- `unit_conversion` のDB保存形と既存の双方向換算ロジックは変更していない。

## 今回追加した安全装置

- 単位換算の保存前検証を、換算先の数量・単位に限定して分かりやすくした。
- 換算元はフォーム入力ではなく、在庫単位から `fromQty=1` / `fromUnit=values.unit.trim()` で組み立てるため、上の単位と換算元単位の不一致が起きにくい。
- 既存換算データは編集ロード時に `toQty / fromQty` へ正規化し、旧データの意味を保つ。
- 対象テストを更新し、在庫・買い物・レシピの保存 payload が壊れないことを確認した。

## 実施した確認

`harness/bin/verify_web.sh TKT-0154-inventory-qty-unit-input-ux`

- lint: pass
- typecheck: pass
- test: pass（vitest 100件）
- build: pass
- no_gas_dependency: pass
- no_hardcoded_secret: pass
- supabase_rls_present: pass

追加確認:

- 対象テスト `inventory-board.test.tsx` / `recipe-meal-workspace.test.tsx`: 38件 pass。
- 在庫追加で単位ピッカーから「丁」を追加し、換算先だけ `300 g` を入力して `{fromQty:1, fromUnit:"丁", toQty:300, toUnit:"g"}` で保存されることをテストで確認。
- 買い物リスト追加で単位ピッカーから「本」を選び、保存内容が壊れないことをテストで確認。
- レシピ材料編集で単位ピッカーを通して保存し、材料保存 payload が維持されることをテストで確認。

## 残リスク

- 実機スマホでの数値キーパッド表示とスピンボタン挙動の目視は未実施。`type="number"` + `inputMode="decimal"` と `step="any"` は自動テストではDOM上の退行なし。
- `/check-gates` の diff 自動判定が `supabase_schema_change` / `photo_upload_storage` に過剰マッチした。実diffを確認し、schema / RLS / Storage / 写真処理 / AI route の変更が無いことを `manual-smokes.md` と `review.md` に記録した。

## 次の依頼や人判断

- 実機スマホで、数量欄の数値キーパッド表示・IME挙動・スピンボタン1刻みを目視確認する。
- もし `step="any"` のスピンがブラウザで1刻みにならない場合は、`step="1"` へのフォールバックを検討する。
- 単位ピッカーの候補順や候補追加は、実利用で足りない単位が出たら `COMMON_UNITS` を調整する。
