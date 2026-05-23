---
id: SPEC-0105-inventory-and-staging-web
title: 在庫と登録待ちのWeb版移植
status: spec_ready
scope:
  - web/
  - inventory_items
  - staging_items
constraints:
  - 写真取り込みとAI解析は TKT-0106/TKT-0107 で扱う
  - Canvas版 `app.html` は変更しない
  - Web版ではGAS/Spreadsheetを使わない
acceptance:
  - 在庫一覧を表示できる
  - 登録待ち候補を作成・編集・削除できる
  - 登録待ち候補を確認して在庫へ確定できる
  - スマホで主要操作が押しやすい
related_tickets:
  - TKT-0105-inventory-and-staging-web
---

# Summary

Web版の最初の業務機能として、在庫と登録待ちを移植する。写真やAIの前に、手動で候補登録から在庫化まで動く状態を作る。

## 非対象

- AI解析
- 写真アップロード
- レシピ/献立/料理履歴
