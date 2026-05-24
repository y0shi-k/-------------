---
id: SPEC-0115-inventory-staging-canvas-parity
title: 在庫・登録待ちCanvas同等化
status: spec_ready
scope:
  - web/
  - inventory_items
  - staging_items
constraints:
  - GAS/Spreadsheet/Driveは使わない
  - 個人データはSupabase RLSで本人だけに限定する
acceptance:
  - 保存場所タブ、期限、ソート、使い切り、選択操作がCanvas版に近い
  - 登録待ちの手動追加、写真AI解析、在庫確定、一括削除が使える
  - スマホで在庫と登録待ちを行き来しやすい
related_tickets:
  - TKT-0115-inventory-staging-canvas-parity
---

# Summary

Web版の在庫と登録待ちを、Canvas版の日常操作に近づける。
