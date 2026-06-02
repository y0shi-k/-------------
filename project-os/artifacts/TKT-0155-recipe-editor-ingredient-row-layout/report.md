---
ticket_id: TKT-0155-recipe-editor-ingredient-row-layout
status: ready
---

# Report

## 変更目的

「レシピを編集」モーダルの材料/調味料行で、数量・単位入力が狭く使いにくく、TKT-0154 で導入した単位ピッカー（`UnitPicker`）が `{×, ×, +` のように縦積みで崩れて表示されていた。原因は、`UnitPicker`（タグ＋検索input＋クリア/追加アイコン2つを持つ `min-height: 52px` のポップオーバーフィールド）が、レシピ材料行グリッド `20px minmax(0,1fr) 64px 64px 36px` の **64px幅の単位列**に押し込まれ、`.genre-field { flex-wrap: wrap }` で折り返していたこと。在庫モーダルが使う `.qty-unit-wrap` の nowrap 指定がレシピ行には無かった。

TKT-0154 と同じコンセプト（モーダル幅拡張 + 単位ピッカーに十分な幅 + nowrap 化）を適用し、見た目を在庫モーダルと揃えて使いやすくした。レイアウトは「1行インライン維持」（ユーザー確定）。CSSのみで対応し、JSX は変更していない。

## 今回追加した安全装置

- 追加した CSS 指定はすべて `.canvas-recipe-item-row` スコープに限定し、`.genre-*` のベース定義（ジャンルタグピッカー・在庫モーダルの単位ピッカー共用、`globals.css` L3147-3273）には手を入れていない。これによりジャンル入力・在庫の単位ピッカーへの副作用を防いだ。
- JSX/コンポーネントのロジック・DOM 構造・props は不変（`recipe-meal-workspace.tsx` 据え置き）。DB・RLS・Storage・AI route には一切触れていない（非危険変更）。

## 実施した確認

- `/verify TKT-0155-recipe-editor-ingredient-row-layout`（`harness/bin/verify_web.sh`）が全 pass:
  - lint / typecheck / test / build = すべて pass
  - policy: no_gas_dependency / no_hardcoded_secret / supabase_rls_present = すべて pass
  - 結果は `artifacts/TKT-0155-.../verify.json`（status: pass）
- `/check-gates TKT-0155-...`: CSS のみの差分は危険 eval に非該当 → 既定の軽量プロセス（verify.json + report.md）。必須 gate なし。
- 変更内容（`web/src/app/globals.css`）:
  1. `.recipe-editor-modal` 幅 `min(672px,100%) → min(720px,100%)`（在庫モーダルと統一）
  2. `.canvas-recipe-item-row` グリッド `... 64px 64px ... → ... 5rem 10rem ...`（数量約5rem・単位約10rem）
  3. `.canvas-recipe-item-row` スコープで単位ピッカーを nowrap 化（`.qty-unit-wrap` を踏襲: `genre-field`/`genre-tags`/`genre-input`/`genre-icon-button`）
  4. `@media (max-width: 520px)` の材料行グリッドと `.genre-input` min-width を狭幅向けに調整（1行維持）

## 残リスク

- 実機・ブラウザでの目視確認は未実施（Supabase ログインが必要なため自動スクショは行っていない）。手元 dev（`web/` で `npm run dev` → 献立・レシピ → レシピ編集）で次を目視確認することを推奨: 単位ピッカーが1行で崩れ無し／品名・数量・単位・削除が1行に収まる／≤520px でも1行維持／在庫モーダルと見た目が揃う。
- 単位タグが極端に長い単位名の場合は 10rem 列で省略表示になる（`.genre-tag-name` は `text-overflow: ellipsis` 済みで破綻はしない）。

## 次の依頼や人判断

- 目視確認で崩れや窮屈さが残る場合は、モーダル幅や単位列幅（10rem）の微調整を追加で依頼してほしい。
- 同様の単位ピッカー配置を他画面でも使う場合、`.qty-unit-wrap` の共通化（クラス再利用）を検討余地あり。
