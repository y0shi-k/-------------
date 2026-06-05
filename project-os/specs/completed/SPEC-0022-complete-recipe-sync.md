# SPEC-0022-complete-recipe-sync

## 背景

料理完了時に、在庫減算・献立ステータス更新・レシピ集調理回数更新・料理履歴追加の4つの更新を一度のGAS通信で完了させる。これによりユーザーの待ち時間を最小化し、整合性を保つ。

## 変更範囲

- `app.html` のGASペイロードに `completeRecipe` を追加
- GAS側に `completeRecipe` ハンドラーを追加
- `syncPendingChanges()` の拡張（オプション：completeRecipeを同期フローに統合）

## 詳細仕様

### 1. GASペイロード: completeRecipe

フロントから送信:

```json
{
  "action": "completeRecipe",
  "recipeId": "uuid",
  "scheduleKey": { "date": "YYYY-MM-DD", "meal": "朝" },
  "cookingDate": "YYYY-MM-DD HH:mm:ss",
  "rating": 4,
  "comment": "美味しくできた",
  "photoUrl": "https://drive.google.com/...",
  "inventoryUpdates": [...],
  "inventoryDeletes": [...]
}
```

### 2. GAS側処理順序

1. **在庫更新・削除**:
   - `inventoryUpdates` を「食材在庫」シートに反映（該当IDの行を更新）
   - `inventoryDeletes` を「食材在庫」シートから削除（該当IDの行を `deleteRow`）

2. **献立ステータス更新**:
   - `scheduleKey.date` + `scheduleKey.meal` + `recipeId` で「献立スケジュール」シートの該当行を検索
   - 該当行の「ステータス」列を「完了」に更新
   - 該当行が見つからない場合は無視（献立外で直接料理した場合）

3. **レシピ集更新**:
   - `recipeId` で「レシピ集」シートの該当行を検索
   - 「調理回数」を+1
   - 「調理日履歴」JSON配列に `cookingDate` の日付部分（YYYY-MM-DD）を追加
   - JSONパース失敗時は空配列から開始

4. **料理履歴追加**:
   - 新規行を「料理履歴」シートに追加
   - 履歴ID: `Utilities.getUuid()`
   - 調理日時: `cookingDate`
   - レシピID: `recipeId`
   - レシピ名: レシピ集から取得（またはペイロードに含める）
   - 感想: `comment`
   - 写真URL: `photoUrl`
   - 評価: `rating`

5. **レスポンス**:
   - `{ success: true, updatedInventory: [...], completedSchedule: {...} }`

### 3. フロント側フロー

- 記録モーダルの「記録を保存」ボタン押下で:
  1. 未選択の写真があれば `saveImageToDrive` を先に実行（完了待ち）
  2. `completeRecipe` ペイロードを構築
  3. `executeGAS(payload)` で送信
  4. 成功後:
     - `showToast('料理が完了しました！')`
     - クッキングビューアを閉じる
     - `state.inventory` をレスポンスの `updatedInventory` で置き換え
     - `state.schedule` 内の該当予定ステータスを「完了」に更新
     - モードAまたはモードBに遷移（`switchMode('B')` で献立タブへ）
  5. 失敗時:
     - `showToast('保存に失敗しました。再度お試しください。')`
     - 未同期キューに積まない（completeRecipeは即時通信が必要な複合更新のため）

### 4. トランザクション的整合性

- GAS側で `SpreadsheetApp.flush()` を各ステップ後に実行
- いずれかのステップで例外が発生した場合、GAS側でエラーレスポンスを返す（フロント側で失敗を検知）
- ※GAS側の完全なロールバックは行わない（代替案：各更新を独立したサブ関数に分け、エラー発生時に中断する）

## 技術的制約

- 即時GAS通信を1回にまとめる（`completeRecipe` 内で在庫更新も行うため、pendingSync の在庫更新は空にするか、completeRecipeと分離する）
- 現状の `syncPendingChanges()` と競合しないよう、completeRecipe実行前に `syncPendingChanges()` を呼んで在庫更新を空にする設計とする

## テスト観点

- 献立ステータスが「完了」に更新される
- レシピの調理回数が+1される
- 料理履歴に新規行が追加される
- 在庫が減算される
- 画像URLが料理履歴に保存される
- verify が通る
