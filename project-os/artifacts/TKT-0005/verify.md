# TKT-0005 Artifacts

## 実装日
2026-05-14

## 変更ファイル
- `app.html`

## 変更概要

### Phase 1: 基本実装
- `#bTabAi` のプレースホルダーを AIレシピ考案UIに置き換え
  - 「🚨 優先消費レシピ」「🎯 指定食材から考案」の2ボタン
  - 期限が近い食材のプレビューリスト表示
  - 選択済み食材タグ表示
- `#aiIngredientSelectModal` 追加
  - 在庫一覧から食材をチェックボックスで選択
  - 期限ハイライト（赤/黄）付き
- `#aiRecipePreviewModal` 追加
  - 生成レシピのプレビュー（レシピ名・材料リスト・手順リスト）
  - 「再生成」「レシピ集に保存」ボタン

### Phase 2: プロンプト編集モーダル
- `#aiPromptEditModal` 追加
  - AIへのプロンプトをユーザーが確認・編集できる
  - デフォルトプロンプトから数量表記を削除し「在庫をすべて使い切る必要はありません」注釈を追加

### Phase 3: 2段階AI相談フロー
- `#aiPromptEditModal` を `#aiRequestModal` に全面書き換え
  - **画面A: 要望入力**
    - 使う食材をカード形式で表示
    - 「どんなレシピがいいですか？」テキストエリア
    - 「AIに相談する」ボタン
  - **画面B: 方針確認**
    - AIの提案方針を自然言語で表示
    - 「この方針でレシピを生成」「要望を変える」「キャンセル」
- APIコールを2段階に分離
  - **ステップ1** `consultAiRecipe()`: 食材+要望 → AIが方針説明を自然言語で返す
  - **ステップ2** `generateAiRecipeFromPlan()`: 方針+要望+食材 → JSONレシピ生成

### Phase 4: ハイブリッドプロンプト編集UI（最終版）
- `#aiRequestModal` 画面Aを再構成
  - **AI提案プロンプト編集エリア**（上部）
    - `buildAiPrompt()` で生成したデフォルトプロンプトを表示
    - ユーザーが直接編集可能
    - 「提案に戻す」ボタンでデフォルトにリセット
    - フォントは `font-mono` で等幅、ソースコード風の見た目
  - **追加の要望エリア**（下部）
    - 自然言語で追加指示を書くためのテキストエリア
    - 例: 「子供向けに、卵は半熟で、パスタにしてほしい...」
    - プロンプトに追加される形でAIに伝わる
- 3種類の使い方をサポート
  1. **プロンプトを直接編集** → デフォルトプロンプトを書き換える
  2. **追加要望を書く** → プロンプトはそのまま + 要望を追記
  3. **一から作る** → プロンプトを全削除して要望だけ書く / プロンプトを丸ごと書き換える

### JS関数群
- `getExpiringItems()`: 期限3日以内の食材抽出
- `generatePriorityRecipe()`: 優先消費レシピ（リクエストモーダル経由）
- `openAiIngredientSelector()`: 食材選択モーダル
- `generateSelectedRecipe()`: 指定食材からレシピ（リクエストモーダル経由）
- `buildAiPrompt(mode, items)`: デフォルトプロンプト生成（数量なし）
- `openAiRequestModal()`: 相談モーダル表示（プロンプト初期化付き）
- `resetAiPromptToDefault()`: プロンプトをデフォルトに戻す
- `closeAiRequestModal()`: 相談モーダル閉じる
- `consultAiRecipe()`: ステップ1: プロンプト+要望でAI相談
- `backToAiRequestInput()`: 画面B→画面Aに戻る
- `generateAiRecipeFromPlan()`: ステップ2: 方針確定後にJSONレシピ生成
- `openAiRecipePreview()`: プレビューモーダル表示
- `saveAiRecipeToCollection()`: レシピ集への保存（既存 `saveRecipe` フロー流用）
- `regenerateAiRecipe()`: 同条件で再生成
- `renderAiTab()`: AIタブ描画（期限プレビュー）

## 設計上の判断
- Gemini API 呼び出しは既存 `parseRecipeTextWithAI()` と同じパターンを流用
- レシピ保存は既存 `queueRecipeCreate()` + `renderRecipeList()` を流用
- `executeGAS` は `syncPendingChanges()` 経由のみ（個別呼び出しなし）
- エラーハンドリング: `try/catch` + `setStatus(false)` + `showToast(..., 'error')`
- `GEMINI_API_KEY` の空チェックは行わない（Canvas環境でユーザーが手動設定する前提）
- 数量問題対策: プロンプトに食材名のみ提示し「在庫をすべて使い切る必要はありません」と明記
- UX改善: 
  - JSONを完全に隠し、自然言語での要望入力と方針確認を挟む
  - AI提案プロンプトを可視化し、ユーザーが「踏み台」にして編集できる
  - 3種類の操作パターン（プロンプト編集 / 追加要望 / 一から）を同時にサポート

## Verify
```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
# => VERIFY_PASSED
```

### Canvas環境追加チェック
- alert/confirm/prompt: なし
- showToast 関数: 存在
- GEMINI_API_KEY 空チェック: なし（仕様通り）
- executeGAS 個別呼び出し: なし（syncPendingChanges のみ）
- コード肥大化: 既存パターンを流用、モーダル構造は既存と同一

## 残タスク
- Canvas 貼り付け後の動作確認（Gemini API 実際の通信テストは API キー設定後に実施）
