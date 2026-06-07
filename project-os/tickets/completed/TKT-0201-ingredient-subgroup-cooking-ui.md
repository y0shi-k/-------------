---
id: TKT-0201-ingredient-subgroup-cooking-ui
title: 全画面ビューの材料・調味料サブグルーピングUI（選択→グループ化／解除）
status: completed
goal: 全画面ビューで材料/調味料の中をサブグループに分けられるようにし、TKT-0200のgroup_indexへ永続保存する。
acceptance:
  - 材料・調味料の行をクリックすると選択状態に切り替わる（再クリックで解除）
  - Cmd（Mac）/ Ctrl（Win）を押しながらクリックで複数行を選択できる
  - 選択は同一 item_type 内に限定される（材料と調味料の混在選択はできない）
  - 複数行を選択すると、その item_type のラベル（材料/調味料）の隣に「グルーピング」ボタンが表示される
  - グルーピング実行で、選択行が同一 item_type 内の1サブグループ（同じ group_index）にまとまる
  - 選択行 or グループ単位で「グループ解除」ができ、group_index が 0 に戻る
  - サブグループ見出しが材料=A/B/C…、調味料=あ/い/う… の自動採番で表示される
  - グルーピング/解除の結果は確定保存で `recipe_ingredients.group_index` に永続化され、再読込・編集画面でも保持される
  - 既存の3本線D&D並び替えがグループ境界を考慮して動く（移動先グループの group_index を引き継ぐ）
  - 行クリック選択とD&Dハンドル操作が競合しない
  - DB schema変更はしない（TKT-0200の土台を利用）
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0201-ingredient-subgroup-cooking-ui/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0201-ingredient-subgroup-cooking-ui
related_artifacts:
  - artifacts/TKT-0201-ingredient-subgroup-cooking-ui/verify.json
  - artifacts/TKT-0201-ingredient-subgroup-cooking-ui/report.md
owner_role: implementer
owner_notes:
  - 現役正本はWeb版。Canvas版 `app.html` は編集しない。GAS/Spreadsheet/Driveを使わない。
  - 先行依存 TKT-0200 で `recipe_ingredients.group_index` と型・取得順・保存ペイロードが整っている前提。未完なら着手しない。
  - 対象は `web/src/components/recipe-meal-workspace.tsx`（CookingViewer ~L3445、材料グループ描画 `renderIngredientGroup` ~L3506、ラベル `cooking-ing-group-label` ~L3410）と `globals.css`。
  - 選択stateは選択中 ingredient id の集合（Set/配列）。行 `onClick` でトグル、`event.metaKey || event.ctrlKey` で追加選択。同一 item_type 内のみ選択可。
  - グルーピングボタンは選択2件以上かつ同一 item_type の時のみ、そのラベル隣に表示。実行で未使用の最小 group_index を割り当てる。
  - 解除は group_index を 0 に戻す。番号の欠番は表示時の自動採番で吸収する（DBの番号は連番でなくてよい）。
  - ラベル導出関数: 食材 N>0 → A,B,C…（`String.fromCharCode(64+rank)`）、調味料 N>0 → あ,い,う…（ひらがな配列）。rank は item_type 内の group_index 出現順。
  - D&Dは既存 `moveCookingIngredient`（~L1651）/ `saveCookingReorder`（~L1703）を拡張。移動先グループの group_index を引き継ぎ、確定保存（TKT-0199の確認付き）で group_index も書く。
  - 行クリック選択とD&Dハンドル（`cooking-row-drag-handle`）操作が競合しないよう、ハンドル領域のクリックは選択トグルにしない等のイベント切り分けをする。
  - テストでは、複数選択→グルーピングで group_index が揃うこと、解除で 0 に戻ること、ラベル自動採番（A/B、あ/い）、保存ペイロードの group_index、item_type混在選択不可を確認する。
  - `/check-gates` が文言で schema/Storage 系evalを過剰検出する場合は、report で「migration追加なし（TKT-0200で追加済みカラムの利用のみ）」を静的に示す。
  - verify は `/verify TKT-0201-ingredient-subgroup-cooking-ui`。
---

# Summary

全画面ビューで材料/調味料の中をサブグループ化・解除できるUIを実装する。行クリック＋Cmd/Ctrl複数選択 → ラベル隣の「グルーピング」ボタン → 同一item_type内で group_index を揃える。見出しは番号から自動採番（材料A/B/C、調味料あ/い/う）。結果は TKT-0200 の `group_index` に永続保存し、既存D&Dはグループ境界を考慮する。

## 実装メモ

- 選択UI: 行に選択スタイル（既存 `data-changed` 等の見た目に倣う）を付け、クリックでトグル・修飾キーで複数選択。
- グルーピング/解除ボタンはラベル行に条件表示。実行は group_index を更新する純粋な配列操作。
- ラベル導出は item_type 内の group_index 出現順を rank にして A/B/C・あ/い/う を割り当てる。
- D&Dとの整合: グループ内移動は同 group_index、グループ間移動は移動先の group_index に変更。

## 非対象

- 編集画面側のグルーピングUI（TKT-0202）
- 任意グループ名（自動ラベルのみ）
- DB schema変更

## 依存チケット

- TKT-0200-ingredient-subgroup-schema（DB土台。先行必須）
