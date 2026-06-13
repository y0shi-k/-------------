---
id: SPEC-0255-ingredient-cross-type-reorder-mobile
title: 材料/調味料の種別またぎ並び替え＋モバイルgrouping/タッチ並び替え
status: draft
scope:
  - レシピ編集モーダルの材料エディタ（recipe-meal-workspace.tsx の renderRecipeIngredientEditor 周辺）
  - 「調理を開始」詳細ビュー（CookingViewer）の材料リスト
  - 材料行のサブグルーピング選択UI（複数選択→グルーピング）
  - 材料行の並び替え（D&D）のタッチ端末対応
  - recipes テーブルへの「種別ラベル非表示」設定列の追加（永続化）
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 種別またぎは「並び替え」のみ許可。グルーピングは単一種別のまま（選択は1種別に限定を維持）
  - 個人データを扱うため、recipes 列追加時もログイン必須・Supabase RLS（既存 recipes ポリシー踏襲）・APIキー非露出を守る
  - 手順（steps）/ジャンルの並び替えは今回の対象外（PC据え置き）
acceptance:
  - ALLタブで食材⇄調味料をまたいで並び替えても、各行の item_type が変わらず順序だけ混在する（編集・調理の両画面）
  - 材料/調味料タブで種別フィルタが従来どおり効く
  - 「種別ラベルを隠す」をレシピ単位で保存・復元でき、ON時は行の種別バッジとセクション見出しが消える
  - スマホ/タブレットで「選択モード」をONにするとタップで複数選択でき、グルーピングできる
  - スマホ/タブレットで材料行をタッチドラッグして並び替えできる
related_tickets:
  - TKT-0255-recipe-editor-cross-type-reorder
  - TKT-0256-cooking-viewer-cross-type-reorder
  - TKT-0257-ingredient-type-label-hide-persist
  - TKT-0258-grouping-selection-mode-toggle
  - TKT-0259-ingredient-touch-dnd
---

# Summary

レシピの材料リスト（編集モーダル＋調理詳細）で、現状「種別（食材/調味料）をまたいだ並び替えができない／モバイルでグルーピングも並び替えもできない」を解消する。この spec は、reviewer が会話ではなく `project-os/` だけで判断できる正本。

## 背景

- 編集モーダルの `moveIngredient`（`web/src/components/recipe-meal-workspace.tsx:769`）は `moving.item_type !== targetType` で種別またぎを**ブロック**。
- 調理ビューの `moveCookingIngredient`（同 2154）は種別をまたぐと `item_type` を**ドロップ先の種別へ書き換える**（再分類で、混在にならない）。
- 複数選択は `event.metaKey || event.ctrlKey` 依存で、修飾キーの無いタッチ端末ではグルーピング不能。
- 並び替えはネイティブHTML5 D&D（`draggable`/`onDragStart`/`onDrop`）で、タッチ端末では発火せず動かない。
- データモデル: `recipe_ingredients.sort_order` はレシピ単位の単一グローバル整数（`supabase/migrations/20260523094705_schema_v1.sql:92`、unique制約なし）。保存時 `normalizeRecipeForm`（同コンポーネント内）が表示順で `sort_order` を採番し直すため、**種別混在の並び順は追加スキーマ無しで保存できる**。`item_type` / `group_index` は各行に存在。

## 仕様

採用する設計の要点（全チケット共通の前提）:

- **ALL タブ = 1本のグローバル順リスト**で食材/調味料を混在表示。各行に種別バッジ（ラベル隠しでOFF）。
  **ALLではサブグループ見出し（A/B/C・あ/い/う）は出さない**（per-type採番なので混在で分断され意味を失うため）。
- **材料 / 調味料 タブ = 従来どおり**の単一種別表示。サブグループ見出しもそのまま機能。
- **種別またぎは「並び替え」のみ**許可。**グルーピングは単一種別のまま**（選択は1種別に限定を維持）。
  → 既存の `subgroupLabel` / `subgroupRankMap` / `subgroupRuns` / `replaceSubgroupList` をそのまま再利用でき、混在サブグループのラベル問題を回避。
- ラベル隠しは `recipes` に bool 列を1本追加（`is_favorite` = TKT-0167 と同じ前例パターン）。
- モバイル複数選択は「選択モード」切替ボタン方式（長押しではない）。
- タッチ並び替えは材料リスト限定で対応（推奨 @dnd-kit、代替は自前pointerフック）。

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 現役正本（編集対象）: `web/`, `supabase/`
- verify: `/verify`（= `harness/bin/verify_web.sh`）。
- Web版ポリシー: GAS/Spreadsheet/Driveを使わず、Next.js + Supabase + Vercelで実装する。APIキー・秘密鍵は環境変数で管理する。

## 非対象

- 手順（steps）/ジャンルの並び替えのタッチ対応・再構成（今回はPC据え置き）。
- 種別をまたいだ「グルーピング」（混在サブグループ）。今回は並び替えのみ混在を許可。
- AI/写真Storage/CSVへの変更。

## Acceptance Example

- 各チケットの `project-os/artifacts/TKT-xxxx/` を見れば達成可否を判定できる状態にする。
- TKT-0257（schema変更）は manual-smokes.md / review.md を必須にし、recipes のRLS/権限が既存方針を崩していないことを記録する。
