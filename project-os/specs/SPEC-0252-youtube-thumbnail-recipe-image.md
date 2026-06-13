---
id: SPEC-0252-youtube-thumbnail-recipe-image
title: YouTube URL からのレシピ画像自動登録
status: spec_ready
scope:
  - レシピ追加・編集画面
  - YouTube URL 判定・サムネイル候補URL生成
  - レシピ画像の Supabase Storage 保存
  - レシピ画像の自動登録状態・失敗時フィードバック
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - Web版（`web/` + `supabase/`）だけを対象にする
  - GAS、Google Spreadsheet、Google Drive は使わない
  - YouTube以外の任意URLから画像を取得しない
  - サムネイル画像の公開URLや署名付きURLをDBに保存しない。DBには既存どおり `recipes.image_storage_path` だけを保存する
  - 画像は既存の非公開 `photos` バケットへ保存し、表示は署名付きURLを使う
  - ユーザーが手動で画像を選択済みの場合、自動サムネイルで上書きしない
  - APIキー、Supabase service role key、秘密鍵を直書きしない
acceptance:
  - レシピの出典に YouTube URL があり、レシピ画像の手動選択・候補選択・既存画像がない場合、保存時に YouTube サムネイルがレシピ画像として登録される
  - YouTube URL の判定は既存 `web/src/lib/youtube.ts` の安全な videoId 抽出ルールを使い、許可済みYouTubeホスト以外は対象にしない
  - 取得対象は YouTube サムネイルの固定ホスト・固定パスだけに限定し、任意URL取得を実装しない
  - サムネイル取得または画像保存に失敗した場合でも、レシピ本文・材料は保存され、画像だけ未登録であることを「原因」「影響」「修正方法」が分かる形で表示する
  - 自動登録された画像は既存のレシピ画像表示優先順位（ユーザー登録画像 → 固定デモ画像 → プレースホルダ）に乗る
  - スマホ幅でも保存中・失敗時の表示が崩れない
  - Web版 verify が通る
related_tickets:
  - TKT-0252-youtube-thumbnail-fetch-storage
  - TKT-0253-recipe-save-auto-youtube-thumbnail
  - TKT-0254-youtube-thumbnail-ui-tests
---

# Summary

レシピ追加・編集時に、出典欄へ YouTube URL があり、画像が未登録の場合だけ、YouTube のサムネイル画像を自動でレシピ画像として保存する。

「スクショを撮る」方式はサーバーでブラウザ実行が必要になり、Vercel運用では重く不安定になりやすい。そのため本仕様では、YouTube の動画IDからサムネイル画像URLを組み立て、画像ファイルとして取得して既存のレシピ画像Storage保存経路へ流す。

## 背景

- 既存の `web/src/lib/youtube.ts` は YouTube URL から安全に videoId を抽出できる。
- 既存のレシピ画像は `recipes.image_storage_path` に非公開 `photos` バケット内のStorage pathだけを保存する設計。
- 既存の手動画像登録は `web/src/lib/photos/recipe-image-upload.ts` と `web/src/components/recipe-meal-workspace.tsx` にある。
- YouTube動画再生は TKT-0234/TKT-0235 で調理ビューアに導入済み。

## 仕様

- 対象条件:
  - `recipes.source` 相当の出典テキストに、`findFirstYoutubeVideoId` で videoId が見つかる。
  - レシピ画像の手動ファイル選択がない。
  - 完成写真候補からの選択がない。
  - 既存画像がない、または新規追加時で画像がまだない。
  - 画像削除操作中は、自動登録しない。
- サムネイル取得:
  - videoId から YouTube サムネイルの固定URL候補を作る。
  - YouTube以外のURL、ユーザー入力URL、リダイレクト先URLをそのまま取得対象にしない。
  - 取得に失敗した場合は、低解像度候補など実装で定めたフォールバックを試してよい。
- 保存:
  - 取得した画像は既存 `photos` バケットの `<user_id>/recipe-images/<recipe_id>/...` 配下へ保存する。
  - DBには公開URLではなく `recipes.image_storage_path` だけを保存する。
  - service role key をブラウザ・API routeに露出しない。
- UX:
  - 自動登録は保存処理の一部として行う。
  - 失敗時もレシピ本文・材料は保存済みであることを明示する。
  - 手動画像がある場合は手動画像を最優先にする。

## 非対象

- YouTube Data API の利用。
- 動画タイトル・チャンネル名の取得。
- サーバー上でブラウザを起動して動画画面をスクリーンショットする方式。
- YouTube以外の動画サービス対応。
- DB schema変更。
- Storage policy変更。
- Canvas版 `app.html` の変更。

## Acceptance Example

- 画像未選択で、出典に `https://www.youtube.com/watch?v=dQw4w9WgXcQ` を入れてレシピ保存 → レシピ画像が自動登録され、一覧カード・詳細・調理ビューアで表示される。
- 画像を手動選択して同じYouTube URL入りレシピを保存 → 手動画像が保存され、自動サムネイルで上書きされない。
- 非YouTube URLだけの出典で保存 → 外部画像取得は走らず、従来どおり固定画像またはプレースホルダ表示になる。
- サムネイル取得失敗 → レシピ本文・材料は保存され、画像だけ未登録であることが表示される。
