---
ticket_id: TKT-0169-web-home-visual-redesign
status: passed
execution_mode: static_only
target_evals:
  - pwa_mobile_ui
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- `pwa_mobile_ui`: スマホ既存挙動（食材管理起点・下部タブ3つ・ホーム非初期表示）を変えていないこと。ホーム描画はPC中心だが、フォールバックでスマホでも崩れないこと。
- 危険eval（`supabase_schema_change` / `photo_upload_storage`）は語彙の過剰マッチで実体なし（review.md 参照）。

## executed_checks

- 自動: `harness/bin/verify_web.sh TKT-0169-...` = VERIFY_PASSED（lint / typecheck / test / build すべて pass）。policy 3項目 pass。
- 自動: `web/src/__tests__/home-dashboard.test.tsx`（挨拶＋サマリー件数 / サマリーカード遷移 / レシピ無しで feature 枠非表示 / 最近作ったレシピの写真カード化＋レシピモード遷移 / 未調理時のお気に入りフォールバック）。
- 静的: 変更は `web/` のフロント（コンポーネント・page.tsx の prop 受け渡し・CSS・テスト）のみ。`supabase/` 未編集を目視確認。

## skipped_checks

- 実機ブラウザでのPC/スマホ目視（要ユーザー）。理由: 実画像未配置（`home-hero.webp` / `recipe-<slug>.webp` は TKT-0172 で配置）のため現状は全面フォールバック表示。見栄えの最終確認は実画像配置後に行う。
- 具体の確認観点は本ファイル末尾の「実機目視リスト」として残す。

## open_risks

- 実機目視未実施。feature カードの 4:3 表示・PC3列折返し、ヒーローのテキスト/イラスト併記、スマホ回帰は未検証。
- 実画像配置（TKT-0172）まではプレースホルダ表示（想定どおり）。
- 「最近作った/お気に入り」が無いユーザーでは feature 枠が出ない（仕様どおり）。

### 実機目視リスト（実画像配置後に再確認）
- [ ] PC: ヒーロー（画像無→テキスト / 画像有→イラスト併記）が崩れない。
- [ ] PC: feature が対象ありの時だけ写真カードで出て3列に折り返す。各カード/サマリーから該当モードへ遷移。
- [ ] スマホ: 起点・下部タブ3つ・ホーム非初期表示が不変。ホームを開いても縦に崩れない。
- [ ] devtools で APIキー / 署名付き写真URL / Service Role Key が露出しない。console エラー/警告なし。
