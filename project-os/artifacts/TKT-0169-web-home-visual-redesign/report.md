---
ticket_id: TKT-0169-web-home-visual-redesign
status: ready
---

# TKT-0169 実装レポート

## 変更目的

TKT-0162 で作ったテキスト主体のホームを、参考モック「ようこそ」に沿って写真カード＋イラストヒーロー＋視覚化されたサマリーへ刷新し、PCの入口を体験画面に寄せる。データソースは既存のまま（新規DBクエリを増やさない）で、TKT-0168 の共通部品（`<RecipeThumb>` / ヒーロー画像規約）に乗せて見た目だけを §8 トーンに寄せた。

## 実装内容

- `web/src/components/home-dashboard.tsx`
  - ヒーローを `HomeHero` コンポーネント化。`/images/hero/home-hero.webp` を `<img onError>` で読み、読込失敗時はイラストを外して**従来のテキストヒーローにフォールバック**（テキストは常時表示するため画像ゼロでも崩れない、§8.1）。直書きの `<img>` だが §8.4 の方針どおり onError フォールバックのため next/image は使わず eslint-disable コメントを明記。
  - 「おすすめ/最近作った」レシピを `<RecipeThumb size="card">` の写真カードで横並び/グリッド表示する `home-feature` セクションを追加。選定は既存 `recipes`（page.tsx で既に取得済み）から `pickFeaturedRecipes` で決定：① `cooked_on_history` のある「最近作ったレシピ」（最新日降順, 最大6件）→ ②無ければ `is_favorite` の「お気に入りレシピ」（最大6件）→ ③どちらも無ければ `null` で**枠を出さない**（飾りで埋めない）。**新規クエリは追加していない**。
  - 各レシピカードは `selectShellLeaf("recipes", "recipes")` でレシピモードへ遷移（既存I/F流用）。補足テキストはジャンル優先、無ければ調理回数。
  - 既存のサマリーカード4枚（在庫/レシピ/献立/記録）と `<TodayDashboard>`（今日の確認）はそのまま維持。
- `web/src/app/page.tsx`: 既存 `recipesWithIngredients` を `HomeDashboard` の新 prop `recipes` に渡すのみ（取得処理は不変・新規クエリなし）。
- `web/src/app/globals.css`: `.home-hero` を flex（テキスト＋イラスト併記）に変更し角丸/余白を §8 トーンへ。`.home-hero-art` / `.home-feature` / `.home-feature-grid` / `.home-feature-card`（写真上・メタ下・overflow hidden）/ `.home-feature-meta` 等を追加。`@media (min-width: 960px)` で feature グリッドを3列に。`:root` トークンの追加なし（既存 `--accent-soft` / `--muted` / `--line` / `--surface` / `--shadow-card` で充足）。スマホ専用クエリは未変更（§6 回帰なし）。
- `web/src/__tests__/home-dashboard.test.tsx`: 既存2テスト（挨拶＋サマリー件数 / サマリーカード遷移）を維持しつつ、(a) レシピ無しで feature 枠が出ない、(b) 最近作ったレシピが写真カード化されレシピモードへ遷移、(c) 未調理時はお気に入りにフォールバック、を追加。

## 今回追加した安全装置

- 変更はフロント（コンポーネント / page.tsx の prop 受け渡し / CSS / テスト）のみ。schema / auth・RLS / 写真Storage / AI route / migration には一切触れていない。`supabase/` 未編集。
- 画像は TKT-0168 の resolver / `<RecipeThumb>` 経由でのみ表示（直書き回避）。ヒーローのみ §8.4 の単一既知パスを onError フォールバック付きで読む。
- 画像が1枚も無い状態（現状）でも、ヒーローはテキスト、レシピカードは `<RecipeThumb>` のプレースホルダ（淡背景＋頭文字）で成立。レイアウトは崩れない。
- スマホの既存挙動（食材管理起点・下部タブ3つ・ホーム非初期表示）は不変。ホーム専用CSSのみ追加・変更。
- APIキー・写真URL・Service Role Key をブラウザへ出していない（写真は静的publicパスのみ）。console.log なし。

## 実施した確認

- `harness/bin/verify_web.sh TKT-0169-...`: **VERIFY_PASSED**（lint / typecheck / test / build すべて pass）。policy: no_gas_dependency / no_hardcoded_secret / supabase_rls_present すべて pass。
- `harness/bin/check_gates.py TKT-0169-...`: `supabase_schema_change` / `photo_upload_storage` を🔴危険と判定したが、**これは過剰マッチ（false positive）**。原因は diff の散文・命名・コメントに「recipes / image / 写真 / schema」等の語が含まれ、diff_regex（path=web/ ＋正規表現）が prose・識別子に一致したため。実差分は静的フロント（コンポーネント＋prop受け渡し＋CSS＋テスト）のみで、`create table` / `alter table` / `create policy` / `Storage` / `upload(` / `accept="image/*"` 等は追加していない。`supabase/` 未編集。詳細は review.md / manual-smokes.md 参照（前例 TKT-0160 / 0166 / 0168）。

## 残リスク

- 実機ブラウザでのPC/スマホ目視は未実施（要ユーザー目視）。特に feature カードの 4:3 表示・3列折返し、ヒーローのテキスト/イラスト併記、スマホ回帰。
- 実画像（`home-hero.webp` / `recipe-<slug>.webp`）が揃うまでは全面プレースホルダ表示（想定どおり。実画像の見栄え最終確認は TKT-0172 後）。
- 「最近作った/お気に入り」が既存データに無いユーザーでは feature 枠が出ない（仕様どおり。飾りで埋めない）。

## 次の依頼や人判断

- TKT-0172 で `web/public/images/hero/home-hero.webp` と `recipe-<slug>.webp` を配置後、ホームの見栄え（ヒーローイラスト・写真カード）を目視確認する。
- ファイル名が `recipe-image.ts` のキーと一致しているかを併せて確認する。
