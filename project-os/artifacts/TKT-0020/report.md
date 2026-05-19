# TKT-0020 実装完了報告（修正版）

## 概要

SPEC-0020 に基づき、料理完了時の消費量調整モーダルと在庫減算処理を実装しました。
ユーザーからの追加要望に応じて、在庫不足時でも完了できるように改善しました。

## 変更内容

### 1. 料理記録画面（モードC）の材料タブ改善
**`renderCookingIngredients`** を修正：
- 各材料の下に「在庫: X個 / 必要: Y個」を同時表示
- 在庫不足の材料は行全体を赤系（`bg-rose-50 border-rose-200`）にハイライト
- 不足時は「⚠️ 不足」バッジ、在庫あり時は「在庫あり」バッジを表示
- 在庫テキストの色も不足時は赤（`text-rose-500`）、在庫あり時は緑（`text-emerald-600`）

### 2. 消費量調整モーダル改善（第2弾）
#### 2.1 上辺固定化（リスト数による上辺ずれの解消）
`scheduleRecipeModal`（レシピを選択）と同じ Flexbox + 固定高さの仕組みに統一：
- 外側モーダル: `items-start justify-center pt-12`
- 内側カード: `h-[calc(100vh-6rem)] flex flex-col`
- リスト部分 (`#consumptionList`): `flex-1 min-h-0 overflow-y-auto`
- これによりヘッダー・タブ・全選択ボタンは画面上部に固定され、リストのみスクロール

#### 2.2 チェックボックスによる在庫減算対象選択
- 各材料行の左端にチェックボックス（`.cons-check`）を追加
- **デフォルトは全て OFF**
- チェックが ON の材料のみ在庫減算の対象となる
- `validateConsumptionInputs()` と `confirmConsumption()` を修正し、チェック ON の項目のみ処理対象に変更

#### 2.3 全選択 / 全解除ボタン
- タブ切り替えボタンの下に「すべて選択」「すべて解除」ボタンを追加
- `toggleAllConsumptionChecks(checked)` 関数で一括制御
- 状態変更後に `validateConsumptionInputs()` を自動実行し、在庫不足警告も連動更新

### 3. その他
- モーダル初期表示時にも `validateConsumptionInputs()` を実行し、初期状態から不足警告を表示
- `alert` / `confirm` / `prompt` は不使用
- 個別の `executeGAS` 呼び出しは増やしていない（`syncPendingChanges()` 経由のみ）

## verify 結果

```bash
python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'
# → VERIFY_PASSED
```

追加チェック：
- `alert` / `confirm` / `prompt` 不使用
- `showToast` 関数存在確認
- `executeGAS` の呼び出しは既存の4箇所のみ（新規追加なし）
- スプシ書き込み系の新規コードは `queueInventoryUpdate` / `queueInventoryDelete` 経由で `pendingSync` に積む設計を維持

## 変更ファイル

- `app.html`
- `project-os/artifacts/TKT-0020/verify.json`
- `project-os/artifacts/TKT-0020/report.md`
