---
ticket_id: TKT-0165-web-desktop-schedule-vertical-agenda
status: ready
---

# TKT-0165 実装レポート

## 変更目的

TKT-0159 で導入したPC幅（>=1024px）の「7列横並びスケジュール」が、各日カードを盤面の全高まで引き伸ばし、朝・昼・晩の3スロット下に大きな縦余白（死に領域）を生んでいた。1日あたり最大3枠しかないデータ構造に対し7列は間延びしすぎるため、PC幅でもスマホ版と同じ「1日=1行」の縦アジェンダ表示へ統一し、余白を解消した。

## 今回追加した安全装置

- 変更は `web/src/app/globals.css` の `@media (min-width: 1024px)` 内、スケジュール関連オーバーライドのみに限定（CSSのみ）。
- JSX（`recipe-meal-workspace.tsx`）のDOM構造・状態管理・保存処理（meal_schedules への insert/update/delete、DnD、スロットメニュー）は一切変更していない。
- スマホ幅のレイアウト・操作はベーススタイルをそのまま使うため影響なし。PC幅をベース（縦積み）へフォールバックさせ、`.schedule-board` を `width: min(760px, 100%); margin: 0 auto;` に制限して間延びを防いだだけ。
- AI route、写真Storage、Auth/RLS、Supabase schema、APIキー管理には触れていない。

## 実施した確認

- `harness/bin/verify_web.sh TKT-0165-web-desktop-schedule-vertical-agenda`: VERIFY_PASSED
  - lint: pass / typecheck: pass / test: pass / build: pass
  - policy: no_gas_dependency pass / no_hardcoded_secret pass / supabase_rls_present pass
- `harness/bin/check_gates.py`: 該当 active eval なし（CSSのみで危険evalの diff_regex に一致せず）。既定の軽量プロセス（verify.json + report.md）で完了。
- CSS構造の確認:
  - PC幅で `.schedule-days-grid` が単一カラムに戻り、`.schedule-board` が中央寄せ・最大760px。
  - ベースの `.schedule-day`（flex行: 日付バッジ＋朝昼晩の横並びスロット）・`.schedule-board`（上下シフト↑↓が上下バー）へフォールバック。

## 残リスク

- 760px制限により超ワイドディスプレイでは盤面が中央に寄る（死に余白よりも可読性を優先した意図的な仕様）。
- 実機・各幅（1024〜1280px境界、スマホ）での目視確認は未実施。ブラウザ目視での最終確認を推奨。

## 次の依頼や人判断

- 実機でPC/スマホ両方を開き、縦アジェンダの見た目と余白解消を確認する。
- 760px の最大幅が好みに合うか（もっと広く/狭くするか）は実機で判断する。必要なら同チケットの軽微調整で対応可能。
