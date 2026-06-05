---
id: TKT-0059-inventory-unit-conversion
title: 在庫単位に揃える双方向単位換算の実装
status: verify_passed
goal: レシピ単位と在庫単位が違う材料でも、料理完了時に在庫側の単位で正しく減算できるようにする
acceptance:
  - 食材在庫シートに `単位換算JSON` 列が追加される
  - 食材登録・編集フォームで在庫行ごとの換算を保存できる
  - 消費量調整画面で同一単位・換算あり・換算なし手入力の3ケースを扱える
  - g→パック / パック→g の両方向で減算できる
  - pendingSync + syncPendingChanges の手動一括同期を維持する
  - verify がパスする
required_evals:
  - schema_change
  - ui_component_addition
  - manual_bulk_sync_policy
  - verify_html_valid
  - verify_gas_integration
eval_selection_mode: auto
changed_paths:
  - app.html
  - .agents/rules/schema.md
  - project-os/specs/SPEC-0059-inventory-unit-conversion.md
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0059-inventory-unit-conversion
related_artifacts:
  - artifacts/TKT-0059/verify.json
  - artifacts/TKT-0059/manual-smokes.md
  - artifacts/TKT-0059/report.md
owner_role: implementer
owner_notes:
  - 専用列追加はユーザー許可済みとして扱う
  - 新規即時GAS通信は追加しない
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
---

# Summary

SPEC-0059 に基づき、食材在庫ごとの単位換算定義と料理完了時の在庫単位減算を実装する。

## 実装メモ

- `単位換算JSON` は既存の `最終編集日時` の直前に挿入し、既存の最終編集日時を保持する。
- 既存在庫に換算がない場合でも、同一単位の消費は従来通り扱う。
- 換算未設定の単位違いは、消費量調整画面上の今回消費量入力でのみ扱う。

## 残リスク

- 同名の複数在庫行が異なる換算を持つ場合、既存の在庫消費順に従うため、ユーザーが意図する商品順と異なる可能性がある。
