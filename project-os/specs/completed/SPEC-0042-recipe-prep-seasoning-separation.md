---
id: SPEC-0042-recipe-prep-seasoning-separation
title: レシピの材料・調味料・下ごしらえ・調理工程の分離
status: ready
scope:
  - レシピ編集モーダル（recipeModal）
  - AIレシピ生成・テキスト解析プロンプト
  - AIプレビュー・レシピ閲覧モーダル（aiRecipePreviewModal）
  - 料理ビューア（cookingViewer）の材料タブ・手順タブ
  - レシピ一覧の材料数表示・食材検索
  - 買い物リスト連携（compareRecipeWithInventory, addShortagesToShopping）
  - 在庫消費調整（openConsumptionAdjustmentModal）
  - スプレッドシート「レシピ集」の列構造
constraints:
  - 既存レシピデータはそのまま保持する（後方互換）
  - 個別の即時GAS通信は行わない（state.pendingSync + syncPendingChanges() の流れを維持）
acceptance:
  - AI考案レシピ生成で材料・調味料・下ごしらえ・調理工程が分離されたJSONが出力される
  - テキストからレシピ解析でも同様に4項目が分離される
  - レシピ編集モーダルに材料/調味料/下ごしらえ/調理工程の4入力エリアが表示される
  - 料理ビューアの材料タブで材料と調味料が分離表示される
  - 料理ビューアの手順タブで下ごしらえと調理工程が分離表示される
  - 買い物リスト連携に調味料も含まれる
  - 在庫消費調整に調味料も含まれる
  - レシピ一覧の材料数に調味料が合算される
  - レシピ検索（食材モード）で調味料名もヒットする
  - スプレッドシート「レシピ集」に調味料JSON列・下ごしらえJSON列が追加される
  - 既存レシピ（旧形式）は今まで通り表示され、新規レシピは4区分で表示される
related_tickets:
  - TKT-0042-recipe-prep-seasoning-separation
---

# Summary

レシピデータを「材料」「調味料」「下ごしらえ」「調理工程」の4区分に分離し、AI生成・テキスト解析・UI表示・在庫連携の全フローで扱えるようにする。

## 背景

従来のレシピ構造では `ingredients`（材料+調味料混在）と `steps`（下ごしらえ+調理工程混在）のみだったため、料理中の手順追いや買い物リストの整理がしにくかった。

## 仕様

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- verify: `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
- スプシ変更ポリシー: 初期読込/承認を除く書き込み系は `state.pendingSync` + `syncPendingChanges()` に集約し、個別 `executeGAS(payload...)` を増やさない

### データ構造変更

レシピオブジェクトに以下を追加（後方互換）:
- `seasonings: '[]'` — 調味料配列（{name, amount, unit}）
- `prepSteps: '[]'` — 下ごしらえ配列（文字列）

既存の `ingredients` と `steps` はそのまま維持。`steps` は「調理工程」として扱う。

### スプレッドシート列追加

「レシピ集」シートに新列を追加:
- J列: `調味料JSON`
- K列: `下ごしらえJSON`

GAS側の `ensureRecipeHeader` / `readRecipes` / `recipeCreates` / `recipeUpdates` を対応。

### AIプロンプト更新

- `generateAiRecipeFromPlan`（AI考案）と `parseRecipeTextWithAI`（テキスト解析）の出力スキーマに `seasonings` / `prepSteps` を追加
- 各項目の定義を明確に指示

### UI変更

- レシピ編集モーダル: 4セクション入力
- AIプレビュー/閲覧モーダル: 4セクション表示
- 料理ビューア材料タブ: 材料と調味料を分離表示（在庫バッジ個別）
- 料理ビューア手順タブ: 下ごしらえ（teal）と調理工程（indigo）を分離表示

### 連携変更

- 買い物リスト: `compareRecipeWithInventory` で材料+調味料を対象に
- 在庫消費調整: `openConsumptionAdjustmentModal` で材料+調味料を対象に（無いものは無視）
- レシピ検索: 食材モードで調味料名も検索対象に
- 材料数カウント: `getRecipeIngredientCount` で ingredients + seasonings を合算

## 非対象

- 献立スケジュールのデータ構造
- 買い物リストのデータ構造
- 食材在庫のデータ構造
- 料理履歴のデータ構造
- GASスクリプトの再デプロイ（app.html内のGASコードを更新するため不要）

## Acceptance Example

- AIが生成したレシピを保存後、レシピ閲覧モーダルで「材料」「調味料」「下ごしらえ」「調理工程」が分離して表示される
- 既存の旧形式レシピを開いても、材料と手順が今まで通り表示される（下ごしらえ欄・調味料欄は空）
- 料理ビューアで材料タブを開くと、在庫がある材料は「在庫あり」、調味料も同様に判定される
- 買い物リストへ追加すると、調味料の不足分もリストに入る
