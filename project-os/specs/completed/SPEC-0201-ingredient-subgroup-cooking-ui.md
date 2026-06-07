---
id: SPEC-0201-ingredient-subgroup-cooking-ui
title: 全画面ビューで材料・調味料をサブグループ化・解除する
status: draft
scope:
  - 全画面ビュー（CookingViewer）の材料・調味料カード
  - 行の選択（クリック / Cmd・Ctrl複数選択）
  - 「材料」「調味料」ラベル隣のグルーピング／解除ボタン
  - サブグループ見出しの自動ラベル表示（材料=A/B/C、調味料=あ/い/う）
constraints:
  - 保存対象は TKT-0200 で追加した `recipe_ingredients.group_index`（と既存 `sort_order` / `item_type`）
  - ラベル文字はDBに持たず group_index から導出する
  - 既存の3本線D&D並び替えと共存し、グループ境界を考慮する
  - DB schema変更はしない（TKT-0200の土台を利用）
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
acceptance:
  - 材料・調味料の行をクリックすると選択状態に切り替わる（再クリックで解除）
  - Cmd（Mac）/ Ctrl（Win）を押しながらクリックで複数行を選択できる
  - 複数行を選択すると「材料」/「調味料」ラベルの隣に「グルーピング」ボタンが表示される
  - グルーピングを実行すると、選択行が同一 item_type 内で1つのサブグループ（同じ group_index）にまとまる
  - 選択行 or グループを対象に「グループ解除」ができ、group_index が 0 に戻る
  - サブグループには材料=A/B/C…、調味料=あ/い/う… の見出しが自動採番で表示される
  - グルーピング/解除の結果は確定保存で `recipe_ingredients.group_index` に永続化され、再読込・編集画面でも保持される
  - 既存の3本線D&D並び替えがグループ境界を考慮して動く（グループ内/グループ間移動で group_index が更新される）
  - 行クリック選択とD&Dハンドル操作が競合しない
  - Web版verifyが通る
related_tickets:
  - TKT-0201-ingredient-subgroup-cooking-ui
---

# Summary

全画面ビューで、材料の中・調味料の中をサブグループに分けられるようにする。行クリックで選択、Cmd/Ctrlで複数選択し、ラベル隣の「グルーピング」ボタンでまとめ、「解除」で戻す。サブグループ見出しは番号から自動採番（材料A/B/C、調味料あ/い/う）。結果は TKT-0200 の `group_index` に永続保存する。

## 背景

材料・調味料は `item_type` で2分類されるが、その中をさらに（例:下ごしらえ群／仕上げ群のように）まとめたいという要望。永続化の土台は TKT-0200 が用意する。

## 仕様

- 対象は `web/src/components/recipe-meal-workspace.tsx`（CookingViewer ~L3445、材料グループ描画 `renderIngredientGroup` ~L3506）と `globals.css`。
- 選択state（選択中の ingredient id 集合）を持つ。行クリックでトグル、`event.metaKey || event.ctrlKey` で追加選択。同一 item_type 内のみ選択可とする（材料と調味料の混在グルーピングはしない）。
- 選択が2件以上の時、対象 item_type のラベル（`cooking-ing-group-label`）隣に「グルーピング」ボタンを出す。実行で、未使用の group_index を割り当てて選択行に設定する。
- 「グループ解除」: 選択行（またはグループ単位）の group_index を 0 に戻す。
- ラベル導出: 食材 group_index N>0 → A,B,C…（`String.fromCharCode` 等）、調味料 N>0 → あ,い,う…（ひらがな配列）。導出関数を用意する。
- 既存のD&D（`moveCookingIngredient` ~L1651 / `saveCookingReorder` ~L1703）を拡張し、移動先グループの group_index を引き継ぐ。並び替え確定（TKT-0199で確認付き）で group_index も保存する。
- 保存は `recipe_ingredients` の `group_index` / `sort_order` / `item_type` 更新に限定する。

## 非対象

- 編集画面側のグルーピングUI（TKT-0202）
- 任意グループ名（自動ラベルのみ）
- DB schema変更
