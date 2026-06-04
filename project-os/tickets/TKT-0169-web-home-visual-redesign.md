---
id: TKT-0169-web-home-visual-redesign
title: ホーム画面のビジュアル刷新（おすすめ写真カード＋ヒーロー＋今日の確認の視覚化）
status: draft
goal: TKT-0162で作ったテキスト主体のホームを、参考モック「ようこそ」に沿って写真カード・ヒーロー・視覚化された今日の確認へ刷新し、PCの入口を体験画面にする
acceptance:
  - ホーム上部のヒーローがイラスト（`home-hero` 画像があれば表示／無ければ従来のテキストヒーローにフォールバック）になる
  - 「おすすめレシピ」または「最近作ったレシピ」を `<RecipeThumb>` の写真カードで横並び/グリッド表示する（既存データ由来。新規DBクエリは増やさない）
  - 既存のサマリーカード（在庫/レシピ/献立/記録カウント）と今日の確認（`today-dashboard`）は維持しつつ、§8トーンに視覚を寄せる
  - 各カードから該当モードへ遷移できる（既存の `selectShellLeaf` を流用）
  - 画像が無い状態（フォールバック）でもレイアウトが崩れない
  - スマホの既存挙動（食材管理起点・下部タブ3つ・ホーム非初期表示）を変えない
  - APIキー・写真URL・Service Role Key をブラウザへ出さない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/home-dashboard.tsx
  - web/src/components/today-dashboard.tsx
  - web/src/app/globals.css
  - web/src/__tests__/
  - project-os/artifacts/TKT-0169-web-home-visual-redesign/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0169-web-home-visual-redesign
related_artifacts:
  - artifacts/TKT-0169-web-home-visual-redesign/verify.json
  - artifacts/TKT-0169-web-home-visual-redesign/report.md
owner_role: implementer
owner_notes:
  - 依存: **TKT-0168（ビジュアル基盤）完了が前提**。`<RecipeThumb>` とヒーロー画像規約を使う。
  - 土台はTKT-0162で実装済み（`home-dashboard.tsx` / `today-dashboard.tsx`）。本チケットは§8トーンへの視覚刷新で、新規データソースは増やさない（飾りウィジェットを作らない）。
  - 「おすすめ/最近作った」の元データは既存（cookCandidates / recipe一覧 / cooked_on_history 等）から選ぶ。新規クエリは足さない。埋まらなければその枠を出さない。
  - 非危険変更。`photo_upload_storage` eval は語彙で過剰マッチ（実Storage/schema無変更）→report に記録。
  - verify は `/verify TKT-0169`。Canvas版 `app.html` は触らない。対象は `web/`。スマホ温存（§6）。
  - APIキー・秘密情報を直書きしない。console.log を残さない。
---

# Summary

TKT-0162 のテキスト主体ホームを、参考モック「ようこそ」のような写真カード＋ヒーロー＋視覚化された今日の確認へ刷新する。既存データの集約という方針は維持し、TKT-0168 の共通部品で見た目を寄せる。

## 背景

- 現状 `home-dashboard.tsx` は挨拶（テキスト）＋数字のサマリーカード4枚＋`today-dashboard`（テキスト行）。参考モックは写真カードとイラストが主役で「程遠い」状態。
- 根本差は画像の有無（TKT-0168で土台を用意）。

## 実装メモ

- ヒーロー: `web/public/images/hero/home-hero.webp` があれば表示、無ければ現行テキストヒーロー。
- おすすめ/最近: `<RecipeThumb>` で写真カード化。元データは既存（`cookCandidates` の候補、レシピ一覧、`cooked_on_history`）から選定。新規クエリを足さない。
- サマリー/今日の確認: 既存維持しつつ§8トーン（余白・角丸・淡色）に寄せる。
- フォールバック: 画像ゼロでも成立。テスト更新（既存 `home-dashboard.test.tsx`）。

### 共通方針
- TKT-0168 の resolver/コンポーネント経由で画像を出す（直書き禁止）。既存規約・`@/`・immutable に合わせる。

## 残リスク

- 既存テスト（ホームの初期表示・カード遷移）への影響。テスト更新が必要。
- 「おすすめ」の選定ロジックが既存データで弱い場合は枠を出さない（飾りで埋めない）。
- photo eval 過剰マッチ（report に記録）。実画像の見栄えは TKT-0172 後に最終確認。
