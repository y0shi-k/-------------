---
id: TKT-0175-ingredient-standard-image-catalog
title: 食材標準画像カタログ（無料利用可能アセット）
status: implementation_ready
goal: 食材画像が未登録でも、主要食材は標準画像/アイコンで見分けやすく表示できるようにする
acceptance:
  - 主要な食材・調味料に標準画像または標準アイコンが割り当てられる
  - `ingredient-image` resolverが食材名の表記ゆれを吸収する
  - 標準画像がない食材は既存絵文字にフォールバックする
  - 追加アセットの出典・ライセンス・利用条件がartifactまたはdocsに記録される
  - 在庫一覧で標準画像表示が崩れない
  - スマホ幅で画像/絵文字/文字が重ならない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/public/images/ingredients/
  - web/src/lib/ui/ingredient-image.ts
  - web/src/components/
  - web/src/app/globals.css
  - web/src/__tests__/
  - docs/
  - project-os/artifacts/TKT-0175-ingredient-standard-image-catalog/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0175-ingredient-standard-image-catalog
related_artifacts:
  - artifacts/TKT-0175-ingredient-standard-image-catalog/verify.json
  - artifacts/TKT-0175-ingredient-standard-image-catalog/report.md
owner_role: implementer
owner_notes:
  - 依存: TKT-0170（食材絵文字）完了。TKT-0176の前に実装してよい。
  - 外部素材を使う場合は、必ず実装時点でライセンスを確認し、出典と条件をartifactまたはdocsに残す。
  - ライセンス不明な画像、スクレイピング画像、商用不可素材は使わない。
  - まず主要食材に絞る。完全網羅より、追加しやすいresolverとフォールバックを優先する。
  - DB schema / Storage / auth / RLS は変更しない。
  - Canvas版 `app.html` は触らない。
---

# Summary

在庫や買い物リストで、食材が絵文字だけに頼らず見分けられるよう、標準画像カタログを用意する。

## 実装メモ

- `web/src/lib/ui/ingredient-image.ts` を新規作成する。
- `resolveIngredientImage(name, category)` のような関数で標準画像パスを返す。
- 画像なしなら既存の絵文字resolverに戻す。
- 初期対象はSPEC記載の主要食材から実装し、アセット容量を抑える。
- テストは代表食材、表記ゆれ、未知食材フォールバックを確認する。

## 検証メモ

- `/verify TKT-0175-ingredient-standard-image-catalog`
- スマホ幅の在庫一覧で画像・絵文字・食材名が重ならないことを確認する。

## 残リスク

- 外部素材のライセンス確認が必要。確認できない素材は使わない。
