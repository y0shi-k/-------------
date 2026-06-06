---
id: TKT-0190-fractional-inventory-quantity
title: 在庫数量の分数入力・表示・減算対応
status: implementation_ready
goal: `1/2` や `1/3` のような分数量を在庫登録・編集・調理減算で扱えるようにし、キャベツ1個から1/3消費したら残り2/3個と分かる表示にする。
acceptance:
  - 数量入力で `1/2`, `1/3`, `2/3`, `１／２`, `0.5`, 帯分数 `2 1/2` を受け付ける
  - DB保存時は既存の numeric に合わせて number として保存される
  - 在庫一覧、AI候補、調理減算画面で代表的な端数が分数表記で表示される
  - 調理完了で `1 - 1/3 = 2/3` 相当の減算ができる
  - 不正な分数は保存せず、ユーザー向けエラーを出す
  - 既存の整数入力、g/ml の数量、単位換算が壊れない
  - 数量欄の端数エリアをクリックするとポップオーバーが開き、候補（¼ ⅓ ½ ⅔ ¾）から選べる。新しい分数を追加するとタグのように記憶し次回候補に出る
  - 分数入力・端数ボタンは g/cc(ml) 以外の単位に限定し、g/cc は小数のみで扱う
  - 分数で入力したら分数、小数で入力したら小数で表示する（減らす操作でも追従）
  - 最後に入力した表示形式を端末内に記憶し、再読込後も同じ形式で表示する（schema は変更しない）
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/lib/format/numeric.ts
  - web/src/lib/format/quantity-notation.ts
  - web/src/lib/format/fraction-candidates.ts
  - web/src/lib/inventory/types.ts
  - web/src/components/number-field.tsx
  - web/src/components/fraction-picker.tsx
  - web/src/components/inventory-board.tsx
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/
  - project-os/artifacts/TKT-0190-fractional-inventory-quantity/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0190-fractional-inventory-quantity
related_artifacts:
  - artifacts/TKT-0190-fractional-inventory-quantity/verify.json
  - artifacts/TKT-0190-fractional-inventory-quantity/report.md
owner_role: implementer
owner_notes:
  - Web版のみ。Canvas版 `app.html` は触らない。
  - DB schema変更は不要。`inventory_items.quantity` は既存 numeric のまま使う。
  - `web/src/lib/format/numeric.ts` に、入力文字列を数値へ変換する関数と、数値を短い表示文字列へ戻す関数を置くのが第一候補。
  - `NumberField` は現状 `sanitizeDecimalInput` で `/` を消しているため、分数入力を許す必要がある。
  - `normalizeForm`、AI候補表示、`adjustInventoryQuantity`、調理完了時の `nextQuantity` 算出で同じヘルパーを使い、丸めルールを散らさない。
  - エラー文は「原因」「影響」「修正方法」が分かる形にする。
  - APIキー・Supabase秘密鍵を直書きしない。GAS/Spreadsheet/Driveを使わない。
  - verify は `/verify TKT-0190-fractional-inventory-quantity`。
---

# Summary

在庫数量で分数を扱えるようにする。入力は分数を許し、保存は既存DBの numeric に合わせる。表示はできるだけ分数へ戻し、調理完了時の一部消費でも残量が分かるようにする。

## 実装メモ

- 対象:
  - `web/src/lib/format/numeric.ts`
  - `web/src/components/number-field.tsx`
  - `web/src/components/inventory-board.tsx`
  - `web/src/components/recipe-meal-workspace.tsx`
- 追加候補:
  - `parseQuantityInput(value: string): { ok: true; value: number } | { ok: false; error: string }`
  - `formatQuantity(value: number): string`
- テスト:
  - `1/2`, `１／２`, `1/3`, `2/3`, `0.5`, `1/0`, `abc`
  - 調理完了で `1個` から `1/3個` 消費

## 非対象

- 0在庫履歴（TKT-0194）
- 複数画像解析（TKT-0193）
