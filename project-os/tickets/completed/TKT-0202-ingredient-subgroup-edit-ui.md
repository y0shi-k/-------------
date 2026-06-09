---
id: TKT-0202-ingredient-subgroup-edit-ui
title: レシピ編集画面の材料・調味料サブグルーピングUI（選択→グループ化／解除）
status: verify_passed
goal: 全画面ビュー（TKT-0201）と同じサブグルーピングを編集モーダルでも使えるようにし、編集・全画面の両画面で材料/調味料のサブグループを永続管理できるようにする。
acceptance:
  - 編集モーダルの材料・調味料行をクリックで選択／再クリックで解除できる
  - Cmd（Mac）/ Ctrl（Win）を押しながらで複数選択できる（同一 item_type 内に限定）
  - 複数選択すると「材料」/「調味料」見出しの隣に「グルーピング」ボタンが表示される
  - グルーピングで選択行が同一 item_type 内の1サブグループ（同じ group_index）にまとまる
  - 選択行 or グループ単位で「グループ解除」ができ、group_index が 0 に戻る
  - サブグループ見出しが材料=A/B/C…、調味料=あ/い/う… の自動採番で表示される
  - 保存すると group_index が `recipe_ingredients` に永続化され、全画面ビュー・再表示でも保持される
  - TKT-0198 の編集画面D&Dがグループ境界を考慮して動く
  - 行クリック選択と行内入力（品名/数量/単位）・D&Dハンドル操作が競合しない
  - 選択/グルーピング/解除/ラベル導出ロジックは TKT-0201 と共通化され重複実装していない
  - DB schema変更はしない（TKT-0200の土台を利用）
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0202-ingredient-subgroup-edit-ui/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0202-ingredient-subgroup-edit-ui
related_artifacts:
  - artifacts/TKT-0202-ingredient-subgroup-edit-ui/verify.json
  - artifacts/TKT-0202-ingredient-subgroup-edit-ui/report.md
owner_role: implementer
owner_notes:
  - 現役正本はWeb版。Canvas版 `app.html` は編集しない。GAS/Spreadsheet/Driveを使わない。
  - 先行依存: TKT-0200（DB土台）、TKT-0201（全画面ビューUI・共通ロジック）、TKT-0198（編集画面D&D）。これらが揃ってから着手する。
  - 対象は編集モーダル（`web/src/components/recipe-meal-workspace.tsx` ~L2336〜2438、材料/調味料分離 `foodIngredientEntries`/`seasoningIngredientEntries` ~L462）と `globals.css`。
  - TKT-0201 で実装した選択state・グルーピング/解除・ラベル導出関数を共通関数として切り出して再利用する。編集画面用に新規ロジックを重複実装しないこと。
  - 編集画面の各行に選択UI（クリックトグル・`metaKey/ctrlKey`複数選択）を付ける。行内のinput/NumberField/UnitPicker/削除ボタン/D&Dハンドルのクリックは選択トグルにしない（イベント切り分け）。
  - 保存は既存 `saveRecipe`（~L1011、TKT-0200で group_index 対応済み）に乗せる。新規DB書き込み機構は追加しない。
  - TKT-0198 の編集画面D&Dとグループ境界を整合させる（グループ内移動は同 group_index、グループ間移動で更新）。
  - テストでは、編集画面での複数選択→グルーピングで group_index が揃うこと、解除で 0 に戻ること、保存ペイロードの group_index、ラベル自動採番、入力編集との非競合を確認する。
  - `/check-gates` が文言で schema/Storage 系evalを過剰検出する場合は、report で「migration追加なし（TKT-0200で追加済みカラムの利用のみ）」を静的に示す。
  - verify は `/verify TKT-0202-ingredient-subgroup-edit-ui`。
---

# Summary

全画面ビュー（TKT-0201）のサブグルーピングUIを編集モーダルへ展開する。選択/グルーピング/解除/ラベル導出の共通ロジックを再利用し、編集画面の材料・調味料行で同じ操作を提供する。保存は既存 `saveRecipe` フローで group_index を永続化し、編集・全画面の両画面で保持する。

## 実装メモ

- TKT-0201 の共通ロジックを関数として切り出し（同ファイル内 or 小さなユーティリティ）、編集画面・全画面ビュー双方から使う。
- 編集画面の行に選択スタイルとクリックハンドラを追加。入力要素・ハンドル・削除ボタンのクリックは `stopPropagation` 等で選択から除外する。
- 見出し（材料/調味料）隣にグルーピング/解除ボタンを条件表示。
- D&D（TKT-0198）とグループ境界の整合を取る。

## 非対象

- 全画面ビュー側のグルーピングUI（TKT-0201で実装済み）
- 任意グループ名（自動ラベルのみ）
- DB schema変更

## 依存チケット

- TKT-0200-ingredient-subgroup-schema（DB土台）
- TKT-0201-ingredient-subgroup-cooking-ui（全画面ビューUI・共通ロジック）
- TKT-0198-edit-ingredient-reorder-dnd（編集画面D&D・整合）
