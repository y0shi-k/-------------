---
id: SPEC-0164-consumption-modal-single-row-redesign
title: 完了モーダル（実際の消費量を調整 / ConsumptionEditor）のUI簡素化・1行高密度化
status: draft
scope:
  - 「料理を完了する」→「実際の消費量を調整」モーダル（`ConsumptionEditor`、`web/src/components/recipe-meal-workspace.tsx`）
  - その完了処理 `completeSchedule` の減算ゲート・バリデーション
  - `web/src/app/globals.css` の完了モーダル用レイアウト（新規クラス）
constraints:
  - 料理履歴編集モーダル `cooking-record-edit-modal.tsx`（`ConsumptionEditList`）は触らない（チェックOFF＝明細削除＋在庫差分戻し、減算しない＝在庫非紐づけ保持、という固有意味を持ち、統一は在庫差分計算を壊す危険変更になるため）
  - 共有CSS `.consumption-item` 系（globals.css L3981-4039）は変更しない（編集モーダルが使用中）。完了モーダルには新規クラスを割り当てて結合を断つ
  - `selected` の他用途 `shortageSelectionItems`（recipe-meal-workspace.tsx L324-325, L1066, L1723）は別機能なので無改変
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - Supabase schema / Auth・RLS / 写真Storage / AI route / CSV移行 には触れない
acceptance:
  - 完了モーダルが1材料あたり1〜2行の高密度で表示され、チェックボックスと「減算しない」optionが無い
  - 除外は「消費量0」だけで表現され、消費量0の行は確定しても在庫が減らず `cooking_consumption_events` に記録されない。消費量>0かつ在庫選択済みの行だけ在庫減算＆記録される
  - exact match 在庫がある材料は在庫が pre-select され既定量（min(必要量, 在庫量)）が入る
  - ツールバーの一括操作で「全部 既定量／全部 0」が機能する（表示中タブの行に作用）
  - 消費量入力が NumberField（全角→半角正規化）で、単位が右隣に表示される
  - 在庫不足（消費量>在庫）で警告が出る
  - ブラウザ幅が狭い場合に在庫select＋消費量が自動で2段目へ折り返す
  - 料理履歴編集モーダルが従来どおり（チェックボックス・減算しない・縦積み・保存/削除/在庫差分）で回帰が無い
  - Web版verifyが通る
related_tickets:
  - TKT-0164-consumption-modal-single-row-redesign
---

# Summary

この spec は、reviewer が会話ではなく `project-os/` だけを読んで判断できる状態を作るための正本。完了モーダル `ConsumptionEditor` の縦長・冗長UIを、除外を「消費量0」だけに一本化し、1行高密度レイアウトへ刷新する。

## 背景

「実際の消費量を調整」モーダルが縦に細長い。1材料あたり「チェック+材料名」「減らす在庫(select)」「消費量(input)」が縦3段に積まれ、材料が増えると確定ボタンまで遠い。
根本原因は「減算しない」を表す手段が3重に存在すること。保存ロジック `recipe-meal-workspace.tsx:1146`:

```js
if (!draft.selected || !draft.stockItemId || draft.consumedAmount === 0) continue;
```

で「チェックOFF」「在庫未選択（減算しない）」「消費量0」のどれか1つでも減算スキップ＝同義の除外手段が3つある。完了モーダルは一度きりの減算なので3つは完全に冗長。

## 仕様

- 除外は「消費量0」だけに一本化。チェックボックスと「減算しない」optionを廃止する。
- `ConsumptionDraft` 型から `selected` を削除。`completeSchedule` の減算ゲートを `if (!draft.stockItemId || draft.consumedAmount === 0) continue;` に、バリデーションを `stockItemId` 保有行のみ対象に変更。
- `buildConsumptionDrafts` の既定値（exact stock → pre-select＋amount=min(必要量,在庫)、無 → stockItemId=""・amount="0"）は維持。
- 一括操作 `setVisibleConsumptionSelected` を `onBulkSet(mode: "default" | "zero")` に作り替え。default=表示中かつ在庫選択済み行に既定量、zero=表示中行を amount="0"。
- 行マークアップを新規クラス（`.consumption-row` ほか）で1行高密度化。材料名＋必要量・種別サブ行、在庫select＋消費量(NumberField)＋単位を横一列。
- 在庫selectは常に表示し、代替材料の減算に対応する。同分類・同単位・数量>0を「おすすめ（同分類・同単位）」optgroup、それ以外の数量>0在庫を「その他の在庫（代替材料）」optgroup として出し、どの在庫からでも減算先を選べる。在庫が1件も無いときのみプレースホルダを「在庫がありません」にする。
- 消費量入力は既存 `NumberField`（`web/src/components/number-field.tsx`、TKT-0154導入）に置換し単位を右隣に表示。
- CSS は完了モーダル専用の新規ブロックのみ追加。`.consumption-item` 系は変更しない。

## 非対象

- 料理履歴編集モーダル `cooking-record-edit-modal.tsx` のロジック・UI（危険変更のため別チケットで扱う）。
- DBスキーマ・RLS・Storage・AI route・CSV移行。

## Acceptance Example

- `project-os/artifacts/TKT-0164-consumption-modal-single-row-redesign/` の verify.json と report.md で達成可否を判定できる状態にする。
- 個人データの読み書き（在庫数量更新・消費明細記録）はログイン前提・Supabase RLS下で行い、APIキー等の秘密は露出しない。
