---
ticket_id: TKT-0159-web-desktop-recipe-meal-layout
status: passed
review_scope:
  - SPEC-0159-web-desktop-recipe-meal-layout
  - TKT-0159-web-desktop-recipe-meal-layout
---

# TKT-0159 review

## checked_diff_paths

- `web/src/components/recipe-meal-workspace.tsx`
  - `useShellSubView()` を追加し、Shell側の `selectedSubViews.recipes` と内部 `activeView` を同期。
  - 内部タブ押下時に `selectShellLeaf("recipes", view)` を呼ぶよう変更。
  - スケジュールの7日部分に `.schedule-days-grid` を追加し、既存の追加・DnD・スロットメニュー処理を流用。
  - レシピ詳細に `.recipe-detail-hero` と材料/手順の2カラム用DOMを追加。
- `web/src/app/globals.css`
  - PC幅 `>=1024px` で内部タブ非表示、レシピ一覧グリッド、レシピ詳細ヒーロー、7日スケジュール横グリッドを追加。
  - スマホ幅では既存の内部タブと縦アジェンダ表示を維持。
- `web/src/__tests__/recipe-meal-workspace.test.tsx`
  - Shell選択からスケジュール表示になるテストを追加。
  - 内部タブ操作がShellへ通知されるテストを追加。
- `project-os/artifacts/TKT-0159-web-desktop-recipe-meal-layout/`
  - `verify.json`、`report.md`、`manual-smokes.md`、`review.md` を作成。

## checked_artifacts

- `verify.json`: status=pass
- `report.md`: status=ready
- `manual-smokes.md`: status=passed

## findings

重大な未解決問題は見つからない。確認したこと:

- サイドバー連動はTKT-0157で追加済みの `useShellSubView()` を利用しており、新しいグローバル状態や別系統のナビ状態は追加していない。
- 内部タブはスマホ用として残し、PC幅だけCSSで隠している。スマホの既存操作は維持される。
- スケジュールは既存の `moveScheduleToSlot`、`setPickerSlot`、`setSlotMenuId`、`meal_schedules` 保存処理を流用しており、保存ロジックは変更していない。
- レシピ詳細のヒーロー風エリアは既存データ（名前、ジャンル、材料数、調理回数、参考元）だけを使う。写真URLやStorage署名URLは扱わない。
- verify policy は GAS混入なし、秘密直書きなし、Supabase RLS確認 pass。
- `/check-gates` の危険evalは過剰マッチ。`supabase/` 未編集、Auth/RLS/Storage/APIキー/AI route の変更なしを確認した。

## open_risks

- 1024px境界付近のタブレットでは、7列スケジュールが窮屈に見える可能性がある。
- 実データで非常に長いレシピ名が多い場合、スケジュールカードの省略表示が増える。
- 実スマホ端末でのタップ確認は未実施。ブラウザviewportではスマホ表示維持を確認済み。

## verdict

pass。TKT-0159の主目的であるPC幅のレシピ/献立レイアウト改善とサイドバー連動は実装済み。スマホ表示、AI route、Supabase保存処理、Auth/RLS、写真Storage、秘密情報管理への変更はない。
