# SPEC-0024-spreadsheet-folder-and-last-edited-column

## 背景

現在のスプシはGDriveのルートに作成され、写真もルートに保存される。また、シートに最終編集日時が記録されておらず、データの更新履歴を追えない。ユーザーは「フォルダでまとめて管理し、いつ更新されたか分かるようにしたい」という要件を持っている。

## 変更範囲

- `app.html` の `handleInit()` — フォルダ作成/取得、スプシ移動、ヘッダー更新
- `app.html` の `syncPendingChanges()` — フォルダ取得、最終編集日時自動セット、写真保存先変更

## 詳細仕様

### 1. フォルダ構成

- フォルダ名: `料理レシピ・食材管理_Canvasアプリ`
- 作成場所: GDriveルート直下
- スプシ名: `料理レシピ・食材管理DB`
- 写真保存先: 同フォルダ内

```javascript
var folderName = '料理レシピ・食材管理_Canvasアプリ';
var folders = DriveApp.getFoldersByName(folderName);
var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
```

### 2. スプシ移動

```javascript
// handleInit() 内
if (!ss) {
  ss = SpreadsheetApp.create('料理レシピ・食材管理DB');
  props.setProperty('SS_ID_RECIPE_APP', ss.getId());
  var file = DriveApp.getFileById(ss.getId());
  file.moveTo(folder);
}
```

### 3. 全シートのスキーマ変更

| シート名 | 列数 | 最終編集日時の位置 |
|---------|------|----------------|
| 食材在庫 | 12 | 12列目 |
| レシピ集 | 8 | 8列目 |
| 献立スケジュール | 6 | 6列目 |
| 料理履歴 | 8 | 8列目 |
| 買い物リスト | 10 | 10列目 |

#### 食材在庫（12列）
1. ID
2. 分類
3. 品名
4. 数量
5. 単位
6. 購入日
7. 開封日
8. 表示期限
9. 実質期限
10. 保存場所
11. 状態メモ
12. 最終編集日時

#### レシピ集（8列）
1. レシピID
2. レシピ名
3. 材料JSON
4. 手順JSON
5. 出典
6. 調理回数
7. 調理日履歴
8. 最終編集日時

#### 献立スケジュール（6列）
1. 予定日
2. 食事区分
3. レシピID
4. レシピ名
5. ステータス
6. 最終編集日時

#### 料理履歴（8列）
1. 履歴ID
2. 調理日時
3. レシピID
4. レシピ名
5. 感想
6. 写真URL
7. 評価
8. 最終編集日時

#### 買い物リスト（10列）
1. リストID
2. 品名
3. 必要数量
4. 単位
5. ステータス
6. 紐づくレシピ名
7. 出自種別
8. 予定日
9. 食事区分
10. 最終編集日時

### 4. 最終編集日時の自動更新

`syncPendingChanges()` 内で `now` を定義し、全書き込み処理に適用:

```javascript
var now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
```

#### 更新対象一覧

| 処理 | 対象シート | 更新方法 |
|-----|----------|---------|
| 在庫更新 | 食材在庫 | `setValues([..., now])` |
| 在庫追加 | 食材在庫 | `appendRow([..., now])` |
| レシピ更新 | レシピ集 | `setValues([..., now])` |
| レシピ追加 | レシピ集 | `appendRow([..., now])` |
| 献立更新 | 献立スケジュール | `setValues([..., now])` + `setValue(now)` |
| 献立追加 | 献立スケジュール | `appendRow([..., now])` |
| 買い物購入 | 買い物リスト | `setValue(now)` |
| 買い物追加 | 買い物リスト | `appendRow([..., now])` |
| 買い物→在庫移行 | 食材在庫 | `setValue(now)` / `appendRow([..., now])` |
| レシピ調理回数 | レシピ集 | `setValues([..., now])` |
| 料理履歴追加 | 料理履歴 | `appendRow([..., now])` |

### 5. 写真保存先変更

```javascript
var file = DriveApp.createFile(blob);
file.moveTo(folder);
photoUrl = file.getUrl();
```

### 6. 読み出し処理

既存の読み出し処理（`readInventory`, `readShopping`, `readRecipes`, `readSchedule`）は、新しい列を参照しないため変更なし。`loadSchedule()` も同様に変更なし。

## テスト観点

- 新規アプリ起動時にフォルダが作成され、スプシがフォルダ内に保存される
- 各種データ追加・更新時に最終編集日時が自動セットされる
- 料理完了時の写真がフォルダ内に保存される
- 既存の読み出し・表示処理が正常に動作する
- verify が通る
