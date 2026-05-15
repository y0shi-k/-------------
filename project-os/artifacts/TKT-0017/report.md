# TKT-0017 完了報告

## タイトル
レシピ集閲覧画面の導入（編集前プレビュー）

## 目的
献立・レシピ画面（レシピ集タブ）でレシピカードをタップした際に、これまで直接編集画面が開いていたのを、AI生成レシピプレビューと同じ閲覧画面を先に表示し、「編集する」ボタンから編集画面へ遷移するように変更する。

## 実装日
2026-05-15

## 変更ファイル
- `app.html`

## 変更内容

### 1. レシピカードのクリック動作変更
- `renderRecipeList()` 内のレシピカード `onclick` を `openRecipeEditor('${recipe.id}')` から `openRecipeViewer('${recipe.id}')` に変更
- 編集アイコン（✎）の `onclick` は `event.stopPropagation(); openRecipeEditor('${recipe.id}')` のまま維持（直接編集画面を開く）

### 2. `aiRecipePreviewModal` のモード対応
- モーダルタイトル `<h3 id="aiPreviewTitle">` を追加し、AI生成時は「生成されたレシピ」、レシピ閲覧時は「レシピ詳細」に切り替わるようにした
- ボタンエリアを2系統に分離：
  - `#aiPreviewActions`（AI生成時）：「キャンセル」「再生成」「レシピ集に保存」
  - `#recipeViewActions`（レシピ閲覧時）：「閉じる」「編集する」
- `hidden` クラスの付け替えで表示を切り替える

### 3. 新規関数の追加
- `openRecipeViewer(recipeId)`：指定レシピの内容を `aiRecipePreviewModal` に読み込み、閲覧モードで表示
- `openEditorFromViewer()`：閲覧画面を閉じ、保持中の `state._viewingRecipeId` で編集画面を開く

### 4. `openAiRecipePreview()` の拡張
- 表示切り替え時に `state._aiPreviewMode = 'generated'` を設定
- AI生成関連のボタンを表示し、閲覧用ボタンを非表示にする

### 5. `closeAiPreviewModal()` の拡張
- 閉じる際に `state._aiPreviewMode` と `state._viewingRecipeId` をクリーンアップ

## Verify 結果

```bash
$ python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
VERIFY_PASSED
```

- `alert`/`confirm`/`prompt`：0個
- `showToast`：存在
- `syncPendingChanges`：使用継続中
- 新規スプシ書き込みコードは `syncPendingChanges()` 以外で個別 `executeGAS(payload...)` していない
- `openRecipeViewer` 関数が追加されている
- `recipeViewActions` / `aiPreviewActions` の切り替えが存在
- レシピカードの `onclick` が `openRecipeViewer` に変更されている

## 手動スモークテスト項目
（Gemini Canvas プレビュー時に確認）
- [ ] レシピ集タブで既存レシピのカードをタップすると、閲覧画面（レシピ詳細）が開く
- [ ] 閲覧画面にレシピ名・材料・手順が正しく表示される
- [ ] 閲覧画面のボタンが「閉じる」と「編集する」になっている
- [ ] 「編集する」を押すと編集画面が開き、内容が編集可能になる
- [ ] レシピカードの編集アイコン（✎）を押すと、閲覧画面を経由せず直接編集画面が開く
- [ ] AI考案タブでレシピを生成し、プレビュー画面のボタンが「キャンセル」「再生成」「レシピ集に保存」のままである
- [ ] AIプレビューから「レシピ集に保存」後、レシピ集タブでそのレシピをタップすると閲覧画面が開く

## 備考
- 本変更はUIフローのみの変更であり、スプレッドシートのスキーマやGAS通信方式には影響しない
- 既存の `aiRecipePreviewModal` を流用したため、新規モーダルHTMLの追加は行っていない（コード肥大化抑制）
