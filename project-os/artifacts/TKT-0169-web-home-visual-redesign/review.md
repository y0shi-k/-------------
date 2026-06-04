---
ticket_id: TKT-0169-web-home-visual-redesign
status: passed
review_scope:
  - SPEC-0169-web-home-visual-redesign
  - TKT-0169-web-home-visual-redesign
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。
> 本チケットは非危険変更（フロントのみ）。`check_gates.py` が `supabase_schema_change` /
> `photo_upload_storage` を🔴危険と判定したが、いずれも語彙の過剰マッチ（false positive）である
> （前例 TKT-0160 / 0166 / 0168）。

## checked_diff_paths

- `web/src/components/home-dashboard.tsx`: ヒーローの `HomeHero` 化、`<RecipeThumb>` 写真カードの feature セクション追加、`recipes` prop 追加。
- `web/src/app/page.tsx`: 既存 `recipesWithIngredients` を `recipes` prop で渡す1行のみ（取得処理は不変）。
- `web/src/app/globals.css`: `.home-hero`（flex化）・`.home-hero-art`・`.home-feature*` の追加と PC 3列メディアクエリ。`:root` トークン追加なし。
- `web/src/__tests__/home-dashboard.test.tsx`: 既存2＋追加3テスト。
- `supabase/`: **未編集**（schema / RLS / policy / migration いずれも変更なし）。

## checked_artifacts

- `verify.json`: status=pass（lint / typecheck / test / build, policy 3項目）。
- `report.md` / `manual-smokes.md`: 内容と整合を確認。

## subagent_usage

- なし（軽量フロント変更のため本セッションで直接実装・確認）。

## findings

- **危険evalは過剰マッチ**。`supabase_schema_change` は page.tsx の既存 `recipes` 参照・散文の「schema」語に、`photo_upload_storage` は「写真 / 画像 / image / RecipeThumb」語に diff_regex が一致したもの。実体（`create/alter table`・migration・Storage `upload(`・`createSignedUrl`・`accept="image/*"`）は無い。
- 画像はすべて `web/public/` 配下の静的パスを resolver / `<RecipeThumb>` 経由で参照。直書き `<img>` はヒーローの単一既知パスのみ（§8.4 準拠、onError フォールバック付き）。
- 秘匿情報（APIキー / 写真URL / Service Role Key）のブラウザ露出なし。console.log なし。immutable・`@/` 規約準拠。

## open_risks

- 実機目視（PC/スマホ）未実施。実画像配置（TKT-0172）後に見栄えとスマホ回帰を確認する。

## verdict

- **passed**。危険変更の実体なし。verify 全 pass。本記録をもって `review_ready` を閉じる。
