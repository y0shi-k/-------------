---
ticket_id: TKT-0219-cooking-viewer-photo-toggle
status: passed
execution_mode: static_only
target_evals:
  - pwa_mobile_ui
  - photo_upload_storage
  - supabase_schema_change
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- pwa_mobile_ui（チケットの required_evals。非危険）
- photo_upload_storage / supabase_schema_change は diff 内の「写真/image」語による自動マッチ。本チケットは表示のみで、Storage・schema の挙動変更はない（チケット owner_notes で予見済み）。

## executed_checks

- ユニットテスト（vitest, jsdom）で次を確認:
  - 調理ビューを開くと写真ブロックが初期「開」で表示される（`aria-expanded="true"`、`role="img"` のサムネイル存在）。
  - トグル操作で写真が隠れ（`aria-expanded="false"`・サムネイル消滅）、再操作で復帰する。
  - ビューを閉じて開き直すと開状態にリセットされる。
- `npm run build` で本番ビルドが通り、CSS 追加によるビルドエラーがないことを確認。
- コードレビューで以下を確認:
  - 写真URLは既存 `recipeImageUrls`（署名付きURL Map）の読み取りのみ。Storage への新規アクセス・アップロード・権限変更なし。
  - `supabase/` 配下・migration・schema に変更なし（`git status` で確認）。
  - 調理完成写真（cooking_history.photos）の撮影・表示ロジックに変更なし。

## skipped_checks

- スマホ実機・実ブラウザでの目視確認（jsdom テストと CSS 設計レビューで代替。表示のみの変更で機能・データへの影響なし）。

## open_risks

- 実機幅での見た目の微調整（サムネイルサイズ等）が必要になる可能性はあるが、データ破壊リスクはない。
