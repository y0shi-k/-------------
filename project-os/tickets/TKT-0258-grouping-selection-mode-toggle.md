---
id: TKT-0258-grouping-selection-mode-toggle
title: グルーピングの複数選択を「選択モード切替ボタン」でモバイル対応する
status: draft
goal: スマホ/タブレットで修飾キー（Cmd/Ctrl）無しに材料を複数選択してグルーピングできるようにする（現状は1個しか選べずグルーピング不能）
acceptance:
  - 編集モーダルと調理ビューの材料ペインに「選択モード」トグルボタンがある
  - 選択モードONの間、行/カードをタップすると加算選択（複数選択）になり、選択中の行にチェック表示が出る
  - 選択モードOFFの間は従来挙動（単一選択／ハイライト）を維持する
  - PC で Cmd/Ctrl を押しながらのタップ加算選択も従来どおり併存する
  - 2件以上選択でグルーピング/解除ボタンが有効になり、実際にグルーピングできる
  - 選択は単一 item_type に限定（別種別の行を足すと選択がリセットされる）従来ガードを維持する
  - スマホ幅(375px)/タブレット幅で操作でき、`/verify` が通る
required_evals:
  - web_project_bootstrap
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0255-ingredient-cross-type-reorder-mobile
related_artifacts:
  - artifacts/TKT-0258-grouping-selection-mode-toggle/verify.json
  - artifacts/TKT-0258-grouping-selection-mode-toggle/report.md
owner_role: implementer
owner_notes:
  - verify は `/verify TKT-0258`。コマンド正本は `harness/registry.json`
  - mobile/tablet UI を触るため pwa_mobile_ui が match する想定。schema/auth/Storage は無変更。過剰マッチ時は report に記録
  - 危険変更なし。manual-smokes/review は不要（ただし実機スモークは残作業として report に記載）
---

# Summary

材料のサブグルーピング選択を、修飾キー依存からの脱却として「選択モード」切替ボタン方式に拡張する。選択モードON中はタップが加算選択として働き、モバイルでも複数選択→グルーピングできる。

## 実装メモ

### 現状把握（参照すべき既存コード）
- `web/src/components/recipe-meal-workspace.tsx`:
  - 編集側選択: `toggleRecipeIngredientSelection(index, ingredient, additive)`（805行）。`additive` は現在 `event.metaKey || event.ctrlKey`（2726/2763行）で渡している。
  - 調理側選択: `toggleCookingIngredientSelection(ingredient, additive)`（2181行）。`additive` は 4491行で同様に修飾キー。
  - グルーピングボタン: 編集側 `groupSelectedRecipeIngredients`（840行）/ UI（2819行）。調理側 `onGroupSelected`（4573行）。`canGroup = 選択2件以上`。
  - 単一種別ガード: 両 toggle に「別 item_type を足すと選択リセット」あり（813/2189行）。維持する。

### 変更方針
1. **選択モード state を追加**（編集用・調理用にそれぞれ、例 `recipeSelectionMode` / `cookingSelectionMode`）。材料ペイン見出し付近に「選択」トグルボタンを置く（グルーピングボタンの近く＝2817行/4571行付近）。
2. **additive の決定を拡張**: `additive = selectionMode || event.metaKey || event.ctrlKey`。選択モードON中は単タップで加算選択になる。
3. **チェック表示**: 選択モードON中は各行/カードにチェックボックス風UIを出す（`data-selecting` 属性＋CSS）。OFF中は従来表示。編集側は既存の `recipe-row-select-target`（2754行）を流用・強調、調理側は `data-selected`（4489行）にチェックUIを追加。
4. **選択モード解除時**: 選択をクリアするか保持するかを決める（推奨: モードOFFで選択クリア、誤操作防止）。グルーピング実行後は従来どおり選択クリア。
5. **D&D との両立**: 行は `draggable`。選択モード中もタップ＝選択、ドラッグはハンドル（☰）起点に寄せる方針を TKT-0259 と整合させる（本チケットではタップ選択の追加に留め、ハンドル限定ドラッグは TKT-0259 で詰めてよい）。

### テスト
- `web/src/__tests__/recipe-meal-workspace.test.tsx` 系に「選択モードON中は修飾キー無しタップで複数選択できる」「別種別タップで選択リセット」を追加。

### 注意・ポリシー
- schema/auth/Storage 無変更。GAS不使用、APIキー直書き禁止。Canvas版 `app.html` は触らない。

## 非ゴール

- タッチでの並び替え（D&D）対応（→ TKT-0259）。
- 長押しジェスチャでの選択モード起動（今回はボタン方式に確定。長押しは採用しない）。
- 種別をまたいだグルーピング（並び替えのみ混在＝SPEC-0255 方針）。

## 依存チケット

- TKT-0255・TKT-0256（混在リスト構造の上で選択UIを載せるため、先行が望ましい）。

## 残リスク

- 選択モードON中の単タップと、行内 input（編集側の品名/数量/単位）のタップ干渉。`stopPropagation` の既存処理（2771/2785行）との整合を確認する。
