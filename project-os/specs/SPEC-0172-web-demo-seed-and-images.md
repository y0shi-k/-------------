---
id: SPEC-0172-web-demo-seed-and-images
title: デモ用シードデータ＋Codex生成画像の配置（実画像で最終見栄え確認）
status: spec_ready
scope:
  - web/public/images/
  - scripts/
  - web/src/lib/ui/recipe-image.ts
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 画像は `web/public/` に静的配置（Supabase Storage を使わない）
  - シードはデータ追加のみ。削除・上書き・移行をしない。RLS（`auth.uid()=user_id`）下で動く
  - シードは自動実行しない（ユーザーが明示実行）
  - schema / RLS / Storage を変更しない
acceptance:
  - 生成画像が `recipe-<slug>.webp`（最低6枚）＋ `home-hero.webp` に規約どおり配置される
  - ファイル名が `recipe-image.ts` の静的mapキーと一致し、`resolveRecipeImage` が画像を返す
  - `scripts/seed-demo-recipes.*` が用意され、ユーザーが明示実行できる（追加のみ・既存を壊さない）
  - 画像配置後、ホーム/一覧/詳細/提案で写真が表示され、未一致はプレースホルダで崩れない
  - 4:3 `object-fit: cover` で破綻せず、合計サイズが過大でない
  - Web版verifyが通る
related_tickets:
  - TKT-0172-web-demo-seed-and-images
---

# Summary

Codex生成のデモ画像を `web/public/` に配置し、画像と名前が一致するデモレシピ/食材のシード手段を用意して、参考モックに近い実画面で最終確認する。schema/Storage は変更せず、シードはデータ追加のみ。

## 仕様

- 画像配置: `docs/design/demo-image-assets.md` の表に従う（`recipe-<slug>.webp` 最低6枚＋`home-hero.webp`）。
- `recipe-image.ts` の静的mapキー整合確認・不足追加。
- シード: `scripts/seed-demo-recipes.*`（RLS下・追加のみ・冪等寄り）。デモレシピ名は画像mapキーと一致。少数の食材も投入。
- 最終確認: 各画面で写真表示、未一致プレースホルダ、4:3破綻なし、サイズ確認。

## 非対象

- 画像生成そのもの（ユーザーがCodexで実施）。schema変更（`recipes.image_path` 等は将来別チケット）。Storage利用。

- 依存: TKT-0168〜0171 完了が前提。verify: `/verify`。Canvas版 `app.html` は触らない。
- `csv_import_migration` eval が `scripts/`×`import|upsert|migration` 語彙で過剰マッチしうる（実態はデモ追加・移行ではない）→report に記録。本物の移行ではないため manual-smokes/review は不要。
