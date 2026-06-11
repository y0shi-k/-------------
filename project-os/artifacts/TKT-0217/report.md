---
ticket_id: TKT-0217-home-favorite-open-cooking-viewer
status: ready
---

# Report Draft

## 変更目的

ホーム（`HomeDashboard`）の「お気に入り/最近作ったレシピ」カードは、クリックしてもレシピ一覧タブへ移動するだけで、表示中のそのレシピの詳細（調理ビュー）に直接入れなかった。クリックしたレシピの調理ビュー（CookingViewer 全画面）へ直行できるようにする。

## 今回追加した安全装置

- 調理ビューへの遷移は既存インフラ `requestViewRecipe(recipeId)`（`useShellNavigation`、origin 既定 `"recipes"`）を再利用。新規 state・新規ルーティングは追加せず、既存の `pendingRecipeId` 経路（`recipe-meal-workspace.tsx` が購読し `openCookingViewer` を呼ぶ）に委譲する。`cooking-history-board.tsx` と同じ仕組み。
- 置換はレシピカードの `onClick`（`selectShellLeaf("recipes", "recipes")` → `requestViewRecipe(recipe.id)`）のみ。サマリーカード（在庫・レシピ・献立・記録）の `selectShellLeaf` 遷移は据え置き、ホームの他カードの既存遷移は変えない。
- origin が既定 `"recipes"` のため、調理ビューを閉じた後の戻り先は「献立・レシピ > レシピ」となり、既存の origin ルーティングに沿う。
- イミュータブル方針・既存命名を維持。`home-dashboard.test.tsx` のモックに `useShellNavigation` を追加し、最近作ったレシピカードのクリックで `requestViewRecipe("new")` が呼ばれることを検証。

## 実施した確認

- `/verify TKT-0217`（`harness/bin/verify_web.sh`）: lint / typecheck / test / build すべて pass。policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present / backlog_focus_lean）すべて pass。結果は `verify.json`。
- `supabase_schema_change` / `photo_upload_storage` は diff の語彙（`web/` パス＋`recipes` テーブル名トークン、既存 `RecipeThumb`/署名URL読込まわりの `image`/`Storage` 文字列）に機械マッチするが、本変更はクライアント遷移のみで DB schema / migration / Auth・RLS / 写真Storage の保存系は無変更。チケット front-matter の `required_gates`（spec_ready / implementation_ready / verify_passed / report_ready）と owner_notes のとおり manual-smokes / review は不要（TKT-0213/0215/0216 と同じ運用）。

## 残リスク

- なし（既存の調理ビュー遷移経路を再利用したのみ）。本機能上の新規リスクは生じない。

## 次の依頼や人判断

- 実機スモーク（`pwa_mobile_ui`）: ホームのお気に入り/最近作ったレシピカードをタップ → 該当レシピの調理ビューが開き材料・手順が一致 → 閉じると「献立・レシピ > レシピ」へ戻ることをスマホ実機で目視確認。
