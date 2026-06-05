---
id: SPEC-0058-consumption-substitution-tabs
title: 料理完了時の消費量調整画面にタブ・代替品選択を追加
status: spec_ready
scope:
  - モーダル: 消費量調整（consumptionModal）
  - 新規モーダル: 代替品選択（substitutionModal）
constraints:
  - スプシ書き込みロジックは変更しない（confirmConsumption内の既存減算フローを維持）
  - 新規GAS通信は行わない（在庫データはstate.inventoryから参照）
  - 個別executeGAS呼び出しを増やさない
acceptance:
  - All/調味料/材料タブで表示を切り替えられ、初期値はALL
  - タブ切り替え時、入力済み数量が保持される
  - 各行に「代替」ボタンがあり、タップで代替品選択モーダルが開く
  - 代替品モーダルは既存の食材管理リストUIを移植（検索・場所フィルタ・分類フィルタ・期限ソート・期限バッジ付き）
  - 在庫にある食材だけが代替品として選択可能
  - 単位は元の材料と同じ（数量のみ調整）
  - 代替設定後は元の行に「→ 代替品名」と表示され、元に戻す操作が可能
  - confirmConsumptionで、代替が設定されていれば代替品名で在庫を検索・減算する
  - 調味料・材料の両方で代替可能
related_tickets:
  - TKT-0058-consumption-substitution-tabs
---

# Summary

料理を完了する → 実際の消費量調整画面（consumptionModal）を拡張し、
タブによる表示切り替えと、在庫からの代替品選択機能を追加する。

## 背景

- 現在の調整画面は材料・調味料を一覧表示するのみで、分類フィルタがない
- 数量調整はできるが、同系統の食材への代替（豆腐→絹豆腐など）に対応していない
- 実際の料理ではレシピ通りの材料がない場合、代替品を使う場面が多い

## 仕様

### 1. タブ切り替え

consumptionModal 内のリスト上部に3タブを追加：
- **All**（初期選択）
- **調味料**
- **材料**

各行は既存の `調味料`/`材料` バッジで判定。タブ切り替え時はDOMを再構築するが、
`.cons-qty` の入力値は `data-idx` 属性をキーに復元する。

### 2. 代替ボタン

各行の右端（数量入力の近く）に「代替」テキストボタンを配置：
- スタイル: `text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg`
- クリック時: `_substitutionTargetIdx` に該当行のidxを保存し、`openSubstitutionModal()` を呼ぶ

### 3. 代替品選択モーダル（substitutionModal）

新規モーダル。既存の食材管理画面（inventoryView）のリスト表示を移植：
- 検索バー（品名フィルタ）
- 保存場所フィルタ（select、state.customLocations + DEFAULT_STORAGE_LOCATIONS）
- 分類フィルタ（select、全分類オプション）
- ソート: 期限順 / 名前順 / 購入日順（既存のsortInventoryを流用）
- 各行に: 品名、数量・単位、保存場所、期限バッジ（既存の期限切れ/近い/通常の色分け）
- 在庫数量が0の食材も表示する（選択時に不足警告が出る設計）

**選択後の挙動:**
- `_consumptionIngredients[idx].substitute = { name, id, originalName }` を設定
- 元の `consumptionModal` に戻り、該当行の表示を更新
  - 例: `豆腐 → 絹豆腐`（元名を小さく表示）
  - 「元に戻す」リンクを表示

### 4. 確定時の処理

`confirmConsumption()` を拡張：
- input走査時、`substitute` が設定されていれば `substitute.name` で在庫を検索・減算
- 設定がなければ元の `ing.name` で減算（既存動作）
- 減算対象が在庫に存在しない場合は0として扱い、不足メッセージに含める

## 非対象

- スプシスキーマ変更
- レシピデータ構造の変更（材料JSONの形式は変えない）
- GAS側のコード変更
- 単位換算（1丁→1パックなどの単位変換は行わない）

## Acceptance Example

1. 料理完了ボタンを押すと調整モーダルが開く
2. 初期状態で「All」タブが選択され、材料と調味料が混在して表示される
3. 「調味料」タブを押すと調味料のみ表示される
4. 数量を変更し、「材料」タブに切り替えても数量が保持される
5. 「代替」ボタンを押すと、在庫食材一覧のモーダルが開く
6. モーダルで絹豆腐を選び、元のモーダルに戻ると「豆腐 → 絹豆腐」と表示される
7. 確定すると、在庫から絹豆腐が減算される
8. verifyコマンドが通る
