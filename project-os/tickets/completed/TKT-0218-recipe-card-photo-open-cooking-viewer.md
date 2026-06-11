---
id: TKT-0218-recipe-card-photo-open-cooking-viewer
title: レシピ一覧カードの写真クリックで調理ビューを開く
status: completed
goal: 「献立・レシピ > レシピ」一覧でレシピ写真を押しても選択されるだけで詳細に入れない問題を防ぐ。
acceptance:
  - レシピ一覧（RecipeList）の各カードのレシピ写真サムネをクリックすると、そのレシピの調理ビュー（CookingViewer 全画面）が開く
  - 写真クリックで開く調理ビューの内容がそのレシピと一致する
  - 写真以外のカード領域クリックは従来どおり「そのレシピを選択（右の詳細パネル表示）」のまま変わらない
  - 既存の「料理する」アイコンボタン、編集・削除・お気に入り等のカード内ボタンは従来どおり動作する（写真クリックと二重発火しない）
  - 写真サムネがキーボード/スクリーンリーダーからも操作可能で、用途が分かるラベルを持つ
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0218-recipe-card-photo-open-cooking-viewer/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0119-recipe-collection-canvas-parity
related_artifacts:
  - artifacts/TKT-0218-recipe-card-photo-open-cooking-viewer/verify.json
  - artifacts/TKT-0218-recipe-card-photo-open-cooking-viewer/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0218`。コマンドの正本は `harness/registry.json`
  - 非危険変更（クリック導線とUIのみ）。DB schema / Auth・RLS / Storage / AI route / CSV移行は触らない
  - Canvas版 `app.html` は凍結・参照専用のため編集しない
---

# Summary

「献立・レシピ」モードの「レシピ」一覧（`RecipeList`）では、各カードに写真サムネ（`RecipeThumb`）が出るが、カード全体クリック＝選択（`onSelect`）で、写真も同じ挙動。ユーザーは写真クリックで「そのレシピの詳細（＝調理ビュー）」に入りたい。カードには既に `onCook`（= `openCookingViewer`）が渡っているので、写真クリックでそれを呼べばよい。

## 参照すべき既存実装

- `web/src/components/recipe-meal-workspace.tsx`
  - `RecipeList`（定義 4439 行付近）。カード本体 4510 行: `<article className="recipe-card" ... onClick={() => onSelect(recipe.id)}>`、その直下 4511 行に `<RecipeThumb imageUrl={...} recipe={recipe} />`。
  - 既存の「料理する」ボタン 4518 行: `onClick={(event) => { event.stopPropagation(); onCook(recipe); }}` が `openCookingViewer` を呼ぶ実装パターン。これに倣う。
  - `RecipeList` への props 配線 3352 行 `onCook={openCookingViewer}`、3356 行 `onSelect={setSelectedRecipeId}`。
- `web/src/components/ui/recipe-thumb.tsx` … サムネ表示コンポーネント（写真 or プレースホルダ）。

## 実装メモ

- `RecipeThumb` をクリック可能にする。`RecipeThumb` を `<button type="button">` でラップする（または onClick を持つラッパー要素にし、`role="button"` + `tabIndex` + Enter/Space 対応）。アクセシビリティ確保のためボタン化を推奨。
- クリックハンドラは必ず `event.stopPropagation()` してから `onCook(recipe)` を呼ぶ（カード `onSelect` との二重発火を防ぐ）。
- `aria-label` は「{recipe.name} の調理ビューを開く」等、用途が分かる文言にする。
- 写真ラッパーに hover/フォーカスで押せると分かる軽いスタイルを `globals.css` に足す（`.recipe-card` 周辺の既存スタイルに合わせる。過度な装飾は不要）。
- 写真URLは既存の `imageUrls.get(recipe.id)`（署名付きURL）をそのまま使う。Storageや取得ロジックは変更しない。

## 非ゴール

- カード本体クリックの挙動（選択＝詳細パネル表示）の変更。
- 献立スケジュールのスロットカードの挙動変更（このチケットはレシピ一覧カードのみ）。
- 調理ビュー内部のUI変更。
