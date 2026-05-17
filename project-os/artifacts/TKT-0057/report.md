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
- [ ] 並び替え・検索モード切替と組み合わせて動作する
