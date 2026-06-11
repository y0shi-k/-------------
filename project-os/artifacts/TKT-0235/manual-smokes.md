---
ticket_id: TKT-0235-cooking-viewer-youtube-player
status: passed
execution_mode: static_only
target_evals:
  - pwa_mobile_ui
  - photo_upload_storage
  - supabase_schema_change
  - auth_and_rls_policy
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- pwa_mobile_ui（チケットの required_evals。非危険）
- photo_upload_storage / supabase_schema_change / auth_and_rls_policy の自動マッチは、diff 内の「写真/photo」語の過剰マッチと、並行セッションの認証イニシアチブ（TKT-0228〜0233）の未コミット変更が同一作業ツリーに同居しているため。本チケットの実変更3ファイルは表示のみ（チケット owner_notes で予見済み）。

## executed_checks

- ユニットテスト（vitest, jsdom）で次を確認:
  - source に YouTube URL を持つレシピで調理ビューアを開くと `iframe[src*="youtube-nocookie.com/embed/"]` が初期表示され、`title`・`allowfullscreen` 属性を持つ。
  - 切替タブ「写真」で `RecipeThumb` へ切り替わり、「動画」で iframe に戻る。
  - YouTube URL の無いレシピでは切替タブ・iframe が出ず、従来の写真表示のまま。
- `npm run build` で本番ビルド pass（CSS 追加によるエラーなし）。
- コードレビューで以下を確認:
  - 写真URLは既存 `recipeImageUrls`（署名付きURL Map）の読み取りのみ。Storage への新規アクセス・アップロード・権限変更なし。
  - 本チケットとして `supabase/` 配下・migration・auth コードに変更なし。
  - 調理完成写真（cooking_history.photos）のロジックに変更なし。
  - iframe の src は videoId 検証済み値のみで組み立て、`sandbox` 不使用は spec どおり。

## skipped_checks

- 実ブラウザ・実機での動画再生と CSP violation 確認（jsdom では iframe を実ロードしないため不可）。**ユーザーの実機スモークで確認する**: 動画初期表示 / 写真切替 / 隠すトグル / Console に CSP エラーなし / 375px・PC幅の非崩れ。

## open_risks

- 実機での見た目（iframe と写真枠の高さ差・タブの配置）の微調整が必要になる可能性はあるが、データ破壊リスクはない。
