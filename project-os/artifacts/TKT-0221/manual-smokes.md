---
ticket_id: TKT-0221-all-buttons-tooltips
status: passed
execution_mode: static_only
target_evals:
  - pwa_mobile_ui
  - web_project_bootstrap
  - photo_upload_storage
  - supabase_schema_change
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- pwa_mobile_ui（チケットの required_evals。非危険）
- web_project_bootstrap（🟢非危険）は `web/src/components/` 広域変更による自動マッチ。
- photo_upload_storage / supabase_schema_change は diff 内の「image/写真」「recipes」等の語による自動マッチ。本チケットは属性付与＋CSSのみで、Storage・schema の挙動変更はない。

## executed_checks

- 付け漏らしチェック: 全17ファイルで `<button` 出現数と `data-tooltip` 付与数を grep で突き合わせ、194 = 194 の完全一致を確認。
- 既存テスト（vitest 323件）全パスで、クリック動作・aria-label・テキスト取得に回帰がないことを確認。
- `npm run build` で本番ビルドが通ることを確認。
- コードレビューで以下を確認:
  - 変更は `web/src/components/` の `.tsx` への `data-tooltip` / `data-tooltip-pos` 属性付与と `globals.css` のツールチップCSSのみ。
  - `supabase/` 配下・migration・Storage アクセスコード・クリックハンドラに変更なし。
  - ツールチップ表示は `:hover` と `:focus-visible` の両方（CSS定義で確認）。

## skipped_checks

- 実ブラウザ・実機での全194ボタンのツールチップ目視（文言妥当性・画面端の見切れ・モーダル上での前面表示）。属性とCSSのみの変更で機能・データへの影響がないため、調整は属性値/CSS単独変更で対応可能。

## open_risks

- 文言・配置の微調整が実機確認後に必要になる可能性はあるが、データ破壊リスクはない。
