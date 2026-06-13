---
id: TKT-0247-recipe-ingredient-editor-focus-stability
title: レシピ編集画面の材料・調味料入力で1文字ごとにフォーカスが外れる不具合を直す
status: implementation_ready
goal: レシピ編集モーダルの材料/調味料行が入力のたびに作り直され、品名・数量・単位入力からフォーカスが外れる不具合を防ぐ
acceptance:
  - レシピ編集モーダルの材料「品名」欄で文字を入力しても、入力欄のフォーカスが維持される
  - レシピ編集モーダルの材料「品名」欄で Backspace により文字を削除しても、入力欄のフォーカスが維持される
  - レシピ編集モーダルの調味料「品名」欄でも、文字入力・Backspace 後にフォーカスが維持される
  - 材料/調味料の数量欄で文字入力・Backspace 後にフォーカスが維持される
  - 材料/調味料の単位検索欄で文字入力・Backspace 後にフォーカスが維持される
  - レシピ名、ジャンル検索、出典、下ごしらえ、調理工程の各入力欄について、同じ原因の `key` 不安定化がないことを実装時に静的確認し、report に記録する
  - 材料/調味料の行追加・行削除・D&D並び替え・グルーピング/解除・保存時の `sort_order` 採番を壊さない
  - DB schema、Supabase Auth/RLS、Storage、AI API route は変更しない
  - Web版 verify が通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0247-recipe-ingredient-editor-focus-stability/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0198-edit-ingredient-reorder-dnd
  - SPEC-0202-ingredient-subgroup-edit-ui
related_artifacts:
  - artifacts/TKT-0247-recipe-ingredient-editor-focus-stability/verify.json
  - artifacts/TKT-0247-recipe-ingredient-editor-focus-stability/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0247-recipe-ingredient-editor-focus-stability`（= `harness/bin/verify_web.sh`）
  - 非危険変更（クライアントUIのみ）。必須成果物は verify.json + report.md
  - Canvas版 `app.html` は凍結・参照専用。編集しない
  - GAS / Google Spreadsheet / Google Drive は使わない
  - APIキー、Supabase秘密鍵、写真URL、Storage path を直書きしない
---

# Summary

レシピ編集モーダルで材料/調味料の品名を1文字入力または Backspace するたび、入力欄からフォーカスが外れる不具合を修正する。

調査時点の原因は `web/src/components/recipe-meal-workspace.tsx` の `renderRecipeIngredientEditor` 内、材料行の `key` が `key={`${tone}-${index}-${ingredient.name}`}` になっていること。`ingredient.name` は入力中に変わるため、React が「別の行」と判断して行DOMを作り直し、フォーカスが失われる。

## 原因（調査済み・2026-06-12）

- 問題箇所: `web/src/components/recipe-meal-workspace.tsx` の `renderRow`。
- 現状の行 key: `key={`${tone}-${index}-${ingredient.name}`}`。
- `ingredient.name` は品名入力の `value` と同じ値なので、1文字入力・削除ごとに key が変わる。
- React の key は「同じ部品かどうか」を判断する名札。key が変わると、同じ入力欄ではなく新しい入力欄として作り直される。
- その結果、品名欄だけでなく、同じ行内にある数量欄・単位検索欄も親行ごと作り直される可能性がある。

## 実装メモ

- 変更対象は `web/src/components/recipe-meal-workspace.tsx` の材料/調味料行 key。
- 最小修正は `ingredient.name` を key から外すこと。
  - 例: `key={`${tone}-${index}`}`。
  - ただし D&D 並び替え・グルーピング・行追加/削除との相性を確認し、より安定した行IDが必要なら `RecipeIngredientFormValues` に UI 専用 ID を持たせる案を検討する。
- 既存の `RecipeIngredientFormValues` は保存payloadの正本でもあるため、UI専用IDを追加する場合は `normalizeRecipeForm` の保存payloadへ混ぜないこと。
- `toRecipeFormValues` で既存DBレシピから編集フォームを作る経路と、新規追加 `addIngredientRow` の経路の両方で安定 key が成立することを確認する。
- レシピ名、ジャンル検索、出典、下ごしらえ、調理工程、AI入力欄などは横断確認済み。入力値そのものを親 key に使う構造は見つかっていないが、実装時にも再確認して report に残す。
- スマホ/タブレットでの入力体験が主目的。見た目の大幅変更はしない。

## テスト

- `web/src/__tests__/recipe-meal-workspace.test.tsx` にフォーカス維持テストを追加する。
- 推奨テスト:
  - 新規レシピモーダルを開く
  - 材料入力エリアの「品名」に focus
  - `fireEvent.change` で文字入力し、`document.activeElement` が同じ input のままか確認
  - Backspace 相当の変更（例: `玉ねぎ` → `玉ね`）後も `document.activeElement` が同じ input のままか確認
  - 調味料行を追加し、調味料の「品名」でも同様に確認
  - 数量欄と単位検索欄も、入力後に `document.activeElement` が維持されることを確認
- 既存の D&D/グルーピング/保存テストが通ることも確認する。

## 手動確認

- PC幅で新規レシピを開き、材料品名を連続入力できる
- PC幅で材料品名を Backspace 長押しまたは連打しても、フォーカスが外れない
- スマホ幅で材料品名・数量・単位検索を連続入力できる
- 調味料欄でも同じ操作ができる
- 行追加、行削除、D&D並び替え、グルーピング/解除、保存後の再表示が崩れない

## 非対象

- レシピ編集画面のデザイン刷新
- 材料/調味料の並び替え仕様変更
- グルーピング仕様変更
- DB schema変更
- Supabase Auth/RLS変更
- Supabase Storage変更
- AI API route変更
- Canvas版 `app.html` の変更

## 依存チケット

- なし（独立して着手可）

## 残リスク

- 単純に `key={`${tone}-${index}`}` へ変えるだけで直る可能性が高いが、D&Dやグルーピング後の行同一性まで厳密に見るなら UI 専用IDの導入が必要になる可能性がある。その場合も保存payloadへ混ぜないよう注意する。
- jsdom テストでは実ブラウザの日本語IME挙動までは完全再現できない。report には自動テスト結果に加え、可能ならブラウザでの手動入力確認結果を残す。
