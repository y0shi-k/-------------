---
id: TKT-0196-cooking-step-amount-chips
title: 調理ビュー手順内の材料・調味料に使用量を表示
status: implementation_ready
goal: 調理ビューの手順を読んでいる時に、Canvas版と同じ考え方で、文中の材料名と大さじ/小さじの使用量を読みやすく分けて表示する。
acceptance:
  - 調理ビューの手順文中に出る材料・調味料名は、材料名だけのチップとして表示される
  - 手順文中の `大さじ1` / `小さじ1` などは、材料名チップとは別の分量チップとして表示される
  - 手順文に分量が書かれていない材料・調味料は、登録済み使用量を材料名の直後に別チップで補う
  - 手順文に分量が書かれている場合は、登録済み使用量を重複表示しない
  - `1大さじ` ではなく、必ず `大さじ1` / `小さじ1` の順で読める
  - 大さじと小さじはCanvas版に寄せて色分けされる
  - 食材と調味料の見た目の区別が残る
  - 材料名チップを押すと、左ペインの材料ハイライトが従来どおり動く
  - 既存レシピの手順本文は自動で書き換えない
  - 数量が0または未設定相当の場合は、無理に分量を表示しない
  - HTML文字列の直接差し込みを使わず、Reactの通常レンダリングで表示する
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0196-cooking-step-amount-chips/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0196-cooking-step-amount-chips
related_artifacts:
  - artifacts/TKT-0196-cooking-step-amount-chips/verify.json
  - artifacts/TKT-0196-cooking-step-amount-chips/manual-smokes.md
  - artifacts/TKT-0196-cooking-step-amount-chips/review.md
  - artifacts/TKT-0196-cooking-step-amount-chips/report.md
owner_role: implementer
owner_notes:
  - 現役正本はWeb版。Canvas版 `app.html` は参照のみ。
  - Canvas版 `chipifyCookingText` を参照し、材料名チップと `大さじ` / `小さじ` 分量チップを分ける。
  - Web版の既存データは本文を書き換えず、手順本文に書かれている `大さじ1` / `小さじ1` を表示時にチップ化する。
  - 手順本文に分量がない材料は、登録済み量を別チップで補う。ただし本文直後に `大さじ1` / `小さじ1` がある場合は重複させない。
  - `chipifyStep` 周辺を拡張し、材料名マッチングとハイライト挙動を壊さない。
  - XSS対策として `dangerouslySetInnerHTML` やHTML文字列組み立ては使わない。
  - APIキー・Supabase秘密鍵を直書きしない。GAS/Spreadsheet/Driveを使わない。
  - 先行実装済み差分がある場合は、実装内容がこのチケットの完了条件に収まっているか確認してからreportを書く。
  - `/check-gates` が文言により schema/Storage 系evalを過剰検出する場合は、manual-smokes.md / review.md で実変更なしを静的に証明する。
  - verify は `/verify TKT-0196-cooking-step-amount-chips`。
---

# Summary

調理ビュー右ペインの手順で、材料名チップと分量チップを分けて表示する。手順本文そのものは変更せず、表示だけを改善する。

## 実装メモ

- `chipifyStep` に `RecipeIngredient[]` を渡し、名前・分類を使って材料名チップを作る。
- 手順文中の `大さじ1` / `小さじ1` 形式を検出し、Canvas版に寄せた赤/青の分量チップにする。
- 手順文に分量がない材料・調味料は、登録済み使用量を材料名の直後に別チップで表示する。
- 本文にすでに `大さじ1` / `小さじ1` が続く場合は、登録済み量を追加しない。
- チップのアクセシブル名は材料名のままにして、既存の「材料名を押して照合」テストや操作感を保つ。
- 材料一覧側の分量も `大さじ1` / `小さじ1` の順に整える。
- テストでは、手順中に材料名チップと登録済み量があり、`大さじ1` が表示され、`1大さじ` が出ないことを確認する。

## 非対象

- AI生成プロンプトの修正
- 既存レシピ本文の自動補正
- 工程ごとの使用量推定
