---
ticket_id: TKT-0225-consumption-modal-wide
status: passed
execution_mode: static_only
target_evals:
  - pwa_mobile_ui
  - supabase_schema_change
  - photo_upload_storage
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- pwa_mobile_ui（チケットの required_evals。非危険）
- supabase_schema_change / photo_upload_storage は作業ツリー上の他チケット diff 語彙による自動マッチ。本チケットは globals.css の PC 幅メディアクエリ追記のみで、schema・Storage の挙動変更はない。

## executed_checks

- 既存テスト 377件全パス（マークアップ無変更のため DOM 依存テストに影響なし）。
- `npm run build` 通過（CSS 構文エラーなし）。
- コードレビューで以下を確認:
  - 追記は `@media (min-width: 1024px)` ブロック内のみ＝スマホ幅に影響なし。
  - `.consumption-list` の2カラム化が調理完了/履歴編集の両モーダルに共通クラスで効く構造であること。
  - 料理記録パネル（写真等）は対象セレクタ外であること。

## skipped_checks

- 実ブラウザでの 1024px 以上幅の目視（2カラムの並び・sticky ボタンの非崩れ・横スクロールなし）。CSSのみの変更で機能・データ影響がないため静的確認で足りると判断。

## open_risks

- 実機での見た目調整（列間隔等）が必要になる可能性はあるが、CSS単独で対応可能。データリスクなし。
