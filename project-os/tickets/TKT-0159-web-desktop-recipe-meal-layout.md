---
id: TKT-0159-web-desktop-recipe-meal-layout
title: 献立・レシピのPC多カラム化（レシピ一覧グリッド＋レシピ詳細ヒーロー＋スケジュール広幅）
status: draft
goal: PC幅で献立・レシピを添付モックの「レシピ詳細（写真ヒーロー＋材料/手順）」「レシピ一覧グリッド」「広幅スケジュール」に寄せる（スマホは温存）
acceptance:
  - 【IA: グループ化ツリー】PCではサイドバー「献立・レシピ」グループ配下の葉「レシピ」「献立スケジュール」を選ぶと該当ビューに切り替わる。コンテンツ内のサブタブ（`.recipe-subnav` の recipes/schedule）はPCではサイドバーに一本化し隠す（スマホは内部タブのまま）
  - `activeView`（recipes/schedule）を TKT-0157 のシェルから controlled/initial prop で受け取れるよう持ち上げる（スマホの既存挙動は不変）
  - PC幅（≥1024px）でレシピ一覧が複数カラムのカードグリッドになる
  - PC幅でレシピ詳細（ビューア）が、料理写真ヒーロー＋材料/手順の多カラム構成になる（モック「レシピ詳細」相当、`.cooking-viewer` の広画面構成を踏襲/拡張）
  - 【確定: 案A】PC幅で献立スケジュールが「曜日=列／朝・昼・夜=行」の7日ウィークグリッドになり、今日±3日の1週間が横一覧で見える。スマホは現状の縦アジェンダ（`.schedule-board` 縦リスト）を維持する
  - スロット間のドラッグ&ドロップ（`moveSchedule` / `is-dragover`）・←前の週/今週/次の週→ ナビ・スロットのメニュー操作がPC（ウィークグリッド）/スマホ（縦アジェンダ）両方で動く
  - レシピ生成・テキスト取り込み・献立追加・「コレを作る」など既存操作がPC/スマホ両方で動く
  - スマホ幅では従来の単一カラム表示・挙動を一切変えない
  - レシピ生成API（AI route）・スケジュール保存ロジックは変更しない（レイアウトのみ）
  - APIキー・写真URL・Service Role Key をブラウザへ出さない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/globals.css
  - web/src/__tests__/recipe-meal-workspace.test.tsx
  - project-os/artifacts/TKT-0159-web-desktop-recipe-meal-layout/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0159-web-desktop-recipe-meal-layout
related_artifacts:
  - artifacts/TKT-0159-web-desktop-recipe-meal-layout/verify.json
  - artifacts/TKT-0159-web-desktop-recipe-meal-layout/report.md
owner_role: implementer
owner_notes:
  - 依存: TKT-0157（デスクトップシェル）の完了が前提。サイドバー葉「レシピ/献立スケジュール」が `activeView` を駆動する（TKT-0157 の受け渡し口を使う）。
  - 【IA: グループ化ツリー（2026-06-03 確定）】PCは `.recipe-subnav` をサイドバーへ一本化し隠す。スマホは内部タブ維持。`activeView` の持ち上げ（小リファクタ）が必要。
  - レイアウト中心の変更だが `recipe-meal-workspace.tsx` はレシピ生成（Gemini）の語を含むため、`/check-gates` の diff 自動判定で `ai_server_route` に過剰マッチする可能性がある。その場合は manual-smokes.md / review.md を追加し required_gates に `manual_smokes_done` / `review_ready` を足す（最終確定は `/check-gates TKT-0159`）。
  - AI生成API・献立保存・「コレを作る」ロジックは変更しない。多カラム再配置とCSSが中心。
  - 既存の `.cooking-viewer`（≥1024px で 38% + 1fr の2カラム）/ `.cooking-viewer-grid` を踏襲・拡張する。
  - verify は `/verify TKT-0159`。Canvas版 `app.html` は触らない。対象は `web/` のみ。
  - APIキー・秘密情報を直書きしない。Gemini APIキーを表示・ログに出さない。
---

# Summary

PC幅で献立・レシピ（`RecipeMealWorkspace`）を添付モックに寄せる。**レシピ一覧のカードグリッド**、**レシピ詳細の写真ヒーロー＋材料/手順の多カラム**（モック「レシピ詳細」）、**広幅スケジュール**が対象。スマホ温存。

## 背景

- 献立・レシピは `web/src/components/recipe-meal-workspace.tsx`。レシピ一覧・レシピビューア（`.cooking-viewer`）・スケジュール（`.schedule-board` / `.meal-week`）を持つ。
- `globals.css` には既に `@media (min-width:1024px) .cooking-viewer { grid-template-columns: minmax(280px,38%) 1fr }` があり、レシピ詳細の2カラム土台が存在する。
- `.recipe-meal-grid` は 720px/960px でも `1fr` のまま。レシピ一覧の多カラム化が主な不足。

## 実装メモ

- レシピ一覧（`.recipe-list`）をデスクトップ幅で複数カラムのカードグリッドに。
- レシピ詳細（ビューア）の写真ヒーロー＋材料/手順の多カラムを、既存 `.cooking-viewer` / `.cooking-viewer-grid` の構成を踏襲して広画面向けに調整。
- スケジュール（`.schedule-board` / `.schedule-day` / `.schedule-day-slots`）を、PC幅では**曜日=列／朝・昼・夜=行のウィークグリッドへ転置**する（現状は7日を縦に並べる `.schedule-day` リスト＝今日±3日ウィンドウ）。スマホ幅は現状の縦アジェンダのまま。
  - 既存の7日ウィンドウ模型（`scheduleWindowStart` / `scheduleDays` / ←前の週・今週・次の週→ の ±7日ナビ）はそのまま流用する。表示の並べ方だけを変える。
  - スロット（`.schedule-slot`）のドラッグ&ドロップ（`moveSchedule` / `onDragOver` の `is-dragover`）・スロットメニュー・空きスロットの＋追加は維持する。
  - 可能ならCSS（グリッドの行/列定義）中心で転置し、JSX/DOM変更は最小化する。転置にDOM構造の調整が要る場合も、DnDハンドラの結線は変えない。
- レシピ一覧・レシピ詳細はCSS（デスクトップ用メディアクエリ）優先で、JSX変更は最小化。スマホ用CSSは触らない。

### 共通方針
- 既存規約・命名・`@/` エイリアス・immutable patterns に合わせる。console.log を残さない。
- AI生成API・献立保存ロジックは変更しない（レイアウトのみ）。

## 残リスク

- `recipe-meal-workspace.tsx` が大きく、Gemini語を含むため `/check-gates` が `ai_server_route` へ過剰マッチし manual-smokes/review が必要になる可能性。
- スケジュールのウィークグリッド転置は、ドラッグ&ドロップ（`is-dragover` 等）の挙動・スロットメニューの位置・空きスロットの見え方が崩れないか要確認。PCとスマホで別レイアウトになるため、両方の動作確認が必要。
- 「今日±3日」ウィンドウは月曜始まりの暦週ではないため、ウィークグリッドの列順（左=今日-3 … 右=今日+3、今日列を強調）の見せ方を spec で確定する。
- 実機（PC/スマホ両方）での目視は別途。
