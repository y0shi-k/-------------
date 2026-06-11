---
ticket_id: TKT-0220-amount-badge-svg-background
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
- photo_upload_storage / supabase_schema_change は diff 内の「image/画像」語による自動マッチ。本チケットは静的SVGアセット＋CSSのみで、Storage・schema の挙動変更はない（チケット owner_notes で予見済み）。

## executed_checks

- `npm run build` で本番ビルドが通り、`web/public/images/badges/` の静的アセット参照（CSS の `url()`）でビルドエラーがないことを確認。
- 既存テスト（vitest 323件）が全パスし、バッジ生成ロジック（`chipifyStep`/`cookingAmountChip`）の挙動に回帰がないことを確認。
- コードレビューで以下を確認:
  - 変更は `web/public/images/badges/*.svg`（新規2点）と `globals.css` の2セレクタのみ。`supabase/` 配下・Storage アクセスコード・migration に変更なし（`git status` で確認）。
  - グレー系（その他単位）セレクタは無変更。
  - 既存の単色背景・文字色は複合 background 指定内で維持。

## skipped_checks

- 実ブラウザ・実機での目視（SVGの淡さ・文字の可読性・ピル形状の非崩れ）。静的アセット＋CSSのみの変更で機能・データへの影響がないため、実機調整は後続のCSS単独変更で対応可能。

## open_risks

- SVG の opacity / サイズ / padding がサンプル値のため、実機で見た目調整が必要になる可能性。データ破壊リスクはない。
