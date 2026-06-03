---
id: SPEC-0159-web-desktop-recipe-meal-layout
title: 献立・レシピのPC多カラム化（レシピ一覧グリッド＋レシピ詳細ヒーロー＋スケジュール広幅）
status: draft
scope:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - スマホ幅（<1024px）の表示・挙動を変えない
  - レシピ生成API（AI route）・献立保存・「コレを作る」ロジック・既存の7日ウィンドウ模型（`scheduleWindowStart`/`scheduleDays`/±7日ナビ）・ドラッグ&ドロップ結線は変更しない。レイアウト（並べ方）のみ
  - 【確定: 案A（2026-06-03）】PCのスケジュールは曜日=列/朝昼夜=行のウィークグリッドに転置。スマホは縦アジェンダ維持
  - TKT-0157（デスクトップシェル）完了が前提
  - ログイン必須・RLS・Storage非公開・APIキー非露出を守る（Gemini APIキー/写真URLを表示・ログに出さない）
acceptance:
  - 【IA: グループ化ツリー】PCはサイドバー葉「レシピ/献立スケジュール」でビュー切替。`.recipe-subnav` はPCで隠しサイドバーに一本化（スマホは内部タブ維持）。`activeView` はシェルから controlled/initial prop で駆動
  - PC幅でレシピ一覧が複数カラムのカードグリッドになる
  - PC幅でレシピ詳細が写真ヒーロー＋材料/手順の多カラム構成になる（`.cooking-viewer` 構成を踏襲/拡張）
  - PC幅で献立スケジュールが「曜日=列/朝・昼・夜=行」の7日ウィークグリッドになる。スマホは縦アジェンダ維持
  - スロットのドラッグ&ドロップ・±週ナビ・スロットメニューがPC/スマホ両方で動く
  - レシピ生成・テキスト取り込み・献立追加・「コレを作る」が崩れず動く
  - スマホ幅では従来表示を維持
  - Web版verifyが通る
related_tickets:
  - TKT-0159-web-desktop-recipe-meal-layout
---

# Summary

PC幅で `RecipeMealWorkspace` を添付モックへ寄せる。レシピ一覧グリッド、レシピ詳細ヒーロー＋材料/手順の多カラム、広幅スケジュールが対象。スマホ温存。

## 背景

- 献立・レシピは `recipe-meal-workspace.tsx`。レシピ一覧・ビューア（`.cooking-viewer`）・スケジュール（`.schedule-board`/`.meal-week`）を持つ。
- 既に `@media (min-width:1024px) .cooking-viewer { minmax(280px,38%) 1fr }` があり詳細2カラムの土台あり。`.recipe-meal-grid` は単一カラムのまま。

## 仕様

- レシピ一覧（`.recipe-list`）をデスクトップ幅で複数カラムグリッドに。
- レシピ詳細を既存 `.cooking-viewer` / `.cooking-viewer-grid` の構成を踏襲し写真ヒーロー＋材料/手順の多カラムに。
- スケジュール（`.schedule-board`/`.schedule-day`/`.schedule-day-slots`）はPC幅で曜日=列/朝昼夜=行のウィークグリッドへ転置（スマホは縦アジェンダ維持）。7日ウィンドウ模型・±週ナビ・DnD結線は不変、並べ方のみ変更。今日±3日のため列順（左=今日-3…右=今日+3、今日列を強調）の見せ方を確定する。
- CSS（デスクトップ用メディアクエリ）優先、JSX変更は最小化。スマホ用CSSは触らない。

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 現役正本（編集対象）: `web/`, `supabase/`, `scripts/`
- Canvas版 `app.html` は凍結・参照専用
- verify: `/verify`（= `harness/bin/verify_web.sh`）
- Web版ポリシー: GAS/Spreadsheet/Driveを使わない。APIキー・秘密鍵は環境変数。

## 非対象

- AI生成API・献立保存ロジックの変更
- スマホ表示の変更
- 設定・ホーム・検索（別チケット）
