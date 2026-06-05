---
id: TKT-0162-web-desktop-home-dashboard
title: ホーム/ダッシュボード画面（「ようこそ」広画面ランディング）
status: completed
goal: 添付モック「ようこそ」に沿った広画面ランディング（挨拶＋サマリー＋今日の献立＋レシピ候補＋在庫アラート）を追加し、PCの入口を一覧性の高いダッシュボードにする
acceptance:
  - 【確定: 案A】PCサイドバーの主ナビに「ホーム」項目が追加され、ホーム/ダッシュボードを表示できる
  - 【確定: 案A】PCの初期表示はホームになる（PC ≥1024px）
  - 【確定: 案A】スマホは従来どおり食材管理起点のまま。下部タブは3つのまま増やさず、ホームを初期表示にしない
  - ホームに挨拶（「ようこそ！今日は何を作りましょう？」相当）＋サマリーカード（在庫件数・レシピ件数・献立件数・記録件数など既存カウント）が表示される
  - ホームに今日の献立／レシピ候補／在庫アラート等、既存データを集約したカードが並ぶ（新規データソースは増やさない）
  - ホームの各カードから該当モード（食材/献立/記録）へ遷移できる
  - APIキー・写真URL・Service Role Key をブラウザへ出さない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/web-mode-shell.tsx
  - web/src/components/today-dashboard.tsx
  - web/src/app/page.tsx
  - web/src/app/globals.css
  - web/src/__tests__/
  - project-os/artifacts/TKT-0162-web-desktop-home-dashboard/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0162-web-desktop-home-dashboard
related_artifacts:
  - artifacts/TKT-0162-web-desktop-home-dashboard/verify.json
  - artifacts/TKT-0162-web-desktop-home-dashboard/report.md
owner_role: implementer
owner_notes:
  - 依存: TKT-0157（デスクトップシェル）の完了が前提。PCサイドバーの主ナビに「ホーム」を足す。
  - 【IA確定（2026-06-03・案A）】ホームを新設しPCのみ初期表示にする。スマホは従来どおり食材管理起点・下部タブ3つ据え置き・ホーム非初期表示。決定は decisions.md に記録済み。
  - 既存の集計（`inventoryCount` / `recipeCount` / `mealCount` / `historyCount`）と `today-dashboard`（今日の献立）を流用する。**新しいデータソース・新しいDBクエリは増やさない**（飾りウィジェットを作らない）。
  - 【IA: グループ化ツリー（2026-06-03 確定）】「今日の献立」はホームに集約し、サイドバーの葉にはしない（食材管理内での重複表示の扱いは TKT-0158 と整合させる）。ホームはサイドバー最上部の専用項目（グループ見出しではない単独の葉）。
  - 非危険変更（既存データの集約表示のみ）。schema/auth/RLS/Storage/AI route は変更しない。
  - verify は `/verify TKT-0162`。Canvas版 `app.html` は触らない。対象は `web/` のみ。
  - APIキー・秘密情報を直書きしない。
---

# Summary

添付モック「ようこそ」に沿った広画面のホーム/ダッシュボードを追加する。挨拶＋サマリーカード＋今日の献立＋レシピ候補＋在庫アラートなど、**既存データの集約表示**でPCの入口の一覧性を高める。新しいデータソースは増やさない。

## 背景

- `web-mode-shell.tsx` は既に `inventoryCount` / `recipeCount` / `mealCount` / `historyCount` を受け取り、ステータス表示に使っている。
- `today-dashboard.tsx`（今日の献立）が `inventory-board` 内に存在する。これらを集約してホームを構成できる。
- モック「ようこそ」は挨拶見出し＋統計カード＋レシピ候補カード（写真）＋小リスト。

## 実装メモ

- TKT-0157 のサイドバー/ナビに「ホーム」を追加（モード追加 or 別ルートは spec で確定）。
- ホームに挨拶・サマリーカード（既存カウント）・`today-dashboard`（今日の献立）・レシピ候補・在庫アラートを配置。各カードから該当モードへ遷移（`returnToMode` / `requestViewRecipe` を流用）。
- 初期ランディング（PC: ホーム or 食材管理）と、スマホでの扱いを spec で確定。
- 既存データのみを集約し、新規クエリ・新規データソースは増やさない。

### 共通方針
- 既存規約・命名・`@/` エイリアス・immutable patterns に合わせる。console.log を残さない。

## 残リスク

- 初期表示モードの変更は既存ユーザー体験・既存テスト（`web-mode-shell.test.tsx` の初期 activeMode 前提）に影響。テスト更新が必要。
- モックの一部ウィジェットが既存データで埋められない場合は、その項目を出さない（飾りで埋めない）。
- IA変更（新ナビ＋初期表示変更）はユーザー確認後に着手する。
