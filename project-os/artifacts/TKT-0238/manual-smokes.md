---
ticket_id: TKT-0238-location-picker-label-touch-fix
status: passed
execution_mode: static_only
target_evals:
  - pwa_mobile_ui
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- pwa_mobile_ui（ticket の required_evals）
- `/check-gates` が示した supabase_schema_change / photo_upload_storage は、同一作業ツリー上の並行チケット（TKT-0239 の inventory_items select、チケットmd内の「写真」語彙）による**過剰マッチ**。本チケットは JSX ラッパー変更と CSS 追記のみで、schema / policy / Storage / 写真経路に変更なし。

## executed_checks

- `npx vitest run src/__tests__/inventory-board.test.tsx` → 28件 全パス（実装サブエージェント実行・オーケストレーター verify でも全テスト再実行 pass）
- `bash harness/bin/verify_web.sh TKT-0238` → lint / typecheck / test / build / policy すべて pass
- diff 静的確認: 変更が `inventory-board.tsx`（label→div+span 2箇所）と `globals.css`（ラベル見た目の最小追記）に限定されること

## skipped_checks

- タブレット実機（iPad 等）でのタッチ操作確認: 本環境に実機がないためスキップ。ユーザー側スモーク手順は report.md「次の依頼や人判断」参照
- PC ブラウザでの目視レイアウト確認（編集モーダルのラベル見た目）: DevTools 確認はユーザー側に委ねる

## open_risks

- 実機タッチでの修復確認が未了（推定原因に基づく修正）。万一解消しない場合は、ポップオーバーの外側閉鎖が `mousedown` のみ監視である点（タッチ系イベント未監視）を次の調査候補とする
