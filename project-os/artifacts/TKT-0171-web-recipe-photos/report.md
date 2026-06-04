---
ticket_id: TKT-0171-web-recipe-photos
status: ready
---

# Report

## 変更目的

レシピ一覧カード、レシピ詳細、作りたい候補に `<RecipeThumb>` を差し込み、静的 resolver で見つかるレシピは写真表示、見つからないレシピは既存の頭文字プレースホルダへフォールバックするようにしました。

## 今回追加した安全装置

- `<img>` の直書きはせず、TKT-0168 の `<RecipeThumb>` 経由に統一しました。
- DB schema、Supabase Storage、auth/RLS、AI route は変更していません。
- APIキーや秘密情報の直書きはありません。
- 作りたい候補は `recipe_id` または `recipe_name` で既存レシピを探し、見つからない場合も候補名でプレースホルダ表示します。
- スマホ向けの横並びカードではサムネを小さく保ち、PCの縦型カードでは上部の写真領域として表示するCSSにしました。

## 実施した確認

- `npm test -- --run src/__tests__/recipe-meal-workspace.test.tsx src/__tests__/recipe-thumb.test.tsx src/__tests__/recipe-image.test.ts`
  - 33 tests passed
- `harness/bin/verify_web.sh TKT-0171-web-recipe-photos`
  - lint: pass
  - typecheck: pass
  - test: pass
  - build: pass
  - no_gas_dependency: pass
  - no_hardcoded_secret: pass
  - supabase_rls_present: pass

## 残リスク

- 今回は静的 resolver の表示差し込みだけです。実画像の追加・配置は TKT-0172 側の作業です。
- `photo_upload_storage` や `ai_server_route` は語彙上マッチしうるものの、実際には Storage/API/AI ロジックを変更していません。

## 次の依頼や人判断

TKT-0172 で実画像アセットを増やした後、写真の切り抜き位置とスマホ表示の見た目をブラウザで確認してください。
