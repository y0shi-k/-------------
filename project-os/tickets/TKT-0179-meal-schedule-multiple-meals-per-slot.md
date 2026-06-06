---
id: TKT-0179-meal-schedule-multiple-meals-per-slot
title: 1スロット（日付×食事タイプ）に複数献立を全件表示する
status: implementation_ready
goal: 1回の食事が複数レシピのこともあるのに、1スロットに先頭1件しか表示されず他の献立が隠れる問題を解消する。
acceptance:
  - 同じ日付・同じ食事タイプ（朝/昼/晩）に複数の献立がある場合、その全件がカードとして縦に並んで表示される。
  - 献立が増えるとスロットの高さ（行）が自動で広がり、カードが重ならない・隠れない。
  - 各カードは従来どおり選択（スロットメニューを開く）・ドラッグ移動・完了バッジ表示・×削除（TKT-0178）が機能する。
  - 献立が0件のスロットは従来どおり空表示（data-empty）で、＋追加ボタンが押せる。
  - スマホ幅・PC幅のどちらでもカードが崩れず、複数件でレイアウトが破綻しない。
  - 同一スロット複数献立が全件描画されることを確認するテストが追加され、Web版verifyが通る。
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0179-meal-schedule-multiple-meals-per-slot/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0179-meal-schedule-multiple-meals-per-slot
related_artifacts:
  - artifacts/TKT-0179-meal-schedule-multiple-meals-per-slot/verify.json
  - artifacts/TKT-0179-meal-schedule-multiple-meals-per-slot/report.md
owner_role: implementer
owner_notes:
  - DB変更は不要。`meal_schedules` は (user_id, scheduled_on, meal_type) に**unique制約が無く**（`supabase/migrations/20260523094705_schema_v1.sql` line 99-112 はindex `meal_schedules_user_date_idx` のみ）、`addScheduleEntry`（recipe-meal-workspace.tsx line 964-1008）も毎回insertするため、同一スロット複数行は既にデータ層で成立している。**表示だけが先頭1件に絞られている**のが原因。
  - 原因箇所: recipe-meal-workspace.tsx line 2262 `const schedule = daySchedules.find((item) => item.meal_type === mealType)`。これを `filter` にして配列を map する。
  - 非危険変更（CSS/JSXの表示のみ）。`required_evals` は `pwa_mobile_ui`。もし `/check-gates` が table名トークン（meal_schedules等）で `supabase_schema_change` に過剰マッチしたら、report に「実schema/RLS/Storage 無変更・表示のみ」と記録する（backlog の過去チケットと同じ運用）。
  - Canvas版 `app.html` は触らない。GAS/Spreadsheet/Drive 不使用。
---

# Summary

7日献立スケジュールの各スロット（日付×食事タイプ）を、複数献立があれば全件カード表示し、件数に応じて
スロットの高さを自動で広げる。DBは既に複数行を許しているため、描画ロジック（find→filter+map）と
CSS（縦積み・高さ自動）の変更のみで成立する。

## 実装メモ（前提なしで着手できるよう詳述）

### 1. 描画ロジック（recipe-meal-workspace.tsx ≈line 2260-2333）
- 現状: `scheduleMealTypes.map(mealType => { const schedule = daySchedules.find(... === mealType); ... {schedule ? <article .../> : null} })`。
- 変更: `const slotSchedules = daySchedules.filter((item) => item.meal_type === mealType)` にし、`slotSchedules.map((schedule) => <article key={schedule.id} .../>)` で複数カードを描画。
- 空判定 `data-empty={!schedule}` は `data-empty={slotSchedules.length === 0}` に変更。
- `isSelected`（line 2263）は各カードごとに `selectedSchedule?.id === schedule.id` で判定。
- ドラッグ&ドロップ（slot側 onDrop, line 2279-2286 / `moveScheduleToSlot` line 1112）はスロット単位のまま。複数あっても末尾追加移動で問題ない。各カードの onDragStart は維持。
- ＋追加ボタン（line 2290-2297）はスロットヘッダに従来どおり1つ。

### 2. CSS（web/src/app/globals.css、`.schedule-slot` / `.schedule-day-slots` / `.schedule-meal-card` 周辺、≈line 2599〜）
- スロットを固定高ではなく `min-height` + 縦並び（flex column か gap）にして、カード件数で高さが伸びるようにする。
- カード間に `gap` を入れ、複数枚でも重ならないようにする。
- PC幅（1024px ブロック、TKT-0165 で縦アジェンダ化済み）とスマホ幅の両方で確認。既存のトーン（TKT-0165/0166 のデザイン正本 `docs/design/pc-design-language.md`）を壊さない。

### 3. テスト（web/src/__tests__/recipe-meal-workspace.test.tsx）
- 同一 `scheduled_on` + `meal_type` に2件の `meal_schedules` を与え、両方の recipe_name がレンダリングされることを確認。

## 検証メモ

- `/verify TKT-0179-meal-schedule-multiple-meals-per-slot`。
- 目視（report に記録）: 同一スロットに2件以上追加 → 両方見える・行が伸びる・各カードの選択/ドラッグ/×が効く・空スロットの＋が押せる。スマホ/PC両幅。

## 非ゴール

- 完了解除・削除時の在庫/履歴の巻き戻し（→ TKT-0178）。
- 完成写真の候補化（→ TKT-0180）。
- スロットの並び順変更UIや、1スロット内のカード並べ替え（本チケットは表示のみ）。
- DBスキーマ変更・unique制約の追加/削除。

## 依存チケット

- TKT-0178（×ボタン追加）と同じカードDOMを編集する。推奨実装順は TKT-0178 → TKT-0179。単独着手も可能だが、その場合は TKT-0178 側で×ボタンを載せる際に本チケットの filter+map 構造へ合流させる。

## 残リスク

- 1スロットに大量の献立を入れると縦に長くなる。当面は上限を設けず自然に伸ばす（必要なら将来チケットでスクロール/折りたたみ）。
