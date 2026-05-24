---
id: SPEC-0132-meal-schedule-workspace-visual-parity
title: スケジュール画面Canvas表示寄せ
status: spec_ready
scope:
  - web/
  - meal schedule workspace
  - recipe picker
constraints:
  - Supabase保存処理を壊さない
  - スマホ操作を優先し、ドラッグだけに依存しない
  - Canvas版 `app.html` は変更しない
acceptance:
  - 献立・レシピ内の `スケジュール` タブで7日分が見やすい
  - 朝/昼/晩スロットと追加入口が分かる
  - 今日の強調、日送り、削除、移動の導線が分かる
  - スマホで予定追加と確認がしやすい
  - Web版verifyが通る
related_tickets:
  - TKT-0132-meal-schedule-workspace-visual-parity
---

# Summary

献立スケジュールをCanvas版の7日表示、朝昼晩スロット、スロット内追加導線へ寄せる。
