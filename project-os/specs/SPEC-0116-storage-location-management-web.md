---
id: SPEC-0116-storage-location-management-web
title: 保存場所管理Web移植
status: spec_ready
scope:
  - web/
  - supabase/
  - storage locations
constraints:
  - 保存場所はCSV移行前に保存形式を確定する
  - 在庫がある保存場所を誤削除しない
acceptance:
  - 保存場所を追加、表示、削除できる
  - 在庫または登録待ちで使用中の保存場所は安全に扱われる
  - CSV移行時の保存場所正規化方針が明確になる
related_tickets:
  - TKT-0116-storage-location-management-web
---

# Summary

Canvas版の保存場所管理をSupabase前提でWeb版へ移す。
