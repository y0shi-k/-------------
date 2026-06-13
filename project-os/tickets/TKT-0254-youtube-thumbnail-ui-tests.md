---
id: TKT-0254-youtube-thumbnail-ui-tests
title: YouTubeサムネイル自動登録のUI表示と回帰テストを固める
status: implementation_ready
goal: YouTubeサムネイル自動登録の成功・失敗・優先順位がユーザーに分かり、スマホ表示と既存画像機能の回帰を防ぐ
acceptance:
  - レシピ保存時にYouTubeサムネイル自動登録が行われた場合、成功メッセージまたは保存後表示で画像登録済みと分かる
  - 自動登録に失敗した場合、原因・影響・修正方法が分かるメッセージが表示される
  - 保存中の二重送信防止が既存の `isSaving` と矛盾しない
  - レシピ画像ピッカーの手動選択・取り消し・削除・完成写真候補選択の表示が崩れない
  - 375px前後のスマホ幅で、レシピ編集モーダルの画像エリアとフィードバック文言が横はみ出ししない
  - 自動登録あり/なし、手動画像優先、既存画像保持、削除優先、失敗時のテストが追加または整理されている
  - DB schema、Supabase Auth/RLS、Storage policy、AI API route は変更しない
  - Web版 verify が通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - web/src/__tests__/recipe-image-upload.test.ts
  - project-os/artifacts/TKT-0254-youtube-thumbnail-ui-tests/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0252-youtube-thumbnail-recipe-image
  - SPEC-0174-recipe-image-upload-ui
related_artifacts:
  - artifacts/TKT-0254-youtube-thumbnail-ui-tests/verify.json
  - artifacts/TKT-0254-youtube-thumbnail-ui-tests/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0254-youtube-thumbnail-ui-tests`（= `harness/bin/verify_web.sh`）
  - 非危険変更。UI表示とテスト補強のみ。Storage保存ロジックやAPI routeを広げる場合はTKT-0252/0253側へ戻す
  - Canvas版 `app.html` は凍結・参照専用。編集しない
  - GAS / Google Spreadsheet / Google Drive は使わない
  - APIキー、Supabase秘密鍵、service role key、署名付きURL、写真URLを直書きしない
---

# Summary

YouTubeサムネイル自動登録のユーザー表示と回帰テストを固める。

このチケットでは、Storage保存の本体や保存時接続の仕様を広げない。TKT-0252/TKT-0253で入った動作が、ユーザーに分かりやすく、スマホでも崩れず、今後壊れにくい状態にする。

## 実装メモ

- 既存確認先:
  - `web/src/components/recipe-meal-workspace.tsx`
  - `web/src/app/globals.css`
  - `web/src/__tests__/recipe-meal-workspace.test.tsx`
  - `web/src/__tests__/recipe-image-upload.test.ts`
- UI方針:
  - 自動サムネイル登録は裏側の補助機能。入力欄を増やしすぎない。
  - 成功時は通常の「レシピを追加しました。」に短い補足を足す程度でよい。
  - 失敗時は既存ルールどおり「原因」「影響」「修正方法」を含める。
  - 手動画像が最優先であることをUI挙動で守る。説明文を増やしすぎない。
- スマホ:
  - 長いURLやエラー文言で横はみ出ししない。
  - 画像ピッカー、候補選択、削除予約の表示が縦に自然に収まる。

## テスト

- `recipe-meal-workspace.test.tsx` で以下を固定する:
  - YouTube URLあり + 画像未選択の保存後に画像pathが反映される。
  - YouTube URLなしでは自動登録が走らない。
  - 手動画像があると自動登録より優先される。
  - 完成写真候補があると自動登録より優先される。
  - 既存画像あり編集では自動上書きしない。
  - 画像削除予約時は自動再登録しない。
  - 自動登録失敗時のメッセージが表示される。
- `recipe-image-upload.test.ts` でTKT-0252側の保存ヘルパーの成功/失敗ケースが不足していれば補う。
- 既存YouTube埋め込みテスト（TKT-0235相当）を壊さない。

## 手動確認

- 375px幅で新規レシピモーダルを開き、YouTube URL入りレシピを保存して表示崩れがない。
- PC幅で同じ操作を行い、一覧カード・詳細パネルの画像表示が自然。
- 自動登録失敗を疑似的に起こし、メッセージが長すぎてUIを壊さない。
- 手動画像登録・画像削除・完成写真候補選択の既存操作が従来通り使える。

## 非対象

- サムネイル取得ロジックの新設・大幅変更。
- レシピ保存時接続の条件変更。
- DB schema変更。
- Supabase Auth/RLS変更。
- Storage policy変更。
- AI API route変更。
- Canvas版 `app.html` の変更。

## 依存チケット

- TKT-0252-youtube-thumbnail-fetch-storage
- TKT-0253-recipe-save-auto-youtube-thumbnail

## 残リスク

- 自動取得サムネイルは動画投稿者が設定した画像のため、必ず料理完成写真とは限らない。ユーザーが気に入らない場合は既存の手動画像差し替えで対応する。
