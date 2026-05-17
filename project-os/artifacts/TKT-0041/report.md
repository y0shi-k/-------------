# TKT-0041: テキストからレシピ追加時のURL自動抽出・表示

## 変更概要

テキストからレシピを追加する際、貼り付けたテキスト内に動画や参考URLが含まれていれば、出典欄に自動的にURLを抽出して貼り付ける機能を追加しました。さらに、レシピ詳細ビューアー（レシピ集）および料理・記録ビューアーに、出典URLをリンクとして表示するUIを追加しました。

## 変更箇所

### app.html

1. **出典欄を textarea に変更** (Line ~433)
   - `r-source` を `<input type="text">` → `<textarea rows="2">` に変更
   - 複数URLや長いリンクを見やすくするため

2. **AIプロンプトに source 抽出を追加** (Line ~4461)
   - レシピ構造化プロンプトのJSON出力に `"source"` フィールドを追加
   - テキスト内に動画や参考URLがあれば改行区切りで出力するよう指示

3. **クライアント側フォールバック URL 抽出** (Line ~4503)
   - AIが source を返さなかった場合、入力テキストから正規表現 `/https?:\/\/[^\s]+/g` でURLを抽出
   - 複数URLは改行区切りで `r-source` にセット

4. **レシピ詳細ビューアーに source URL 表示** (Line ~630, ~3603)
   - `aiRecipePreviewModal` の `aiPreviewName` の下に `aiPreviewSource` コンテナを追加
   - `openRecipeViewer` で source をリンク一覧として表示
   - URL形式のものは `target="_blank" rel="noopener noreferrer"` で別タブで開くリンクとして表示
   - URLでないものはテキストとして表示

5. **料理ビューアーに source URL 表示** (Line ~222, ~5283)
   - `cookingViewer` の `cookingRecipeName` の下に `cookingSource` コンテナを追加
   - `openCookingViewer` で source をリンク一覧として表示
   - 同様にURLは別タブで開くリンクとして表示

## Verify結果

```
VERIFY_PASSED
```

## Canvas環境手動チェック結果

| 項目 | 結果 |
|------|------|
| alert/confirm/prompt 残存 | なし（変更箇所では未使用） |
| showToast 関数存在 | OK |
| GEMINI_API_KEY 空チェック | 既存パターンに従い、変更箇所では空チェックを追加していない |
| executeGAS 個別呼び出し | 変更箇所では個別呼び出しなし（UI表示・AIプロンプト・URL抽出のみ） |
| 新規コードの肥大化 | 既存パターン（insertAdjacentHTML, escapeHtml）を再利用。肥大化なし。 |

## テスト観点（Canvas環境で手動確認）

1. テキストからレシピ追加 → URL含むテキスト貼り付け → AI構造化後、出典欄にURLが自動入力されることを確認
2. レシピ集 → レシピタップ → レシピ名の下に出典URLリンクが表示されることを確認
3. 料理・記録 → レシピを選択 → 上部タイトルの下に出典URLリンクが表示されることを確認
4. 出典URLをタップ → 別タブで開くことを確認
