# Report — TKT-0058-consumption-substitution-tabs

## 実装概要

料理完了時の消費量調整画面（consumptionModal）を拡張し、以下の機能を追加した。

1. **タブ切り替え（All / 調味料 / 材料）**
   - 初期値はALL
   - タブ切り替え時も入力済み数量を保持

2. **代替品選択**
   - 各行に「代替」ボタンを配置
   - タップで在庫食材一覧モーダルを表示（既存UIを移植）
   - 検索・保存場所フィルタ・分類フィルタ・期限ソート対応
   - 選択後は「元に戻す」で復元可能

3. **確定処理の拡張**
   - 代替が設定されていれば代替品名で在庫を検索・減算
   - メッセージに「元の材料→代替品名」と表示

## 変更ファイル

- `app.html`

## 変更詳細

### HTML（app.html）

- `consumptionModal` にタブ用の `#consumptionTabs` を追加（3ボタン）
- `cookingRecordModal` の直前に `#substitutionModal` を新規追加
  - ヘッダー（元材料名表示）
  - 検索バー
  - 保存場所・分類フィルタ（select）
  - ソートボタン（期限/名前/購入日）
  - リストエリア

### JavaScript（app.html）

- 状態変数追加
  - `_consumptionTabFilter` ('all'|'seasoning'|'ingredient')
  - `_substitutionTargetIdx`
  - `_substitutionSortBy`, `_substitutionSortOrder`
- `openConsumptionAdjustmentModal()`
  - `_category` プロパティを材料・調味料に付与
  - `_consumptionTabFilter` を 'all' で初期化
  - `renderConsumptionTabs()` / `renderConsumptionList()` を呼び出し
- `renderConsumptionTabs()`, `setConsumptionTab()`
- `renderConsumptionList()`（新規）
  - 既存入力値の保存・復元
  - `_consumptionTabFilter` に応じたフィルタ
  - substitute 表示対応（元に戻すリンク付き）
  - 「代替」ボタンの配置
- `validateConsumptionInputs()`
  - `data-idx` から材料オブジェクトを参照
  - substitute 設定時は substitute.name で在庫検索
- `confirmConsumption()`
  - `data-idx` から材料オブジェクトを参照
  - substitute 設定時は substitute.name で減算
  - メッセージに「元→代替」と表示
- `closeConsumptionModal()`
  - `_consumptionTabFilter`, `_substitutionTargetIdx` をリセット
- `sortInventory(list, sortBy, sortOrder)`
  - 第2,3引数を追加（省略時は従来のstateを参照）
- 代替品選択モーダル関数群（新規）
  - `openSubstitutionModal(idx)`
  - `closeSubstitutionModal()`
  - `renderSubstitutionSortButtons()`, `setSubstitutionSort(sortBy)`
  - `renderSubstitutionList()`
  - `selectSubstitution(inventoryId, inventoryName)`
  - `clearSubstitution(idx)`

### バグ修正

- `getAllLocationNames()` → `getStorageLocations()` に修正（存在しない関数呼び出しを解消）

## 非機能面

- **GAS通信**: 新規追加なし（既存の `queueInventoryUpdate` / `queueInventoryDelete` を利用）
- **スプシ同期**: `confirmConsumption` で `pendingSync` に積むのみ。実際の反映はユーザーが `syncPendingChanges()` を実行するまで保留
- **パフォーマンス**: 在庫リストのフィルタ・ソートはクライアントサイド完結

## 残課題・制限

- 単位換算は行わない（豆腐1丁 → 絹豆腐1丁のまま）
- 代替品モーダルは在庫データ量が多い場合にスクロールが長くなる可能性がある（ページネーション未対応）

## Verify結果

```
VERIFY_PASSED
```

- HTML構文エラーなし
- `executeGAS`, `GAS_URL`, `showToast` 存在確認済み
- ネイティブダイアログ（alert/confirm/prompt）未使用
- 新規個別GAS通信なし

## マニュアルスモークテスト

詳細は `manual-smokes.md` を参照。
