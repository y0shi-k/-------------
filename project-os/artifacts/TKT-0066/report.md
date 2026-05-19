# TKT-0066 実装完了報告

## 概要

調理完了後にスケジュールのステータスが正しく「完了」に更新されないバグを修正し、完了済みスケジュールカードの視覚的表示を改善しました。

## 変更内容

### 1. スケジュール完了反映のバグ修正
#### 1.1 問題の原因
調理を開始→調理を完了する フローで、スケジュールのステータスが「完了」に更新されないケースがあった。
- `completeRecipe()` では「今日の日付 + recipeId」でスケジュールアイテムを検索していた
- しかし、献立スケジュールに登録された日付と実際に調理した日付が異なる場合（例: 前日に登録→翌日調理）、検索に失敗していた
- 根本原因: スケジュールから調理を開始した際に、そのスケジュールアイテムのIDが引き継がれていなかった

#### 1.2 修正内容
- `startScheduleSlotCooking()` で `_cookingScheduleItemId` にスケジュールアイテムIDを保存
- `openCookingViewer()` で `options.scheduleItemId` を受け取り、`_cookingScheduleItemId` に設定
- `closeCookingViewer()` で `_cookingScheduleItemId` をクリア
- `completeRecipe()` で `_cookingScheduleItemId` があれば、それを使って正確にスケジュールアイテムを特定（優先）
- `_cookingScheduleItemId` がない場合は、従来通り「今日の日付 + recipeId」でフォールバック検索

### 2. 完了したスケジュールカードの視覚的改善
- スケジュールカードの背景色を変更: `bg-sky-50` → `bg-emerald-50 border-emerald-100`
- ホバー時も `hover:bg-emerald-100`
- テキスト色も `text-sky-800` → `text-emerald-800`
- ドラッグハンドル（≡）も `text-emerald-300` に変更
- 「完了」テキストラベルは既存のまま維持

### 3. 実行時バグ修正（Hotfix #1）
#### 3.1 問題
`completeRecipe()` 内で `todayStr` が `ReferenceError: todayStr is not defined` でクラッシュしていた。
- 原因: `_cookingScheduleItemId` がある場合、`today` / `todayStr` を定義している `if (!scheduleItem)` ブロックがスキップされ、後続の `cookingDate` 生成で未定義変数を参照していた

#### 3.2 修正
- `today` と `todayStr` を `completeRecipe()` の先頭（条件分岐の前）に移動
- これにより `_cookingScheduleItemId` パスでもフォールバックパスでも、どちらのパスでも `todayStr` が確実に定義される

### 4. 実行時バグ修正（Hotfix #2）
#### 4.1 問題
エラーはなくなったが、スケジュールが「完了」にならなかった。
- 原因: `confirmConsumption()` → `closeCookingViewer()` の呼び出しで `_cookingScheduleItemId` がクリアされていた
- その後 `openCookingRecordModal()` → `saveCookingRecord()` → `completeRecipe()` の流れで、`_cookingScheduleItemId` は常に `null` のため、フォールバック検索（今日の日付 + recipeId）しか使えなかった
- 前日登録→翌日調理の場合、日付が異なるためフォールバック検索も失敗

#### 4.2 修正
- `confirmConsumption()` で `closeCookingViewer()` の前に `_cookingScheduleItemId` を一時変数 `savedScheduleItemId` に保存
- `openCookingRecordModal(recipeId, savedScheduleItemId)` に渡す
- `openCookingRecordModal()` で受け取った `scheduleItemId` を `_cookingScheduleItemId` に復元
- `closeCookingRecordModal()` で `_cookingScheduleItemId` をクリア（次回調理に影響しないよう）

### 5. その他
- `alert` / `confirm` / `prompt` は不使用
- 個別の `executeGAS` 呼び出しは増やしていない（`syncPendingChanges()` 経由のみ）

## verify 結果

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
# → VERIFY_PASSED
```

追加チェック：
- `alert` / `confirm` / `prompt` 不使用
- `showToast` 関数存在確認
- `executeGAS` の呼び出しは既存の5箇所のみ（新規追加なし）
- スプシ書き込み系の新規コードは `queueScheduleUpdate` / `pendingSync` に積む設計を維持

## 変更ファイル

- `app.html`
- `project-os/tickets/TKT-0066.md`
- `project-os/artifacts/TKT-0066/verify.json`
- `project-os/artifacts/TKT-0066/report.md`
