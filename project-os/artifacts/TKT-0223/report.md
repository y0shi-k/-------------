---
ticket_id: TKT-0223-consumption-stock-auto-match
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

調理完了時・履歴編集時の「実際の消費量を調整」で、在庫名とレシピ食材名が完全一致しないと自動選択されず全件手動選択になっていた。TKT-0222 の名前マッチング（正規化＋類義語辞書）を適用し、「たまご/卵」のような表記ゆれでも自動紐付けされるようにした。

- `web/src/lib/ingredients/name-match.ts`: 共通ヘルパー `findMatchingStock(ingredientName, ingredientType, ingredientUnit, items)` を追加。条件は 分類一致・単位一致・在庫>0・`matchesIngredientName`（score>=2、部分一致は除外）。複数候補は `ingredientNameMatchScore` 降順（完全一致>正規化一致>辞書一致）で選択。
- `web/src/lib/cooking-history/edit.ts` `buildDraftsFromRecipeIngredients`: 完全一致 `find` を `findMatchingStock` に置換（履歴編集経路）。
- `web/src/components/recipe-meal-workspace.tsx` `buildConsumptionDrafts`: 同様に置換（調理完了経路）。`ConsumptionEditor` の「おすすめ（同分類・同単位）」optgroup 内をスコア降順にソート（新配列を生成、mutate なし）。
- `web/src/components/cooking-record-edit-modal.tsx` `ConsumptionEditList`: フラットリストだった在庫プルダウンを ConsumptionEditor と同じ「おすすめ（同分類・同単位）」「その他の在庫」の optgroup 構成に統一し、おすすめ内をスコア降順に。

## 今回追加した安全装置

- 自動選択は matches=true（正規化一致 or 辞書一致）のみ。**部分一致のみの在庫（豚肉×豚こま切れ肉）は自動選択されない**ことをテストで固定（SPEC-0222 のユーザー確定方針）。
- 既存条件（分類一致・単位一致・在庫>0）は緩めていない。自動選択時の消費量は従来どおり `Math.min(必要量, 在庫量)`・selected=true。
- マッチングロジックは `findMatchingStock` に一元化し、両経路（調理完了/履歴編集）で重複実装しない。
- テスト5件追加（表記ゆれ自動紐付け・部分一致非選択・複数候補の優先順・optgroup 表示2件）。

## 実施した確認

- `/verify TKT-0223`: lint / typecheck / test（38ファイル・373件全パス）/ build すべて pass。policy も pass。`verify.json` 参照。
- 既存テスト「completes a meal schedule and creates cooking history」（完全一致の従来ケース）が無変更で通過し、回帰がないことを確認。

## 残リスク

- optgroup のテストは jsdom の `getByRole("group")` に依存。実ブラウザでのプルダウン表示は実機目視が未実施（表示のみの差異でデータ影響なし）。

## 次の依頼や人判断

- なし。supabase_schema_change 等の eval マッチは `cooking_history`/`recipes` 等のテーブル名トークンによる過剰マッチで、実 schema・DB 書き込み経路（`computeInventoryAdjustments` 含む）は無変更（manual-smokes.md / review.md に記録。チケット owner_notes で予見済み）。
