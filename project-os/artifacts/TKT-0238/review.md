---
ticket_id: TKT-0238-location-picker-label-touch-fix
status: passed
review_scope:
  - SPEC-0105-inventory-and-staging-web
  - TKT-0238-location-picker-label-touch-fix
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- web/src/components/inventory-board.tsx（保存場所・数量単位の label→div+span 変更のみ）
- web/src/app/globals.css（`.inventory-editor-modal .stock-form .genre-field-label` の最小追記のみ）

## checked_artifacts

- artifacts/TKT-0238/verify.json（status: pass）
- artifacts/TKT-0238/report.md
- artifacts/TKT-0238/manual-smokes.md

## subagent_usage

- 実装: impl-fast（Sonnet）。`harness/bin/route_model.py TKT-0238` の判定どおり
- レビュー・検証: オーケストレーター（Fable 5 メインセッション）が diff レビューと verify を実施

## findings

- 変更はチケットの acceptance に一致。レシピのジャンル欄（recipe-meal-workspace.tsx:2996）と同一構造に揃っており、UI実装の一貫性が回復
- aria-label は LocationTagPicker / UnitPicker / NumberField の各 input 側に既存のまま残っており、getByLabelText 系のテスト・支援技術への回帰なし
- 旧 label スタイルの代替 CSS はモーダルスコープ（`.inventory-editor-modal`）+ 汎用 `.stock-form .genre-field-label`（既存 2432行）で網羅されている
- 危険系 eval（supabase_schema_change / photo_upload_storage）の match は作業ツリー内の並行チケット語彙による過剰マッチで、本 diff に schema / Storage / 写真経路の変更はない（過去運用 TKT-0222/0226 と同じ整理）

## open_risks

- タブレット実機での修復確認が未了（manual-smokes の skipped_checks 参照）

## verdict

passed — verify 全 pass・diff 最小・回帰なし。実機スモークのみユーザー残
