# SPEC-0021-cooking-record-modal

## 背景

料理完了後に、完成写真・評価・感想を記録し、日後の振り返りとレシピの改善に役立てる。これらのデータは「料理履歴」シートに保存される。

## 変更範囲

- `app.html` に記録モーダルを新規追加
- GAS側に画像Drive保存処理を追加（フロント側は `executeGAS` で `saveImageToDrive` を呼ぶ）

## 詳細仕様

### 1. 記録モーダルUI

- モーダルタイトル: 「料理の記録」
- 写真アップロードエリア:
  - カメラアイコン付きのドロップゾーン風UI
  - `<input type="file" accept="image/*">` を非表示で配置し、ラベルでカスタマイズ
  - 選択後にプレビュー画像を表示
  - プレビュー下に「変更」ボタン
- 評価入力:
  - ★1〜5の星アイコン（SVGまたは絵文字）
  - タップで選択、ハイライト表示
  - 初期値は未選択（0）
- 感想入力:
  - `<textarea>` で複数行入力
  - placeholder: 「今回の調理の感想、次回の改善点など（任意）」

### 2. 画像処理フロー

- 画像選択後、JavaScriptの `FileReader` でBase64文字列に変換
- Base64データを `state._tempCookingPhotoBase64` に一時保持
- 「記録を保存」ボタン押下時、GASペイロード `saveImageToDrive` で送信
  - payload: `{ action: 'saveImageToDrive', base64: '...', filename: 'cooking_YYYYMMDD_HHmmss.jpg' }`
- GAS側で `DriveApp.createFile()` で保存し、ファイルURLを返す
- 返却されたURLを `state._tempCookingPhotoUrl` に保持
- 画像未選択の場合はURLを空文字として履歴保存へ進む

### 3. エラーハンドリング

- 画像アップロード失敗時は `showToast('写真の保存に失敗しました。記録を続行します。')` で継続可能にする
- 評価未入力でも保存可能（0として保存）

## 技術的制約

- 画像サイズが大きすぎる場合（Base64で5MB超）の対策:
  - Canvasでリサイズ（最大1024px）してからBase64化
- `alert` / `confirm` / `prompt` を使わない

## テスト観点

- 画像選択後プレビューが表示される
- 星評価がタップで選択できる
- 画像未選択でも保存できる
- verify が通る
