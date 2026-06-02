---
ticket_id: TKT-0154-inventory-qty-unit-input-ux
status: passed
execution_mode: automated_and_static
target_evals:
  - pwa_mobile_ui
  - supabase_schema_change
  - photo_upload_storage
---

# TKT-0154 manual smokes

実行日時: 2026-06-02 20:39 JST

## 注記

- 本来の対象は `pwa_mobile_ui`。
- `supabase_schema_change` / `photo_upload_storage` は `/check-gates` の diff 自動判定が、`inventory-board.tsx` / `recipe-meal-workspace.tsx` 内の既存キーワードに過剰マッチしたもの。
- 実変更は数量・単位入力UI、保存前の単位換算組み立て、表示用CSS、テストのみ。Supabase schema / RLS / Storage / 写真処理 / AI route は変更していない。

## target_evals

- `pwa_mobile_ui`: 数量欄に `inputMode="decimal"` を付け、単位をピッカー化。スマホ幅の材料行と数量+単位の収まりをCSSで調整。
- `supabase_schema_change`（過剰マッチ）: 実変更なし。migration / RLS / DB型は未変更。
- `photo_upload_storage`（過剰マッチ）: 実変更なし。写真取り込み・画像圧縮・Storage保存は未変更。

## executed_checks

| 項目 | 結果 | メモ |
|---|---:|---|
| verify一式 | pass | `harness/bin/verify_web.sh TKT-0154-inventory-qty-unit-input-ux` で lint/typecheck/test/build/policy すべて pass |
| 対象テスト | pass | `inventory-board.test.tsx` / `recipe-meal-workspace.test.tsx` 38件 pass |
| 在庫の単位ピッカー | pass | 候補外「丁」をEnterで追加し、在庫単位として保存されることを確認 |
| 単位換算の連動保存 | pass | 換算先だけ `300 g` を入力し `{fromQty:1, fromUnit:"丁", toQty:300, toUnit:"g"}` で保存 |
| 買い物リストの単位ピッカー | pass | 「本」を選んで手動追加 payload が維持されることを確認 |
| レシピ材料の単位ピッカー | pass | 材料単位をピッカー経由で選び、ingredient payload が維持されることを確認 |
| 在庫モーダル幅の改善 | pass | CSS上で在庫モーダルを `width: min(720px, 100%)` に変更し、選択済みピッカーのプレースホルダーを非表示化 |
| policy チェック | pass | GAS依存なし、秘密直書きなし、RLS存在確認 pass |
| ビルド成功 | pass | `npm run build` 通過 |

実行コマンド:

```bash
npm test -- --run src/__tests__/inventory-board.test.tsx src/__tests__/recipe-meal-workspace.test.tsx
npm run typecheck
npm run lint
harness/bin/verify_web.sh TKT-0154-inventory-qty-unit-input-ux
```

## skipped_checks

- 実機スマホでの数値キーパッド表示、IME挙動、スピンボタン1刻みの目視は未実施。理由はこの環境で実機操作がないため。
- in-app Browserでの目視確認は未実施。CSSと自動テストではフォーム操作の退行なし。

## open_risks

- `step="any"` のスピンボタン増減量はブラウザ実装差がありうる。主要ブラウザで1刻みにならない場合は、仕様メモ通り `step="1"` へのフォールバックを検討する。
- 単位ピッカーは既存ジャンルピッカーCSSを流用している。実機で候補ポップオーバーが窮屈なら、単位専用の幅調整を追加する余地がある。
