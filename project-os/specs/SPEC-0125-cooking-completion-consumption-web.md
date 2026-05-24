---
id: SPEC-0125-cooking-completion-consumption-web
title: 調理完了と在庫消費Web移植
status: spec_ready
scope:
  - web/
  - supabase/
  - inventory consumption
  - cooking_history
constraints:
  - CSV移行前に保存形式を確定する
  - 在庫を減らしすぎない安全策を入れる
acceptance:
  - 消費量調整ができる
  - 代替品を選べる
  - 在庫を減算できる
  - 料理履歴を作成できる
related_tickets:
  - TKT-0125-cooking-completion-consumption-web
---

# Summary

Canvas版の調理完了フローをWeb版へ移し、在庫消費と履歴作成をつなげる。
