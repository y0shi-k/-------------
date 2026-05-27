---
id: SPEC-0141-web-direct-inventory-add-flow
title: Web版 食材追加フロー整理
status: spec_ready
scope:
  - web/
  - inventory_items
  - ingredient_scan_api
constraints:
  - Canvas版 app.html は変更しない
  - staging_items テーブルは削除しない
  - Gemini APIキーはサーバー側だけで扱う
  - 写真は非公開Storageに保存し、ブラウザには署名URLやAPIキーを出さない
acceptance:
  - プラスボタンから画像スキャンと手動追加を選べる
  - 手動追加は登録待ちを経由せず在庫へ保存される
  - 写真解析候補は確認してから在庫へ保存される
  - 登録待ちUIは新しいWeb導線から外れる
related_tickets:
  - TKT-0141-web-direct-inventory-add-flow
---

# Summary

Web版の食材追加を、Supabaseへ即時保存できる特性に合わせて直接在庫登録へ整理する。
