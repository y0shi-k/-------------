---
id: SPEC-0161-web-desktop-settings-screen
title: 設定・連携のPC画面（散在する設定の集約・新規ナビ項目）
status: draft
scope:
  - web/src/components/web-mode-shell.tsx
  - web/src/components/gemini-api-key-panel.tsx
  - web/src/components/ai-usage-meter.tsx
  - web/src/components/logout-button.tsx
  - web/src/components/inventory-board.tsx
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/page.tsx
  - web/src/app/globals.css
constraints:
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 認証（ログイン/ログアウト）・Gemini APIキー保存のロジックは変更しない。UIの移設・集約が中心
  - APIキーの平文を不要に表示・ログ出力しない。Service Role Key・写真URLをブラウザへ出さない
  - TKT-0157（デスクトップシェル）完了が前提
  - 【IA確定（2026-06-03・案A）】設定は主ナビに昇格させない。PC=サイドバー下部ギア、スマホ=アカウント導線から全画面設定へ。主ナビ3つ・スマホ下部タブ3つを温存。decisions.md に記録済み
  - ログイン必須・Supabase RLS・Storage非公開を守る
acceptance:
  - PCは左サイドバー下部の「設定」ギアから全画面の設定へ遷移できる（設定を主ナビに昇格させない）
  - スマホはアカウント導線から設定へ遷移でき、下部タブは3つのまま
  - 設定画面にGemini APIキー設定・本日のAI残り回数・アカウント/ログアウトが集約される
  - 各ボード内の重複設定UIの扱い（移設 or 併存）が spec の決定どおりに整理される
  - APIキーが安全に扱われ、ログイン/ログアウト/キー保存の既存挙動が壊れない
  - スマホ幅の設定アクセスが壊れない
  - Web版verifyが通る
related_tickets:
  - TKT-0161-web-desktop-settings-screen
---

# Summary

各ボードに散在する設定（Gemini APIキー・AI残り回数・アカウント/ログアウト）を、添付モック「設定・連携」に沿ってPCの設定画面へ集約する。実在する設定要素の集約が対象で、未実装機能（データ書き出し/取り込み等）は飾りで置かず別途検討。

## 背景

- `gemini-api-key-panel`（recipe-meal-workspace内）・`ai-usage-meter`（上部バー＋各パネル）・`logout-button`（ボード内）が分散。
- モック「設定・連携」はトグル設定行・アカウント・データ管理を持つ。

## 仕様

- TKT-0157 のサイドバー/ナビに「設定」を追加（モード追加 or 別ルートは本specで確定）。
- 設定画面に既存設定要素をセクション配置。重複UIの移設/併存方針を確定。
- スマホでの設定アクセス方法を定義。
- 認証・キーのロジックは不変（移設のみ）。APIキーはマスク等で安全に扱う。

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 現役正本（編集対象）: `web/`, `supabase/`, `scripts/`
- Canvas版 `app.html` は凍結・参照専用
- verify: `/verify`（= `harness/bin/verify_web.sh`）
- Web版ポリシー: GAS/Spreadsheet/Driveを使わない。APIキー・秘密鍵は環境変数。

## 非対象

- 認証・APIキー保存ロジックの変更
- モックにある未実装機能（データ書き出し/取り込み等）の新規実装
- 各画面の多カラム化（TKT-0158〜0160）
