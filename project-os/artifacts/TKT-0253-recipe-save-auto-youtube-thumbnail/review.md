---
ticket_id: TKT-0253-recipe-save-auto-youtube-thumbnail
---

# Review

## 変更範囲

- `web/src/components/recipe-meal-workspace.tsx`
- `web/src/__tests__/recipe-meal-workspace.test.tsx`

## 安全確認

- レシピ保存の本文・材料保存後に、既存の画像任意保存フロー `persistRecipeImageChange` へ接続した。
- 自動登録条件は `!recipeImageCandidate`、`!recipeImageFile`、`!recipeImageRemoved`、`!currentImagePath`、`findFirstYoutubeVideoId(source)` を満たす場合だけ。
- 手動画像ファイルがある場合は、既存の `uploadRecipeImage` 分岐が先に実行される。
- 完成写真候補がある場合は、既存の `setRecipeImageFromCandidate` 分岐が先に実行される。
- 既存画像がある編集保存では `currentImagePath` があるため自動登録しない。
- 画像削除予約がある保存では `recipeImageRemoved` により自動登録しない。
- YouTube URL判定は既存 `findFirstYoutubeVideoId` を使用し、複数URL時も最初の有効videoIdに揃う。
- 実際の取得・形式チェック・サイズチェック・Storage保存はTKT-0252の `setRecipeImageFromYoutubeThumbnail` に委譲している。
- ブラウザから直接YouTubeサムネイルを取得せず、同一オリジンの `/api/youtube/thumbnail` 経由にした。外部取得はサーバー側で固定YouTube候補URLだけを対象にする。
- `maxresdefault.jpg` が404になる動画でも、TKT-0252の候補順で `sddefault.jpg` などへフォールバックする。
- DBにはStorage pathだけを保存し、公開URL、署名付きURL、YouTubeサムネイルURLは保存しない。
- service role key、APIキー、秘密鍵の追加はない。
- DB schema、Storage policy、API route、Canvas版 `app.html`、GAS、Google Spreadsheet、Google Drive は変更していない。

## 残リスク

- 自動サムネイル失敗時は警告扱いにして、画面のローカル一覧にもレシピを追加する。画像だけ未登録として扱う。
- 実Storage連携はサンプルユーザーで確認済み。スマホ幅の詳細UI確認は後続TKT-0254で扱う。
