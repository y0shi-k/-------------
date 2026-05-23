---
id: SPEC-0109-recipes-and-meal-schedule-web
title: レシピ・献立・調理導線のWeb版移植
status: spec_ready
scope:
  - web/
  - recipes
  - meal_schedules
  - shopping_items連携
constraints:
  - AIレシピ生成の拡張は別途扱う
  - Canvas版 `app.html` は変更しない
  - 既存の主要ワークフローを優先し、過剰な新機能を入れない
acceptance:
  - レシピを作成・編集・閲覧できる
  - 献立へレシピを配置できる
  - 献立から買い物リストへ不足食材を反映できる
  - 調理完了を料理履歴へつなげられる
related_tickets:
  - TKT-0109-recipes-and-meal-schedule-web
---

# Summary

Canvas版のレシピ、献立、調理導線をWeb版へ移す。Web版v1で現行機能ほぼ全部に近づけるための大きな移植チケット。

## 非対象

- CSV移行
- PWA仕上げ
- 本番公開
