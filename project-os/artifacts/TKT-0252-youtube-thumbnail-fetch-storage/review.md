---
ticket_id: TKT-0252-youtube-thumbnail-fetch-storage
---

# Review

## 変更範囲

- `web/src/lib/youtube.ts`
- `web/src/lib/photos/recipe-image-upload.ts`
- `web/src/__tests__/youtube.test.ts`
- `web/src/__tests__/recipe-image-upload.test.ts`

## 安全確認

- ユーザー入力URLは画像取得に使わず、抽出済み `videoId` から `buildYoutubeThumbnailCandidateUrls` が作る固定URLだけをfetch対象にしている。
- サムネイル候補は `https://img.youtube.com/vi/<videoId>/<固定名>.jpg` のみ。任意ホスト、任意パス、公開サムネイルURLのDB保存はない。
- fetchは `redirect: "error"` を指定し、リダイレクト先の任意URLを追わない。
- 保存対象の画像形式は `image/jpeg` / `image/png` / `image/webp` のみ。
- アプリ側上限は2MB。`content-length` と取得後 `Blob.size` の両方で確認する。
- DBには `recipes.image_storage_path` としてStorage pathだけを保存する。公開URL、署名付きURL、YouTubeサムネイルURLは保存しない。
- Storage pathは既存 `buildRecipeImageStoragePath(userId, recipeId, extension)` を使い、`<user_id>/recipe-images/<recipe_id>/...` 配下に限定している。
- Supabase service role key、APIキー、秘密鍵の追加はない。
- Canvas版 `app.html`、GAS、Google Spreadsheet、Google Drive は変更していない。

## 残リスク

- YouTube側の固定サムネイルURL仕様が変わると取得に失敗する可能性がある。後続UI接続では、失敗してもレシピ本文保存を止めず画像未登録として扱う。
- 実Storageへの疎通は未実施。今回の範囲ではモックによる upload/update/remove の順序確認まで。
