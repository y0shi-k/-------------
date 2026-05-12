# SPEC-0003-image-scan-registration.md

## 概要

レシートや食材パッケージの写真から、Gemini マルチモーダル API を使って食材情報を自動抽出し、登録待ち（Staging）リストへ一括投入する機能を実装する。手動入力の負担を減らし、買い物直後の一括登録をスムーズにする。

## Acceptance Criteria

1. **画像選択 UI**
   - 登録待ちタブ内に「画像スキャン」ボタンを配置
   - `<input type="file" accept="image/*">` をプログラム的に起動
   - ボタンは既存の Tailwind クラス構成を踏襲

2. **Base64 エンコード**
   - `FileReader.readAsDataURL()` で画像を data URL に変換
   - data URL から prefix を除去し、pure base64 を抽出
   - 処理中は `setStatus()` で「画像をエンコード中...」を表示

3. **Gemini API マルチモーダル呼び出し**
   - エンドポイント: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
   - リクエストボディに `inlineData`（mimeType + data）を含む
   - プロンプトで JSON 形式の出力を指定（`responseMimeType: "application/json"`）
   - API キーは `const GEMINI_API_KEY = ""` で定義（ユーザー自身が設定）

4. **レスポンスパース**
   - 期待する JSON スキーマ:
     ```json
     [
       {
         "name": "食材名",
         "qty": 1,
         "unit": "個",
         "limit1": "YYYY-MM-DD",
         "loc": "冷蔵庫"
       }
     ]
     ```
   - パース失敗時はエラーメッセージを表示し、フリーズしない
   - 抽出結果は既存の Staging 編集フローを流用可能な形式に変換

5. **Staging リストへの追加**
   - 抽出結果を `state.staging` に一括 `push`
   - 各アイテムのデフォルト値:
     - `type`: `'食材'`
     - `buy`: 当日日付
     - `open`: `''`
     - `limit2`: `null`
     - `memo`: `'画像スキャンから追加'`
   - 追加後 `renderList()` で即時反映

6. **UX/エラーハンドリング**
   - API キー未設定時はアラート
   - ネットワークエラー時はアラート
   - 画像に食材が検出されない場合は空リストとして扱い、アラート
   - ステータスバーで各フェーズを詳細に表示

7. **技術制約**
   - 単一 HTML ファイル（`app.html`）内に実装
   - Tailwind CSS の既存クラス構成を踏襲
   - スキーマ変更なし（Staging はメモリ上のオブジェクト配列）
   - `executeGAS()` は本機能では使用しない（Gemini API はフロントエンド直接呼び出し）

## 影響範囲

- `app.html` のみ
- 新規関数：`handleImageScan(e)`, `scanImageWithAI(base64Data, mimeType)`, `parseAIImageResponse(text)`
- 新規 DOM 要素：隠し `<input type="file">`、画像スキャンボタン

## 参考

- TKT-0003-image-scan-registration.md
- 要件定義書 §3 モードA: AIスキャナー＆推測処理
