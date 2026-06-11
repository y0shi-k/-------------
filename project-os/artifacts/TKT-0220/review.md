---
ticket_id: TKT-0220-amount-badge-svg-background
status: passed
review_scope:
  - SPEC-0196-cooking-step-amount-chips
  - TKT-0220-amount-badge-svg-background
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- web/public/images/badges/tablespoon.svg（新規・「大」サンプルSVG）
- web/public/images/badges/teaspoon.svg（新規・「小」サンプルSVG）
- web/src/app/globals.css（`[data-unit="大さじ"]` / `[data-unit="小さじ"]` の複合背景＋padding）

## checked_artifacts

- project-os/artifacts/TKT-0220/verify.json（status: pass）
- project-os/artifacts/TKT-0220/manual-smokes.md（status: passed）

## subagent_usage

- impl-fast（Sonnet）に実装を委譲。route_model.py の判定は「非危険 eval のみ: pwa_mobile_ui → fast」。

## findings

- 危険 eval（photo_upload_storage / supabase_schema_change）の自動マッチは「image/画像」語によるもの。実変更は public 静的SVG 2点と CSS 2セレクタのみで、Supabase Storage・schema・auth・migration への変更はない。
- 複合 background は SVG レイヤー＋既存単色の重ね指定で、単色のみの旧指定を完全に置き換えつつ色は維持。SVG 読み込み失敗時も単色背景は残るため表示破綻しない。
- ピル形状・サイズはベースセレクタに残置されており上書きなし。グレー系（その他単位）も無変更。
- SVG は外部ライブラリ不使用の手書きで、前例（`ingredient-*.svg`）の命名規約（英小文字）に適合。

## open_risks

- 実機での見た目（淡さ・被り）の最終調整は未実施（manual-smokes の skipped_checks 参照）。CSS単独で調整可能でデータリスクなし。

## verdict

- passed。危険 eval は誤マッチ（静的アセット＋CSSのみ）であり、Storage・schema・auth に実質変更がないことをコードと git status で確認した。
