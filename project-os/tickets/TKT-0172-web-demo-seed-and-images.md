---
id: TKT-0172-web-demo-seed-and-images
title: デモ用シードデータ＋Codex生成画像の配置（実画像で最終見栄え確認）
status: implementation_ready
goal: Codexで生成したレシピ写真・ヒーローを `web/public/` に配置し、画像と一致するデモレシピ/食材のシードを用意して、参考モックに近い実画面を確認できるようにする
acceptance:
  - `docs/design/demo-image-assets.md` の規約どおりに生成画像が `web/public/images/recipes/recipe-<slug>.webp`（最低6枚）と `web/public/images/hero/home-hero.webp` に配置される
  - ファイル名が `recipe-image.ts` の静的mapキーと一致し、`resolveRecipeImage` が当該レシピで画像を返す
  - デモレシピ/食材のシード手段（`scripts/seed-demo-recipes.*`）が用意され、ユーザーが自分のDBに対し明示実行できる（自動実行はしない）
  - シードは通常のRLS（`auth.uid() = user_id`）下で動き、既存データを削除・上書きしない（追加のみ）
  - 画像配置後、ホーム/レシピ一覧/詳細/提案で写真が表示され、未一致レシピはプレースホルダのままで崩れない
  - 4:3 `object-fit: cover` で破綻せず、合計画像サイズが過大でない（webp/圧縮）
  - schema / RLS / Storage を変更しない（画像は静的配置、シードはデータ追加のみ）
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
  - csv_import_migration
eval_selection_mode: auto
changed_paths:
  - web/public/images/
  - scripts/
  - web/src/lib/ui/recipe-image.ts
  - project-os/artifacts/TKT-0172-web-demo-seed-and-images/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0172-web-demo-seed-and-images
related_artifacts:
  - artifacts/TKT-0172-web-demo-seed-and-images/verify.json
  - artifacts/TKT-0172-web-demo-seed-and-images/report.md
owner_role: implementer
owner_notes:
  - 依存: **TKT-0168〜0171 完了が前提**（resolver/コンポーネント/各画面が実画像を受けられる状態）。
  - 画像は**ユーザーがCodex(DALL·E)で生成**して配置する。本チケットは配置・命名整合・シード手段・最終見栄え確認が主。画像生成そのものはAI実装作業ではない。
  - シードはデータ**追加のみ**。削除・移行・upsert で既存を壊さない。`scripts/` の seed は `csv_import_migration` eval が `import|migration|upsert|件数` 語彙で過剰マッチしうる→**実際はデータ移行ではない**旨を report に記録。本物のデータ移行ではないため manual-smokes/review は不要（過剰マッチ）。
  - シードは**自動実行しない**。実行はユーザーが自分のdev/hosted DBに対して明示的に行う（破壊的・外向き操作の方針）。
  - Storage は使わない（静的 `public/` 配置）。schema 変更なし（`recipes.image_path` 等は将来別チケット）。
  - verify は `/verify TKT-0172`。Canvas版 `app.html` は触らない。
  - APIキー・秘密情報を直書きしない。console.log を残さない。
---

# Summary

Codex生成のデモ画像を `web/public/` に配置し、画像と名前が一致するデモレシピ/食材のシード手段を用意して、参考モックに近い実画面で最終確認する。schema/Storage は変更せず、シードはデータ追加のみ。

## 背景

- TKT-0168〜0171 で resolver/共通部品と各画面の写真・絵文字対応が入る（フォールバック状態）。
- 実画像とそれに一致するデモデータが無いと、参考モックのような「埋まった画面」を確認できない。

## 実装メモ

- 画像配置: `demo-image-assets.md` の表に従い `recipe-<slug>.webp`（最低6枚）＋ `home-hero.webp`。
- `recipe-image.ts` の静的mapにキー（レシピ名→slug）が揃っているか整合確認。不足分を追加。
- シード: `scripts/seed-demo-recipes.*`（Node/SQL いずれか。RLS下・追加のみ・冪等寄り）。デモレシピ名は画像mapキーと一致させる。食材も少数投入して在庫/食材一覧の絵文字を確認。
- 最終確認: ホーム/一覧/詳細/提案で写真表示、未一致はプレースホルダで崩れないこと。サイズ・4:3表示の破綻確認。

### 共通方針
- シードは自動実行しない（ユーザー明示実行）。既存データを壊さない（追加のみ）。秘密情報を直書きしない。

## 残リスク

- `csv_import_migration` eval の過剰マッチ（`scripts/` × `import|upsert` 語彙）。実態はデモ追加で移行ではない→report に記録。万一本当に既存を壊す設計になりかけたら停止し別途相談。
- 画像合計サイズの肥大（webp圧縮で抑制）。
- デモレシピ名とユーザー実レシピ名の衝突（追加のみ・別レコードで回避）。
