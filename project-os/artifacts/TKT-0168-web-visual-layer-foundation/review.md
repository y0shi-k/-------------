---
ticket_id: TKT-0168-web-visual-layer-foundation
status: passed
review_scope:
  - SPEC-0168-web-visual-layer-foundation
  - TKT-0168-web-visual-layer-foundation
---

# Review Record

## checked_diff_paths

- `web/src/lib/ui/recipe-image.ts`（新規）
  - `resolveRecipeImage({ name, genre? })`。NFKC＋空白除去で正規化し静的map → `/images/recipes/recipe-<slug>.webp`。未一致・空名は `null`。schema/Storage 非依存。
- `web/src/lib/ui/ingredient-emoji.ts`（新規）
  - `ingredientEmoji(name)` キーワード部分一致。フォールバック `🥘`。具体（鶏/豚/牛/魚）を汎用（肉/菜）より先に評価。
- `web/src/components/ui/recipe-thumb.tsx`（新規・client）
  - 画像あり=`<img loading="lazy">`（`onError`→`useState` でプレースホルダ退避）、なし=`recipe-thumb--placeholder`（頭文字）。`role="img"`+`aria-label`。
- `web/src/components/ui/ingredient-icon.tsx`（新規）
  - 絵文字を `.ingredient-icon`（淡い円）に乗せる。サイズ props（sm/md/lg）。
- `web/src/app/globals.css`
  - 末尾に §8.5 のクラス追加（`.recipe-thumb` / `--hero` / `--placeholder` / `.ingredient-icon` + サイズ）。`:root` 新規トークン追加なし。
- `web/src/__tests__/`（新規4本）: resolver 2本＋コンポーネント 2本。
- `web/public/images/recipes|hero/.gitkeep`（実画像なし）。

## checked_artifacts

- `verify.json`: status=pass（lint/typecheck/test/build 全pass、policy 全pass）。
- `report.md`: status=ready。

## subagent_usage

- なし（フロント静的・単一目的のため、メイン実装で完結）。

## findings

- **check-gates の危険判定は過剰マッチ（false positive）**。`supabase_schema_change` と `photo_upload_storage` が match したが、根拠は実コードではなく散文・slug・コメント。
  - `supabase_schema_change` の `recipes|...` 系語が、resolver の slug（`recipe-...`）・型コメント（"schema非依存"）・正本/チケット説明文に一致。
  - `photo_upload_storage` の `photo|image|写真|画像` が、パス `public/images/`・コメント・正本説明文に一致。
  - 実コード差分には `create table` / `alter table` / `create policy` / `Storage` / `upload(` / `accept="image/*"` 等は**追加されていない**。`supabase/` ディレクトリは未編集。
- 画像表示は `next/image` ではなく `<img loading="lazy">` を採用。静的デモ画像で `onError` フォールバックを使うため。`@next/next/no-img-element` は理由付きで局所 disable。
- 全コンポーネントが画像/一致なしでも成立（`resolveRecipeImage`→null でプレースホルダ、`ingredientEmoji`→`🥘`、`<img>` `onError` 退避）。
- 秘密情報の直書きなし、GAS依存の追加なし、console.log なし（verify policy pass）。immutable／`@/` エイリアス準拠。

## open_risks

- 実機ブラウザ目視（PCの 4:3 サムネ・プレースホルダ・絵文字円・スマホ回帰）は未実施。manual-smokes.md の skipped_checks 参照。
- 実画像は TKT-0172 で配置。それまで全面プレースホルダ。

## verdict

pass。本チケットの実変更は非危険（フロント静的：lib＋コンポーネント＋CSS＋テスト＋画像ディレクトリ）。check-gates の🔴危険判定は命名・コメント・markdown 散文による過剰マッチであり、Storage/Auth/schema/migration への実変更はない。`supabase/` 未編集、写真アップロード経路・RLS・AI route 無改変を確認した。
