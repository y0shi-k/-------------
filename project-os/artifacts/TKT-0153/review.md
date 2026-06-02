---
ticket_id: TKT-0153
status: passed
review_scope:
  - SPEC-0153-ai-usage-statusbar
  - TKT-0153-ai-usage-statusbar
---

# TKT-0153 review

## checked_diff_paths

- `web/src/components/web-mode-shell.tsx`
- `web/src/components/ai-usage-meter.tsx`
- `web/src/components/inventory-board.tsx`
- `web/src/components/recipe-meal-workspace.tsx`
- `web/src/app/globals.css`
- `web/src/__tests__/ai-usage-meter.test.tsx`
- `web/src/__tests__/web-mode-shell.test.tsx`
- `web/src/__tests__/inventory-board.test.tsx`
- `web/src/__tests__/recipe-meal-workspace.test.tsx`

## checked_artifacts

- `verify.json`: pass
- `manual-smokes.md`: passed
- `report.md`: ready

## subagent_usage

- 実装は impl-fast（Sonnet）に委譲。レビューはオーケストレーター側で web-mode-shell・ai-usage-meter・両パネルの配線とCSSを実読して確認。

## findings

重大な未解決問題は見つからない。確認したこと:

- **単一ソース化**: `web-mode-shell.tsx` に `aiUsageSummary` state（88行）+ `refreshAiUsage`（139-140行）を追加。`supabase` は useMemo（90行）、マウント時に1回 fetch（175-176行）。`ShellStatusContext` に集計を追加し既定値を `null` / async noop（51-55行）にしているため、Provider外でも安全。`useShellAiUsage()`（71-73行）を公開。
- **ステータスバー表示**: `.canvas-status-bar` 内に `<AiUsageMeter variant="statusbar" summary={aiUsageSummary} />`（188行）。
- **メーター拡張**: `ai-usage-meter.tsx` に `variant`（既定 panel）。statusbar はラベル・注記を出さず、`exhausted` も statusbar では false にして注記を抑止（32-35行）。バッジに `ai-usage-badge-recipe` / `-scan` / `-total` クラスを付与しCSSで制御可能に。既存 panel 用途は不変。
- **パネルの context 移行**: `inventory-board.tsx`（216行）/ `recipe-meal-workspace.tsx`（296行）が `useShellAiUsage()` 由来の集計とリフレッシュを使用。ローカルの独立 fetch を撤去。パネル内メーター（`feature` 付き）とボタン無効化は維持。
- **CSS（密度方針）**: `.canvas-status-bar .ai-usage-meter[data-variant="statusbar"]`（109行〜）でコンパクト化。`@media (max-width: 480px)`（121行〜）でレシピ・写真バッジを非表示にし合計のみ → 確定方針「PCは3バッジ/モバイルは合計のみ」と一致。
- **非対象の不変性**: 既存 `get_ai_usage_summary` を読むのみ。`ai_usage_events` のスキーマ・RLS・関数、AI route（recipes / scan-ingredients）のサーバーロジック、写真取り込み・圧縮・Storage処理は変更していない。
  → `/check-gates` の `supabase_schema_change` / `photo_upload_storage` は diff キーワードによる過剰マッチであり、実体の危険変更ではない。
- **秘匿情報**: APIキーの直書き・表示・ログ出力なし。policy チェック（no_hardcoded_secret / no_gas_dependency / supabase_rls_present）pass。
- Canvas版 `app.html` は未編集。対象は web/ のみ。

## open_risks

- 実機スマホでの目視は未実施（自動テスト＋CSSでは破綻なし）。
- 狭幅ブレークポイント 480px は spec 未指定。実機確認後に調整余地。

## verdict

review_ready: pass（`verify_passed` / `manual_smokes_done` / `review_ready` を満たす。over-match の2危険evalは実変更を伴わないことを実読で確認済み）
