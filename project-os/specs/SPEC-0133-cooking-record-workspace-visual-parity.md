---
id: SPEC-0133-cooking-record-workspace-visual-parity
title: 料理・記録画面Canvas表示寄せ
status: spec_ready
scope:
  - web/
  - cooking workspace
  - cooking viewer
  - cooking history
constraints:
  - 写真Storageは非公開を維持する
  - Supabase保存処理と在庫減算処理を壊さない
  - Canvas版 `app.html` は変更しない
acceptance:
  - 下部ナビの `料理・記録` から今日、調理、履歴へ迷わず進める
  - 調理ビューアは材料/調味料/手順の確認がしやすい
  - 調理完了から在庫消費、料理記録、履歴保存の流れが分かる
  - 料理履歴はタイムライン、カレンダー、振り返りの入口が分かる
  - スマホで調理中に操作しやすい
  - Web版verifyが通る
related_tickets:
  - TKT-0133-cooking-record-workspace-visual-parity
---

# Summary

料理・記録モードをCanvas版の画面導線へ寄せ、調理中と履歴確認をスマホで使いやすくする。
