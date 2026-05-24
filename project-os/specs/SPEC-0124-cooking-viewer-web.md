---
id: SPEC-0124-cooking-viewer-web
title: 調理ビューアWeb移植
status: spec_ready
scope:
  - web/
  - recipes
  - inventory check
constraints:
  - 調理完了の在庫減算はTKT-0125で扱う
  - スマホ調理中の見やすさを優先する
acceptance:
  - 材料/調味料タブがある
  - 在庫チェック表示がある
  - 下準備/調理工程タブがある
  - 手順内の材料照合ができる
related_tickets:
  - TKT-0124-cooking-viewer-web
---

# Summary

Canvas版の調理中画面をWeb版へ移す。
