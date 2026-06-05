---
id: SPEC-0121-meal-schedule-canvas-parity
title: 献立Canvas同等化
status: spec_ready
scope:
  - web/
  - meal_schedules
constraints:
  - 既存予定を壊さない
  - 調理完了の在庫消費はTKT-0125で扱う
acceptance:
  - 7日表示と日送りができる
  - レシピ選択、削除、移動ができる
  - スマホで予定を確認しやすい
related_tickets:
  - TKT-0121-meal-schedule-canvas-parity
---

# Summary

Web版の献立をCanvas版の週表示と操作感に近づける。
