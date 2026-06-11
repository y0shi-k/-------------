---
ticket_id: TKT-0221-all-buttons-tooltips
status: passed
review_scope:
  - SPEC-0064-dynamic-genre-summary-tooltip
  - TKT-0221-all-buttons-tooltips
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- web/src/app/globals.css（汎用 `[data-tooltip]` CSS＋配置バリアント＋`.recipe-genre-more` override）
- web/src/components/ 配下17ファイル（`data-tooltip` 属性付与のみ。内訳は report.md 参照）

## checked_artifacts

- project-os/artifacts/TKT-0221/verify.json（status: pass）
- project-os/artifacts/TKT-0221/manual-smokes.md（status: passed）

## subagent_usage

- impl-fast（Sonnet）に実装を委譲。route_model.py の判定は「非危険 eval のみ: pwa_mobile_ui → fast」。

## findings

- 危険 eval（photo_upload_storage / supabase_schema_change）の自動マッチは、広域 diff に含まれる「image/写真/recipes」等の語彙によるもの。実変更は JSX への属性付与と CSS のみで、Supabase Storage・schema・auth・migration への変更はない。
- 付け漏らしチェック（`<button` 数 vs `data-tooltip` 数）が全17ファイルで一致（194/194）しており、acceptance の「漏れがない」を機械的に確認済み。
- 既存 `aria-label` は温存され、data-tooltip は視覚補助として併設。アクセシビリティの後退なし。
- z-index 110 は既存最大（delete-confirm-backdrop: 100）より前面で、モーダル内ボタンのツールチップも隠れない。
- 非ゴール遵守: 共通 `<Button>` コンポーネント導入・外部ライブラリ追加・ボタン以外への展開はしていない。

## open_risks

- 文言妥当性・画面端見切れの実機目視は未実施（manual-smokes の skipped_checks 参照）。属性値/CSSのみで調整可能でデータリスクなし。

## verdict

- passed。危険 eval は誤マッチ（属性付与＋CSSのみ）であり、Storage・schema・auth に実質変更がないことをコードと git status で確認した。
