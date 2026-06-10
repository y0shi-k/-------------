---
id: TKT-0220-amount-badge-svg-background
title: 大さじ/小さじ分量バッジをSVG付きで強調する
status: completed
goal: 調理ビューの分量バッジが色だけで識別しづらい問題を防ぎ、大さじ/小さじを直感的に見分けられるようにする。
acceptance:
  - 大さじ/小さじ用のローカルSVGを `web/public/images/measurements/` に配置する
  - 調理ビューの調理手順内に出る `大さじ1` / `小さじ1/2` は、単位バッジ（大さじ/小さじ）と数値バッジ（1/1/2）に分けて表示される
  - 単位バッジ背面のスプーンSVGは、バッジ内に閉じ込めず、行の余白へ少しはみ出して視認性を上げる
  - 色は大さじ=赤系、小さじ=青系で、単位バッジと数値バッジの色が揃う
  - `aria-label="大さじ1"` / `aria-label="小さじ1/2"` のように、読み上げ用の意味は維持される
  - 大さじ/小さじ以外の単位バッジ（その他=グレー系）には背景SVGを付けない
  - バッジのピル形状（border-radius 999px）・サイズ・行内配置が崩れない
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - web/public/images/badges/
  - web/public/images/measurements/
  - web/src/app/globals.css
  - project-os/artifacts/TKT-0220-amount-badge-svg-background/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0196-cooking-step-amount-chips
related_artifacts:
  - artifacts/TKT-0220-amount-badge-svg-background/verify.json
  - artifacts/TKT-0220-amount-badge-svg-background/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0220`。コマンドの正本は `harness/registry.json`
  - 非危険変更（調理ビュー表示ロジック、静的SVGアセット追加、CSS調整のみ）。DB schema / Auth・RLS / Storage / AI route / CSV移行は触らない
  - `/check-gates` が diff の「image/画像」語で photo_upload_storage（danger）を match させる可能性があるが、本チケットは public 配下の静的SVGとCSSのみ。Supabase Storageは無関係である旨を report に明記する
  - Canvas版 `app.html` は凍結・参照専用のため編集しない
---

# Summary

調理ビューの手順テキスト中の分量は `cookingAmountChip`/`chipifyStep`（`recipe-meal-workspace.tsx` 付近）で `.cooking-amount-chip[data-unit]` バッジ化される。色だけだと大さじ/小さじを見分けにくいため、単位バッジと数値バッジに分け、単位側にスプーンSVGを重ねて視認性を上げる。

## 参照すべき既存実装

- `web/src/app/globals.css`: `.cooking-amount-chip`、`.cooking-measure-unit`、`.cooking-measure-unit::before`、`.cooking-measure-value`。
- `web/src/components/recipe-meal-workspace.tsx`: `cookingAmountChip()`、`chipifyStep()`（`大さじ|小さじ` を正規表現で抽出して data-unit を付与）。
- SVGアセットの置き方の前例: `web/public/images/ingredients/ingredient-*.svg`（命名は英小文字ハイフン）。アイコンライブラリ（lucide 等）は不使用。

## 実装メモ

- `web/public/images/measurements/` に `tablespoon-spoon-a/b/c.svg` と `teaspoon-spoon-a/b/c.svg` を置く。実表示はA案。
- `cookingAmountChip()` は、大さじ/小さじの場合だけ `<span class="cooking-measure-unit">単位</span>` と `<span class="cooking-measure-value">数値</span>` に分ける。外側には `aria-label` で元表記を残す。
- `globals.css` の `.cooking-measure-unit::before` がスプーン装飾の調整点。主な調整値は `left` / `width` / `height` / `z-index` / `opacity`。
- スプーンがSVG自体で欠ける場合は、`tablespoon-spoon-a.svg` / `teaspoon-spoon-a.svg` の `viewBox` 余白を調整する。
- 小さじの色はCSSとSVGの両方で青系に揃える。CSS側は `.cooking-amount-chip[data-unit="小さじ"]` と `.cooking-measure-value`、SVG側は `teaspoon-spoon-*.svg`。
- 文字可読性を最優先。SVGは文字より背面、バッジ背景より前面に置く。
- その他単位（グレー系）には背景を付けない。ピル形状・サイズは維持。

## 非ゴール

- バッジ抽出ロジック（`chipifyStep` の正規表現）や対象単位の拡張。
- レシピ詳細パネルやレシピ編集画面など、調理ビュー外の分量表示の変更。
- Supabase Storage 上の画像の利用（背景はローカル public の静的SVG）。
