---
id: TKT-0217-home-favorite-open-cooking-viewer
title: ホームのお気に入り/最近レシピをクリックで調理ビュー直行にする
status: completed
goal: ホームでレシピをクリックしたのにレシピ一覧へ飛ぶだけで、目的のレシピ詳細（調理ビュー）にすぐ入れない問題を防ぐ。
acceptance:
  - ホーム画面の「お気に入り/最近作ったレシピ」カードをクリックすると、レシピ一覧ではなくそのレシピの調理ビュー（CookingViewer 全画面）が開く
  - 開いた調理ビューの内容（材料・手順）がクリックしたレシピと一致する
  - 調理ビューを閉じたあとの戻り先が「献立・レシピ > レシピ」になっている（既存の origin ルーティングに沿う）
  - ホームの他カード（在庫・買い物・献立予定など）の既存遷移は変えない
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/home-dashboard.tsx
  - project-os/artifacts/TKT-0217-home-favorite-open-cooking-viewer/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0123-today-dashboard-web
related_artifacts:
  - artifacts/TKT-0217-home-favorite-open-cooking-viewer/verify.json
  - artifacts/TKT-0217-home-favorite-open-cooking-viewer/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0217`。コマンドの正本は `harness/registry.json`
  - 非危険変更（クライアント遷移のみ）。DB schema / Auth・RLS / Storage / AI route / CSV移行は触らない
  - Canvas版 `app.html` は凍結・参照専用のため編集しない
---

# Summary

ホーム（`HomeDashboard`）のレシピカードは現在クリックすると `selectShellLeaf("recipes", "recipes")` を呼び、レシピ一覧タブへ移動するだけになっている。ユーザーは「表示中のそのレシピの詳細（＝調理ビュー）」に直接入りたい。既存の遷移インフラ `requestViewRecipe(recipeId)` を使えば、レシピIDを渡すだけで調理ビューが開く。

## 参照すべき既存実装

- `web/src/components/home-dashboard.tsx`
  - レシピカード描画とクリックハンドラ（現状 `selectShellLeaf("recipes", "recipes")`、おおよそ 113-126 行付近）。`pickFeaturedRecipes()`（53-68 行付近）が表示対象レシピを選ぶ。
- `web/src/components/web-mode-shell.tsx`
  - `useShellNavigation()` が `requestViewRecipe(recipeId, origin?)` を公開（219-223 行）。`origin` 既定は `"recipes"`。
- `web/src/components/recipe-meal-workspace.tsx:1188-1196`
  - `pendingRecipeId` を購読し `openCookingViewer(recipe, pendingRecipeOrigin)` を呼ぶ既存の受け口。ここが調理ビューを開く。`cooking-history-board.tsx` も同じ仕組みで既に調理ビューへ遷移している（参考: `cooking-history-board.tsx:124, 342`）。

## 実装メモ

- `home-dashboard.tsx` で `useShellNavigation`（`@/components/web-mode-shell`）を import し、`requestViewRecipe` を取得する。
- レシピカードの `onClick` を `selectShellLeaf("recipes", "recipes")` から `requestViewRecipe(recipe.id)`（origin は既定の `"recipes"`）へ置換する。
- `selectShellLeaf` がレシピカード以外で使われていれば、その用途は据え置く（置換はレシピカードのクリックのみ）。
- イミュータブル方針・既存命名に合わせる。新規 state は不要（既存 `pendingRecipeId` 経路に委譲）。

## 非ゴール

- 調理ビュー側のUI変更（写真トグルや戻り先ロジックの新設）。それらは TKT-0219 等の別チケット。
- ホームの他カード（在庫・買い物・献立予定）の遷移変更。
- レシピ詳細パネル（一覧横）への遷移にすること（要件は調理ビュー直行）。
