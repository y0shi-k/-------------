---
id: TKT-0160-web-desktop-cooking-layout
title: 料理・記録のPC多カラム化（タイムライン/カレンダー/インサイトの広幅化）
status: draft
goal: PC幅で料理・記録を広画面向けに多カラム化し、サマリー・タイムライン・カレンダー・インサイトを余白を活かして配置する（スマホは温存）
acceptance:
  - 【IA: グループ化ツリー】PCではサイドバー「料理・記録」グループ配下の葉「カレンダー」「タイムライン」「インサイト」を選ぶと該当ビューに切り替わる。コンテンツ内のビュータブ（`.cooking-view-tabs`）はPCではサイドバーに一本化し隠す（スマホは内部タブのまま）
  - `historyView`（calendar/timeline/insights）を TKT-0157 のシェルから controlled/initial prop で受け取れるよう持ち上げる（スマホの既存挙動は不変）
  - PC幅（≥1024px）で料理サマリー（`.cooking-summary-grid`）・タイムライン・カレンダー・インサイトが広幅で見やすく配置される
  - PC幅でタイムラインの履歴カード（`.history-item`）が広画面の余白を活かしたレイアウトになる（必要なら複数カラム）
  - カレンダー（`.calendar-cell-grid`）・インサイト（`.insight-grid`）が広幅で破綻しない
  - 記録の追加/編集・完了記録・写真・評価など既存操作がPC/スマホ両方で動く
  - スマホ幅では従来の表示・挙動を一切変えない
  - 写真Storage・記録保存ロジックは変更しない（レイアウトのみ）
  - APIキー・写真URL・Service Role Key をブラウザへ出さない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
eval_selection_mode: auto
changed_paths:
  - web/src/components/cooking-history-board.tsx
  - web/src/app/globals.css
  - web/src/__tests__/cooking-history-board.test.tsx
  - project-os/artifacts/TKT-0160-web-desktop-cooking-layout/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0160-web-desktop-cooking-layout
related_artifacts:
  - artifacts/TKT-0160-web-desktop-cooking-layout/verify.json
  - artifacts/TKT-0160-web-desktop-cooking-layout/report.md
owner_role: implementer
owner_notes:
  - 依存: TKT-0157（デスクトップシェル）の完了が前提。サイドバー葉「カレンダー/タイムライン/インサイト」が `historyView` を駆動する（TKT-0157 の受け渡し口を使う）。
  - 【IA: グループ化ツリー（2026-06-03 確定）】PCは `.cooking-view-tabs` をサイドバーへ一本化し隠す。スマホは内部タブ維持。`historyView` の持ち上げ（小リファクタ）が必要。
  - レイアウト中心の変更だが `cooking-history-board.tsx` は写真（Storage）の語を含むため、`/check-gates` の diff 自動判定で `photo_upload_storage` に過剰マッチする可能性がある。その場合は manual-smokes.md / review.md を追加し required_gates に `manual_smokes_done` / `review_ready` を足す（最終確定は `/check-gates TKT-0160`）。
  - 写真Storage・記録保存ロジックは変更しない。多カラム再配置とCSSが中心。
  - verify は `/verify TKT-0160`。Canvas版 `app.html` は触らない。対象は `web/` のみ。
  - APIキー・秘密情報を直書きしない。署名付き写真URLを表示・ログに出さない。
---

# Summary

PC幅で料理・記録（`CookingHistoryBoard`）を広画面向けに多カラム化する。サマリー・タイムライン・カレンダー・インサイトの各ビューを余白を活かして配置。スマホ温存。

## 背景

- 料理・記録は `web/src/components/cooking-history-board.tsx`。サマリー（`.cooking-summary-grid` 4列）、タイムライン（`.history-item`）、カレンダー（`.calendar-*`）、インサイト（`.insight-grid` 2列）を持つ。
- 既に一部は多列だが（サマリー4列・インサイト2列）、コンテンツ全体は中央660px列前提。デスクトップシェル（TKT-0157）で広幅になると間延びするため、広画面向けの配置を整える。

## 実装メモ

- 広画面でタイムライン/カレンダー/インサイトを横に並べる、または履歴カードを複数カラムにするなど、余白を活かす配置に。
- 料理記録カレンダー（`.calendar-cell-grid`）は既に7列の月グリッドなので**構造変更は不要**。広画面ではセル（現状 `min-height:72px`）と写真サムネ（現状 `height:34px`）を大きくして見やすくするだけ（ドット凡例・選択状態の見え方は維持）。
- 既存ビュー切替（`.cooking-view-tabs`）・履歴カード（`.history-item`）・カレンダーセル・インサイトパネルの構造は維持。
- まずCSS（デスクトップ用メディアクエリ）で実現できる範囲を優先し、JSX変更は最小化。スマホ用CSSは触らない。

### 共通方針
- 既存規約・命名・`@/` エイリアス・immutable patterns に合わせる。console.log を残さない。
- 写真Storage・記録保存ロジックは変更しない（レイアウトのみ）。

## 残リスク

- `cooking-history-board.tsx` が写真語を含むため `/check-gates` が `photo_upload_storage` へ過剰マッチし manual-smokes/review が必要になる可能性。
- カレンダーセル内の写真サムネ・ドット表示が広幅で崩れないか要確認。
- 実機（PC/スマホ両方）での目視は別途。
