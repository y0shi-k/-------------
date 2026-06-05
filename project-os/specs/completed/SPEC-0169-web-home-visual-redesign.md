---
id: SPEC-0169-web-home-visual-redesign
title: ホーム画面のビジュアル刷新（おすすめ写真カード＋ヒーロー＋今日の確認の視覚化）
status: draft
scope:
  - web/src/components/home-dashboard.tsx
  - web/src/components/today-dashboard.tsx
  - web/src/app/globals.css
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 既存データの集約のみ。新規DBクエリ・データソースを増やさない
  - 画像・絵文字は TKT-0168 の resolver/コンポーネント経由（直書き禁止）
  - 画像が無いフォールバック状態でも崩れない
  - スマホの既存挙動（食材管理起点・下部タブ3つ・ホーム非初期表示）を変えない
  - 非危険変更（schema/auth/RLS/Storage/AI route 無変更）
acceptance:
  - ヒーローがイラスト（`home-hero` 画像あり）／無ければテキストヒーローにフォールバック
  - おすすめ/最近作ったレシピを `<RecipeThumb>` 写真カードで表示（既存データ由来）
  - サマリーカード・今日の確認（`today-dashboard`）を維持しつつ §8トーンに寄せる
  - 各カードから該当モードへ遷移できる
  - Web版verifyが通る
related_tickets:
  - TKT-0169-web-home-visual-redesign
---

# Summary

TKT-0162 のテキスト主体ホームを、参考モック「ようこそ」のような写真カード＋ヒーロー＋視覚化された今日の確認へ刷新する。既存データ集約という方針は維持し、TKT-0168 の共通部品で見た目を寄せる。

## 仕様

- ヒーロー: `home-hero.webp` があれば表示、無ければ現行テキストヒーロー。
- おすすめ/最近: `<RecipeThumb>` 写真カード。元データは既存（cookCandidates / レシピ一覧 / cooked_on_history）から選定。新規クエリを足さない。埋まらなければ枠を出さない。
- サマリー/今日の確認: 既存維持しつつ §8トーンへ。

## 非対象

- 実画像配置（TKT-0172）。新規データソース追加。schema/Storage変更。

- 依存: TKT-0168 完了が前提。verify: `/verify`。Canvas版 `app.html` は触らない。スマホ温存。
- `photo_upload_storage` eval は語彙で過剰マッチ（実Storage無変更）→report に記録。
