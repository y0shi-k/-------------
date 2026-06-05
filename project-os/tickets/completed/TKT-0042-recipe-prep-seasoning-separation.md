---
id: TKT-0042-recipe-prep-seasoning-separation
title: レシピの材料・調味料・下ごしらえ・調理工程の分離実装
status: completed
goal: レシピデータを4区分に分離し、AI生成・テキスト解析・UI表示・在庫連携の全フローで正しく扱う
acceptance:
  - AIプロンプトが4区分のJSONスキーマを出力する
  - レシピ編集モーダルに4つの入力セクションがある
  - AIプレビュー・閲覧モーダルに4つの表示セクションがある
  - 料理ビューアで材料/調味料・下ごしらえ/調理工程が分離表示される
  - 買い物リスト連携に調味料が含まれる
  - 在庫消費調整に調味料が含まれる
  - スプレッドシートに調味料JSON・下ごしらえJSON列が追加される
  - 既存レシピは後方互換で表示される
required_evals:
  - manual_bulk_sync_policy
  - html_structure_verify
eval_selection_mode: auto
changed_paths:
  - app.html
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0042-recipe-prep-seasoning-separation
related_artifacts:
  - artifacts/TKT-0042/verify.json
  - artifacts/TKT-0042/manual-smokes.md
  - artifacts/TKT-0042/review.md
  - artifacts/TKT-0042/report.md
owner_role: implementer
owner_notes:
  - verify は `python3 -c "import html.parser; html.parser.HTMLParser().feed(open('app.html').read())" && grep -q 'executeGAS' app.html && grep -q 'GAS_URL' app.html && echo 'VERIFY_PASSED'`
  - スプシ変更は state.pendingSync + syncPendingChanges() の流れを維持
  - 既存データの後方互換を維持（seasonings/prepSteps 空の場合は無視）
---

# Summary

実装は後追いで実施。spec と ticket を実装完了後に作成。

## 実装メモ

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 正本: `app.html`, `要件定義書.md`, `AGENTS.md`
- 生成物: GASデプロイ後のWebアプリ、Spreadsheet内データ、Drive保存画像
- stack 固有 eval: スキーマ変更、GAS通信パターン改変、UIコンポーネント追加

### 変更箇所（app.html）

1. `cleanRecipeItem` — `seasonings` / `prepSteps` を追加
2. GASコード（`syncPendingChanges` payload 内）:
   - `ensureRecipeHeader` — ヘッダーに `調味料JSON` / `下ごしらえJSON` を追加
   - `readRecipes` — `rr[9]` / `rr[10]` から読み込み
   - `recipeCreates` — 新列に `seasonings` / `prepSteps` を書き込み
   - `recipeUpdates` — 更新時に J/K 列も更新
3. `getRecipeIngredientCount` — ingredients + seasonings を合算
4. `getFilteredSortedRecipes` — 食材検索で seasonings も対象に
5. `generateAiRecipeFromPlan` — プロンプトに4区分スキーマを追加
6. `parseRecipeTextWithAI` — 同上
7. `openAiRecipePreview` — 4セクション表示（ingredients/seasonings/prepSteps/steps）
8. `openRecipeViewer` — 同上
9. `openRecipeEditor` — 4セクション入力（renderIngredientInputs / renderSeasoningInputs / renderPrepStepInputs / renderCookStepInputs）
10. `getRecipeFormData` — 4区分を収集
11. `saveAiRecipeToCollection` — seasonings / prepSteps を含めて保存
12. `renderCookingIngredients` — 材料と調味料を分離表示
13. `renderCookingSteps` — 下ごしらえと調理工程を分離表示
14. `compareRecipeWithInventory` — 材料+調味料を対象に
15. `openConsumptionAdjustmentModal` — 材料+調味料を対象に

### 残リスク

- Canvas環境での実際のAI通信による4区分出力精度は未検証（プロンプト強化済み）
- 既存レシピの `steps` に下ごしらえが混在している場合、手動で `prepSteps` に移動する必要がある（自動移行は未実装）
- 調味料の在庫が未登録の場合、買い物リストに常に追加される動作は仕様通りだが、ユーザーが塩・醤油などを在庫管理しない場合は買い物リストが煩雑になる可能性がある
