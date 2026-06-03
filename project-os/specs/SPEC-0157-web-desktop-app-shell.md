---
id: SPEC-0157-web-desktop-app-shell
title: PC広画面デスクトップシェル（左サイドバーナビ＋上部バー＋広幅コンテナ）
status: spec_ready
scope:
  - web/src/components/web-mode-shell.tsx
  - web/src/app/page.tsx
  - web/src/app/globals.css
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - スマホ幅（<1024px）の見た目・挙動を一切変えない。既存 `.app-shell`（660px）/ `.bottom-mode-nav` / `.canvas-status-bar` はスマホ用に残す
  - 非危険変更（UIシェルのみ）。Supabase schema / Auth・RLS / 写真Storage / AI route のロジックは変更しない
  - 各画面の中身の多カラム化は本specの対象外（TKT-0158〜0163）。本specは「器（シェル）」のみ
  - ログイン必須・Supabase RLS・Storage非公開・APIキー非露出を守る（APIキー/写真URL/Service Role Keyをブラウザへ出さない）
acceptance:
  - PC幅（既定 ≥1024px）で左サイドバーにモードナビ（食材管理／献立・レシピ／料理・記録）が縦並びで常時表示される
  - PC幅で上部バー（アプリ名／検索スロット／本日のAI残り回数／アカウント・ログアウト）が表示される
  - PC幅でコンテンツが660px固定をやめ、サイドバー（目安220〜260px）＋広幅コンテンツ（最大目安1200〜1280px）の骨格になる
  - スマホ幅では従来の下部ナビ＋上部ステータスバー＋中央660px列のまま
  - モード切替・AI残り回数表示・レシピビューア遷移が PC/スマホ両方で動く
  - 検索スロットは骨格のみ（機能はTKT-0163）。未実装でもレイアウトが崩れない
  - Web版verifyが通る
related_tickets:
  - TKT-0157-web-desktop-app-shell
---

# Summary

PC（広画面）を添付モックの「左サイドバーナビ＋上部バー＋広幅多カラム」型へ寄せる土台を作る。reviewer は本spec＋artifacts だけで、スマホ温存とデスクトップ骨格の成立を判定できる状態にする。

## 背景

- 現状PCは `.app-shell { width: min(660px, 100%) }`＋下部タブの単一カラム（実質「でかいスマホ」）。
- `globals.css` L303 に未使用の `.desktop-mode-nav { display: none }` プレースホルダがある。
- パレット・角丸・影・紫アクセントは既にモックと一致しているため、骨格（シェル）の追加が主作業。
- 先行の TKT-0138 は「PCに広げず Canvas のモバイル型へ寄せる」方針。本specは ≥1024px のデスクトップ表示についてその方針を見直す（モバイル温存）。方針転換の確定は decisions.md に残す。

## 仕様

- ブレークポイント: 既定 1024px（デスクトップシェル ON）。タブレット帯（768〜1024px）の扱いを定義する。
- 左サイドバー: 「主ナビのリスト」＋「下部に固定するギア領域」の2構造で作る。主ナビは3モード（アイコン＋ラベル、`activeMode` と同期）。後日 TKT-0162 で主ナビ先頭に「ホーム」が、TKT-0161 で下部ギアに「設定」が入る前提（本specでは枠だけ用意してよい）。
- 上部バー: アプリ名/ロゴ、検索スロット（空でも崩れない）、`AiUsageMeter`（statusbar variant 流用）、アカウント表示＋ログアウト。
- コンテナ: スマホ=660px維持、デスクトップ=サイドバー＋広幅コンテンツの2カラム。既存 class の意味を変えず、デスクトップ用ラッパ class を追加して出し分ける。
- `ShellStatusContext` のAPI（`aiUsageSummary` / `requestViewRecipe` / `returnToMode` 等）は不変。

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 共通正本: `AGENTS.md`, `.agents/`, `harness/*.json`, `project-os/`, `docs/`
- 現役正本（編集対象）: `web/`, `supabase/`, `scripts/`
- Canvas版 `app.html` / `要件定義書.md` は凍結・参照専用（編集しない）
- verify: `/verify`（= `harness/bin/verify_web.sh`）。コマンドの正本は `harness/registry.json`
- Web版ポリシー: GAS/Spreadsheet/Driveを使わず、Next.js + Supabase + Vercel。APIキー・秘密鍵は環境変数で管理する。

## 非対象

- 各画面（食材一覧・レシピ詳細・記録・設定・ホーム）の多カラム化と中身の作り込み（TKT-0158〜0162）
- 検索の機能（TKT-0163。本specはスロットのみ）
- スマホ表示の変更
