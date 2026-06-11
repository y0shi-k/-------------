---
ticket_id: TKT-0241-consumption-unit-conversion
status: ready
---

# Report

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

在庫の単位とレシピの必要単位が違うとき（ユーザー実例: 豚コマ 5パック・1パック=80g vs レシピ 豚こま肉 300g）、単位換算が登録済みでも自動マッチせず消費もできない問題の解消。ユーザー要望（2026-06-12）: 「換算して適切に消費してほしい。まずはマッチしてほしい」「パック単位でもグラム換算でも消費できるように。120g消費すれば3と1/2パックとしたい」。

## 変更内容

- `web/src/lib/inventory/unit-conversion.ts`（新規・純粋関数）: `conversionFactorToUnit`（同単位=1 / 正方向換算=toQty/fromQty / 不能=null。0除算・負値・NaNガード）、`stockAmountInUnit`、`convertToStockUnit`
- `web/src/lib/ingredients/name-match.ts`: `findMatchingStock` の unit 条件を「一致 または 正方向換算成立」へ拡張
- `web/src/components/recipe-meal-workspace.tsx`:
  - おすすめ判定（rawOptions / stockOptionsForIngredient）を換算対応 → 豚コマが「おすすめ（同分類・同単位）」に入り自動選択される
  - ConsumptionDraft に `consumeUnit` 追加。換算マッチ行のみ単位セレクタ（レシピ単位⇔在庫単位）を表示。単位切替時は消費量を0リセット、在庫切替時はレシピ単位へリセット
  - 確定時: 入力単位 → 在庫単位へ換算して減算（120g → 1.5パック減算 → 残3.5）。換算失敗時は在庫を一切触らずエラー表示
  - `cooking_consumption_events` の consumed_amount/consumed_unit を**在庫単位**で保存（rollback が quantity へ直接足し戻すため。同単位ケースは従来と同値）
  - 換算消費時は QuantityNotation を "fraction" にし、在庫一覧の残量を分数優先表示（3.5 → 「3 1/2」）
  - 不足計算 `inventoryAmountByNameAndUnit` を換算合算に拡張（5パック×80g=400g ≥ 300g なら不足扱いしない。同一在庫の二重計上なし）

## 今回追加した安全装置

- 換算不能時の確定ブロック（在庫減算前に中断・エラー表示）
- 単体テスト計153件 pass（unit-conversion 14 / name-match 65 / workspace 69 / rollback 5。豚コマ実例・120g→残3.5・巻き戻し3.75復元・換算なし非マッチ・同単位回帰を固定）
- **ローカルSupabase + Playwright によるブラウザE2Eスモークを実施し全項目確認**（詳細は manual-smokes.md）

## 実施した確認

- `bash harness/bin/verify_web.sh TKT-0241` → lint / typecheck / test / build / policy すべて pass
- ブラウザE2E（ローカルSupabase・シードデータ＝ユーザー実例と同値）:
  1. 豚こま肉(300g) に 豚コマ(5パック) が自動選択・初期値300・単位セレクタ g/パック 表示 ✓
  2. 120g で確定 → DB: 豚コマ quantity **3.5**、消費イベント consumed_amount **1.5 / consumed_unit パック**（在庫単位） ✓
  3. 在庫一覧（再読込後）で「**3 1/2パック**」と分数表示 ✓
  4. 卵(3個)→たまご(7個) の同単位マッチ回帰なし（7→4個） ✓
- supabase_schema_change eval の match は `inventory_items`/`cooking_consumption_events` トークンの過剰マッチ。**schema / policy / migration は無変更**（既存CHECK制約 >=0 の範囲内・列追加なし）

## 残リスク

- consumed_unit の意味が「レシピ単位」→「在庫単位」へ変わった（同単位ケースは同値のため既存データ非影響）。表示利用箇所は cooking-record-edit-modal の「前回 …」のみで、在庫単位表示になるのはデータと整合する正しい挙動
- cooking-record-edit-modal（料理記録の再編集）は換算UI非対応のまま（在庫単位の値を在庫単位として扱うため整合は崩れない。対応する場合は別チケット）
- 逆方向換算（レシピ=パック・在庫=g）・連鎖換算はスコープ外
- **E2E中に確認した既知事項（本チケットの回帰ではない）**: 料理完了後、同一セッションの食材管理ボードの残量表示は古いまま（ボード間スナップショット問題の在庫ボード側。TKT-0239 は消費ダイアログ側のみ対応）。再読込で正しく表示される。対応する場合は別チケット

## 追補（2026-06-12・ユーザーフィードバック対応）

実機確認で「文字が見切れる・単位セレクタ（g/パック）が大きすぎる」との指摘。原因は `.consumption-row-controls select` の `flex: 1 1 auto`／大きめ padding が新設の単位セレクタにも適用され、在庫セレクトと数値入力の幅を奪っていたこと。`globals.css` に `.consumption-row-controls .consumption-unit-select`（flex:0 0 auto・width:auto・padding 8px 4px・0.78rem）を追加し、`.consumption-amount .number-field` を 108px→92px に縮小して在庫セレクトへ幅を譲った。ローカルブラウザE2Eで再計測: PC 2カラム時 在庫セレクト 81→102px（品名＋残量の先頭が見える）・数値「280」全表示・単位コンパクト、SP 375px は全文表示。再 verify pass。

## 次の依頼や人判断

- ユーザー実機確認: 実データ（豚コマ・1パック=80g）で 料理完了 → 自動マッチ → g入力で確定 → 残量が分数表示されること
- 食材管理ボードの残量即時反映（上記既知事項）を直すかの判断
