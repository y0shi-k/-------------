# TKT-0023 実装完了報告

## 概要

料理完了時の全更新（在庫減算・献立ステータス更新・レシピ集調理回数更新・料理履歴追加・画像Drive保存）を、即時GAS通信から手動一括同期経路（`syncPendingChanges()`）に移行しました。

## 変更内容

### 1. pendingSync 構造の拡張
**`createEmptyPendingSync()`** を修正：
- `cookingHistory` を追加
- 各要素: `{ recipeId, recipeName, cookingDate, rating, comment, photoBase64, photoFilename }`

### 2. completeRecipe() の書き換え
**変更前**: 即時 `executeGAS` を呼び出し、スプシに即反映

**変更後**: すべての更新を `pendingSync` に積み、表示のみ更新
- 在庫更新: `confirmConsumption()` で既に `pendingSync` に積まれているのでクリアしない
- 献立ステータス更新: `state.schedule` の該当予定を「完了」に + `pendingSync.scheduleUpdates` に積む
- レシピ集更新: `state.recipes` の該当レシピの調理回数+1・履歴追加 + `pendingSync.recipeHistory` に積む
- 料理履歴追加: `pendingSync.cookingHistory` に積む（`photoBase64` 含む）
- 一時データ（Base64）をクリア

### 3. saveCookingRecord() の書き換え
**変更前**: `executeGAS` で即時 `saveImageToDrive` を呼び出し

**変更後**: 
- 画像アップロード即時実行を停止
- Base64データは `state._tempCookingPhotoBase64` に保持したまま
- `completeRecipe()` を呼び出して `pendingSync` に積む

### 4. syncPendingChanges() のGASペイロード拡張
既存の在庫・レシピ・献立・買い物処理に加えて、以下を追加:

**献立ステータス更新**:
```javascript
var scheduleUpdates = pending.scheduleUpdates || [];
scheduleUpdates.forEach(function(u) {
  // date + meal で特定してステータス列を更新
});
```

**レシピ集調理回数・履歴更新**:
```javascript
var recipeHistory = pending.recipeHistory || [];
recipeHistory.forEach(function(h) {
  // recipeId で特定して調理回数+1、履歴JSONに日付追加
});
```

**料理履歴追加（画像Drive保存含む）**:
```javascript
var cookingHistory = pending.cookingHistory || [];
cookingHistory.forEach(function(ch) {
  // photoBase64 があればDriveに保存してURL取得
  var photoUrl = '';
  if(ch.photoBase64) {
    var blob = Utilities.newBlob(Utilities.base64Decode(...), 'image/jpeg', ch.photoFilename);
    var file = DriveApp.createFile(blob);
    photoUrl = file.getUrl();
  }
  // 料理履歴シートに書き込み
  sHistory.appendRow([historyId, ch.cookingDate, ch.recipeId, ch.recipeName, ch.comment, photoUrl, ch.rating]);
});
```

### 5. getPendingSyncCount / updateSyncBar の拡張
- `cookingHistory.length` をカウントに追加
- 未同期バーの詳細表示に「料理履歴 N件」を追加

### 6. GAS側コード更新
- `docs/reports/MaginAgent GAS code.js` の `completeRecipe` に非推奨注釈を追加

## verify 結果

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
# → VERIFY_PASSED
```

追加チェック:
- `alert` / `confirm` / `prompt` 不使用
- `showToast` 関数存在確認
- 新規の個別 `executeGAS` 書き込みは増えていない（`syncPendingChanges` 経由のみ）

## 変更ファイル

- `app.html`
- `docs/reports/MaginAgent GAS code.js`
- `project-os/tickets/TKT-0023-cooking-completion-batch-sync.md`
- `project-os/specs/SPEC-0023-cooking-completion-batch-sync.md`
- `project-os/artifacts/TKT-0023/verify.json`
- `project-os/artifacts/TKT-0023/report.md`
- `project-os/artifacts/TKT-0023/manual-smokes.md`
- `project-os/artifacts/TKT-0023/review.md`
