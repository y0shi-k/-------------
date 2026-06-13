---
id: TKT-0253-recipe-save-auto-youtube-thumbnail
title: レシピ保存時に画像未登録ならYouTubeサムネイルを自動登録する
status: implementation_ready
goal: レシピ追加・編集で出典にYouTube URLがある場合、画像未登録なら自動でサムネイル画像を登録し、手動画像の登録体験を壊さない
acceptance:
  - 新規レシピ保存時、出典にYouTube URLがあり、画像ファイル選択・完成写真候補選択がない場合、YouTubeサムネイルがレシピ画像として登録される
  - 編集保存時、既存画像がある場合はYouTubeサムネイルで上書きしない
  - 手動で画像ファイルを選んだ場合は、YouTubeサムネイルより手動画像が優先される
  - 完成写真候補を選んだ場合は、YouTubeサムネイルより候補画像が優先される
  - 画像削除を予約している保存では、自動サムネイル登録を勝手に走らせない
  - YouTube URLが複数ある場合は、既存 `findFirstYoutubeVideoId` と同じく最初に有効なvideoIdを使う
  - サムネイル取得・保存に失敗しても、レシピ本文と材料は保存され、画像だけ未登録であることがユーザーに伝わる
  - 既存のレシピ画像アップロード・削除・候補画像選択・固定デモ画像フォールバックを壊さない
  - Web版 verify が通る
required_evals:
  - web_project_bootstrap
  - photo_upload_storage
eval_selection_mode: manual
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/lib/photos/recipe-image-upload.ts
  - web/src/lib/youtube.ts
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - web/src/__tests__/recipe-image-upload.test.ts
  - project-os/artifacts/TKT-0253-recipe-save-auto-youtube-thumbnail/
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
  - artifacts/TKT-0253-recipe-save-auto-youtube-thumbnail/verify.json
  - artifacts/TKT-0253-recipe-save-auto-youtube-thumbnail/manual-smokes.md
  - artifacts/TKT-0253-recipe-save-auto-youtube-thumbnail/review.md
  - artifacts/TKT-0253-recipe-save-auto-youtube-thumbnail/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0253-recipe-save-auto-youtube-thumbnail`（= `harness/bin/verify_web.sh`）
  - 危険変更扱い。既存のレシピ画像Storage保存フローへ自動処理を接続するため manual-smokes.md / review.md を必ず残す
  - Canvas版 `app.html` は凍結・参照専用。編集しない
  - GAS / Google Spreadsheet / Google Drive は使わない
  - APIキー、Supabase秘密鍵、service role key、署名付きURL、写真URLを直書きしない
---

# Summary

`saveRecipe` の画像保存処理に、YouTubeサムネイル自動登録を接続する。

対象は「出典にYouTube URLがある」「画像がまだない」「ユーザーが手動で画像を選んでいない」ケースだけ。ユーザーが明示的に選んだ画像を自動処理で上書きしない。

## 実装メモ

- 既存確認先:
  - `web/src/components/recipe-meal-workspace.tsx`
    - `saveRecipe`
    - `persistRecipeImageChange`
    - `recipeImageFile`
    - `recipeImageCandidate`
    - `recipeImageRemoved`
    - `editingRecipeImagePath`
  - `web/src/lib/photos/recipe-image-upload.ts`
  - `web/src/lib/youtube.ts`
- 推奨方針:
  - 既存の `persistRecipeImageChange(recipeId, currentImagePath)` の最後、「画像に変更なし」の直前または分岐内に自動登録条件を足す。
  - 条件は `!recipeImageCandidate && !recipeImageFile && !recipeImageRemoved && !currentImagePath && findFirstYoutubeVideoId(normalized.data.source)` 相当。
  - `normalized.data.source` を使う場合、`persistRecipeImageChange` に source を渡すなど、関数の入力を明示する。
  - 自動登録成功時は `imagePath` にStorage pathを返し、`mergedRecipe.image_storage_path` に反映する。
  - 自動登録失敗時は、レシピ本文・材料は保存済みとして、画像だけ未登録のエラーまたは警告を出す。
- 失敗時の扱い:
  - 画像自動登録失敗でレシピ本文保存をロールバックしない。
  - ただしUIには「原因」「影響」「修正方法」を分けたメッセージを出す。
  - 例: 原因: YouTubeサムネイルを取得できませんでした。影響: レシピは保存済みですが画像は未登録です。修正方法: 画像を手動で選び直してください。
- 編集時の注意:
  - 既存画像があるレシピは自動上書きしない。
  - 画像削除を押して保存した場合、「削除したのにYouTubeで再登録される」動作にしない。

## テスト

- 新規レシピ:
  - YouTube URLあり + 画像未選択 → 自動登録関数が呼ばれ、保存後レシピに `image_storage_path` が入る。
  - YouTube URLなし + 画像未選択 → 自動登録関数が呼ばれない。
  - YouTube URLあり + 手動画像選択 → 手動アップロードが優先され、自動登録関数が呼ばれない。
  - YouTube URLあり + 完成写真候補選択 → 候補画像が優先され、自動登録関数が呼ばれない。
- 編集レシピ:
  - 既存画像あり + YouTube URLあり → 自動上書きしない。
  - 画像削除予約 + YouTube URLあり → 削除が優先され、自動再登録しない。
- 失敗時:
  - 自動登録が失敗してもレシピ本文・材料保存済みの状態が分かるフィードバックが出る。

## 手動確認

- PC幅で、画像未選択のYouTube URL入りレシピを追加し、一覧カード・詳細・調理ビューアで画像が表示される。
- スマホ幅で同じ操作を行い、保存中・成功・失敗表示が崩れない。
- 手動画像を選んだYouTube URL入りレシピで、手動画像が保存される。
- 既存画像ありレシピの出典にYouTube URLを追加して保存しても、既存画像が上書きされない。
- 画像削除操作でYouTubeサムネイルが勝手に復活しない。

## 非対象

- TKT-0252の取得・Storage保存土台の再設計。
- UI文言やプレビュー表示の大幅刷新。
- DB schema変更。
- Storage policy変更。
- YouTube Data API利用。
- サーバーブラウザによるスクリーンショット取得。

## 依存チケット

- TKT-0252-youtube-thumbnail-fetch-storage

## 残リスク

- YouTubeサムネイルの料理写真としての見栄えは動画によってばらつく。まずは自動登録の利便性を優先し、見栄えの手動差し替えは既存の画像編集UIで対応する。
