# TKT-0022 実装完了報告

## 概要

SPEC-0022 に基づき、料理完了時の一括更新GAS連携を実装しました。在庫減算・献立ステータス更新・レシピ集調理回数更新・料理履歴追加を一度のGAS通信で完了させます。

## 変更内容

### 1. completeRecipe 関数実装
**`completeRecipe(recipeId, photoUrl, rating, comment)`** を新規追加：
- `confirmConsumption()` で積まれた在庫更新・削除データを `pendingSync` から取得してクリア
- 今日の献立スケジュールから該当レシピを探し、scheduleKey を構築
- `executeGAS` に即時実行関数文字列を構築して送信（`syncPendingChanges` と同じ方式）
- GAS側で4つの処理を1回の呼び出し内で順次実行：
  1. **在庫更新・削除**: `inventoryUpdates` / `inventoryDeletes` を「食材在庫」シートに反映
  2. **献立ステータス更新**: `scheduleKey` で「献立スケジュール」の該当行を「完了」に更新
  3. **レシピ集更新**: 調理回数+1、調理日履歴に今日の日付を追加
  4. **料理履歴追加**: 「料理履歴」シートに新規行追加（履歴ID: `Utilities.getUuid()`）
- 各ステップ後に `SpreadsheetApp.flush()` を実行

### 2. saveCookingRecord 連携修正
**`saveCookingRecord`** を修正：
- `saveImageToDrive` 呼び出しをオブジェクト形式から即時実行関数文字列に変更（`executeGAS` との互換性確保）
- 写真アップロード後、`completeRecipe(_cookingRecordRecipeId, photoUrl, ...)` を呼び出し

### 3. executeGAS 互換性修正
**`executeGAS`** を修正：
- `typeof payloadCode === 'object'` の場合、`JSON.stringify` して文字列化するように変更
- これによりオブジェクトペイロードとコード文字列ペイロードの両方に対応

### 4. GAS側コード追加
**`docs/reports/MaginAgent GAS code.js`** に追加：
- `saveImageToDrive(base64, filename)`: Driveファイル保存関数
- `completeRecipe(data)`: 一括更新関数（フロント側と同じ4ステップ）

### 5. 成功後のフロント側state更新
- `state.inventory` をレスポンスの `updatedInventory` で置き換え
- `state.schedule` 内の該当予定ステータスを「完了」に更新
- `state.recipes` 内の該当レシピの調理回数・履歴を更新
- `setSyncedSnapshot()` で同期スナップショットを更新
- `rerenderCurrentViews()` で表示を更新
- `showToast('料理が完了しました！', 'success')` を表示

### 6. エラーハンドリング
- いずれかのステップで失敗した場合: `showToast('保存に失敗しました。再度お試しください。', 'error')`
- 画像アップロード失敗時は継続可能（TKT-0021 の仕様を維持）

## verify 結果

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
# → VERIFY_PASSED
```

追加チェック:
- `alert` / `confirm` / `prompt` 不使用
- `showToast` 関数存在確認
- 新規の個別 `executeGAS` 書き込みは `saveImageToDrive` と `completeRecipe` の2つに集約（一括更新のため許容）

## 変更ファイル

- `app.html`
- `docs/reports/MaginAgent GAS code.js`
- `project-os/artifacts/TKT-0022/verify.json`
- `project-os/artifacts/TKT-0022/report.md`
- `project-os/artifacts/TKT-0022/manual-smokes.md`
- `project-os/artifacts/TKT-0022/review.md`
