---
id: TKT-0219-cooking-viewer-photo-toggle
title: 調理ビューの左上にレシピ写真を表示し開閉トグルを付ける
status: completed
goal: 調理ビュー（レシピ詳細画面）でレシピ写真が見えず、どの料理かを画像で確認できない不便を防ぐ。
acceptance:
  - 調理ビュー（CookingViewer 全画面）の左上にレシピ登録写真が表示される
  - 写真は初期表示が「開いている」状態である
  - トグル操作で写真を隠す/再表示でき、隠したときは写真領域が畳まれてレイアウトが崩れない
  - 写真が未登録のレシピでは、既存の `RecipeThumb` プレースホルダ相当の表示になり、トグルがあっても破綻しない
  - 写真クリックや撮影など既存の「調理完成写真（cooking_history）」まわりの動作・データは変えない
  - PC幅・スマホ幅のどちらでも写真とヘッダー操作（戻る/スケジュール追加/編集）が重ならない
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0219-cooking-viewer-photo-toggle/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0124-cooking-viewer-web
  - SPEC-0171-web-recipe-photos
related_artifacts:
  - artifacts/TKT-0219-cooking-viewer-photo-toggle/verify.json
  - artifacts/TKT-0219-cooking-viewer-photo-toggle/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0219`。コマンドの正本は `harness/registry.json`
  - 非危険変更（表示のみ）。写真は既存の署名付きURL（recipeImageUrls）の再利用で、Storageへのアップロード/権限/バケット設定は一切変更しない
  - `/check-gates` が diff の「写真/画像/image」語で photo_upload_storage（danger）を match させる可能性があるが、本チケットは表示のみ。Storage挙動を変えていないことを report で明記すれば manual-smokes は表示確認で足りる
  - Canvas版 `app.html` は凍結・参照専用のため編集しない
---

# Summary

調理ビューの全画面オーバーレイ（`cooking-overlay`）のヘッダーはレシピ名と参考元リンクだけで、レシピ写真が出ていない。左上にレシピ登録写真を表示し、初期は開・トグルで隠せるようにする。写真は既存の署名付きURL（`recipeImageUrls`）を再利用する。

## 参照すべき既存実装

- `web/src/components/recipe-meal-workspace.tsx`
  - `cooking-overlay` ヘッダー 2670-2691 行（`cooking-overlay-header` / `cooking-overlay-title` / `cooking-overlay-header-actions`）。`activeCookingRecipe` が対象レシピ。
  - `openCookingViewer(recipe, origin)`（1033 行付近）と、その state `activeCookingRecipeId`。
  - 写真URL: `recipeImageUrls`（`Map<recipeId, signedUrl>`）。詳細パネルでは `RecipeThumb className="recipe-detail-photo" imageUrl={recipeImageUrls.get(...)} recipe={...} size="hero"`（4689 行）として既に使用。
- `web/src/components/ui/recipe-thumb.tsx` … 写真 or プレースホルダ描画。size バリアントあり（`hero` 等）。

## 実装メモ

- 調理ビューのヘッダー左側（戻るボタンの近く）に写真ブロックを追加し、`RecipeThumb` で `activeCookingRecipe` の写真を表示する。URLは `recipeImageUrls.get(activeCookingRecipe.id) ?? null`。
- 開閉トグル用の state を1つ追加（例: `isCookingPhotoOpen`、初期 `true`）。イミュータブルに更新する。
- トグルボタンは用途が分かる `aria-label`/`aria-expanded` を持たせ、`title`/tooltip 文言も付けられるようにする（TKT-0221 のツールチップ方針と整合）。
- 閉じたときは写真領域を畳む（`globals.css` に開閉スタイルを追加）。レイアウト崩れ・横スクロール発生がないことを PC/スマホ両方で確認。
- 既存の「調理完成写真（cooking_history.photos）」の撮影/表示ロジックとは別物。混同せず、そちらには手を入れない。

## 非ゴール

- 調理完成写真（cooking_history）の機能変更。
- Supabase Storage のアップロード・権限・バケット・署名URL取得ロジックの変更。
- レシピ詳細パネル（一覧横）側の写真表示変更。
