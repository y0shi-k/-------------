---
id: TKT-0147-cooking-history-recipe-viewer-link
title: 料理・記録タイムラインのカードボタンを整理し「レシピを見る」から献立・レシピの全画面調理ビューアを開く
status: ready
goal: 反応しない/不要なカードボタンと手動追加フォームを整理し、料理履歴カードの操作を「レシピを見る」1つに統一して、押下時に献立・レシピ画面と同じ全画面調理ビューア（材料/手順タブ付き）を開けるようにする
acceptance:
  - 料理・記録 → タイムラインの最下部「料理履歴を追加」折りたたみフォームが削除されている
  - 履歴カードの操作ボタンが「レシピを見る」1つのみ（「写真を開く」「もう一度作る」は削除）
  - 「レシピを見る」は item.recipe_id がある履歴でのみ表示され、押下で献立・レシピモードへ自動切替し、全画面の調理ビューア（cooking-overlay / CookingViewer）が開く
  - recipe_id が null の履歴ではボタン（操作行）を表示しない。指すレシピが削除済みの場合は「レシピが見つかりません」をステータス通知する
  - 追加フォーム削除に伴う未使用 state/関数/import を整理し、Web版verify（lint/typecheck/build）が通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/src/components/web-mode-shell.tsx
  - web/src/components/cooking-history-board.tsx
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/page.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0147/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0027-cooking-record-history-view
  - SPEC-0019-cooking-viewer-ui
related_artifacts:
  - artifacts/TKT-0147/verify.json
  - artifacts/TKT-0147/report.md
owner_role: implementer
owner_notes:
  - 非危険変更（UI整理＋シェル経由のクライアント内ナビゲーション）。schema/auth/RLS/Storage/AI route/CSV移行は不変。必須成果物は verify.json + report.md の2点
  - /check-gates は diff 内の「写真」「photo」「Storage」「upload(」「accept="image/*"」等で photo_upload_storage（danger）を保守的にマッチし得るが、これらは「写真を開く」ボタン削除と追加フォーム削除による既存コードの除去であり、写真Storage/圧縮/アップロード処理の新規変更は無い（TKT-0142/0144 と同様の保守的マッチ）
  - クロスコンポーネント連携は既存 ShellStatusContext / useShellStatusMessage（web-mode-shell.tsx）の確立パターンを拡張する。新しいグローバル状態ライブラリは入れない
  - レシピ表示は既存 openCookingViewer(recipe) と cooking-overlay + CookingViewer をそのまま流用。新規のレシピ表示UIは作らない
  - Web版ではGAS/Spreadsheet/Driveを使わない。APIキー直書きしない。RLS/Storage権限は本変更で不変
  - 承認済み計画: ~/.claude/plans/binary-greeting-pnueli.md（参考）
---

# Summary

料理・記録（COOKING RECORD）タイムラインの履歴カードにある「レシピを見る」「もう一度作る」「写真を開く」は `onClick` 未実装で反応しない。これを「レシピを見る」1つに統一し、押下で献立・レシピ画面と同じ**全画面の調理ビューア**を開くようにする。あわせて最下部の手動「料理履歴を追加」フォームを削除する。

料理・記録（`CookingHistoryBoard`）と献立・レシピ（`RecipeMealWorkspace`）は別コンポーネントで、`WebModeShell` が `activeMode` で出し分ける（非アクティブ側はアンマウント）。料理・記録側はレシピ一覧を持たないため、既存の `ShellStatusContext` パターンを拡張して「レシピを開く要求」をシェル経由で渡す。

## 実装メモ（手順）

### 1. シェルにナビゲーション意図を追加 — `web/src/components/web-mode-shell.tsx`
- `WebModeShell` に state `pendingRecipeId: string | null`（初期 `null`）を追加。
- 既存 context の value を拡張：`requestViewRecipe(recipeId)`（`setActiveMode("recipes")` ＋ `setPendingRecipeId(recipeId)`）、`pendingRecipeId`、`clearPendingRecipe()`（`setPendingRecipeId(null)`）。
- 既存 `useShellStatusMessage()`（`showStatusMessage` 返却）は維持。新たに `useShellNavigation()` を追加し `{ requestViewRecipe, pendingRecipeId, clearPendingRecipe }` を返す。既存呼び出し（`recipe-meal-workspace.tsx`）を壊さないこと。

### 2. カードボタン整理 — `web/src/components/cooking-history-board.tsx`
- `useShellNavigation()` から `requestViewRecipe` を取得。
- `HistoryDateGroup` に `onViewRecipe: (recipeId: string) => void` prop を追加し、タイムライン描画箇所（`cooking-timeline-view` 内）で `onViewRecipe={requestViewRecipe}` を渡す。
- カードアクション（`history-card-actions`）：
  - 「写真を開く」「もう一度作る」を削除。
  - 「レシピを見る」を1つだけ残す。`item.recipe_id` が truthy のときのみ `.history-card-actions` を描画し、ボタンに `data-primary="true"` ＋ `onClick={() => onViewRecipe(item.recipe_id!)}`。
  - `recipe_id` が null のときは操作行ごと非表示（空ボックスを出さない）。

### 3. 手動追加フォーム削除＋不要コード整理 — `web/src/components/cooking-history-board.tsx`
- `<details className="cooking-entry-details">…</details>` ブロックを削除。
- 未使用化する以下も削除：`saveHistory` / `selectPhoto` / `resetPhoto`、photoPreviewUrl 解放用 `useEffect`、state（`values` / `selectedPhoto` / `photoPreviewUrl` / `isSaving` / `feedback` / `photoInputRef`）、feedback バナー、未使用 import（`emptyCookingHistoryFormValues` / `compressImageFile` / `buildCookingHistoryPhotoStoragePath` / 型 `ChangeEvent` `FormEvent` `Feedback` / 必要なら `useRef`）。
- `userId` prop が未使用になるため `CookingHistoryBoardProps` から削除し、呼び出し元 `web/src/app/page.tsx` の `userId={user.id}` も削除。
- カレンダー系 state（`selectedDate` 等）は別用途で使用中のため残す。削除対象は追加フォーム由来に限定。

### 4. 献立・レシピ側で受信 — `web/src/components/recipe-meal-workspace.tsx`
- `useShellNavigation()` から `{ pendingRecipeId, clearPendingRecipe }` を取得。
- `useEffect`（deps `[pendingRecipeId, recipes]`）で `pendingRecipeId` が非nullになったら：`recipes.find(r => r.id === pendingRecipeId)` を検索 → 見つかれば既存 `openCookingViewer(recipe)` を呼ぶ（`activeCookingRecipeId` がセットされ全画面 `cooking-overlay` の `CookingViewer` が表示）／見つからなければ `showStatusMessage({ message: "レシピが見つかりません", tone: "error" })` → 最後に `clearPendingRecipe()`。ガードで早期 return するためループしない。`react-hooks/exhaustive-deps` 警告が出る場合は対象関数を `useCallback` 化するか deps を調整して lint を通す。

### 5. CSS 軽微調整（任意） — `web/src/app/globals.css`
- 「写真を開く」専用だった `.history-card-actions button:first-child`（オレンジ）は、残る単一ボタンが `data-primary="true"`（緑、同特異度で後勝ち）になるため実質未使用。混乱回避のため削除推奨（必須ではない）。

## 検証

- `/verify TKT-0147`（`web/` で lint / typecheck / build）でエラー0。特に `cooking-history-board.tsx` の no-unused-vars と `page.tsx` の `userId` 削除整合を確認。
- 手動スモーク（任意・dev）：最下部の追加フォームが消えている／各カードに「レシピを見る」のみ／押下で献立・レシピへ切替し全画面調理ビューアが開く／「←戻る」で閉じる／recipe_id null の履歴はボタン非表示。

## 残リスク

- 手動で料理履歴を追加する唯一のUI（追加フォーム）が無くなる。履歴は引き続き献立の「料理を完了する」フローから作成される（意図通り・ユーザー確認済み）。
- 「レシピを見る」は全画面調理ビューアを開く方式に確定（インライン詳細パネルは採用しない）。
