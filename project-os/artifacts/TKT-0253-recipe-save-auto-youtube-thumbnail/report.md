---
ticket_id: TKT-0253-recipe-save-auto-youtube-thumbnail
---

# Report

レシピ保存時に、画像未登録かつ出典にYouTube URLがある場合だけ、YouTubeサムネイルをレシピ画像として自動登録する接続を追加した。

## 実装

- `persistRecipeImageChange(recipeId, currentImagePath, source)` へ出典テキストを渡すように変更。
- 画像変更なしの直前に、`findFirstYoutubeVideoId(source)` と既存画像有無を見て自動登録を判定。
- 自動登録はTKT-0252の `setRecipeImageFromYoutubeThumbnail` を呼び出すだけにし、取得・Storage保存の安全チェックは共通処理に集約。
- ブラウザからの直接YouTube fetchを避けるため、`/api/youtube/thumbnail` を追加。同一オリジンAPI routeから固定YouTubeサムネイル候補を取得する。
- 手動画像、完成写真候補、画像削除予約、既存画像あり編集を自動登録より優先。
- 自動サムネイル失敗時はレシピ保存を止めず、「レシピ本文と材料は保存済み」と分かる警告として表示。

## 原因調査

- 指定動画 `8Pat_Puc-ck` は `maxresdefault.jpg` が404、`sddefault.jpg` が200だった。
- 高解像度サムネイルが無い動画なので、候補フォールバックが必須。
- 旧UI接続では自動サムネイル失敗を保存全体の失敗として扱っていたため、画像なし状態で保存完了に進めなかった。

## 確認

- `npm test -- --run src/__tests__/recipe-meal-workspace.test.tsx src/__tests__/recipe-image-upload.test.ts src/__tests__/youtube.test.ts`: pass
- `npm run typecheck`: pass
- `harness/bin/verify_web.sh TKT-0253-recipe-save-auto-youtube-thumbnail`: pass
- verify結果: `project-os/artifacts/TKT-0253-recipe-save-auto-youtube-thumbnail/verify.json`
- Browser実機確認: `http://127.0.0.1:3010`、サンプルユーザー、`https://www.youtube.com/watch?v=8Pat_Puc-ck` で保存成功。Supabase Storage署名付きURL表示を確認。

## 非対象

- UI文言やレイアウトの大幅変更。
- DB schema、Storage policy、環境変数の変更。
- YouTube Data API利用。
