---
id: TKT-0045-recipe-editor-drag-drop-reorder
title: レシピ編集画面の材料・調味料・工程をドラッグ＆ドロップで並び替え
status: completed
goal: レシピ編集モーダル内の材料・調味料・下ごしらえ・調理工程の行をドラッグ＆ドロップで並び替え可能にし、上下ボタンを削除する
acceptance:
  - 材料行（ingredient-row）がドラッグハンドルを持ち、D&Dで順序変更可能
  - 調味料行（seasoning-row）がドラッグハンドルを持ち、D&Dで順序変更可能
  - 下ごしらえ行（prep-step-row）がドラッグハンドルを持ち、D&Dで順序変更可能（連番自動更新）
  - 調理工程行（cook-step-row）がドラッグハンドルを持ち、D&Dで順序変更可能（連番自動更新）
  - 上下ボタンがすべて削除されている
  - D&D後の順序が保存時に正しく反映される
required_evals:
  - ui_component_addition
  - canvas_constraint
eval_selection_mode: auto
changed_paths:
  - app.html
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0045-recipe-editor-drag-drop-reorder
related_tickets:
  - TKT-0042-recipe-prep-seasoning-separation
related_artifacts:
  - artifacts/TKT-0045/verify.json
  - artifacts/TKT-0045/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - スプシ変更なし、GASパターン変更なし
  - HTML5 Drag and Drop API を使用（タッチデバイスでの動作はブラウザ依存）
---

# Summary

レシピ編集モーダル内の4セクション（材料・調味料・下ごしらえ・調理工程）の各行をドラッグ＆ドロップで並び替え可能にする。上下ボタンを削除して UI をスッキリさせる。

## 実装メモ

- HTML5 Drag and Drop API を使用
- 材料・調味料行：横並び flex レイアウト内にドラッグハンドル（≡ アイコン）を追加
- 下ごしらえ・調理工程行：連番バッジ自体をドラッグハンドルにする（cursor-grab / cursor-grabbing）
- ドラッグ中は `.dragging` クラスで opacity 0.4、ドロップ位置は `.drag-over-top` クラスで青い border-top で視覚的フィードバック
- 移動後、工程行は `renumberCookSteps()` / `renumberPrepSteps()` で連番を再採番
- 材料・調味料行は `getRecipeFormData()` が DOM 順に収集するため、追加の再採番不要
- `initRecipeDragDrop(containerId, rowSelector, afterDrop)` を汎用関数化し、各セクションで再利用
- イベントリスナーはコンテナに対して1回だけ設定（`_dragInited` フラグで重複防止）

## 残リスク

- タッチデバイス（スマートフォン・タブレット）での HTML5 D&D はブラウザ実装依存。完全なタッチ対応が必要な場合は将来的に touch events ベースの実装を検討
- ドラッグハンドルが小さすぎてタップしにくい可能性がある（材料・調味料行の ≡ アイコン）
