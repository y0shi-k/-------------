---
id: TKT-0164-consumption-modal-single-row-redesign
title: 完了モーダル（実際の消費量を調整 / ConsumptionEditor）のUI簡素化・1行高密度化
status: completed
goal: 縦長で冗長な完了モーダルを、除外を「消費量0」だけに一本化（チェックボックスと「減算しない」optionを廃止）し、材料名＋在庫select＋消費量(+単位)を横一列の高密度レイアウトに刷新して、確定までの導線と判断を単純化する
acceptance:
  - 完了モーダルが1材料1〜2行の高密度で表示され、チェックボックスと「減算しない」optionが無い
  - 除外は「消費量0」だけで表現され、消費量0の行は在庫減算も `cooking_consumption_events` 記録もされない。消費量>0かつ在庫選択済みの行だけ減算・記録される
  - exact match 在庫がある材料は在庫が pre-select され既定量（min(必要量,在庫量)）が入る
  - 一括操作「全部 既定量／全部 0」が表示中タブの行に作用する
  - 消費量入力が NumberField（全角→半角正規化）で単位が右隣に表示される
  - 在庫不足（消費量>在庫）で警告が出る
  - 狭い幅で在庫select＋消費量が自動で2段目へ折り返す
  - 料理履歴編集モーダルが従来どおり（保存/削除/在庫差分）で回帰が無い
  - Web版verifyが通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0164-consumption-modal-single-row-redesign/
related_specs:
  - SPEC-0164-consumption-modal-single-row-redesign
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_artifacts:
  - artifacts/TKT-0164-consumption-modal-single-row-redesign/verify.json
  - artifacts/TKT-0164-consumption-modal-single-row-redesign/report.md
owner_role: implementer
owner_notes:
  - 非危険変更（完了モーダルのUI＋減算ゲートの簡素化）。Supabase schema / Auth・RLS / 写真Storage / AI route / CSV移行 は触らない。既存の在庫数量更新・消費明細記録のDB呼び出し自体は変更しない（ゲート条件のみ変更）。
  - 料理履歴編集モーダル `cooking-record-edit-modal.tsx`（`ConsumptionEditList`）は触らない。チェックOFF＝明細削除＋在庫差分戻し、減算しない＝在庫非紐づけ保持という固有意味があり、統一は在庫差分計算を壊す危険変更になるため別チケット。
  - 共有CSS `.consumption-item` 系（globals.css L3981-4039）は変更しない。完了モーダルには新規クラス（`.consumption-row` 等）を割り当てて結合を断つ。
  - `selected` の他用途 `shortageSelectionItems`（recipe-meal-workspace.tsx L324-325, L1066, L1723）は別機能なので無改変。
  - verify は `/verify TKT-0164-consumption-modal-single-row-redesign`（= `harness/bin/verify_web.sh`）。
  - Canvas版 `app.html` は触らない。
  - 目視確認: モーダルが高密度1〜2行／チェックと減算しないが無い／消費量0で減算なし＆未記録／既定量pre-select／全部既定量・全部0／Numberの全角→半角／在庫不足警告／狭幅で折返し／編集モーダルの回帰無し。
---

# Summary

「料理を完了する」→「実際の消費量を調整」モーダル（`ConsumptionEditor`）の縦長・冗長UIを、除外を「消費量0」だけに一本化し、1行高密度レイアウトへ刷新する。詳細仕様は `SPEC-0164-consumption-modal-single-row-redesign` を正本とする。実装方針はユーザー確定（除外は消費量0のみ／1行ぎっしり高密度）。

## 背景

保存ロジック `recipe-meal-workspace.tsx:1146` が `!draft.selected || !draft.stockItemId || draft.consumedAmount === 0` で減算スキップしており、「チェックOFF」「減算しない」「消費量0」が同義の除外手段として3重に存在し、UIを縦長・複雑にしていた。完了モーダルは一度きりの減算なので3つは冗長。

## 変更内容

1. `web/src/components/recipe-meal-workspace.tsx`
   - `ConsumptionDraft` 型から `selected` を削除。`buildConsumptionDrafts` の `selected` 設定を撤去（既定の stockItemId/amount は維持）。
   - `setVisibleConsumptionSelected` → `onBulkSet(mode)`（default=既定量／zero=0）に作り替え。`stockOptionsForIngredient` で在庫量を引いて min(必要量,在庫) を入れる。
   - `completeSchedule`: バリデーションを `stockItemId` 保有行のみに、減算ゲートを `if (!draft.stockItemId || draft.consumedAmount === 0) continue;` に変更。
   - `ConsumptionEditor`: チェックボックス廃止、`isShortage` から `selected` 除去、ツールバーを「全部 既定量／全部 0」に、行を新規クラス `.consumption-row` で1行高密度化、消費量を `NumberField` ＋単位表示に置換。「減算しない」は廃止し、未選択は中立プレースホルダ「在庫を選ぶ」、在庫options無しは「対象在庫なし」。

2. `web/src/app/globals.css`
   - 完了モーダル用の新規クラスのみ追加（`.consumption-row` / `.consumption-row-top` / `.consumption-row-label` / `.consumption-row-controls` / `.consumption-amount` / `.consumption-unit` / `.consumption-row-nostock`）。`flex-wrap` で狭幅は自動折返し。`data-active="false"`（amount0）で淡色化。`.consumption-item` 系は変更しない。

## 実装メモ

- 共通正本: `AGENTS.md`, `.agents/`, `harness/*.json`, `project-os/`。現役正本: `web/`。
- GAS/Spreadsheet/Drive は使わない。APIキー等の秘密は直書きしない。
- DBスキーマ・RLS・Storage には触れない（既存のDB呼び出しは維持し、減算ゲート条件のみ変更）。

## 残リスク

- 「減算しない」廃止により、在庫がある材料は既定で減算対象になる。exact match が無い材料は stockItemId 未選択（amount 0）で従来同様減算されないため挙動は維持される。
- 編集モーダルとの見た目が一時的に不揃いになる（必要なら別チケットで危険変更として統一）。
