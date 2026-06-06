---
id: SPEC-0179-meal-schedule-multiple-meals-per-slot
title: 1スロット（日付×食事タイプ）に複数献立を全件表示する
status: spec_ready
scope:
  - web/src/components/recipe-meal-workspace.tsx（7日スケジュールの描画 find→filter+map）
  - web/src/app/globals.css（スロット/カードのレイアウト）
  - web/src/__tests__/recipe-meal-workspace.test.tsx
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - DBスキーマ変更・unique制約の追加/削除をしない（表示のみの変更）
  - 既存のデザイントーン（docs/design/pc-design-language.md, TKT-0165/0166）を壊さない
acceptance:
  - 同一 scheduled_on + meal_type に複数献立があると全件がカードで縦に並ぶ
  - 件数に応じてスロット高さが自動で広がり、カードが重ならない・隠れない
  - 各カードの選択・ドラッグ移動・完了バッジ・×削除が機能する
  - 0件スロットは空表示で＋追加が押せる
  - スマホ/PC両幅で崩れない
  - 複数件全件描画のテストが追加され、Web版verifyが通る
related_tickets:
  - TKT-0179-meal-schedule-multiple-meals-per-slot
---

# Summary

献立スケジュールの各スロットを、複数献立があれば全件カード表示し、件数に応じて高さを自動で広げる。

## 背景

1回の食事が複数レシピのこともあるが、現状は描画が `daySchedules.find(... === mealType)` で先頭1件に
絞られ、他の献立が隠れる。DBは (user_id, scheduled_on, meal_type) に unique 制約が無く
（index のみ）、`addScheduleEntry` も毎回 insert するため、複数行はデータ層で既に成立している。
問題は表示だけ。

## 仕様

- recipe-meal-workspace.tsx ≈line 2262 の `find` を `filter` にし、`slotSchedules.map` で全件描画。
- `data-empty` は `slotSchedules.length === 0` で判定。`isSelected` は各カードで `selectedSchedule?.id === schedule.id`。
- ドラッグ&ドロップはスロット単位のまま（複数あっても末尾追加移動）。＋追加ボタンはスロットに1つ。
- CSS（`.schedule-slot`/`.schedule-day-slots`/`.schedule-meal-card`、≈line 2599〜）を固定高から min-height + 縦並び + gap に変更。

## 非対象

- 完了解除・削除時の在庫/履歴巻き戻し（SPEC-0178）。
- 完成写真の候補化（SPEC-0180）。
- スロット内の並べ替えUI・スクロール/折りたたみ・スキーマ変更。

## 実装メモ

- TKT-0178 と同じカードDOMを編集するため、実装順は TKT-0178 → TKT-0179 推奨。
- 非危険変更（CSS/JSX表示のみ）。`/check-gates` が table名トークンで supabase_schema_change に過剰マッチしたら「実schema無変更・表示のみ」と report に記録。

## 残リスク

- 1スロットに大量の献立を入れると縦に長くなる（当面は自然に伸ばす。将来チケットでスクロール/折りたたみ検討）。
