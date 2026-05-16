---
ticket_id: TKT-0030-ai-preview-modal-duplicate-ui-fix
status: completed
scope:
  - app.html
---

# Summary

AIレシピプレビューモーダル（`#aiRecipePreviewModal`）内に、同じレシピ表示構造（レシピ名・材料・手順＋ボタン群）が2セット重複して定義されており、下側の空のセットが無駄に表示されていたバグを修正した。

# Root Cause

`app.html` Line 616〜642 に、Line 583〜610 と完全に同一のHTMLブロック（レシピ表示エリア + ボタン群）が誤って重複定義されていた。同一の `id` 属性（`aiPreviewName`, `aiPreviewIngredients`, `aiPreviewSteps`）が2箇所に存在したため、JavaScriptは `getElementById` で最初の要素にのみ内容を注入し、2つ目の要素は空のまま残存して画面に表示されていた。

# Changes

- `app.html`: 重複していた2セット目のHTML（27行）を削除。
- 既存の1セット目（Line 583〜610）とボタン切り替え用の `recipeViewActions`（Line 612〜615）はそのまま維持。

# Verification

- 標準 verify: `VERIFY_PASSED`
- 重複IDチェック: `aiPreviewName`, `aiPreviewIngredients`, `aiPreviewSteps` がそれぞれ1つずつに減少
- 追加チェック: `alert(`/`confirm(`/`prompt(` なし、`showToast` あり、個別 `executeGAS` 書き込みパターン違反なし

# Impact

- 既存機能への影響なし。削除したのは未使用の重複DOMのみ。
- `recipeViewActions`（レシピ閲覧時のボタン表示切り替え）も維持されており、既存の表示モード切り替えに影響なし。
