---
id: TKT-0166-web-desktop-recipe-card-redesign
title: PCレシピカードを縦型へ刷新（Image #3トーン）＋デザイントークン土台
status: completed
goal: PC幅のレシピ一覧カードが横型を4列に押し込み「名前1文字省略・操作ボタン過密・タグ溢れ」で崩れている問題を解消する。docs/design/pc-design-language.md の §3.5 に沿って縦型カード（上部プレースホルダ＋名前2行＋メタ＋操作退避）へ刷新し、後続画面で再利用するデザイントークン土台（--accent-soft / --favorite / --shadow-card）を導入する。
acceptance:
  - PC幅（>=1024px）でレシピカードが縦型になる（上部にビジュアル・プレースホルダ領域、その下に名前・メタ）
  - レシピ名が1文字省略されず、最低2行まで表示される（2行クランプ）
  - 操作ボタン（料理する/編集/削除）が名前行に詰め込まれず、名前の表示幅を確保する（ホバー表示等へ退避）
  - ジャンルタグが溢れず、カード内に収まる
  - カード上部プレースホルダは写真なし（頭文字/アイコン）で、将来の写真差し込み口になる
  - :root に --accent-soft / --favorite / --shadow-card を追加し、カードがそのトークンを使う
  - スマホ幅（<=640px）のレシピカード表示・操作（選択/料理する/編集/削除）が従来どおり維持される
  - schema / auth・RLS / 写真Storage / AI route を変更しない（CSS + 最小のJSXプレースホルダ変更のみ）
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/app/globals.css
  - web/src/components/recipe-meal-workspace.tsx
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0159-web-desktop-recipe-meal-layout
related_artifacts:
  - artifacts/TKT-0166-web-desktop-recipe-card-redesign/verify.json
  - artifacts/TKT-0166-web-desktop-recipe-card-redesign/report.md
owner_role: implementer
owner_notes:
  - 設計正本は docs/design/pc-design-language.md（§2 トークン / §3.5 レシピカード）。
  - verify は `/verify TKT-0166-web-desktop-recipe-card-redesign`。
  - 非危険変更（CSS + プレースホルダ文言のJSX変更のみ）。お気に入りの機能（is_favorite）は別チケット TKT-0167（schema=危険）で扱う。本チケットはハートの見た目枠までは持たず、お気に入り連動は0167側。
  - スマホ温存: 変更は PCメディアクエリ（>=1024px）内に閉じる。共有 :root トークン追加分はモバイル回帰を verify で確認。
---

# Summary

PC幅のレシピカードを docs/design/pc-design-language.md のトーン（indigo+白基調・余白広め・縦型カード）に揃える。あわせて後続画面で使うデザイントークンを :root に追加する。

## 背景 / 根本原因

- ベース `.recipe-card` は横型（`grid-template-columns: 48px minmax(0,1fr)`）。`@media (min-width: 1024px)` がカードレイアウトを上書きしていないため、PCではこの横型が `recipe-list { repeat(auto-fit, minmax(260px,1fr)) }` の約4列に押し込まれる。
- 結果、約280px幅に「名前＋操作ボタン3個」を1行に並べることになり、名前が `white-space: nowrap; text-overflow: ellipsis` で「究…」まで潰れ、メタ行とジャンルタグも溢れる。

## 実装メモ

- `:root`（globals.css 先頭）に `--accent-soft: #eef0ff;` / `--favorite: #f43f5e;` / `--shadow-card: 0 8px 24px rgb(15 23 42 / 6%);` を追加。
- JSX（`recipe-meal-workspace.tsx`）の最小変更:
  - カード上部プレースホルダの中身を `III` から「レシピ名の頭文字」へ変更（写真差し込み口を兼ねる）。class構造は極力維持。
- CSS（`@media (min-width: 1024px)`）でレシピカードを縦型へ上書き:
  - `.recipe-card` を flex column・overflow hidden・`--shadow-card`・角丸16px。
  - 先頭のプレースホルダを横長（4:3目安）バナーに。
  - 名前を2行クランプ（`-webkit-line-clamp: 2`）、`white-space: normal`。
  - 操作ボタンはホバー時表示のオーバーレイ等へ退避し、通常時は名前幅を確保。
  - ジャンルタグはカード内で折り返し可能にし溢れさせない。
- ベース（スマホ）の `.recipe-card` 横型レイアウトと `@media (max-width: 640px)` 上書きは変更しない。
- Web版ではGAS/Spreadsheet/Driveを使わない。APIキー直書きなし。schema/RLS/Storage/AI routeへの変更なし。

## 残リスク

- 共有 `:root` トークン追加はモバイルにも読み込まれるため、モバイル回帰を verify とブラウザ目視で確認する。
- ジャンルタグの彩度を落とす具体値（淡色 or indigo単色化）は本実装で実画面確認しつつ確定（設計正本 §7 の未決事項）。
- お気に入りハートの機能は本チケットに含まない（TKT-0167 で schema 込みで対応）。
