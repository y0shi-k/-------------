# TKT-0033 実装レポート

## 概要

献立スケジュール機能を以下3点で拡張した。

1. **複数レシピ配置**: 1日の朝・昼・晩の各ブロックに複数レシピを配置可能にした。
2. **D&D移動**: 配置済みレシピをドラッグ＆ドロップで別日・別食事ブロックへ移動、または同ブロック内で並び替え可能にした。
3. **選択モード＋一括削除**: 選択モードでチェックしたレシピカードを一括削除可能にした。完了済みが含まれる場合は確認モーダルを表示する。

## 変更ファイル

- `app.html`: 337行変更（+281, -56）
- `project-os/tickets/TKT-0033-schedule-multi-drag-select.md`: 新規作成

## GAS側変更

### スプレッドシート構造変更

`献立スケジュール` シートを6列→8列に拡張。

| 列 | 旧 | 新 |
|---|---|---|
| A | 予定日 | **ID** |
| B | 食事区分 | 予定日 |
| C | レシピID | 食事区分 |
| D | レシピ名 | レシピID |
| E | ステータス | レシピ名 |
| F | 最終編集日時 | ステータス |
| G | — | **表示順** |
| H | — | 最終編集日時 |

### 既存データ自動移行

`handleInit` 実行時、GAS側で旧構造（A列=予定日）を検出すると、UUID付与とsortOrder=0を自動挿入して新構造に移行する。

### 読み書き更新

- `readSchedule`: ID列・表示順列を読み込み、sortOrderでソート
- `loadSchedule`: 週指定読み込みも8列対応
- 一括同期:
  - `scheduleDeletes`: IDベースで行を特定（旧データはdate+meal+recipeIdでフォールバック）
  - `scheduleCreates`: IDで既存確認→更新、なければappendRow（8列）
  - `scheduleUpdates`: IDで行を特定し、status/sortOrder/最終編集日時を更新

## クライアント側変更

### State構造

- `state.schedule` の各アイテムに `id`（`sched_` prefix UUID）と `sortOrder` を追加
- `state.scheduleSelectMode`（boolean）を追加
- `state.scheduleSelectedIds`（配列）を追加

### 同期キュー

- `cleanScheduleItem`: `id`, `sortOrder` を含む8列構造に更新
- `queueScheduleCreate`: 新規追加（同ブロック内の既存レシピは上書き、別レシピは追加）
- `queueScheduleDelete`: IDベースに変更
- `queueScheduleUpdate`: 新規追加（D&D後のsortOrder/date/meal変更用）
- `getPendingSyncCount` / `updateSyncBar`: `scheduleUpdates` をカウントに追加

### UIレンダリング

- `renderSchedule`: 各食事ブロックを `flex-col` に変更。複数レシピを高さ `h-12` のコンパクトカードで縦積み表示
- 各カードにドラッグハンドル（`≡`）を追加。カード本体タップは献立開始（選択モード時はチェック切替）
- 空ブロックは「＋追加」ボタンを最下部に配置
- 選択モードON時、各カードにチェックボックスを表示
- 1件以上選択時に「チェックした献立を一括削除」ボタンを表示

### D&D機能

- HTML5 Drag and Drop API を使用
- `dragstart`: IDをdataTransferに設定、ドラッグ中スタイル
- `dragover`: ドロップゾーンに `bg-sky-100` を付与
- `drop`:
  - 同ブロック内: マウスY座標から挿入位置を推定し、sortOrderを再計算（index*10）
  - 別ブロック: date/mealを変更、新ブロックのmax sortOrder + 10を設定
- D&D後は `queueScheduleUpdate` で `pendingSync` に即反映（個別GAS通信禁止）

### 一括削除＋確認モーダル

- 「選択モード」ボタンでON/OFF切替
- チェックしたレシピの一括削除
- 完了済みが含まれる場合: `scheduleBatchDeleteModal` を表示（`alert`/`confirm` 不使用）
- 未完了のみ: 即削除
- 削除後、選択モード解除、再描画

## 既存機能への影響

- **料理完了処理**: `scheduleItem` の検索を `date + recipeId + status !== 完了` に維持。`scheduleUpdates` に `id` を含めるように更新
- **買い物リスト連携**: `assignScheduleRecipe` での不足材料追加は維持
- **週切り替え**: `changeScheduleWeek` は維持
- **献立スロットメニュー**: `openScheduleSlotMenu` をIDベースに変更

## Verify結果

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
# => VERIFY_PASSED
```

- `showToast` 関数: 存在確認済み
- `alert`/`confirm`/`prompt`: 0件確認済み
- 個別GAS通信: 新規追加なし（`syncPendingChanges` / `loadSchedule` / `handleInit` / 写真プリフェッチのみ）
- HTML構文: パース成功
