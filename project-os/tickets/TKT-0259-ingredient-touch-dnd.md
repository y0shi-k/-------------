---
id: TKT-0259-ingredient-touch-dnd
title: 材料リストの並び替えをタッチ対応D&D（pointer/touch）にする
status: draft
goal: スマホ/タブレットでも材料行をドラッグして並び替えできるようにする（現状ネイティブHTML5 D&Dはタッチで発火せず動かない）
acceptance:
  - 編集モーダルと調理ビューの材料リストを、タッチ端末で☰ハンドルからドラッグして並び替えできる
  - PC（マウス）でも従来どおり並び替えできる（リグレッションなし）
  - 種別またぎ（TKT-0255/0256）・選択モード（TKT-0258）と両立し、選択モード中はタップ＝選択／ドラッグ＝ハンドル起点に分離される
  - スマホ幅(375px)/タブレット幅で、ドラッグ中のスクロール暴走や誤タップが起きない
  - `/verify` が通る（lint/typecheck/test/build + policy）
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/package.json
  - web/src/app/globals.css
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0255-ingredient-cross-type-reorder-mobile
related_artifacts:
  - artifacts/TKT-0259-ingredient-touch-dnd/verify.json
  - artifacts/TKT-0259-ingredient-touch-dnd/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0259`。コマンド正本は `harness/registry.json`
  - 依存追加（@dnd-kit 採用時）で `web/package.json` / lockfile が変わる。web_project_bootstrap が match する。schema/auth/Storage は無変更
  - mobile/tablet 操作のため pwa_mobile_ui も match 想定。危険変更なし。manual-smokes/review は不要（実機スモークは report に残作業として記載）
---

# Summary

材料リスト（編集モーダル＋調理ビュー）の並び替えを、ネイティブHTML5 D&D からタッチ対応の実装へ置き換え、スマホ/タブレットでも☰ハンドルからドラッグ並び替えできるようにする。

## 実装メモ

### 現状把握（参照すべき既存コード）
- 並び替えは全てネイティブHTML5 D&D（`draggable` / `onDragStart` / `onDrop` / `dataTransfer`）。
  - 編集側: 行（2721-2744行）、エディタ全体/サブグループのドロップ（2809/2841行）。
  - 調理側: カード（4482-4509行）、群/サブグループのドロップ（4564/4590行）。
  - ドラッグハンドル ☰ は既にある（編集 2746行 / 調理 4511行）が、HTML5 DnD はタッチで発火しない。
- 並び替え本体は `moveIngredient`（769行）/ `moveCookingIngredient`（2154行）。**ロジックは再利用し、入力イベントだけ差し替える**。

### 変更方針（推奨: @dnd-kit）
- `@dnd-kit/core` + `@dnd-kit/sortable`（+ `@dnd-kit/modifiers` 任意）を `web/` に追加。
  - PointerSensor / TouchSensor / KeyboardSensor を有効化（touch + mouse + a11y）。
  - 材料リストを `SortableContext`（フラットな単一リスト＝TKT-0255/0256 後の構造に整合）でラップし、`onDragEnd` で `moveIngredient` / `moveCookingIngredient` 相当を呼ぶ（グローバル順の挿入先 index を算出）。
  - ☰ハンドルに `useSortable` の listeners/attributes を限定付与（行全体はタップ＝選択に空ける／TKT-0258 と整合）。
  - サブグループ（材料/調味料タブ表示時）のドロップ先 group_index 継承は、drop 先要素の data 属性から解決する。
- 代替案（依存追加を避ける場合）: pointerdown/pointermove/pointerup ベースの自前フックを `web/src/lib/dnd/` に新設。ただし autoscroll・サブグループ・誤タップ閾値の実装コストが高い。**まず @dnd-kit を推奨**。
- **適用範囲は材料リストのみ**。手順（steps）/ジャンルのネイティブD&Dは今回触らない（PC据え置き）。

### 両立要件
- TKT-0258 の選択モードと衝突しないこと: ハンドル起点でのみドラッグ開始、行本体タップは選択/編集に使う。`PointerSensor` の activation constraint（distance/delay）で誤発火を抑える。

### テスト
- 並び替えロジック（`moveIngredient`/`moveCookingIngredient`）の単体テストは TKT-0255/0256 のものを流用・拡張。@dnd-kit の DnD 自体はユニットで再現しづらいため、`onDragEnd` ハンドラの index 計算を純粋関数に切り出して test する。
- 実機スモーク（375px/タブレット）は report に残作業として記載。

### 注意・ポリシー
- schema/auth/Storage 無変更。新規依存は信頼できる @dnd-kit のみ（ライセンス確認）。APIキー直書き禁止、GAS不使用。Canvas版 `app.html` は触らない。

## 非ゴール

- 手順/ジャンルの並び替えのタッチ対応。
- 既存ネイティブD&D（手順/ジャンル）の @dnd-kit への全面移行。
- 種別ラベル隠し（→ TKT-0257）。

## 依存チケット

- TKT-0255・TKT-0256（最終的な単一リスト構造の上に載せる）。
- TKT-0258（ハンドル起点ドラッグ vs 選択タップの整合）。

## 残リスク

- @dnd-kit と既存ネイティブD&D（手順/ジャンル）の混在による一貫性低下。許容範囲か report で評価する。
- iOS Safari でのスクロール/ドラッグ競合。activation constraint と `touch-action` CSS で調整が要る可能性。
