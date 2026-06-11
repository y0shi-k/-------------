---
ticket_id: TKT-0226-shopping-shortage-modal-wide
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

- 既存テスト 377件全パス（マークアップ無変更のため不足モーダル系テストに影響なし）。
- `npm run build` 通過（CSS 構文エラーなし）。
- コードレビューで以下を確認:
  - 追記は `@media (min-width: 1024px)` 内のみ＝スマホ幅に影響なし。
  - `.shopping-shortage-list` は base CSS の `overflow-y: auto` を維持したままグリッド化（スクロール挙動不変）。
  - TKT-0225 の追記ブロックと衝突しないこと。

## skipped_checks

- 実ブラウザでの 1024px 以上幅の目視（カラム数の自動調整・候補少数時の縦幅・横スクロールなし）。CSSのみの変更で機能・データ影響がないため静的確認で足りると判断。

## open_risks

- 候補数が少ないときの縦幅の見え方は実機確認が望ましい（調整は CSS 単独で可能。データリスクなし）。
