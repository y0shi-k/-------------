---
id: SPEC-0117-unit-conversion-web
title: 単位換算Web移植
status: spec_ready
scope:
  - web/
  - supabase/
  - inventory consumption
constraints:
  - CSV移行前にschemaを確定する
  - 換算できない場合は手入力で安全に補正できる
acceptance:
  - 在庫に単位換算情報を保存できる
  - レシピ単位と在庫単位が違う場合に消費量を扱える
  - 調理完了チケットで使えるデータ構造がある
related_tickets:
  - TKT-0117-unit-conversion-web
---

# Summary

Canvas版の単位換算をWeb版に移し、調理完了時の在庫減算に備える。
