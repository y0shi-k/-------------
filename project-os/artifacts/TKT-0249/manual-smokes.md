---
ticket_id: TKT-0249-consumption-stock-unit-switch
status: passed
execution_mode: static_only
target_evals:
  - pwa_mobile_ui
  - supabase_schema_change
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- pwa_mobile_ui: 消費ダイアログの UI（単位セレクタ表示・入力）の変更。375px/タブレット/PC幅での目視が必要。
- supabase_schema_change: テーブル名トークン（inventory_items / cooking_consumption_events）の過剰マッチで点灯。
  実際の schema / RLS / Storage / migration は無変更（編集は web/src/ のみ）。DB スモークは不要。

## executed_checks

- 純粋関数 `resolveConsumeUnitForStock` / `resolveConsumedStockAmount` の分岐網羅ユニットテスト 10 件 pass
  （換算不可→在庫単位切替、在庫単位入力での正減算、レシピ単位ブロック、換算可/同単位の既存挙動不変）。
- verify_web.sh で lint / typecheck / test(111件) / build すべて pass。
- diff 目視: cooking_consumption_events への insert（consumed_amount=在庫単位換算量・consumed_unit=在庫単位）は無変更。
  rollback の TKT-0241 不変条件が崩れないことをコードレビューで確認（review.md 参照）。

## skipped_checks

- 実機/ブラウザでの操作スモーク（static_only のため未実施。以下をユーザー実機で確認すること）:
  1. 換算未登録で単位不一致の在庫（例 在庫「じゃがいも 3個」／レシピ「じゃがいも 100g」）を「その他の在庫」から選ぶと、
     消費量の単位セレクタが表示され、単位が在庫単位（個）へ自動で切り替わり入力値が空（0）になる。
  2. 在庫単位（個）で「1」を入力して確定 → 在庫が 3個→2個 に減る。完了取り消しで 3個 に戻る。
  3. 単位セレクタをレシピ単位（g）へ手動で戻して確定 → 「単位を在庫の単位（個）へ切り替えてください」エラーで止まり、
     在庫が誤減算されない。
  4. 換算登録あり在庫（例 豚コマ パック=80g）・同単位在庫の既存消費フローが従来どおり動く（回帰）。
  5. 375px / タブレット / PC 幅でセレクタとレイアウトが崩れない。

## open_risks

- 「換算不可＋レシピ単位のまま確定」は従来の誤減算をエラーブロックへ変える挙動変更。実機でユーザー体感を確認すること。
