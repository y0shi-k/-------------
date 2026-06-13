---
ticket_id: TKT-0252-youtube-thumbnail-fetch-storage
---

# Report

YouTubeサムネイルを安全に取得し、既存レシピ画像Storage保存経路へ流す共通処理を追加した。

## 実装

- `buildYoutubeThumbnailCandidateUrls(videoId)` を追加し、有効なYouTube videoIdから固定サムネイルURL候補を生成。
- `fetchYoutubeThumbnailImage(videoId)` を追加し、固定候補URLだけをfetch。
- 許可画像形式を `image/jpeg` / `image/png` / `image/webp` に限定。
- 画像サイズ上限を2MBにし、`content-length` と `Blob.size` を確認。
- `setRecipeImageFromYoutubeThumbnail` を追加し、既存 `photos` バケットの `<user_id>/recipe-images/<recipe_id>/...` へ保存して `recipes.image_storage_path` へStorage pathだけを反映。
- DB更新失敗時はアップロード済みStorage objectを削除。

## 確認

- `npm test -- --run src/__tests__/youtube.test.ts src/__tests__/recipe-image-upload.test.ts`: pass
- `npm run typecheck`: pass
- `harness/bin/verify_web.sh TKT-0252-youtube-thumbnail-fetch-storage`: pass
- verify結果: `project-os/artifacts/TKT-0252-youtube-thumbnail-fetch-storage/verify.json`

## 非対象

- レシピ保存UIへの自動接続は未実装。後続TKT-0253で扱う。
- UI表示・スマホ表示の回帰確認は未実装。後続TKT-0254で扱う。
- DB schema、Storage policy、API route、環境変数は変更していない。
