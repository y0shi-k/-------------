---
ticket_id: TKT-0201-ingredient-subgroup-cooking-ui
status: ready
---

# Report Draft

## 変更目的

全画面ビュー（CookingViewer）で、材料・調味料の中をサブグループに分けられるようにした。行クリック＋Cmd/Ctrl複数選択 → ラベル隣の「グルーピング」ボタンで同一 item_type 内に1サブグループ（同じ `group_index`）を作り、サブグループ見出し横の「解除」または選択行＋「グループ解除」で `group_index` を 0 に戻す。見出しは番号から自動採番（材料=A/B/C、調味料=あ/い/う）。結果は TKT-0200 で追加済みの `recipe_ingredients.group_index` に並び替え確定（TKT-0199の確認付き）で永続保存する。既存の3本線D&Dはドロップ先の隣接行/サブグループの `group_index` を引き継ぐよう拡張した。

## 今回追加した安全装置

- 選択は同一 item_type に限定（別 item_type の行を Cmd/Ctrl で足すと選択が切り替わる）。材料と調味料の混在グルーピングが起きない。
- グルーピングは「未使用の最小 `group_index`」を割り当て、欠番・非連番は表示時の出現順 rank で吸収（DBの番号は連番でなくてよい）。
- 解除した行は未グループ末尾へ寄せ、サブグループの連続性（rendering の run 分割）を保つ。
- D&Dハンドルの onClick は `stopPropagation` で選択トグルと競合させない。
- `sameIngredientOrder` に `group_index` 比較を追加し、位置変更を伴わないグルーピング/解除でも「確定」ボタンが有効化されるようにした。
- 保存対象は `recipe_ingredients` の `item_type` / `sort_order` / `group_index` 更新に限定（schema変更なし）。

## 実施した確認

- `/verify TKT-0201-ingredient-subgroup-cooking-ui`: lint / typecheck / test / build すべて pass。policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present / backlog_focus_lean）すべて pass。
- 追加ユニットテスト（`web/src/__tests__/recipe-meal-workspace.test.tsx`、計41件 pass）:
  - 複数選択→グルーピングで `group_index` が揃い保存ペイロードに反映される（材料=1、他=0）。
  - サブグループ見出し「解除」で `group_index` が 0 に戻る。
  - item_type 混在選択不可（材料選択中に調味料を Cmd クリックすると選択が切り替わる）。
  - 自動採番ラベル（材料=A、調味料=あ）の表示。

## 残リスク

- schema/Storage/AI/移行のいずれの変更もなし。`/check-gates` は `supabase_schema_change` 🔴 を検出するが、これは git diff 内の `recipe_ingredients` / `group_index` 等のトークンによる**語彙の過剰マッチ**。今回 `supabase/` 配下・migration・`.sql` の変更は0件（`git status` で確認済み）。実体は TKT-0200 で追加済みカラムの**利用のみ**。
- 実機での目視（スマホ375px でのサブグループ枠・選択ハイライト・タップ操作とD&Dの共存）は未実施＝ユーザー残作業。
- 編集画面側のグルーピングUIは非対象（TKT-0202）。本チケットの選択/グルーピング/ラベル導出ロジック（`subgroupLabel` / `subgroupRankMap` / `regroupCookingDrafts`）は 0202 で流用できる形でモジュール/コンポーネント内に配置済み。

## 次の依頼や人判断

- TKT-0202（編集画面のサブグルーピングUI）への着手。0201の共通ロジック流用＋0198のD&Dと整合。
- 実機スモーク（上記「残リスク」）。
