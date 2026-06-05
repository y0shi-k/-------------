---
id: SPEC-0153-ai-usage-statusbar
title: 本日のAI残り回数を上部ステータスバーに常時表示する
status: spec_ready
scope:
  - web/src/components/web-mode-shell.tsx
  - web/src/components/ai-usage-meter.tsx
  - web/src/components/inventory-board.tsx
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - Supabase schema / RLS / AI route のロジックは変更しない（既存 `get_ai_usage_summary` を読むだけ）
  - Gemini APIキーをログ・レスポンス・表示に出さない
  - 既存のAI実行フロー（consume/返金）とボタン無効化挙動を壊さない
acceptance:
  - 上部ステータスバー（`.canvas-status-bar`）に本日のAI残り回数が常時表示される
  - PC幅ではレシピ・写真・合計の3バッジ、狭幅（スマホ）では合計のみ表示される
  - AIレシピ生成・食材写真解析の実行（成功・上限超過・返金）後、ステータスバーの数字が即座に更新される
  - ステータスバーとパネル内メーターが同じ集計値（単一ソース）を参照し、ズレない
  - 集計取得に失敗してもステータスバー・パネルが壊れない（残り0と誤表示しない）
  - Web版verifyが通る
related_tickets:
  - TKT-0153-ai-usage-statusbar
---

# Summary

TKT-0151で追加した「本日のAI残り回数」を、各AIパネルだけでなく**上部ステータスバーに常時表示**し、どの画面にいても残量がひと目で分かるようにする。

## 背景

現状、AI残り回数（`get_ai_usage_summary` の結果）は `inventory-board.tsx` と `recipe-meal-workspace.tsx` が**各自で**取得・表示している。食材／レシピのパネルを開いていないと残量が見えず、また2か所が独立してfetchしているため、片方でAIを実行してももう片方は古いままになりうる。常時見える場所（上部ステータスバー）に出し、集計を1つに集約する。

## 仕様

### 集計の単一ソース化
- AI集計（`AiUsageSummary`）を `WebModeShell` の `ShellStatusContext` に持ち上げる。
- `WebModeShell` がマウント時に `getAiUsageSummary()`（ブラウザSupabaseクライアント）を1回呼び、`aiUsageSummary` state に保持する。
- `refreshAiUsage()` を context 経由で公開し、ステータスバーと両パネルが共有する。
- 取得は `get_ai_usage_summary` RPC を読むだけ。schema/RLS/route は変更しない。

### ステータスバー表示
- `.canvas-status-bar` 内にコンパクト版の `AiUsageMeter`（`variant="statusbar"`）を描画する。
- PC幅: レシピ・写真・合計の3バッジ。
- 狭幅（スマホ）: 合計バッジのみ表示（CSSメディアクエリで機能別バッジを非表示）。
- 既存の状態テキスト省略（ellipsis）と共存させ、バーを崩さない。

### パネル側
- `inventory-board.tsx` / `recipe-meal-workspace.tsx` のローカル AI集計 state を context 参照へ置換する。
- パネル内メーター（`feature` 付き）とボタン無効化はそのまま維持する。
- AI実行後の更新は context の `refreshAiUsage()` を呼ぶ。

## 非対象

- 上限値や上限ロジックの変更（TKT-0151のまま）
- `ai_usage_events` のスキーマ・RLS・関数の変更
- AI route（recipes / scan-ingredients）のサーバーロジック変更

## 手動確認

- ステータスバーに本日のAI残り回数が出る。
- AIレシピ生成後、ステータスバーのレシピ／合計が即座に減る。
- 食材写真解析後、ステータスバーの写真／合計が即座に減る。
- 上限到達時、ステータスバーとパネル両方が0表示になる。
- スマホ幅でステータスバーが崩れず、合計のみ表示になる。
