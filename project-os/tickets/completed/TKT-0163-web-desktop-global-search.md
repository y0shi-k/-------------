---
id: TKT-0163-web-desktop-global-search
title: 上部バーの横断検索の機能化（食材・レシピ）
status: draft
goal: TKT-0157 で用意した上部バーの検索スロットを機能化し、食材・レシピを横断的に絞り込めるようにする（添付モックの検索バー相当）
acceptance:
  - 上部バーの検索入力にキーワードを入れると、食材・レシピを対象に絞り込み結果が得られる
  - 検索結果から該当モード（食材管理／献立・レシピ）・該当アイテムへ遷移できる
  - 既存の各モード内フィルタ（保存場所タブ・並び順・履歴フィルタ等）と競合せず共存する
  - 検索は既存のクライアント保持データ（`InventoryBoard` / `RecipeMealWorkspace` の初期データ）を対象とし、新規APIエンドポイント・新規DBクエリを増やさない
  - スマホ幅での検索の出し方（上部に出すか省略か）を spec で定義し、挙動が壊れない
  - APIキー・写真URL・Service Role Key をブラウザへ出さない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/web-mode-shell.tsx
  - web/src/components/inventory-board.tsx
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/
  - project-os/artifacts/TKT-0163-web-desktop-global-search/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0163-web-desktop-global-search
related_artifacts:
  - artifacts/TKT-0163-web-desktop-global-search/verify.json
  - artifacts/TKT-0163-web-desktop-global-search/report.md
owner_role: implementer
owner_notes:
  - 依存: TKT-0157（上部バーの検索スロット）の完了が前提。
  - 【任意・優先度低】添付モックの検索バーを機能化するチケット。デスクトップ化の必須要素ではないため、コア（TKT-0157〜0160）の後に着手する。
  - 検索範囲・遷移仕様（食材のみ/レシピのみ/両方、結果UI）は spec で確定する。まずは既存クライアント保持データのクライアント側絞り込みに限定し、サーバー検索APIは作らない。
  - 非危険変更（既存データのクライアント検索のみ）。schema/auth/RLS/Storage/AI route は変更しない。
  - verify は `/verify TKT-0163`。Canvas版 `app.html` は触らない。対象は `web/` のみ。
  - APIキー・秘密情報を直書きしない。
---

# Summary

TKT-0157 で上部バーに置いた検索スロットを機能化する。添付モックの各画面に出ている検索バー相当。**既存のクライアント保持データ**（各ボードが受け取る初期データ）を対象に、食材・レシピを横断で絞り込み、該当モード/アイテムへ遷移できるようにする。サーバー検索APIは作らない。

## 背景

- 各ボード（`InventoryBoard` / `RecipeMealWorkspace`）は `page.tsx` から初期データを受け取り、クライアントで保持している。
- 各モードには既にローカルなフィルタ（保存場所タブ・並び順・履歴フィルタ）があり、横断検索はそれと競合しないよう上位で扱う。

## 実装メモ

- 上部バーの検索 state を `web-mode-shell.tsx`（または `ShellStatusContext`）で保持し、結果表示と遷移を扱う。
- 検索対象（食材・レシピ）と結果UI（ドロップダウン候補 or 結果一覧）、遷移（`returnToMode` / `requestViewRecipe`）を spec で確定。
- クライアント側絞り込みに限定。新規API・新規DBクエリは作らない。
- スマホでの検索の出し方を spec で定義（上部に出す/省略）。

### 共通方針
- 既存規約・命名・`@/` エイリアス・immutable patterns に合わせる。console.log を残さない。
- デバウンス等は `~/.claude/rules/patterns.md` の `useDebounce` パターンを参考にしてよい。

## 残リスク

- 横断検索の state を Shell に持たせると、各ボードへのデータ受け渡し設計が増える。スコープを「絞り込み＋遷移」に限定して肥大化を防ぐ。
- 検索対象データがクライアント保持分（初期ロード分）に限られる点を spec の acceptance で明示する。
- 実機（PC/スマホ両方）での目視は別途。
