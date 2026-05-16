# TKT-0021 実装完了報告

## 概要

SPEC-0021 に基づき、料理完了後の「料理の記録」モーダルを実装しました。完成写真のアップロード、星評価、感想入力を行い、次の completeRecipe フロー（TKT-0022）へ繋ぎます。

## 変更内容

### 1. 記録モーダル UI 追加
**`cookingRecordModal`** を `app.html` に新規追加：
- モーダルタイトル: 「料理の記録」
- 写真アップロードエリア:
  - ドロップゾーン風UI（カメラアイコン付き）
  - `<input type="file" accept="image/*">` を非表示で配置し、ラベルでカスタマイズ
  - 選択後にプレビュー画像を表示（`photoPreviewContainer`）
  - プレビュー下に「変更」ボタン（`clearCookingPhoto`）
- 評価入力:
  - ★1〜5の星アイコン（ボタン要素）
  - タップで選択、ハイライト表示（`renderStarRating` / `setCookingRating`）
  - 初期値は未選択（0）
- 感想入力:
  - `<textarea id="cookingRecordNote">` で複数行入力
  - placeholder: 「今回の調理の感想、次回の改善点など（任意）」
- アクションボタン:
  - 「スキップ」: 記録を保存せず閉じる
  - 「記録を保存」: 画像アップロード後に completeRecipe フローへ進む

### 2. 画像処理フロー
**`handlePhotoSelect`**:
- `FileReader` で Base64 文字列に変換
- Base64 サイズが 5MB を超える場合、`resizeImage` で Canvas を用いて最大1024pxにリサイズ（JPEG 0.85品質）
- Base64 データを `state._tempCookingPhotoBase64` に一時保持
- プレビュー表示を切り替え

**`saveCookingRecord`**:
- 「記録を保存」ボタン押下時に発火
- 画像が選択されている場合、`executeGAS` で `saveImageToDrive` アクションを送信
  - payload: `{ action: 'saveImageToDrive', base64: '...', filename: 'cooking_YYYYMMDD_HHmmss.jpg' }`
- 返却された URL を `state._tempCookingPhotoUrl` に保持
- 画像未選択の場合は URL を空文字として次へ進む

### 3. エラーハンドリング
- 画像アップロード失敗時: `showToast('写真の保存に失敗しました。記録を続行します。', 'error')` で継続可能
- 評価未入力・画像未選択でも保存可能（評価は0、URLは空文字として保存）

### 4. 既存フローへの統合
**`confirmConsumption`** を修正:
- 消費量調整確定後、`setTimeout(() => openCookingRecordModal(recipeId), 500)` で記録モーダルを自動で開く
- `_consumptionRecipeId` は `closeConsumptionModal` で null 化されるため、呼び出し前にローカル変数 `recipeId` に保存

### 5. state 拡張
`state` に以下を追加:
- `_tempCookingPhotoBase64`: 画像Base64一時保持
- `_tempCookingPhotoUrl`: Drive保存後のURL一時保持
- `_tempCookingRating`: 評価値一時保持
- `_tempCookingNote`: 感想一時保持

## verify 結果

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
# → VERIFY_PASSED
```

追加チェック:
- `alert` / `confirm` / `prompt` 不使用
- `showToast` 関数存在確認
- 画像アップロードは `executeGAS` で `saveImageToDrive` を個別呼び出し（SPEC・チケットで要件化された例外）

## 変更ファイル

- `app.html`
- `project-os/artifacts/TKT-0021/verify.json`
- `project-os/artifacts/TKT-0021/report.md`
- `project-os/artifacts/TKT-0021/manual-smokes.md`
- `project-os/artifacts/TKT-0021/review.md`
