# TKT-0057: レシピ集検索の And/Or 対応 + 出典検索

## 変更概要

献立・レシピの「レシピ集」画面における検索機能を強化しました。

### 1. 複数キーワード検索（And/Or）
- スペース区切りで複数キーワードを入力可能に
- **AND**: すべてのキーワードにマッチするレシピのみ表示
- **OR**: いずれかのキーワードにマッチするレシピを表示
- 検索モード（レシピ名/食材/すべて）との組み合わせも維持

### 2. 出典（source）検索対応
- 「レシピ名」「すべて」検索モードで、レシピの `source` フィールド（URL・本の名前など）も検索対象に含めました

### 3. UI変更
- 検索モード切替ボタンの横に AND/OR 切替ボタンを追加
- レシピ集画面の検索入力欄の右端に × クリアボタンを追加（常時表示）
- 献立追加時の「レシピを選択」モーダルの検索入力欄の右端にも × クリアボタンを追加（常時表示）
- 献立追加モーダルの上辺を固定：レイアウトを `items-start pt-12` に変更し、モーダル内部を flex column に。リスト部分を `flex-1 min-h-0 overflow-y-auto` にして候補数変動時も上辺がブレないように
- **上辺ずれの原因と修正**: `transform scale-95` のデフォルト基準点が要素中心（`transform-origin: center`）なため、高さ変動時に中心点が移動し上辺がずれていた。`origin-top` を追加して基準点を上辺に固定し、さらに `max-h` から固定高さ `h-[calc(100vh-6rem)]` に変更して高さ変動自体を防いだ
- 既存の並び替え・検索モード切替はそのまま維持

## 変更ファイル
- `app.html`

## 変更詳細

### 状態追加
```javascript
recipeSearchLogic: 'and',  // 'and' | 'or'
```

### UI（renderRecipeModeControls 内）
- grid を `grid-cols-[auto_1fr]` から `grid-cols-[auto_auto_1fr]` に変更
- 検索モードボタンの横に AND/OR ボタンを追加
- スタイル: 非アクティブ時 `text-slate-500`、アクティブ時 `bg-white text-slate-700 shadow-sm`

### 検索ロジック（getFilteredSortedRecipes）
- 入力文字列を `split(/\s+/)` でキーワード配列に分解
- 各レシピでキーワードごとのマッチ判定を実行（name / source / ingredients / seasonings）
- `searchLogic === 'and'` → `keywordMatches.every(Boolean)`
- `searchLogic === 'or'` → `keywordMatches.some(Boolean)`

### 関数追加
```javascript
function setRecipeSearchLogic(logic) {
  state.recipeSearchLogic = ['and', 'or'].includes(logic) ? logic : 'and';
  renderRecipeMode();
}

function clearRecipeSearch() {
  state.recipeSearchQuery = '';
  const input = document.getElementById('recipeSearchInput');
  if (input) input.value = '';
  renderRecipeList();
}

function clearScheduleRecipeSearch() {
  const input = document.getElementById('scheduleRecipeSearch');
  if (input) input.value = '';
  renderScheduleRecipePickerList();
}
```

## verify 結果
```
VERIFY_PASSED
```

- HTML 構文チェック: PASS
- `executeGAS` 存在確認: PASS
- `GAS_URL` 存在確認: PASS
- alert/confirm/prompt 不使用: PASS
- showToast 関数存在: PASS
- 新規コードによる個別 GAS 通信: なし（UI/フィルタリングのみ）

## 手動スモーク項目
- [ ] スペース区切りで「鶏肉 玉ねぎ」と入力し、AND で両方含むレシピのみ表示される
- [ ] 同じ入力で OR に切り替え、鶏肉または玉ねぎを含むレシピが表示される
- [ ] 「すべて」モードで出典URLを入力し、sourceにマッチするレシピが表示される
- [ ] 検索入力中に右端の × ボタンをタップし、検索ワードがクリアされリストが元に戻る
- [ ] 献立追加モーダル（レシピを選択）の検索入力欄でも × ボタンでクリアできる
- [ ] 献立追加モーダルで検索して候補が減っても、モーダルの上辺の位置が変わらない
- [ ] 並び替え・検索モード切替と組み合わせて動作する
