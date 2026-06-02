---
ticket_id: TKT-0153
status: ready
---

# TKT-0153 report

## 変更目的

TKT-0151で追加した「本日のAI残り回数」を、各AIパネルだけでなく上部ステータスバーに常時表示し、どの画面にいても残量がひと目で分かるようにする。あわせて、2か所で独立していた集計取得を Shell Context に集約して単一ソース化する。

## 今回追加した安全装置

（本チケットはUI表示の変更で、新規のセキュリティ装置追加は無い。以下は実装内容。）

- 集計の単一ソース化:
  - `web-mode-shell.tsx` に `aiUsageSummary` state と `refreshAiUsage()` を追加。`createBrowserSupabaseClient()` を useMemo で生成し、マウント時に `getAiUsageSummary()` を1回呼ぶ。
  - `ShellStatusContext` に `aiUsageSummary` / `refreshAiUsage` を追加し、`useShellAiUsage()` を公開。context 既定値は `null` / async noop で、Provider外でも安全。
- 上部ステータスバー表示:
  - `.canvas-status-bar` 内に `<AiUsageMeter variant="statusbar">` を描画。
  - PC幅: レシピ・写真・合計の3バッジ。狭幅（`max-width: 480px`）: 機能別バッジを非表示にし合計のみ。
- メーター拡張:
  - `ai-usage-meter.tsx` に `variant?: "panel" | "statusbar"`（既定 panel）を追加。statusbar はラベル・注記を省きバッジのみ。既存 panel 用途は不変。
- パネル側を context 参照へ置換:
  - `inventory-board.tsx` / `recipe-meal-workspace.tsx` のローカル AI集計 state を削除し `useShellAiUsage()` を使用。パネル内メーター・ボタン無効化は維持。AI実行後は context の `refreshAiUsage()` を呼ぶ。
- 既存 `get_ai_usage_summary` RPC を読むだけ。schema / RLS / AI route のロジックは変更していない。

## 実施した確認

`harness/bin/verify_web.sh TKT-0153`

- lint: pass
- typecheck: pass
- test: pass（vitest 99件）
- build: pass
- no_gas_dependency: pass
- no_hardcoded_secret: pass
- supabase_rls_present: pass

追加確認（自動テスト）:

- statusbar variant でラベル・注記が出ず3バッジが出ること（exhaustion時も注記なし）。
- shell がマウント時に集計RPCを呼び、メーターを表示すること。取得失敗時は非表示。
- `useShellAiUsage` を Provider外で呼んでも安全（既定値）。
- パネルが context の集計でボタン無効化し、AI実行後に `refreshAiUsage` を呼ぶこと。

## 残リスク

- 実機スマホでの目視（ステータスバー崩れ・狭幅で合計のみ）は未実施。自動テストとCSSでは破綻なし。
- 狭幅ブレークポイントは `480px` とした（specに明示なし）。実機で窮屈なら調整余地あり。
- `/check-gates` の diff 自動判定が、AIパネル（写真/Storage/テーブル名等の語を含む）への変更により `supabase_schema_change` / `photo_upload_storage` に過剰マッチした。実際にはスキーマ・Storage・RLSの変更は無い（UI表示のみ）。安全側に倒して manual-smokes.md / review.md も作成した。

## 次の依頼や人判断

- 公開前の実機スマホ確認のついでに、ステータスバーの残り回数表示も目視する。
- 480px のブレークポイントで窮屈に感じる場合は閾値を上げる（要望があれば軽微調整）。
