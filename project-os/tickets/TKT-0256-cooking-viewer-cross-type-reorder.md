---
id: TKT-0256-cooking-viewer-cross-type-reorder
title: 調理詳細ビュー（CookingViewer）も種別またぎ並び替え（種別保持）に変更し、フィルタタブは維持する
status: draft
goal: 「調理を開始」詳細でも編集画面（TKT-0255）と同じく、食材⇄調味料を種別を保ったまま並び替えできるようにする（現状は種別を書き換える再分類になっている）
acceptance:
  - 調理詳細ビューの ALLタブで食材カードを調味料カードの間（およびその逆）へD&Dで移動でき、移動後も各カードの item_type が変わらず、表示順だけが混在する
  - ALLタブが foods群＋seasonings群の二段ではなく、単一の混在リストとして描画される
  - 材料/調味料タブ（ingredientTabs）が従来どおり種別フィルタとして機能する
  - ALLタブではサブグループ見出しを表示しない／材料・調味料タブでは従来どおり表示する
  - 並び替え後の順序が調理完了保存・消費フローに正しく引き継がれ、item_type 取り違えによる消費誤りが起きない
  - `/verify` が通る（lint/typecheck/test/build + policy）
required_evals:
  - web_project_bootstrap
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/recipe-meal-workspace.test.tsx
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0255-ingredient-cross-type-reorder-mobile
related_artifacts:
  - artifacts/TKT-0256-cooking-viewer-cross-type-reorder/verify.json
  - artifacts/TKT-0256-cooking-viewer-cross-type-reorder/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0256`。コマンド正本は `harness/registry.json`
  - diff の "recipes"/"image" 語彙で supabase_schema_change/photo_upload_storage が過剰マッチしうるが、client state/レンダリングのみで schema/Storage 無変更。過剰マッチ時は report に記録する
  - 危険変更なし。manual-smokes/review は不要
---

# Summary

調理詳細ビュー（`CookingViewer`）の材料リストを、TKT-0255 と同じ「ALL=単一混在リスト／材料・調味料=フィルタ」へ揃え、`moveCookingIngredient` の種別書き換えを撤廃して種別保持の並び替えにする。

## 実装メモ

### 現状把握（参照すべき既存コード）
- `web/src/components/recipe-meal-workspace.tsx`:
  - `moveCookingIngredient`（2154行）: 跨ぎ時に `item_type: targetType` で**書き換えている**（2170行）。foods/seasonings に split して splice → 連結（2167-2175行）している。
  - ALL描画: `cooking-ing-list`（4784-4796行）。ALL時に `renderIngredientGroup("材料","食材",foods)` と `renderIngredientGroup("調味料","調味料",seasonings)` の**二段**。
  - `renderIngredientGroup`（4540行）/ `renderIngredientCard`（4474行）/ `subgroupRankMap`・`subgroupRuns` 再利用。
  - フィルタタブ: `ingredientTabs`（4676行）はそのまま維持。
  - 並び替えの undo: `pushCookingReorderUndo` を踏襲（2162行）。

### 変更方針
1. **`moveCookingIngredient` の種別保持**: 2170行の `item_type: targetType` をやめ、`dragged.ingredient.item_type` を保持。foods/seasonings 別 splice をやめ、**単一の `cookingIngredientDrafts` 配列上**でグローバル順に挿入する実装へ変更（TKT-0255 の `moveIngredient` と同じ考え方）。`group_index` は ALL時 0、フィルタ時は隣接継承。
2. **ALL描画を単一リスト化**: ALL時は `ingredientDrafts` を配列順のまま1リストで描画（種別バッジは各カードに表示済み＝4522行）。サブグループ見出しは ALL では出さない。材料/調味料タブ時は従来の `renderIngredientGroup` を使う。
3. **フィルタタブ維持**: `ingredientTab` の "all"|"食材"|"調味料" 分岐（4785行）を、ALL=単一リスト／他=従来 group 表示に整える。
4. **選択ガード維持**: `toggleCookingIngredientSelection`（2181行）の単一種別ガードは残す（混在グルーピングはしない）。

### テスト
- `web/src/__tests__/recipe-meal-workspace.test.tsx` に `moveCookingIngredient` 相当の純粋ロジック検証を追加（食材→調味料群へ移動で item_type が保持され、グローバル順だけ変わる）。
- 消費フローに渡る順序が壊れないことを既存テストで確認（item_type 取り違えが消費対象を誤らせないか）。

### 注意・ポリシー
- GAS/Spreadsheet/Drive 不使用、APIキー直書き禁止。schema 無変更。Canvas版 `app.html` は触らない。

## 非ゴール

- 編集モーダル側の変更（→ TKT-0255、本チケットの前提）。
- ラベル隠し永続化（→ TKT-0257）。
- モバイル選択モード・タッチD&D（→ TKT-0258 / TKT-0259）。

## 依存チケット

- TKT-0255（混在表示ロジック／ヘルパー抽出を共有。先に完了させる）。

## 残リスク

- 並び替え順が `cooking_consumption_events` 等の消費記録に影響しないか（item_type 保持により、むしろ現状の再分類より正しくなる想定）。手動スモークで消費の正しさを確認。
