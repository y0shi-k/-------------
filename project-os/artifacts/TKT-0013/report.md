# TKT-0013 Artifact: 在庫管理リストの昇順/降順トグル

## 実装内容

在庫管理リスト（モードA）のソートボタン（期限順 / 名前順 / 購入日順）を押すたびに、昇順 ↔ 降順 をトグル切り替えできるようにした。

## 変更箇所（app.html）

### 1. state 初期化
- `sortOrder: 'asc'` を追加

### 2. setSort(key) 関数
- 同じキーを押した場合：`sortOrder` を `'asc'` ↔ `'desc'` でトグル
- 異なるキーを押した場合：`sortBy` を更新し `sortOrder` を `'asc'` にリセット
- 各ボタンのテキストに `▲`（昇順）または `▼`（降順）を付与

### 3. sortInventory(list) 関数
- 昇順ソート後、`state.sortOrder === 'desc'` の場合に `sorted.reverse()` で反転

### 4. HTML ボタン初期表示
- 期限順ボタンの初期テキストを「期限順 ▲」に変更（初期状態は昇順）

## Verify 結果

```
VERIFY_PASSED
sortOrder occurrences: 5
```

### Canvas環境追加チェック
- `alert(` / `confirm(` / `prompt(`: 0 件（残存なし）
- `showToast`: 存在確認OK
- `GEMINI_API_KEY`: 既存コード、変更なし
- スプシ書き込み系：`syncPendingChanges()` 経由のみ、個別 `executeGAS` はなし
- 既存パターンを再利用、肥大化なし

## 完了日
2026-05-15
