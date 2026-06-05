---
id: SPEC-0054-schedule-meal-name-normalization
title: レシピ詳細スケジュール追加の食事区分正規化
status: ready
scope:
  - app.html のレシピ詳細経由スケジュール追加
  - app.html のスケジュール表示フィルタ
constraints:
  - スプレッドシートスキーマ変更なし
  - GAS通信パターン変更なし
  - `state.pendingSync` 構造変更なし
acceptance:
  - レシピ詳細から夕食枠へ追加した献立が、スケジュール画面の晩枠に表示される
  - 既に `夜` としてローカル/スプシから読み込まれた献立も、晩枠に表示される
  - 今後の詳細経由追加は `晩` として pendingSync に積まれる
  - verify が PASS すること
related_tickets:
  - TKT-0054-schedule-meal-name-normalization
---

# Summary

レシピ詳細の「スケジュールに追加」モーダルだけ夕食ラベルに `夜` を使っており、スケジュール画面の表示条件 `晩` と一致しない問題を修正する。
