---
ticket_id: TKT-0172-web-demo-seed-and-images
status: ready
reported_at: 2026-06-04T21:32:00+09:00
---

# Report

## 変更目的

TKT-0172 の実装は完了。デモ用の料理画像6枚とホームヒーロー画像を `web/public/` に配置し、画像mapとの一致をテストで固定した。デモレシピ/食材を追加する明示実行用スクリプトも追加した。

## 今回追加した安全装置

- シードは自動実行しない。
- シードは `SUPABASE_AUTH_TOKEN` を使い、ユーザー本人のRLS下で追加する。
- 既存の同名レシピはスキップし、削除・上書き・upsert はしない。
- Service Role key や秘密情報は直書きしていない。
- 画像mapと実ファイルの一致をテストで確認する。

## 変更内容

- `web/public/images/recipes/`
  - `recipe-chicken-stir-fry.webp`
  - `recipe-nikujaga.webp`
  - `recipe-hamburg.webp`
  - `recipe-mapo-tofu.webp`
  - `recipe-grilled-salmon.webp`
  - `recipe-curry-rice.webp`
- `web/public/images/hero/home-hero.webp`
- `scripts/seed-demo-recipes.mjs`
  - ユーザー本人のログイン済みトークンでRLS下に追加。
  - 既存の同名レシピはスキップ。
  - 削除・上書き・upsert はしない。
- `web/src/__tests__/recipe-image.test.ts`
  - デモレシピ6件が期待画像パスへ解決され、実ファイルが存在することを確認。
- `project-os/specs/SPEC-0172-web-demo-seed-and-images.md`
  - `status: spec_ready`
- `project-os/tickets/TKT-0172-web-demo-seed-and-images.md`
  - `status: implementation_ready`

## 画像サイズ

- レシピ画像: 6枚すべて `640x480`
- ヒーロー画像: `1200x400`
- 合計サイズ: `212K`

## シード実行方法

自動実行はしていない。ユーザーが自分のDBへ追加したい場合だけ、ログイン済みユーザーの access token を `SUPABASE_AUTH_TOKEN` に入れて実行する。

```bash
NEXT_PUBLIC_SUPABASE_URL=... \
NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
SUPABASE_AUTH_TOKEN=... \
node scripts/seed-demo-recipes.mjs
```

`SUPABASE_AUTH_TOKEN` は本人権限の一時トークンなので、チャット・Git・共有メモへ貼らないこと。

## 実施した確認

- `node --check scripts/seed-demo-recipes.mjs`: pass
- `npm test -- recipe-image.test.ts`: pass
- `harness/bin/verify_web.sh TKT-0172-web-demo-seed-and-images`: pass
- ブラウザ確認:
  - ホームで `home-hero.webp` が表示されることを確認。
  - 既存DBの未一致レシピはプレースホルダのまま崩れないことを確認。

## 残リスク

- シード投入はユーザー明示実行のため、この作業中にはDBへ流していない。投入後の全画面写真表示は改めて目視確認が必要。
- `SUPABASE_AUTH_TOKEN` は本人権限の一時トークンなので、漏えいに注意が必要。
- 既存レシピ名とデモ名が衝突した場合は、既存データ保護を優先して該当デモレシピの追加をスキップする。

## 次の依頼や人判断

- デモデータを自分のDBに入れる場合だけ、ユーザーが `scripts/seed-demo-recipes.mjs` を明示実行する。
- 実行後、ホーム/レシピ一覧/詳細/提案でデモ写真の見え方を確認する。

## 過剰マッチ

`check-gates` は `scripts/` と画像配置により危険変更として過剰検出した。実態はデモ追加手段と静的画像配置であり、Supabase schema / RLS / Storage / CSV移行は変更していない。ただし gate を閉じるため `manual-smokes.md` と `review.md` に確認内容を記録した。
