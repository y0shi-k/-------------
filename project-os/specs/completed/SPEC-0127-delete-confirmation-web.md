---
id: SPEC-0127-delete-confirmation-web
title: Web版削除確認統一
status: spec_ready
scope:
  - web/
  - delete confirmation
constraints:
  - ブラウザ標準confirmに頼らない
  - 誤削除を防ぐ
acceptance:
  - 削除操作に統一された確認UIがある
  - 在庫、登録待ち、買い物、レシピ、献立、履歴で誤削除しにくい
related_tickets:
  - TKT-0127-delete-confirmation-web
---

# Summary

Canvas版の独自削除確認体験をWeb版へ移す。
