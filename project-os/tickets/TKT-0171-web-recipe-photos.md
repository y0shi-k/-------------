---
id: TKT-0171-web-recipe-photos
title: レシピの写真化（一覧カード＋レシピ詳細ヒーロー＋レシピ提案サムネ）
status: draft
goal: TKT-0166の縦型カードのプレースホルダに実写真の差し込み口を通し、レシピ一覧・詳細・提案を参考モックのような写真主体の見た目にする
acceptance:
  - レシピ一覧カード（`recipe-meal-workspace` 内の縦型カード）が `<RecipeThumb>` で写真表示になり、画像が無いものはプレースホルダ（TKT-0166既存）にフォールバックする
  - レシピ詳細の上部に `<RecipeThumb size="hero">` のヒーロー写真領域が出る（画像が無ければプレースホルダ）
  - レシピ提案（Batch Mode）の候補に `<RecipeThumb>` のサムネが付く
  - お気に入りハート・タグ・操作ボタン退避（TKT-0166/0167）の挙動を壊さない
  - 画像が無い状態でも全箇所が成立する（崩れない）
  - スマホの既存レイアウト・操作を変えない
  - schema / Storage / auth / RLS / AI route を変更しない（写真は静的resolver経由）
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/
  - project-os/artifacts/TKT-0171-web-recipe-photos/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0171-web-recipe-photos
related_artifacts:
  - artifacts/TKT-0171-web-recipe-photos/verify.json
  - artifacts/TKT-0171-web-recipe-photos/report.md
owner_role: implementer
owner_notes:
  - 依存: **TKT-0168（ビジュアル基盤）完了が前提**。`<RecipeThumb>` / `resolveRecipeImage` を使う。
  - TKT-0166で作った縦型カードの**プレースホルダ差し込み口**を実写真対応に変えるのが主眼。プレースホルダのフォールバックは残す。
  - お気に入り（TKT-0167）・タグ・操作ボタン退避（TKT-0166）の既存挙動を壊さない。
  - 非危険変更（静的resolver経由）。`photo_upload_storage` eval は語彙で過剰マッチ（実Storage/schema無変更）→report に記録。
  - レシピ提案は AI 生成結果の表示だが**認識/生成ロジック（ai_server_route）には触らない**。表示のみ。ai eval が過剰マッチしうる→report に記録。
  - verify は `/verify TKT-0171`。Canvas版 `app.html` は触らない。対象は `web/`。スマホ温存。
  - APIキー・秘密情報を直書きしない。console.log を残さない。
---

# Summary

TKT-0166 が用意した縦型レシピカードのプレースホルダ差し込み口に、TKT-0168 の `<RecipeThumb>` で実写真を流す。レシピ一覧・詳細・提案（Batch）を参考モックのような写真主体の見た目にする。画像が無ければ既存プレースホルダにフォールバック。

## 背景

- TKT-0166 で縦型カード＋プレースホルダ領域は実装済み。設計（§3.5/§8）は写真の差し込み口を前提にしている。
- 参考モックはレシピ詳細に大きなヒーロー写真、一覧/提案にサムネがある。

## 実装メモ

- 一覧カード: プレースホルダ部分を `<RecipeThumb recipe={recipe} />` に置換（フォールバック維持）。
- 詳細: 上部に `<RecipeThumb size="hero" recipe={recipe} />` を追加。
- 提案（Batch）: 候補行/カードに `<RecipeThumb>` サムネを追加。
- `globals.css` はTKT-0168の `.recipe-thumb` を流用。hero サイズの調整のみ追加。
- テスト: 画像なしでプレースホルダ、ハート/タグ/ボタン退避が維持されること。

### 共通方針
- `<RecipeThumb>` 経由で出す（`<img>` 直書き禁止）。既存規約・immutable に合わせる。

## 残リスク

- photo / ai eval の過剰マッチ（語彙由来）。実ロジック・Storage無変更を report に記録。
- カード高さ（写真追加で縦長化）とグリッド gap の調整。スマホ回帰を verify で確認。
- 実画像の見栄えは TKT-0172（画像配置）後に最終確認。
