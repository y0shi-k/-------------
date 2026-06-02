---
id: TKT-0153-ai-usage-statusbar
title: 本日のAI残り回数を上部ステータスバーに常時表示する
status: completed
goal: どの画面にいても本日のAI残り回数がひと目で分かるよう、上部ステータスバーに常時表示し、集計を単一ソースに集約する
acceptance:
  - 上部ステータスバー（`.canvas-status-bar`）に本日のAI残り回数が常時表示される
  - PC幅ではレシピ・写真・合計の3バッジ、狭幅（スマホ）では合計のみ表示される
  - AIレシピ生成・食材写真解析の実行（成功・上限超過・返金）後、ステータスバーの数字が即座に更新される
  - ステータスバーとパネル内メーターが同じ集計値（単一ソース）を参照し、ズレない
  - 集計取得に失敗してもステータスバー・パネルが壊れない（残り0と誤表示しない）
  - 既存のAI実行フロー・ボタン無効化が壊れていない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/web-mode-shell.tsx
  - web/src/components/ai-usage-meter.tsx
  - web/src/components/inventory-board.tsx
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/
  - project-os/artifacts/TKT-0153-ai-usage-statusbar/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0153-ai-usage-statusbar
related_artifacts:
  - artifacts/TKT-0153-ai-usage-statusbar/verify.json
  - artifacts/TKT-0153-ai-usage-statusbar/report.md
owner_role: implementer
owner_notes:
  - 非危険変更（UIのみ）。既存 `get_ai_usage_summary` を読むだけで、schema/RLS/AI routeのロジックは変更しない。
  - ただし `inventory-board.tsx` / `recipe-meal-workspace.tsx`（Gemini/写真/Storageの語を含む）を触るため、`/check-gates` の diff 自動判定で `ai_server_route` / `photo_upload_storage` に過剰マッチする可能性がある。その場合は manual-smokes.md / review.md を追加し、required_gates を満たす（最終的な required_evals は `/check-gates TKT-0153` で確定）。
  - verify は `/verify TKT-0153`（= `harness/bin/verify_web.sh`）。
  - Canvas版 `app.html` は触らない。対象は web/ のみ（supabase/ も触らない）。
  - APIキー・秘密情報を直書きしない。Gemini APIキーを表示・ログに出さない。
---

# Summary

TKT-0151で追加した「本日のAI残り回数」を、各AIパネルだけでなく**上部ステータスバー（`.canvas-status-bar`）に常時表示**する。あわせて、現状2か所（食材／レシピパネル）で独立して取得している集計を `ShellStatusContext` に集約し、単一ソース化する。

ユーザー確定済みの表示方針:
- **PC幅: レシピ・写真・合計の3バッジ**
- **狭幅（スマホ）: 合計のみ**

## 実装メモ

### 1. 集計を Shell Context に集約（`web/src/components/web-mode-shell.tsx`）
- `aiUsageSummary: AiUsageSummary | null` state と `refreshAiUsage()` を追加。
  - ブラウザクライアントは `createBrowserSupabaseClient()` を `useMemo` で生成（パネルと同じもの）。
  - `refreshAiUsage` は `getAiUsageSummary(supabase)` を呼んで state を更新（`@/lib/ai/usage`）。
  - マウント時 `useEffect` で1回 `refreshAiUsage()`。
- `ShellStatusContext` に `aiUsageSummary` / `refreshAiUsage` を追加。`useShellAiUsage()` フックを公開する。
  - 既存の context 既定値も更新し、Provider 無しでも安全（`aiUsageSummary: null` / `refreshAiUsage: async () => {}`）にする（テスト・単体描画用）。
- `.canvas-status-bar` 内に `<AiUsageMeter variant="statusbar" summary={aiUsageSummary} />` を描画する。状態テキストの ellipsis と共存させる。

### 2. メーターにコンパクト表示を追加（`web/src/components/ai-usage-meter.tsx`）
- 任意 props `variant?: "panel" | "statusbar"`（既定 `"panel"`）。
- `"statusbar"` ではラベル「本日のAI残り」と注記文を省き、3バッジのみのコンパクト描画（ルート要素に `data-variant="statusbar"` 等を付与）。
- 既存の panel 用途（`feature` 付き、注記あり）は不変。

### 3. パネルを context 参照へ置換（`inventory-board.tsx` / `recipe-meal-workspace.tsx`）
- ローカルの `aiUsage` state / `getAiUsageSummary` import / `refreshAiUsage` / マウント時fetch を削除し、`useShellAiUsage()` の `aiUsageSummary` / `refreshAiUsage` を使う。
- パネル内の `<AiUsageMeter feature=…>` とボタン無効化ロジックはそのまま（context の summary を渡す）。
- AI実行（scan / recipe生成）後の更新は context の `refreshAiUsage()` を呼ぶ。

### 4. CSS（`web/src/app/globals.css`）
- `.canvas-status-bar .ai-usage-meter[data-variant="statusbar"]` のコンパクトスタイル（小さめバッジ、gap調整）。
- 狭幅メディアクエリで機能別バッジ（レシピ・写真）を非表示にし、合計バッジのみ表示。
- 既存 `.canvas-status-text` の省略表示を維持しつつバーが崩れないようにする。

### 5. テスト（`web/src/__tests__/`）
- `ai-usage-meter.test.tsx`: `variant="statusbar"` でラベル/注記が出ず3バッジが出ること。
- 既存パネルテスト: context 依存になるため、最小のテスト用 Provider（または `useShellAiUsage` のモック）で summary を供給する形に更新。ボタン無効化・AI実行後の `refreshAiUsage` 呼び出しの検証を維持する。
- 可能なら shell の集計取得・表示の軽いテストを追加（rpc モック）。

### 共通方針
- Web版ではGAS/Spreadsheet/Driveを使わない。APIキー・秘密情報は直書きしない。
- 既存のコード規約・命名・import エイリアス（`@/`）・immutable patterns に合わせる。console.log を残さない。

## 残リスク

- 大きいパネル2ファイルの state 配線を触る（変更は局所的だが、既存テストの更新が必要）。
- ステータスバーは高さ約32px・中央寄せで狭く、狭幅では合計のみに間引く前提。実機スマホでの最終目視は別途。
- `/check-gates` の diff 自動判定で危険evalに過剰マッチした場合、manual-smokes.md / review.md の追加が必要になる。
