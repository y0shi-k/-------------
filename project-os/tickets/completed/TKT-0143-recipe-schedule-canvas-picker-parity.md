---
id: TKT-0143-recipe-schedule-canvas-picker-parity
title: 献立スケジュール画面のCanvas表示寄せ（ピッカー追加導線・週ナビ・日付トーン）
status: completed
goal: Web版「献立・レシピ > スケジュール」の見た目・配置・配色・余白・カード構造をCanvas版（app.html）に一致させ、追加導線をクイック追加フォームからセルの＋→レシピピッカーへ寄せる。Supabase保存処理は壊さない。
acceptance:
  - スケジュールタブが青(active)になり、各日が独立カードで色付き日付バッジ（今日=オレンジ/土=青/日=赤）を持つ
  - 空セルの「予定なし」表示を廃止し、セルの＋からレシピピッカー（モーダル）で献立を追加できる
  - レシピカードはコンパクト表示で、選択時のみ前日/翌日/調理完了/削除の操作が展開する
  - 週ナビが「前の週/今週/次の週」になり、リスト上下に1日送りの↑↓バーがある
  - moveSchedule / completeSchedule / deleteSchedule / consumption の既存挙動とSupabase呼び出しが変わらない
  - Web版verify（lint / typecheck / test / build）が通る
required_evals:
  - ui_component_addition
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0143/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0132-meal-schedule-workspace-visual-parity
related_artifacts:
  - artifacts/TKT-0143/verify.json
  - artifacts/TKT-0143/manual-smokes.md
  - artifacts/TKT-0143/review.md
  - artifacts/TKT-0143/report.md
owner_role: implementer
owner_notes:
  - Canvas版 app.html は凍結・参照専用。見た目の正として読むだけ
  - 実体はUI改修。Supabase schema / migration / RLS / Storage / auth は変更していない
  - check-gates は diff 内の文字列 `meal_schedules`（既存insert呼び出し）に反応して supabase_schema_change を保守的にマッチするが、スキーマ変更は無い。データ保護面の不変はmanual-smokes/reviewで明示確認した
  - ドラッグ＆ドロップ並べ替えと「選択モード一括削除」は本チケット対象外（移動は前日/翌日で担保）
  - 「同期は上部の同期ボタンで一括反映」テキストはWeb版（GAS非使用）に不整合のため非移植
---

# Summary

Web版 `recipe-meal-workspace.tsx` のスケジュールビューを、Canvas版 `app.html` の `renderSchedule`（7日分の独立カード＋日付バッジ＋朝昼晩スロット＋スロット内追加導線）に合わせて再構築する。追加はクイック追加フォーム廃止＋セルの＋→レシピピッカー（既存 `.modal-backdrop`/`.canvas-modal` 流儀）へ統一。

## 実装メモ

- `saveSchedule` のinsert本体を `addScheduleEntry(date, meal, recipeId)` に切り出し、ピッカーと料理画面の「献立へ追加」フォーム（薄いラッパ `saveSchedule`）で共有
- 日付トーン判定 `scheduleDateTone()` を追加し、`data-tone`（today/sun/sat/weekday）でCSS着色
- 盤面は `.schedule-board` / `.schedule-day` / `.schedule-day-badge` / `.schedule-slot` / `.schedule-meal-card` / `.schedule-meal-actions` / `.schedule-shift` のセマンティックCSSで実装（Tailwindユーティリティ直書きはしない）
- タブは `data-tab` を付与し、レシピ集=indigo / スケジュール=sky にスコープ限定で着色
- Web版ではGAS/Spreadsheet/Driveを使わない。APIキーは直書きしない。RLS/Storage権限は本変更で不変

## 残リスク

- narrowなセル内で選択時に展開する操作ボタンは縦積み（1列）。狭幅端末では縦に伸びるが、選択時のみのため許容
- 旧スケジュールCSS（`.meal-week` 等）は他クラスとの共用回避のため残置（dead CSS、無害）
