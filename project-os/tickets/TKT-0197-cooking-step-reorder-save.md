---
id: TKT-0197-cooking-step-reorder-save
title: 調理ビュー手順・材料の並び替えとレシピ本体への保存
status: implementation_ready
goal: 調理中に気づいた手順・材料・調味料の順番変更を、編集画面へ入らず調理ビュー上で一時調整し、確定時にレシピ本体へ保存できるようにする。
acceptance:
  - 調理ビュー右ペインの手順カードをドラッグ&ドロップで並び替えできる
  - 調理ビュー左ペインの材料・調味料カードをドラッグ&ドロップで並び替えできる
  - 下ごしらえと調理工程をまたいで手順を移動できる
  - 材料と調味料をまたいで移動でき、移動先の分類として保存できる
  - 行の左側にスマホで見慣れた3本線のドラッグハンドルが表示される
  - D&D直後は画面内の一時変更にとどまり、DBへ即保存されない
  - Undo / Redo で直前の並び替え操作を戻せる
  - 移動した行は未確定中に色付き枠で分かる
  - 調理ビュー下部に `並び替えを確定` と `料理を完了する` が分かれて表示される
  - `並び替えを確定` を押すと、既存の `recipes.prep_steps` / `recipes.steps` に保存される
  - 材料・調味料の並び替えは既存の `recipe_ingredients.sort_order` と `recipe_ingredients.item_type` に保存される
  - 保存後に再読込しても手順順が維持される
  - 未確定の並び替えがある状態で `料理を完了する` を押すと、保存してから完了へ進むか確認する
  - 調理完了済みの献立でも、手順の並び替え保存はできる
  - 既存の消費量確認、料理履歴保存、在庫減算は壊れない
  - DB schema変更はしない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0197-cooking-step-reorder-save/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0197-cooking-step-reorder-save
related_artifacts:
  - artifacts/TKT-0197-cooking-step-reorder-save/verify.json
  - artifacts/TKT-0197-cooking-step-reorder-save/manual-smokes.md
  - artifacts/TKT-0197-cooking-step-reorder-save/review.md
  - artifacts/TKT-0197-cooking-step-reorder-save/report.md
owner_role: implementer
owner_notes:
  - 現役正本はWeb版。Canvas版 `app.html` は編集しない。
  - 手順並び替え用の一時stateを持ち、保存確定までは `recipes` テーブルを更新しない。
  - 手順の保存対象は既存カラム `recipes.prep_steps` / `recipes.steps`。
  - 材料・調味料の保存対象は既存カラム `recipe_ingredients.sort_order` / `recipe_ingredients.item_type`。
  - 調理完了ボタンは完了済みなら従来どおり無効のままにする。ただし並び替え確定ボタンは完了済みでも使える。
  - 未保存の並び替えがある状態で調理完了へ進む時は、既存の確認UIパターンを使い、保存成功後に既存の `completeSchedule` へ進む。
  - 保存エラー文は「原因」「影響」「修正方法」が分かる形にする。
  - APIキー・Supabase秘密鍵を直書きしない。GAS/Spreadsheet/Driveを使わない。
  - 先行実装済み差分がある場合は、実装内容がこのチケットの完了条件に収まっているか確認してからreportを書く。
  - `/check-gates` が文言により schema/Storage 系evalを過剰検出する場合は、manual-smokes.md / review.md で実変更なしを静的に証明する。
  - verify は `/verify TKT-0197-cooking-step-reorder-save`。
---

# Summary

調理ビュー上で手順順・材料順・材料分類を一時変更し、確定ボタンでレシピ本体へ保存する。調理完了とは別操作にし、未保存のまま完了しようとした場合は確認を挟む。

## 実装メモ

- `CookingStepDraft` のような一時データを用意し、`prep_steps` と `steps` をまたいだ移動を表現する。
- `CookingIngredientDraft` のような一時データを用意し、材料・調味料をまたいだ移動を表現する。
- D&DはHTML5 Drag and Drop APIを使い、行左側の3本線ハンドルを操作目印にする。
- Undo / Redo 用に画面内履歴を持ち、保存後は履歴をクリアする。
- 手順保存は `supabase.from("recipes").update({ prep_steps, steps }).eq("id", recipe.id).eq("user_id", userId)` の形に限定する。
- 材料保存は `recipe_ingredients.sort_order` / `recipe_ingredients.item_type` の更新に限定する。
- 保存成功後はローカルの `recipes` stateを更新し、必要に応じて `router.refresh()` する。
- テストでは、区分移動後に `並び替えを確定` を押すと、期待する `prep_steps` / `steps` でupdateされることを確認する。
- テストでは、材料・調味料をまたいだ移動、Undo / Redo、`sort_order` / `item_type` の保存を確認する。

## 非対象

- レシピ編集モーダル側のD&D再実装
- DB schema変更
- 工程ごとの消費量分割
