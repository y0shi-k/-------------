# SPEC-0023-cooking-completion-batch-sync

## 背景

現在の `completeRecipe` は即時一括GAS通信を行っており、在庫追加とは別の経路でスプシに反映される。ユーザーは「すべての更新をまとめて手動同期したい」という要件を持っており、画像アップロード（Drive保存）も含めて一括同期ポリシーに統一したい。

## 変更範囲

- `app.html` の `pendingSync` 構造を拡張（`cookingHistory` 追加）
- `completeRecipe()` を即時GAS通信から `pendingSync` 積み上げに変更
- `saveCookingRecord()` で画像アップロード即時実行を停止
- `syncPendingChanges()` のGASペイロードを拡張（画像Drive保存含む）

## 詳細仕様

### 1. pendingSync 構造の拡張

```javascript
pendingSync = {
  // 既存
  inventoryCreates: [],
  inventoryUpdates: {},
  inventoryDeletes: [],
  recipeCreates: [],
  recipeUpdates: {},
  recipeDeletes: [],
  scheduleCreates: [],
  scheduleDeletes: [],
  shoppingCreates: [],
  shoppingDeletes: [],
  shoppingPurchases: [],
  // 新規追加
  cookingHistory: []  // { recipeId, recipeName, cookingDate, rating, comment, photoBase64, photoFilename }
}
```

### 2. saveCookingRecord() の変更

**変更前**: `executeGAS` で即時 `saveImageToDrive` を呼び出し

**変更後**: Base64データを `state._tempCookingPhotoBase64` に保持するだけ
- 画像リサイズは選択時に実行済み
- ファイル名は `completeRecipe` で生成

### 3. completeRecipe() の変更

**変更前**: 即時 `executeGAS` を呼び出し、スプシに即反映

**変更後**: すべての更新を `pendingSync` に積み、表示のみ更新

```javascript
async function completeRecipe(recipeId, photoUrl, rating, comment) {
  if (!recipeId) return;
  
  // 1. 在庫更新は confirmConsumption で既に pendingSync に積まれている
  //    → クリアせず、そのまま残す
  
  // 2. 献立ステータス更新をキューに追加（フロント側stateも即座に更新）
  const todayStr = getTodayString();
  const scheduleItem = state.schedule.find(s => s.date === todayStr && s.recipeId === recipeId && s.status !== '完了');
  if (scheduleItem) {
    scheduleItem.status = '完了'; // フロント側state更新
  }
  
  // 3. レシピ集調理回数・履歴更新（フロント側stateも即座に更新）
  const recipe = state.recipes.find(r => r.id === recipeId);
  if (recipe) {
    recipe.count = (Number(recipe.count) || 0) + 1;
    let history = [];
    try { history = JSON.parse(recipe.history || '[]'); } catch(e) { history = []; }
    if (!Array.isArray(history)) history = [];
    history.push(todayStr);
    recipe.history = JSON.stringify(history);
  }
  
  // 4. 料理履歴をキューに追加
  const now = new Date();
  const cookingDate = `${todayStr} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const photoFilename = state._tempCookingPhotoBase64 
    ? `cooking_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.jpg`
    : '';
  
  state.pendingSync.cookingHistory.push({
    recipeId: recipeId,
    recipeName: recipe ? recipe.name : '',
    cookingDate: cookingDate,
    rating: rating || 0,
    comment: comment || '',
    photoBase64: state._tempCookingPhotoBase64 || '',
    photoFilename: photoFilename
  });
  
  // 5. 一時データをクリア
  state._tempCookingPhotoBase64 = '';
  state._tempCookingPhotoUrl = '';
  
  updateSyncBar();
  rerenderCurrentViews();
  showToast('料理が完了しました！同期するまでスプシ未反映です。', 'success');
}
```

### 4. syncPendingChanges() のGASペイロード拡張

既存の `syncPendingChanges()` のGASペイロード内に、以下の処理を追加:

**A. cookingHistory の処理（画像アップロード含む）**

```javascript
var cookingHistory = pending.cookingHistory || [];
if(cookingHistory.length) {
  var sHistory = ss.getSheetByName('料理履歴');
  cookingHistory.forEach(function(ch) {
    var photoUrl = '';
    // 画像Drive保存
    if(ch.photoBase64) {
      try {
        var blob = Utilities.newBlob(Utilities.base64Decode(ch.photoBase64.split(',')[1] || ch.photoBase64), 'image/jpeg', ch.photoFilename);
        var file = DriveApp.createFile(blob);
        photoUrl = file.getUrl();
      } catch(e) {
        // 画像保存失敗時は空文字のまま継続
      }
    }
    var historyId = Utilities.getUuid();
    sHistory.appendRow([historyId, ch.cookingDate, ch.recipeId, ch.recipeName, ch.comment || '', photoUrl, Number(ch.rating) || 0]);
  });
  SpreadsheetApp.flush();
}
```

**B. 献立ステータス更新（scheduleDataの既存処理に追加）**

`scheduleCreates` の既存処理の後に追加:

```javascript
var scheduleUpdates = pending.scheduleUpdates || [];
if(scheduleUpdates.length) {
  var scheduleData = sSchedule.getDataRange().getValues();
  scheduleUpdates.forEach(function(u) {
    for(var si=1; si<scheduleData.length; si++) {
      if(f(scheduleData[si][0]) === u.date && f(scheduleData[si][1]) === u.meal) {
        sSchedule.getRange(si+1, 5).setValue(u.status);
        break;
      }
    }
  });
  SpreadsheetApp.flush();
}
```

**C. レシピ集調理回数・履歴更新**

```javascript
var recipeHistory = pending.recipeHistory || [];
if(recipeHistory.length) {
  var recipeData = sRecipes.getDataRange().getValues();
  recipeHistory.forEach(function(h) {
    for(var ri=1; ri<recipeData.length; ri++) {
      if(String(recipeData[ri][0]) === h.recipeId) {
        var currentCount = Number(recipeData[ri][5]) || 0;
        var currentHistory = recipeData[ri][6] || '[]';
        var historyArr = [];
        try { historyArr = JSON.parse(currentHistory); } catch(e) { historyArr = []; }
        if(!Array.isArray(historyArr)) historyArr = [];
        historyArr.push(h.cookingDate.split(' ')[0]);
        sRecipes.getRange(ri+1, 6, 1, 2).setValues([[currentCount + 1, JSON.stringify(historyArr)]]);
        break;
      }
    }
  });
  SpreadsheetApp.flush();
}
```

### 5. getPendingSyncCount / updateSyncBar の更新

```javascript
function getPendingSyncCount() {
  const p = state.pendingSync;
  return ... + p.cookingHistory.length;
}

// updateSyncBar 内
const cooking = p.cookingHistory.length;
if(cooking) parts.push(`料理履歴 ${cooking}`);
```

### 6. フロー変更

**変更前**:
1. 料理完了 → confirmConsumption（在庫減算・pendingSyncに積む）
2. → saveCookingRecord（写真アップロード・completeRecipe呼び出し）
3. → completeRecipe（即時GAS通信でスプシ反映）
4. → 完了

**変更後**:
1. 料理完了 → confirmConsumption（在庫減算・pendingSyncに積む）
2. → saveCookingRecord（画像保持・completeRecipe呼び出し）
3. → completeRecipe（pendingSyncに献立・レシピ・履歴を積む）
4. → ユーザーが「同期する」ボタンを押す
5. → syncPendingChanges() で一括反映（在庫・献立・レシピ・履歴・画像）
6. → 完了

### 7. 技術的制約

- Base64画像データを含めた一括同期で、POSTサイズ制限に達する可能性がある
  - 対策: 画像は選択時にリサイズ済み（最大1024px、JPEG 0.85品質）
  - 1画像あたり通常200KB〜1MB、通常は1回の料理で1枚
- 画像アップロード失敗時は photoUrl 空文字で記録継続
- alert/confirm/prompt は不使用

## テスト観点

- 料理完了後、未同期バーに在庫・献立・レシピ・履歴のカウントが表示される
- 「同期する」ボタンでスプシに一括反映される
- 画像がDriveに保存され、料理履歴にURLが記録される
- 在庫・献立・レシピ集・料理履歴のすべてが正しく更新される
- verify が通る
