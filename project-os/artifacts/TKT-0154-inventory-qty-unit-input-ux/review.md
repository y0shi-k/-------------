---
ticket_id: TKT-0154-inventory-qty-unit-input-ux
status: passed
review_scope:
  - SPEC-0154-inventory-qty-unit-input-ux
  - TKT-0154-inventory-qty-unit-input-ux
---

# TKT-0154 review

## checked_diff_paths

- `web/src/components/unit-picker.tsx`
- `web/src/lib/inventory/units.ts`
- `web/src/components/inventory-board.tsx`
- `web/src/components/recipe-meal-workspace.tsx`
- `web/src/lib/inventory/types.ts`
- `web/src/app/globals.css`
- `web/src/__tests__/inventory-board.test.tsx`
- `web/src/__tests__/recipe-meal-workspace.test.tsx`

## checked_artifacts

- `verify.json`: pass
- `manual-smokes.md`: passed
- `report.md`: ready

## findings

重大な未解決問題は見つからない。確認したこと:

- `UnitPicker` は候補選択、候補外追加、Enter/Esc、外側クリック閉じを持ち、単位候補は `COMMON_UNITS` に閉じている。サーバー通信や永続マスター化は追加していない。
- 在庫の数量欄、買い物数量欄、レシピ材料/調味料の数量欄は `type="number"` + `inputMode="decimal"` + `step="any"` に揃っている。
- 在庫単位、買い物単位、レシピ材料/調味料単位、換算先単位は `UnitPicker` に置換済み。
- 単位換算は換算先だけを入力対象にし、保存時は `fromQty=1`、`fromUnit=values.unit.trim()`、`toQty=Number(conversion_to_qty)`、`toUnit=conversion_to_unit.trim()` で組み立てている。DB保存形 `{fromQty, fromUnit, toQty, toUnit}` は不変。
- 既存換算データの編集ロードは `toQty / fromQty` を表示するため、旧データの意味が壊れない。
- CSSは数量+単位、換算行、買い物追加、レシピ材料行を対象に限定。スマホ幅の材料行も詰まりにくい列幅へ調整している。
- テストは新しいピッカー操作に合わせて更新済み。対象テスト38件、全体100件がpass。
- Canvas版 `app.html` は未編集。
- APIキー・秘密情報の追加なし。verify policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present）pass。
- `/check-gates` の `supabase_schema_change` / `photo_upload_storage` は過剰マッチ。migration / schema / RLS / Storage / 写真処理 / AI route の実変更は無い。

## open_risks

- 実機スマホでの数値キーパッド・IME挙動・スピンボタン1刻みの目視は未実施。
- `step="any"` のスピン挙動はブラウザ差がありうる。実機で1刻みにならない場合は `step="1"` へのフォールバックを検討する。
- 単位ピッカーのポップオーバーは既存 `.genre-*` CSS流用。狭幅で窮屈なら単位専用CSSを追加する余地あり。

## verdict

review_ready: pass（`verify_passed` / `manual_smokes_done` / `review_ready` を満たす。over-match の危険evalは実変更を伴わないことを実読で確認済み）
