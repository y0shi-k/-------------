# TKT-0017: レシピ集閲覧画面の導入（編集前プレビュー）

## 目的
献立・レシピ画面（レシピ集タブ）でレシピカードをタップした際に、これまで直接編集画面が開いていたのを、AI生成レシピプレビューと同じ閲覧画面を先に表示し、「編集する」ボタンから編集画面へ遷移するように変更する。

## Acceptance Criteria
- [ ] レシピ集のレシピカード全体をクリックすると、閲覧画面（`aiRecipePreviewModal`）が開く
- [ ] 閲覧画面のタイトルが「レシピ詳細」になっている
- [ ] 閲覧画面にレシピ名・材料・手順が読み取り専用で表示される
- [ ] 閲覧画面のボタンが「閉じる」「編集する」になっている
- [ ] 「編集する」ボタンで編集画面（`recipeModal`）が開く
- [ ] 編集アイコン（✎）をクリックした場合は従来通り直接編集画面が開く
- [ ] AI生成レシピプレビュー時のボタン（キャンセル・再生成・レシピ集に保存）はそのまま維持される
- [ ] verify が通る

## Required Evals
- `verify` コマンド成功
- `project-os/artifacts/TKT-0017/report.md` に完了報告を残す

## 実装ファイル
- `app.html`

## 関連SPEC
- （本チケットはUIフロー改善のため、単独SPECなし）

## 実装メモ
- 既存の `aiRecipePreviewModal` を流用し、モード（`generated` / `viewing`）でボタンとタイトルを切り替える
- `state._aiPreviewMode` と `state._viewingRecipeId` で閲覧中のレシピIDを保持
- 閲覧画面から編集への遷移は `closeAiPreviewModal()` → `openRecipeEditor(state._viewingRecipeId)` の順で実行
- 編集アイコンの `onclick` は `event.stopPropagation()` でカードのクリックイベントを防ぎ、`openRecipeEditor` を直接呼ぶ（従来通り）
