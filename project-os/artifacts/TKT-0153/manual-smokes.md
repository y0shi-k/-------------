---
ticket_id: TKT-0153
status: passed
execution_mode: automated_and_static
target_evals:
  - pwa_mobile_ui
  - supabase_schema_change
  - photo_upload_storage
---

# TKT-0153 manual smokes

実行日時: 2026-06-02 19:46 JST

## 注記

- `pwa_mobile_ui` が本来の対象。`supabase_schema_change` / `photo_upload_storage` は `/check-gates` の
  diff 自動判定が、AIパネル（`inventory-board.tsx` / `recipe-meal-workspace.tsx`、写真/Storage/テーブル名等の語を含む）への
  変更に過剰マッチしたもの。**本チケットはUI表示のみで、スキーマ・RLS・Storage・写真処理・AI route のロジックは変更していない。**

## target_evals

- `pwa_mobile_ui`: 上部ステータスバーに本日のAI残り回数を表示。PCは3バッジ、狭幅は合計のみ。
- `supabase_schema_change`（過剰マッチ）: 実変更なし。既存 `get_ai_usage_summary` を読むのみ。
- `photo_upload_storage`（過剰マッチ）: 実変更なし。写真取り込み・圧縮・Storage保存は不変。

## executed_checks

| 項目 | 結果 | メモ |
|---|---:|---|
| verify一式 | pass | `harness/bin/verify_web.sh TKT-0153` で lint/typecheck/test/build/policy すべて pass |
| statusbar variant 表示 | pass | `ai-usage-meter.test.tsx` でラベル/注記なし・3バッジ・data-variant を確認 |
| shell の集計取得・表示 | pass | `web-mode-shell.test.tsx` でマウント時 rpc 呼び出しとメーター表示を確認 |
| 取得失敗時に非表示 | pass | summary が ok=false のときメーター非表示を確認 |
| Provider外での安全性 | pass | `useShellAiUsage` を Provider外で呼んでも既定値で壊れない |
| 単一ソース（パネルが context 参照） | pass | inventory-board / recipe-meal-workspace が `useShellAiUsage` 由来でボタン無効化 |
| AI実行後の更新 | pass | scan / recipe生成後に context の `refreshAiUsage` が呼ばれることを確認 |
| 写真処理・Storage の退行なし | pass | 既存 scan / 写真関連テストが通過（ロジック未変更） |
| ビルド成功 | pass | `npm run build` 通過 |

実行コマンド:

```bash
harness/bin/verify_web.sh TKT-0153
```

## skipped_checks

- 実機スマホ/in-app Browser での目視（ステータスバー崩れ・狭幅で合計のみ）は未実施。理由はこの環境で実機操作がないため。自動テストとCSSでは破綻なし。
- 実Gemini APIキーでのライブ実行は未実施（実キー送信・課金回避のため）。本チケットはAI実行ロジックを変更しないため影響なし。

## open_risks

- 狭幅ブレークポイント `480px` は spec 未指定。実機で窮屈なら閾値調整の余地。
- ステータスバーは高さ約32px・中央寄せで狭く、状態テキストと残り回数の同居は ellipsis 前提。実機での最終目視が望ましい。
