---
ticket_id: TKT-0253-recipe-save-auto-youtube-thumbnail
required_evals:
  - web_project_bootstrap
  - photo_upload_storage
---

# Manual Smokes

## 実施内容

- [x] 新規レシピ保存で、出典にYouTube URLがあり画像未選択なら、YouTubeサムネイル取得とStorage uploadが呼ばれることを単体テストで確認。
- [x] YouTube URLなしでは自動登録処理が呼ばれないことを単体テストで確認。
- [x] 既存画像ありの編集保存ではYouTubeサムネイルで上書きしないことを単体テストで確認。
- [x] サムネイル取得に失敗しても、レシピ本文・材料の保存は完了済みであることをフィードバックするテストを追加。
- [x] 自動登録は `persistRecipeImageChange` 内で、手動画像・完成写真候補・削除予約の後に評価されることを静的確認。
- [x] 実サンプル動画 `https://www.youtube.com/watch?v=8Pat_Puc-ck` で確認。`maxresdefault.jpg` は404、`sddefault.jpg` は200で、フォールバックが必要な動画だった。
- [x] サンプルユーザー `stock-master-test@example.com` でログインし、画像未選択のYouTube URL入りレシピ「いかのYouTubeテスト」を保存。レシピ保存成功、一覧・詳細でStorage画像表示を確認。
- [x] 表示画像の署名付きURLが `photos/<user_id>/recipe-images/<recipe_id>/...jpg` 由来であることを確認。

## コマンド確認

- `npm test -- --run src/__tests__/recipe-meal-workspace.test.tsx src/__tests__/recipe-image-upload.test.ts src/__tests__/youtube.test.ts`: pass
- `npm run typecheck`: pass
- `harness/bin/verify_web.sh TKT-0253-recipe-save-auto-youtube-thumbnail`: pass
- Browser実機確認: `http://127.0.0.1:3010` + サンプルユーザーで pass

## 未実施

- スマホ幅の実機目視は未実施。UI表示の詳細回帰は後続TKT-0254で扱う。
