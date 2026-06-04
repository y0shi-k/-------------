---
ticket_id: TKT-0168-web-visual-layer-foundation
status: ready
---

# TKT-0168 実装レポート

## 変更目的

参考モックのような写真・絵文字を全画面で統一トーンで出すための共通土台を作る。`docs/design/pc-design-language.md` §8 の規定（resolver・共通コンポーネント・CSS）を実装に落とし、後続の各画面チケット（TKT-0169〜0171）と実画像配置（TKT-0172）が同じ部品に乗れるようにした。実画像はまだ置かず、フォールバック（プレースホルダ／フォールバック絵文字）だけで全コンポーネントが成立する状態を作る。

## 実装内容

- `web/src/lib/ui/recipe-image.ts`: `resolveRecipeImage({ name, genre? })` がレシピ名を正規化（NFKC＋空白除去）し、静的map → `/images/recipes/recipe-<slug>.webp` を返す。未一致は `null`（呼び出し側がプレースホルダ）。命名は `docs/design/demo-image-assets.md` と一致。将来 `recipes.image_path`（schema）へ差し替えてもI/F不変。
- `web/src/lib/ui/ingredient-emoji.ts`: `ingredientEmoji(name)` が §8.3 のキーワード表を部分一致で解決し絵文字を返す。未一致は `🥘`（`INGREDIENT_EMOJI_FALLBACK`）。具体的な肉・魚を先に評価し、汎用の「肉」「菜」は後段で拾う順序にした。lib に集約。
- `web/src/components/ui/recipe-thumb.tsx`: `<RecipeThumb recipe size="card"|"hero">`。画像あり=4:3 の `<img loading="lazy">`、`onError` でプレースホルダ退避。画像なし=淡い背景＋料理名頭文字（§3.5）。`role="img"` + `aria-label` でアクセシブル。
- `web/src/components/ui/ingredient-icon.tsx`: `<IngredientIcon name size>`。絵文字を `--accent-soft` の淡い円に乗せる。サイズは props（sm/md/lg）。
- `web/src/app/globals.css`: §8.5 のクラス（`.recipe-thumb` / `.recipe-thumb--hero` / `.recipe-thumb--placeholder` / `.ingredient-icon` + サイズ修飾）を末尾に追加。`:root` への新規トークン追加なし（既存 `--accent-soft` / `--muted` で充足）。スマホ専用メディアクエリは未変更（§6・回帰なし）。
- `web/public/images/recipes/`・`web/public/images/hero/`: `.gitkeep` のみ（実画像は TKT-0172）。
- テスト: `recipe-image.test.ts`（既知名→パス／別名一致／空白吸収／未一致null）、`ingredient-emoji.test.ts`（代表一致／具体ルール優先／全角カナ／フォールバック）、`recipe-thumb.test.tsx`（既知名=img／未一致=プレースホルダ頭文字）、`ingredient-icon.test.tsx`（絵文字／サイズ修飾／フォールバック）。

## 今回追加した安全装置

- 変更はフロント静的（lib・コンポーネント・CSS・テスト・画像ディレクトリの `.gitkeep`）のみ。schema / auth・RLS / 写真Storage / AI route / migration には一切触れていない。`supabase/` 未編集。
- 各画面は本基盤の resolver/コンポーネント経由で画像・絵文字を出す設計（§8.6）。直書きを避け、画面間トーンを一箇所で揃える。
- 画像が1枚も無くても全コンポーネントがプレースホルダ／フォールバック絵文字で成立する（`<img>` の `onError` 退避＋未一致 `null`／`🥘`）。

## 実施した確認

- `harness/bin/verify_web.sh TKT-0168-...`: VERIFY_PASSED（lint / typecheck / test / build すべて pass）。policy: no_gas_dependency / no_hardcoded_secret / supabase_rls_present すべて pass。
- `harness/bin/check_gates.py`: `supabase_schema_change` / `photo_upload_storage` を🔴危険と判定したが、**これは過剰マッチ（false positive）**。原因はコード/正本/チケットの散文・slug・コメントに「recipes / image / 写真 / 画像 / schema」等の語が含まれ、diff_regex（path=web/ かつ正規表現）に prose・命名が一致したため。実コード差分は静的フロント（lib＋コンポーネント＋CSS＋テスト）のみで、`create table` / `alter table` / `create policy` / `Storage` / `upload(` / `accept="image/*"` 等は追加していない。`supabase/` 未編集。詳細は review.md / manual-smokes.md 参照（前例 TKT-0160/0166）。

## 残リスク

- 実機ブラウザでのPC/スマホ目視は未実施（要ユーザー目視）。特に `.recipe-thumb` の 4:3 ボックス、プレースホルダ頭文字、`.ingredient-icon` の円表示、スマホ回帰。
- 実画像が揃うまでは全面プレースホルダ表示（想定どおり。TKT-0172で解消）。
- 絵文字のOS/フォント差で見た目が揺れる（許容・装飾用途）。

## 次の依頼や人判断

- TKT-0169〜0172 はこの基盤の resolver/コンポーネント経由で実装する（直書き禁止）。
- TKT-0172 で `web/public/images/recipes/recipe-<slug>.webp` を配置し、ファイル名が `recipe-image.ts` のキーと一致するか確認する。
