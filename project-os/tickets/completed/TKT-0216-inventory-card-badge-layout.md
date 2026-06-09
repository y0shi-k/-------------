---
id: TKT-0216-inventory-card-badge-layout
title: 食材カードの期限・換算バッジと選択チェック配置を整理する
status: completed
goal: 食材名と期限/換算バッジが同じ行で詰まり、食材名が見切れる問題を防ぐ。
acceptance:
  - 食材カードの食材名行には食材名だけを表示し、期限バッジと `1パック=xxg` などの換算バッジを同じ行に置かない
  - 期限切れ/あと何日バッジは保存場所・購入日の下に独立して表示される
  - 数量ステッパーは左寄せで横幅を取りすぎず、換算バッジはその右側に表示される
  - 選択チェックボックスはカード上部の左端寄りに表示され、食材名の表示幅を圧迫しない
  - PC幅・スマホ幅のどちらでも、食材名・バッジ・数量欄が重ならず、カードからはみ出さない
  - 数量変更、単位換算、編集、削除、選択の既存動作は変えない
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/inventory-board.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0216-inventory-card-badge-layout/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs: []
related_artifacts:
  - artifacts/TKT-0216-inventory-card-badge-layout/verify.json
  - artifacts/TKT-0216-inventory-card-badge-layout/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0216`。コマンドの正本は `harness/registry.json`
  - 非危険変更（UI配置のみ）。DB schema / Auth・RLS / Storage保存 / AI route / CSV移行は触らない
  - Canvas版 `app.html` は凍結・参照専用のため編集しない
---

# Summary

食材カード内で、食材名・期限バッジ・換算バッジが横並びになり、長い食材名が省略されやすくなっている。カード内の情報を行ごとに分け、食材名を読みやすくする。

## 実装メモ

- `inventory-board.tsx`:
  - 食材名行から `expiryBadge(item)` と `unitConversionLabel(item)` を外す。
  - 期限バッジ用の行を `item-main` 内に追加する。
  - 数量ステッパーと換算バッジをまとめるラッパーを追加する。
- `globals.css`:
  - 在庫カード内の選択チェックを左端寄りにする。
  - 数量ステッパーをコンパクトにし、換算バッジを右側へ配置する。
  - スマホ幅では必要に応じて換算バッジを下に折り返す。

## 非ゴール

- 数量計算、単位換算、保存データ、Supabaseまわりの変更。
- 食材写真・背景画像ロジックの変更。
