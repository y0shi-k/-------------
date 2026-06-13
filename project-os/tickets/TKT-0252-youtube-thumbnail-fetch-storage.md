---
id: TKT-0252-youtube-thumbnail-fetch-storage
title: YouTubeサムネイルを安全に取得してレシピ画像Storageへ保存する土台を作る
status: implementation_ready
goal: YouTube URL入りレシピの画像自動登録に必要な、videoIdからサムネイル画像を取得し非公開Storageへ保存する共通処理を用意する
acceptance:
  - `web/src/lib/youtube.ts` に、既存の videoId 抽出ルールを壊さず、YouTubeサムネイル候補URLを作る純関数が追加される
  - サムネイル取得対象は YouTube の固定サムネイルホスト・固定パスだけに限定され、ユーザー入力の任意URLを fetch しない
  - 取得した画像は `image/jpeg` / `image/png` / `image/webp` の許可範囲だけを保存対象にし、それ以外は失敗扱いにする
  - 画像サイズが異常に大きいレスポンスを保存しない上限チェックがある
  - 既存 `photos` バケットの `<user_id>/recipe-images/<recipe_id>/...` 配下へ保存し、DBには公開URLではなくStorage pathだけを反映できる
  - Supabase service role key、APIキー、署名付きURL、公開サムネイルURLをDBやコードへ直書きしない
  - 単体テストで YouTube URL判定、非YouTube拒否、候補URL生成、Storage保存成功/失敗を確認できる
  - Web版 verify が通る
required_evals:
  - web_project_bootstrap
  - photo_upload_storage
eval_selection_mode: manual
changed_paths:
  - web/src/lib/youtube.ts
  - web/src/lib/photos/recipe-image-upload.ts
  - web/src/lib/photos/
  - web/src/__tests__/youtube.test.ts
  - web/src/__tests__/recipe-image-upload.test.ts
  - project-os/artifacts/TKT-0252-youtube-thumbnail-fetch-storage/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0252-youtube-thumbnail-recipe-image
  - SPEC-0174-recipe-image-upload-ui
  - SPEC-0226-cooking-viewer-youtube
related_artifacts:
  - artifacts/TKT-0252-youtube-thumbnail-fetch-storage/verify.json
  - artifacts/TKT-0252-youtube-thumbnail-fetch-storage/manual-smokes.md
  - artifacts/TKT-0252-youtube-thumbnail-fetch-storage/review.md
  - artifacts/TKT-0252-youtube-thumbnail-fetch-storage/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0252-youtube-thumbnail-fetch-storage`（= `harness/bin/verify_web.sh`）
  - 危険変更扱い。画像取得・Storage保存に触れるため manual-smokes.md / review.md を必ず残す
  - Canvas版 `app.html` は凍結・参照専用。編集しない
  - GAS / Google Spreadsheet / Google Drive は使わない
  - APIキー、Supabase秘密鍵、service role key、署名付きURL、写真URLを直書きしない
---

# Summary

YouTube動画IDからサムネイル画像を取得し、既存のレシピ画像と同じ非公開Storage保存経路へ載せる土台を作る。

このチケットでは、レシピ保存UIへの自動呼び出しはまだ入れない。まず「安全に取得できる」「Storageへ保存できる」「危険なURL取得をしない」ことを固定する。

## 実装メモ

- 既存確認先:
  - `web/src/lib/youtube.ts`
  - `web/src/__tests__/youtube.test.ts`
  - `web/src/lib/photos/recipe-image-upload.ts`
  - `web/src/lib/photos/compress.ts`
  - `web/src/lib/photos/user-image.ts`
  - `supabase/migrations/20260605120000_user_image_columns.sql`
- サムネイルURLは videoId から組み立てる。ユーザーが入力したURLそのものを画像取得に使わない。
- 候補例は実装時に決めてよいが、`https://img.youtube.com/vi/<videoId>/...` のようにホストとパス形式を固定する。
- レスポンスの `content-type` を確認し、許可画像以外は保存しない。
- レスポンスサイズ上限を決め、過大な画像を保存しない。既存 `photos` bucket の上限は10MBだが、アプリ側ではより小さい上限を持つこと。
- 保存先pathは既存 `buildRecipeImageStoragePath(userId, recipeId, extension)` を使うか、それと同等の `<user_id>/recipe-images/<recipe_id>/...` 形式にする。
- 既存の `uploadRecipeImage` / `setRecipeImageFromCandidate` と同じく、DB更新失敗時はアップロード済みStorage objectを後始末する。
- Next.js API routeを作る場合も、service role key は使わず、ログインユーザーのSupabase権限で処理する。サーバーでDB更新する必要がある場合は、必ず本人確認と本人行限定を維持する。

## テスト

- `extractYoutubeVideoId` の既存テストは壊さない。
- サムネイル候補URL生成:
  - 有効な videoId から固定ホストの候補URLが返る。
  - 無効な videoId は候補を返さない。
- サムネイル取得:
  - 画像content-typeならBlobとして扱える。
  - HTMLやJSONなど画像以外は失敗。
  - サイズ上限超過は失敗。
- Storage保存:
  - upload成功 + recipes更新成功でStorage pathを返す。
  - upload失敗時はDB更新しない。
  - DB更新失敗時はアップロード済みobjectを削除する。

## 手動確認

- 開発環境でYouTube動画IDからサムネイル画像が取得できる。
- 保存されたStorage pathが `<user_id>/recipe-images/<recipe_id>/...` 形式である。
- `photos` bucketは公開化されていない。
- 他ユーザー領域を指すpathや任意URL取得ができないことを静的に確認し、review.md に記録する。

## 非対象

- レシピ保存時の自動呼び出し。
- レシピ編集画面のUI変更。
- DB schema変更。
- Storage policy変更。
- YouTube Data API利用。
- サーバーブラウザによるスクリーンショット取得。

## 依存チケット

- なし。

## 残リスク

- YouTube側のサムネイルURL仕様が将来変わる可能性がある。失敗時はレシピ保存を止めず、画像未登録として扱えるよう後続チケットで接続する。
