---
id: TKT-0145-recipe-ai-add-direct-editor
title: テキスト/AI考案からのレシピ追加で構造化後すぐ編集モーダルを開き、テキスト残留を解消する
status: ready
goal: テキストから追加／AI考案のどちらでも、AI構造化・生成が終わったら中間プレビュー段（ai-preview）を挟まず直接レシピ編集モーダル（=保存前の確認画面）を開く。2件目を開いたとき前回のレシピテキスト/結果が残らないようにする（SPEC-0129/0130のCanvas同等フローへ是正）
acceptance:
  - テキストから追加: 本文貼付→AIで構造化→中間プレビューなしでレシピ編集モーダルが開き、レシピ名/材料/工程が埋まる
  - AI考案(優先消費レシピ/指定食材から): 生成後も同様に直接レシピ編集モーダルが開く
  - レシピ編集モーダルが保存前の確認を兼ね、キャンセル時は保存されない
  - 「テキストから追加」を開くたびにレシピテキスト欄が空（前回テキストが残らない）。2件連続で追加できる
  - 中間プレビュー(ai-preview)ブロックと「編集モーダルで確認」ボタンが廃止されている
  - Gemini APIキーはブラウザに出さない（/api/ai/recipes 経由のまま、route不変）
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0145/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0129-recipe-text-import-modal-parity
  - SPEC-0130-ai-recipe-two-path-parity
related_artifacts:
  - artifacts/TKT-0145/verify.json
  - artifacts/TKT-0145/report.md
owner_role: implementer
owner_notes:
  - 実装は Codex で行う想定。本チケットは仕様確定済み（spec_ready/implementation_ready 相当の情報を本文に記載）
  - 非危険変更。schema/auth・RLS/写真Storage/AIサーバーroute/CSV移行/データ削除のいずれにも該当しない。/api/ai/recipes route とクライアントの fetch ボディ構造({mode,required,optional,sourceText})は不変
  - eval_selection_mode を manual にしている理由: /check-gates は diff 内の `recipes` 等の文字列で supabase_schema_change を、`fetch("/api/ai/recipes")` 近傍で ai_server_route を保守的にマッチしうるが、いずれも実体変更なし → manual_smokes_done / review_ready は不要
  - verify は `/verify TKT-0145`（= harness/bin/verify_web.sh）。必須成果物は verify.json + report.md
  - Web版ではGAS/Spreadsheet/Driveを使わない。APIキー直書きしない
---

# Summary

SPEC-0129/0130 の Canvas同等フロー（ボタン→テキスト/AI考案モーダル→AI処理→**レシピ編集モーダルで確認**→保存）へ是正する。現状の Web版は AI処理後にモーダル内へ中間プレビュー（`ai-preview`：レシピ名＋材料1行連結＋「編集モーダルで確認」ボタン）を挟む2段構えで、Canvasに無い分断がある。これを廃止し、構造化/生成完了で直接フル編集モーダルを開く。編集モーダルが保存前の確認（プレビュー）を兼ねる。あわせて `aiSourceText`/`aiPreview` がリセットされず2件目に前回テキストが残るバグを、モーダルを開くたびにクリアして解消する。

## 実装メモ（web/src/components/recipe-meal-workspace.tsx）

- `aiPreview` state（261行付近）を削除。`aiSourceText`/`aiRequired`/`aiOptional`/`aiMode` は維持。
- `runAiRecipe`（383-432行）を戻り値 `Promise<RecipeFormValues | null>` に変更。成功時は `setAiPreview(...)`/成功feedbackをやめ `return result.recipe`、失敗・空入力時は error feedback＋`return null`。`setIsAiRunning` の try/finally は維持。
- `applyAiPreview`（434-442行）を `applyRecipeToEditor(recipe: RecipeFormValues)` に置換: `setRecipeValues(recipe)` / `setEditingRecipeId(null)` / テキスト・AI考案モーダルを閉じる / `setAiSourceText("")` / `setIsRecipeEditorOpen(true)` / info feedback。
- 呼び出し側を「await → 成功なら applyRecipeToEditor(recipe)」に: `structureRecipeText`（464行）、`generatePriorityRecipe`（469行）、「指定食材で考案」ボタン（1289行 onClick）。後者は新ハンドラ `generateFromIngredients()` を追加。
- 中間プレビューブロック削除: テキストモーダル内（1253-1260行）、AI考案モーダル内（1292-1299行）。
- 残留バグ修正: 「テキストから追加」ボタン（1215行）の onClick を `() => { setAiSourceText(""); setIsTextImportOpen(true); }`、テキストモーダルの×（1243行）も閉じる際に `setAiSourceText("")`。
- AI考案の `aiRequired`/`aiOptional` は「条件を微調整して再考案」ニーズがあるため自動クリアしない。

## 実装メモ（web/src/app/globals.css）

- 未使用化する `.ai-preview` / `.ai-preview span` / `.ai-preview strong` / `.ai-preview p`（3883行付近）を削除（削除前に他参照が無いことを grep 確認）。

## 実装メモ（web/src/__tests__/recipe-meal-workspace.test.tsx）

- 既存 `global.fetch = vi.fn()`（beforeEach）と `renderWorkspace`/`openRecipeEditor` を再利用。
- 追加1: fetch を `{ recipe: { name, genre, source, ingredients, prep_steps, steps } }`（RecipeFormValues形）でモック → 「テキストから追加」→本文入力→「AIで構造化」→ 編集モーダル見出し「新規レシピ」とレシピ名 input の value 一致を assert、`queryByRole("button", { name: "編集モーダルで確認" })` が null であること。
- 追加2: 「テキストから追加」→ textarea に入力 → ×で閉じる → 再度「テキストから追加」→ textarea の value が "" であること。

## 残リスク

- AI考案の必須/任意食材は意図的にクリアしない（再考案のため）。利用後に挙動の要否を再評価。
- 共有実装（runAiRecipe/編集モーダル/GenreTagPicker）に手を入れるため、verify で既存 recipe-meal-workspace テストの非回帰を必ず確認する。

# Stock Master 共通の実装メモ

- 現役正本（編集対象）: web/, supabase/, scripts/。Canvas版 app.html は凍結・参照専用。
- Web版生成物: Vercelデプロイ、Supabase本番DB/Storage（本変更では不変）。
