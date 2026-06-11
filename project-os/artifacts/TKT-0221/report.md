---
ticket_id: TKT-0221-all-buttons-tooltips
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

ボタンの用途が見ただけでは分からず操作に迷う問題への対応として、`.recipe-genre-more` 専用だったツールチップ実装を汎用化し、Web版の全ボタン（17ファイル・194箇所）に `data-tooltip` でヘルプ文言を付けた。

- `web/src/app/globals.css`: 汎用 `[data-tooltip]` ツールチップ（`position: relative` + `::after`、背景 `#0f172a`・白文字、`:hover`/`:focus-visible` 表示、z-index 110=既存最大の `delete-confirm-backdrop`(100) より前面）を追加。配置バリアント `data-tooltip-pos="bottom" / "left" / "right"` で画面端の見切れを防止。既存 `.recipe-genre-more` の `white-space: pre` は override で維持。
- 全ボタンへの `data-tooltip` 付与: `recipe-meal-workspace.tsx`(95) / `inventory-board.tsx`(39) / `cooking-history-board.tsx`(15) / `cooking-record-edit-modal.tsx`(10) / `recipe-filter-controls.tsx`(7) / `web-mode-shell.tsx`(6) / `unit-picker.tsx`(5) / `fraction-picker.tsx`(3) / `delete-confirm-panel.tsx`(2) / `gemini-api-key-panel.tsx`(2) / `home-dashboard.tsx`(2) / `number-field.tsx`(2) / `photo-candidate-picker.tsx`(2) / `settings-panel.tsx`(1) / `login-form.tsx`(1) / `logout-button.tsx`(1) / `shopping-list-section.tsx`(1)。

## 今回追加した安全装置

- 付け漏らし防止のため、ファイルごとに `<button` 出現数と `data-tooltip` 付与数を突き合わせ、**全17ファイルで 194 = 194 の完全一致**を確認。
- 文言は既存 `aria-label`（79箇所）と整合させ、aria-label を主・data-tooltip を視覚補助とする方針で統一（アクセシビリティ非劣化）。動的な対象名はテンプレートリテラルで反映。
- ツールチップは hover と `:focus-visible` の両方で表示され、キーボード操作でも確認できる。
- 属性付与とCSSのみの変更で、クリックハンドラ・レイアウトプロパティには手を入れていない。

## 実施した確認

- `/verify TKT-0221`: lint / typecheck / test（37ファイル・323件全パス）/ build すべて pass。policy も pass。`verify.json` 参照。
- aria-label・テキストでボタンを取得している既存テストに回帰がないことをテスト全パスで確認。

## 残リスク

- ツールチップ文言（194件）の妥当性は実機での目視確認が未実施。文言修正は属性値の変更のみで対応可能。
- 画面端での見切れは `data-tooltip-pos` で対策済みだが、全画面・全幅での網羅目視は未実施（横スクロール非誘発はCSS設計で担保）。

## 次の依頼や人判断

- なし。`/check-gates` の photo_upload_storage / supabase_schema_change は diff 内語彙の自動マッチで、本チケットは**属性付与とCSSのみ**。Storage・schema・auth は無変更（manual-smokes.md / review.md に詳細）。

## 追補（2026-06-11 ユーザーフィードバック反映: 裏回り/見切れの全面修正）

フィルタ行・タグ行などでツールチップが他要素の裏に回る/見切れる指摘を受け、全 `data-tooltip` ボタンの祖先チェーン（overflow / sticky / z-index）を監査して修正した。根本原因は3系統:

1. **overflow クリップ**: `overflow-x: auto` は縦方向もクリップする。並び/タブ/カテゴリ行（`.recipe-sort-row` / `.location-tab-row` / `.inventory-category-row` / `.canvas-sort-row`）は `@media (min-width:720px)` で `overflow-x: visible; flex-wrap: wrap` に変更（モバイルは横スクロール維持＝タッチは hover なし）。
2. **スタッキングコンテキスト**: sticky 要素は常にスタッキングコンテキストを作り `::after` の z-index 110 が閉じ込められる。`.inventory-canvas-header` / `.desktop-mode-nav` は `:has([data-tooltip]:hover)` で一時 z 昇格、`.desktop-topbar` 内・`.cooking-overlay` ヘッダー・`.modal-close-button`（14箇所）等の画面/モーダル上端ボタンは新バリアント `data-tooltip-pos="bottom-left"` / `"bottom-right"` で下向き化。`.bottom-mode-nav`（画面下端 fixed）は逆に上向きへ修正。汎用安全装置として `[data-tooltip]:hover/:focus-visible { z-index: 111 }` を追加。
3. **クリップ不能な場所は native `title` にフォールバック**: 横スクロール必須の30日カレンダー（`.schedule-add-day`）、縦スクロールリスト内アイテム（`.genre-option` / `.schedule-picker-option`）、角丸クリップに overflow:hidden が必須の小ボタン（`.photo-thumb-remove` / number-field ステッパー / `.calendar-cell` / `.home-feature-card`）。用途説明は `aria-label` で引き続き担保。
- ボタン自身の overflow:hidden でツールチップが消えるケースは、クリップを内側要素へ移動（`.recipe-thumb-button`→`.recipe-thumb`、`.schedule-meal-select` は不要なので削除）。
- `title` と `data-tooltip` の二重表示（schedule-shift ↑/↓等）も解消。クリックハンドラは無変更。
- 再 verify pass（368件）。残: 実機目視（各配置バリアントの見え方）。

