---
id: SPEC-0131-inventory-workspace-visual-parity
title: 食材管理画面Canvas表示寄せ
status: spec_ready
scope:
  - web/
  - inventory workspace
  - shopping list workspace
  - staging workspace
constraints:
  - Supabase保存処理を壊さない
  - GAS/Spreadsheet/Driveは使わない
  - 写真やAI APIキーを公開しない
  - 大きな機能追加より、Canvas版と同じ場所で操作できることを優先する
acceptance:
  - 食材管理を開くと保存場所タブと在庫カードがすぐ見える
  - 買い物リストの追加、購入済み、一括削除の入口が分かる
  - 登録待ちで画像スキャン、手動追加、在庫追加の流れが分かる
  - スマホでカード操作とタブが押しやすい
  - Web版verifyが通る
related_tickets:
  - TKT-0131-inventory-workspace-visual-parity
---

# Summary

食材管理、買い物リスト、登録待ちをCanvas版の見た目と導線へ寄せる。
