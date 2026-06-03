---
id: TKT-0165-web-desktop-schedule-vertical-agenda
title: PC幅の献立スケジュールを縦アジェンダ表示へ戻す（7列横並びの下部余白を解消）
status: completed
goal: TKT-0159で導入したPC幅の7列横並びスケジュールが、各日カードを盤面の全高まで引き伸ばしてスロット下に大きな余白を生む問題を解消する。スマホ版と同じ「1日=1行」の縦アジェンダ表示にPC幅でも揃える。
acceptance:
  - PC幅（>=1024px）で献立スケジュールが「1日=1行（日付バッジ＋朝・昼・晩の横並びスロット）」の縦積み表示になる
  - 日カード下部に死に領域（大きな縦余白）が出ない
  - 盤面が間延びしないよう読みやすい幅に制限され中央寄せになる
  - 上下シフト（↑↓）が左右配置ではなく上下バーに戻る
  - スマホ幅（<=640px）の既存表示・操作（追加・DnD・スロットメニュー）が従来どおり維持される
  - meal_schedules の保存処理・AI route・写真Storage・Auth/RLS・Supabase schema を変更しない（CSSのみ）
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/app/globals.css
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0159-web-desktop-recipe-meal-layout
related_artifacts:
  - artifacts/TKT-0165-web-desktop-schedule-vertical-agenda/verify.json
  - artifacts/TKT-0165-web-desktop-schedule-vertical-agenda/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0165-web-desktop-schedule-vertical-agenda`（= `harness/bin/verify_web.sh`）。
  - required_evals は `/check-gates` が diff から自動判定する。CSSのみのため pwa_mobile_ui（非危険）想定。
  - 既定の必須成果物は verify.json + report.md。危険変更ではないため manual-smokes.md / review.md は不要。
  - 危険変更（auth/RLS, supabase schema, photo storage, ai route, csv migration）には該当しない。CSSのみ。
---

# Summary

TKT-0159 のPC幅レイアウトのうち、献立スケジュールの「7列横並びグリッド」を撤去し、スマホ版と同じ縦アジェンダ表示へ統一する。これは同一画面（SPEC-0159）の見た目修正で、機能・データ処理は変更しない。

## 背景 / 根本原因

- `globals.css` の `@media (min-width: 1024px)`（おおよそ 5604–5644 行）で、
  `.schedule-days-grid { grid-template-columns: repeat(7, …); align-items: stretch; }`、
  `.schedule-day { flex-direction: column; }`、`.schedule-day-slots { flex: 1; grid-template-rows: repeat(3, minmax(92px,1fr)); }` を指定している。
- これが TKT-0157 由来の `desktop-workspace { grid-template-rows: auto minmax(0,1fr); }`（mode-panel が
  ビューポート全高まで伸びる）と噛み合い、各日カードが盤面の全高まで引き伸ばされる。中身（朝・昼・晩）は
  固定高のため、カード下部に大きな縦余白が残る。1日あたり最大3枠しかないデータ構造に対し7列は間延びしすぎ。

## 実装メモ

- 対象は `web/src/app/globals.css` の 1024px ブロック内スケジュール関連オーバーライドのみ。
- 方針:
  - 1024px の `.schedule-days-grid` / `.schedule-day` / `.schedule-day-slots` / `.schedule-day-badge` /
    `.schedule-slot` / `.schedule-shift` / `.schedule-board` のオーバーライドを撤去し、ベース（スマホ）の
    縦アジェンダ表示へフォールバックさせる。
  - `.schedule-board` を `width: min(760px, 100%); margin: 0 auto;` 程度に制限して間延びを防ぐ。
  - `.schedule-days-grid` は単一カラムに戻す。
- JSX（`recipe-meal-workspace.tsx`）のDOM構造・状態管理・保存処理は変更しない（CSSのみで完結する）。
- Web版ではGAS/Spreadsheet/Driveを使わない。APIキーは直書きしない。RLS/Storage権限への変更はない（CSSのみ）。

## 残リスク

- 760px 制限により、超ワイドなディスプレイでは盤面が中央に寄る（仕様意図どおり。死に余白よりは可読性優先）。
- 1024〜1280px 境界での見た目は実機目視で最終確認するのが望ましい。
