# SPEC-0020-consumption-adjustment

## 背景

レシピ通りに料理した後、実際に使った分量は規定量と異なることが多い。ユーザーが実際の消費量を調整し、その分だけ在庫を減算できるようにする。

## 変更範囲

- `app.html` に消費量調整モーダルを新規追加
- 在庫減算ロジックを `state.pendingSync` に統合

## 詳細仕様

### 1. 消費量調整モーダル

- モーダルタイトル: 「実際の消費量を調整」
- レシピの `材料JSON` をリスト表示
- 各行に以下を配置:
  - 品名
  - 規定量（読み取り専用）
  - 実際の消費量（数値入力 `<input type="number">`）
  - 単位（読み取り専用）
- 初期値は規定量と同じ
- 未入力または0の場合は「使わなかった」として扱い、在庫減算対象外

### 2. バリデーション

- 負数は入力不可（`min="0"`）
- 在庫数量を超える消費量は警告トーストを出し、確定ボタンを無効化
- 警告メッセージ: 「在庫が不足しています。実際の在庫を確認してください。」

### 3. 在庫減算処理

- 「確定」ボタン押下で、各材料について以下を計算:
  - 同名・同単位の在庫アイテムを `state.inventory` から検索
  - 実際の消費量を数量から減算
  - 結果が0以下なら `state.pendingSync.inventoryDeletes` に追加
  - 結果が正なら `state.pendingSync.inventoryUpdates` に追加（新数量）
- この時点ではGAS通信せず、pendingSync に積むのみ
- モーダルを閉じ、次の「記録モーダル」を開く

### 4. データ構造

```javascript
state.pendingSync.inventoryUpdates = [
  { id: 'uuid', item: { ...更新後のオブジェクト... } }
];
state.pendingSync.inventoryDeletes = [
  { id: 'uuid', item: { ... } }
];
```

## 技術的制約

- `syncPendingChanges()` で在庫更新と削除が一括送信されること
- 個別の `executeGAS` 呼び出しを増やさない

## テスト観点

- 規定量が初期値としてセットされる
- 0を入力すると在庫減算対象外になる
- 在庫超過の警告が出る
- pendingSync に正しく積まれる
- verify が通る
