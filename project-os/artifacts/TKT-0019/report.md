# TKT-0019 実装完了報告

## 概要

SPEC-0019 に基づき、モードC（クッキングビューア）のUI基盤を実装しました。

## 変更内容

### 1. モードCセクション（`#modeCView`）
- **クッキングビューア**（`#cookingViewer`）を新規実装
  - ヘッダー：レシピ名（`text-2xl font-bold`）＋ 戻るボタン
  - タブ切替：「材料」「手順」の2タブ
  - 材料タブ：大画面カード（`text-xl` / `text-lg font-semibold`）で表示
    - 分類バッジ：「食材」→ 緑系、`調味料`→ 黄系
    - 分量バッジ：「大さじ」→ 赤系太字、「小さじ」→ 青系太字
  - 手順タブ：ステップ番号付き大画面カード
    - テキスト内の分量表現（例: 「醤油 大さじ1」）を正規表現で検出し強調表示
    - インライン分量は `bg-gray-100 px-1 rounded` で視覚的に区切り
  - 完了ボタン：画面下部固定（`fixed bottom-20`）で「料理を完了する」
- **ガイド表示**（`#cookingGuide`）：ビューア未選択時に「献立を選んでください」を表示

### 2. レシピ選択導線
- **献立スケジュール**：割り当て済みスロットに「▶ 開始」ボタンを追加
- **レシピ集**：レシピカードに「🍽️ 料理する」ボタンを追加
- **自動表示**：モードCに切り替えた時、今日の献立があれば自動でビューアを開く

### 3. JavaScript関数群（新規）
- `openCookingViewer(recipeId)`
- `closeCookingViewer()`
- `switchCookingTab(tab)`
- `renderCookingIngredients(recipe)`
- `renderCookingSteps(recipe)`
- `highlightAmounts(text)` — 分量表現の強調
- `getIngredientCategoryBadge(type, unit, name)`
- `getAmountBadge(unit)`
- `finishCooking()` → `openConsumptionAdjustmentModal(recipeId)`（仮実装）

### 4. エラーハンドリング
- 材料JSON・手順JSONのパース失敗時は `showToast('レシピデータの読み込みに失敗しました')` で保護
- `alert` / `confirm` / `prompt` は不使用

## verify 結果

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
# → VERIFY_PASSED
```

追加チェックも全てパス：
- `alert` / `confirm` / `prompt` 不使用
- `showToast` 関数存在確認
- 新規スプシ書き込みコードは `syncPendingChanges()` 経由のみ

## 変更ファイル

- `app.html`
