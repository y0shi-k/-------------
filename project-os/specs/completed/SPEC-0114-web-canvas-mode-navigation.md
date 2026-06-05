---
id: SPEC-0114-web-canvas-mode-navigation
title: Web版Canvas同等ナビとステータス
status: spec_ready
scope:
  - web/
  - bottom navigation
  - status UI
constraints:
  - Canvas版 `app.html` は変更しない
  - GAS/Spreadsheet/Driveは使わない
  - 既存のSupabase保存処理を壊さない
acceptance:
  - 食材管理、献立・レシピ、料理・記録をCanvas版と同じ主モードとして切り替えられる
  - スマホで下部ナビが使いやすい
  - 処理中、成功、失敗、AI処理の状態が常設または見失わない形で表示される
  - Web版verifyが通る
related_tickets:
  - TKT-0114-web-canvas-mode-navigation
---

# Summary

Web版の縦長ホームを、Canvas版に近い3モード構成へ寄せる。完全一致作業の入口として、以後の画面追加先を明確にする。
