---
ticket_id: TKT-0168-web-visual-layer-foundation
status: passed
execution_mode: static_only
target_evals:
  - pwa_mobile_ui
---

# Manual Smokes

> 本チケットの実変更は非危険（フロント静的：lib＋共通コンポーネント＋CSS＋テスト）。check-gates が🔴危険（supabase_schema_change / photo_upload_storage）を過剰マッチしたため念のため本書を作成するが、対象は写真Storage/schema ではなく**共通ビジュアル部品の表示とフォールバック**である。

## target_evals

- pwa_mobile_ui（実体に即した対象。PCトーンの共通部品＋スマホ温存の回帰）。
- 過剰マッチした supabase_schema_change / photo_upload_storage は実コード変更なしのため対象外（review.md 参照）。

## executed_checks

- `npm run build` / `lint` / `typecheck` / `test`: pass（verify.json）。
- 単体テスト（4本）が pass:
  - `resolveRecipeImage`: 既知名→パス／別名一致／前後・全角空白吸収／未一致 `null`／空名 `null`。
  - `ingredientEmoji`: 代表一致／具体（豚/牛/鮭）優先／全角カナ／未一致・空名 `🥘`。
  - `<RecipeThumb>`: 既知名=`<img src>`／未一致=`recipe-thumb--placeholder`（頭文字）。
  - `<IngredientIcon>`: 絵文字表示／サイズ修飾（`--lg`）／フォールバック `🥘`。
- 静的確認:
  - CSS 追加は globals.css 末尾のみ。`:root` 新規トークン追加なし。スマホ専用メディアクエリ未変更。
  - `<img>` に `onError` フォールバック、未一致時 `null`→プレースホルダ、絵文字未一致→`🥘` で、画像0枚でも全部品が成立。
  - `supabase/` 未編集、Storage/Auth/schema コードの追加なしを確認。

## skipped_checks

- 実機ブラウザでのPC幅目視: `.recipe-thumb` の 4:3 ボックス／プレースホルダ頭文字／`.ingredient-icon` の淡い円・絵文字中央が崩れないこと。→ **要ユーザー目視**（このセッションでブラウザ操作は未実行）。
- 実機ブラウザでのスマホ幅目視: 既存レイアウトに回帰がないこと。→ **要ユーザー目視**。
- 実画像での表示確認: 実画像は未配置（TKT-0172）。配置後にファイル名一致と `object-fit: cover` の破綻有無を確認する。

## open_risks

- 上記 skipped の実機目視が未了。部品は画像なしでも成立する設計だが、最終確認は実機で行うのが安全。
- 絵文字のOS/フォント差で見た目が揺れる（許容・装飾用途）。
