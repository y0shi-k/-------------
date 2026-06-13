---
id: TKT-0255-recipe-editor-cross-type-reorder
title: 編集モーダルの材料エディタをフィルタタブ＋単一リスト化し、種別またぎ並び替え（種別保持）を可能にする
status: draft
goal: レシピ編集画面で食材⇄調味料を種別を保ったまま並び替えできる土台を作る（現状は同一item_type内に限定＝またげない）
acceptance:
  - 編集モーダルの材料エディタが ALL/材料/調味料 のフィルタタブ＋単一リスト構成になっている（従来の2ボックス併置を置換）
  - ALLタブで食材行を調味料行の間（およびその逆）へD&Dで移動でき、移動後も各行の item_type が変わらず、表示順だけが混在する
  - 材料タブ・調味料タブでは該当 item_type のみ表示され、従来どおりサブグループ見出し（A/B/C・あ/い/う）と並び替えが機能する
  - ALLタブではサブグループ見出しを表示しない（混在で分断されるため）
  - 保存→再読込後も、混在させた並び順が sort_order として保持される（normalizeRecipeForm 経由）
  - 「＋追加」操作の追加先 item_type が定義どおり（フィルタ時はその種別、ALL時は食材）に動く
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
  - artifacts/TKT-0255-recipe-editor-cross-type-reorder/verify.json
  - artifacts/TKT-0255-recipe-editor-cross-type-reorder/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0255`（= `harness/bin/verify_web.sh`）。コマンドの正本は `harness/registry.json`
  - required_evals は `/check-gates` で diff から自動判定できる。diff に "recipes"/"image" 等の語彙が出ると supabase_schema_change/photo_upload_storage が**過剰マッチ**しうるが、本チケットは client state/レンダリングのみで schema/Storage 無変更。過剰マッチした場合は report に「実schema/Storage無変更」と記録する（backlog の同パターン前例参照）
  - 既定の必須成果物は verify.json + report.md。危険変更なしのため manual-smokes/review は不要
---

# Summary

編集モーダルの材料エディタを、調理ビュー（CookingViewer）と同等の **ALL/材料/調味料 フィルタタブ＋単一リスト**へ再構成し、ALLタブで種別をまたいだ並び替え（item_type は保持）を可能にする。これが TKT-0256〜0259 の土台。

## 実装メモ

### 現状把握（参照すべき既存コード）
- 編集エディタ本体: `web/src/components/recipe-meal-workspace.tsx` の `renderRecipeIngredientEditor`（2705行〜）。現在は `foodIngredientEntries` / `seasoningIngredientEntries`（631-633行）で item_type 別に分割し、材料用・調味料用に**2回呼ばれて2ボックス併置**している（呼び出し箇所を grep で特定すること）。
- 並び替え本体: `moveIngredient`（769行）。`if (!moving || moving.item_type !== targetType) return current;`（773行）が**種別またぎブロック**の正体。
- サブグループ補助: `subgroupRuns` / `subgroupRankMapForItems`（282-309行付近）、`subgroupLabel`（263行）、`replaceSubgroupList`（309行付近）。**そのまま再利用**する。
- 調理ビュー側の「タブ＋単一リスト」実装が良い手本: `CookingViewer` の `ingredientTabs`（4676行）と `cooking-ing-list`（4784-4796行）、`renderIngredientGroup`（4540行）。フィルタタブのUI/挙動はこれに揃える。

### 変更方針
1. **2ボックス → タブ＋単一リスト**:
   - 編集エディタにも ALL/材料/調味料 のフィルタ state（例: `recipeIngredientTab`）を追加。調理側 `CookingIngredientTab`（"all"|"食材"|"調味料"）と同型でよい。
   - ALL時: `recipeValues.ingredients` を**配列順（=グローバル順）のまま**1リストで描画。各行に種別バッジ表示（ラベル隠しは TKT-0257 で対応、本チケットでは常時表示でよい）。サブグループ見出しは出さない。
   - 材料/調味料時: 該当 item_type のみ filter して、従来の `subgroupRuns` ベースのサブグループ表示・並び替えを維持。
2. **moveIngredient の種別またぎ許可**:
   - 773行のブロックを撤廃。またぎ時は `item_type` を**変えず**、グローバル配列上の挿入位置だけを更新する。
   - ALLでのドロップは `group_index = 0`（未グループ）に正規化。フィルタ表示中の同種ドロップは従来どおり隣接行/サブグループの `group_index` を継承。
   - 既存のドロップハンドラ（2738/2810/2841行付近）の `tone`/`sectionIndex`/`dropGroupIndex` の渡し方を、単一リスト前提に整理する。グローバル順での挿入インデックス計算に注意（item_type 別の foods/seasonings splice 前提を、単一リストの splice に変える）。
3. **「＋追加」**: フィルタ時はそのタブの item_type、ALL時は `食材` をデフォルトにする（`addIngredientRow` は引数で item_type を取れる＝787行）。
4. **グルーピング選択は単一種別維持**: `toggleRecipeIngredientSelection`（805行）の「別 item_type を足すと選択をリセット」ガードは残す（混在グルーピングはしない方針）。

### テスト
- `web/src/__tests__/recipe-meal-workspace.test.tsx` に、`moveIngredient` 相当の純粋ロジック（種別保持・グローバル順）の単体検証を追加。少なくとも「食材を調味料群の間に移動しても item_type が食材のまま、配列順だけ変わる」を固定する。

### 注意・ポリシー
- GAS/Spreadsheet/Drive を使わない。APIキー直書きしない。
- recipes/recipe_ingredients の**スキーマは変更しない**（sort_order は既に単一グローバル列）。保存経路 `normalizeRecipeForm` をそのまま使う。
- Canvas版 `app.html` は触らない。

## 非ゴール

- 調理ビュー（CookingViewer）側の同変更（→ TKT-0256）。
- 種別ラベルを隠す設定の永続化（→ TKT-0257）。
- モバイルの選択モード・タッチD&D（→ TKT-0258 / TKT-0259）。
- 手順/ジャンルの並び替え変更。

## 依存チケット

- なし（このイニシアチブの土台）。後続 TKT-0256〜0259 が本チケットに依存する。

## 残リスク

- 単一リスト化に伴うサブグループ表示の回帰（材料/調味料タブでの A/B/C・あ/い/う 見出し）。タブ別の描画分岐を test/手動で確認する。
