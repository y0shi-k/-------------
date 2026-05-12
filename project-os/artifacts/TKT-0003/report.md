# TKT-0003 実装レポート

## 概要
画像スキャンによる食材一括登録機能を `app.html` に実装した。

## 変更ファイル
- `app.html` のみ

## 変更内容

### 1. UI追加
- 隠しファイル入力: `<input type="file" accept="image/*" capture="environment" id="imageScanInput" onchange="handleImageScan(event)" hidden>`
- 画像スキャンボタン: 登録待ちタブの `stagingActions` 内に配置。既存の Tailwind クラス構成を踏襲。
  - ボタンスタイル: `bg-rose-500`, フル幅, アイコン付き

### 2. JavaScript関数追加

#### `handleImageScan(e)`
- `FileReader.readAsDataURL()` で画像を data URL に変換
- prefix (`data:image/...;base64,`) を除去して pure base64 を抽出
- エンコード中は `setStatus()` で「画像をエンコード中...」を表示

#### `scanImageWithAI(base64Data, mimeType)`
- APIキー未設定時はアラートを表示して中断
- エンドポイント: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- リクエストボディに `inlineData`（mimeType + data）を含むマルチモーダルリクエスト
- プロンプトで JSON 形式の出力を指定（`responseMimeType: "application/json"`）
- プロンプト内で「個人情報は含めないでください」と明記し、プライバシー配慮を実装

#### `parseAIImageResponse(text)`
- 期待する JSON スキーマをパース:
  ```json
  [
    { "name": "食材名", "qty": 1, "unit": "個", "limit1": "YYYY-MM-DD", "loc": "冷蔵庫" }
  ]
  ```
- パース失敗時は空配列を返し、フリーズしない

### 3. Staging リストへの追加
- 抽出結果を `state.staging` に一括 `push`
- 各アイテムのデフォルト値:
  - `type`: `'食材'`
  - `buy`: 当日日付
  - `open`: `''`
  - `limit2`: `null`
  - `memo`: `'画像スキャンから追加'`
  - `_newAi`: `true`（ハイライト表示用）
- 追加後 `renderList()` で即時反映

## エラーハンドリング
- APIキー未設定時: アラート表示
- ネットワーク/APIエラー時: アラート表示、フリーズしない
- 画像に食材が検出されない場合: アラート表示
- ファイル読み込み失敗時: アラート表示

## セキュリティ確認
- **APIキー管理**: `const GEMINI_API_KEY = "";` で定義。ユーザー自身が設定する前提。
- **露出リスク**: フロントエンドにAPIキーを記載するため、公開サーバーに配置する場合はリスクがある。本アプリは単一HTMLファイルのGemini Canvasアプリとして利用されることを想定しており、利用者が自分のキーを設定して使う形式である。
- **今後の検討事項**: GAS側でプロキシする方式への移行を検討することで、APIキーの露出を防げる（TKT-0003補足参照）。
- **プライバシー**: プロンプト内で「店舗名・住所・電話番号などの個人情報は含めないでください」と指示済み。

## Verify結果
```
VERIFY_PASSED
```

## Acceptance Checklist
- [x] ユーザーが画像を選択できるUIが存在する
- [x] 画像から複数の食材が自動抽出され、Stagingリストに追加される
- [x] 抽出結果はユーザーが確認・修正できる（既存のStaging編集フローを流用）
- [x] HTML構文チェックが通る
- [x] `executeGAS` と `GAS_URL` が残っている
- [x] API呼び出し失敗時にエラーメッセージが表示され、フリーズしない
