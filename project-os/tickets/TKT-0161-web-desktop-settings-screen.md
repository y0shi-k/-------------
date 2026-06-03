---
id: TKT-0161-web-desktop-settings-screen
title: 設定・連携のPC画面（散在する設定の集約・新規ナビ項目）
status: draft
goal: 各ボードに散在する設定（Gemini APIキー／AI残り回数／アカウント・ログアウト等）を、添付モック「設定・連携」に沿ったPCの設定画面へ集約し、設定の所在を一本化する
acceptance:
  - 【確定: 案A】PCは左サイドバー下部に「設定」ギアを固定配置し、そこから全画面の設定へ遷移できる（主ナビ3項目は据え置き、設定を主ナビに昇格させない）
  - 【確定: 案A】スマホはアカウント導線（メール/アカウント表示）から設定へ遷移でき、下部タブは3つのまま増やさない
  - 設定画面に、Gemini APIキー設定（`gemini-api-key-panel`）／本日のAI残り回数（`ai-usage-meter`）／アカウント情報・ログアウト（`logout-button`）がセクションとして集約される
  - 既存の各ボード内に重複表示していた設定UIの扱い（移設 or 併存）を spec で確定し、その通りに整理されている
  - APIキーは画面に伏字/マスク等で安全に扱い、平文を不要に表示・ログ出力しない
  - ログイン・ログアウト・APIキー保存の既存挙動が壊れない
  - Web版verifyが通る
required_evals:
  - pwa_mobile_ui
  - auth_and_rls_policy
  - ai_server_route
eval_selection_mode: auto
changed_paths:
  - web/src/components/web-mode-shell.tsx
  - web/src/components/gemini-api-key-panel.tsx
  - web/src/components/ai-usage-meter.tsx
  - web/src/components/logout-button.tsx
  - web/src/components/inventory-board.tsx
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/page.tsx
  - web/src/app/globals.css
  - web/src/__tests__/
  - project-os/artifacts/TKT-0161-web-desktop-settings-screen/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0161-web-desktop-settings-screen
related_artifacts:
  - artifacts/TKT-0161-web-desktop-settings-screen/verify.json
  - artifacts/TKT-0161-web-desktop-settings-screen/manual-smokes.md
  - artifacts/TKT-0161-web-desktop-settings-screen/review.md
  - artifacts/TKT-0161-web-desktop-settings-screen/report.md
owner_role: implementer
owner_notes:
  - 依存: TKT-0157（デスクトップシェル）の完了が前提。サイドバー下部のギア（設定エントリ）を足す。
  - 【IA確定（2026-06-03・案A）】設定は主ナビに昇格させない。PCはサイドバー下部にギア固定、スマホはアカウント導線から全画面の設定へ。主ナビ3つ・スマホ下部タブ3つを温存。決定は decisions.md に記録済み。
  - 危険変更扱い: Gemini APIキー（`ai_server_route`）とログイン/ログアウト（`auth_and_rls_policy`）のUIを移設・集約するため、manual-smokes.md / review.md を必須にしている。ロジック自体は変えず移設が中心だが、認証・鍵まわりに触れるため安全側に倒す。
  - APIキーの平文表示・ログ出力をしない。Service Role Key・写真URLをブラウザへ出さない。
  - verify は `/verify TKT-0161`。Canvas版 `app.html` は触らない。対象は `web/` のみ。最終 required_evals は `/check-gates TKT-0161` で確定。
---

# Summary

設定が各ボードに散在している現状（`gemini-api-key-panel` は `recipe-meal-workspace` 内、`ai-usage-meter` は上部バー＋各パネル、`logout-button` はボード内）を、添付モック「設定・連携」に沿ってPCの**設定画面**へ集約する。設定の所在を一本化し、迷子をなくす。

## 背景

- `gemini-api-key-panel` / `ai-usage-meter` / `logout-button` が複数コンポーネントに分散している（`grep` で確認済み）。
- モック「設定・連携」はトグル付きの設定行・アカウント・データ書き出し/取り込みを持つ。本チケットでは**実在する設定要素の集約**を対象とし、未実装の機能（データ書き出し/取り込み等）は別途検討（飾りとして置かない）。

## 実装メモ

- TKT-0157 のサイドバー/ナビに「設定」項目を追加（モードを増やすか、別ルートにするかは spec で確定）。
- 設定画面に既存の Gemini APIキー設定・AI残り回数・アカウント/ログアウトをセクションとして配置。
- 各ボード内の重複設定UIの扱い（移設 or 併存）を spec で確定し整理。
- スマホでの設定アクセス方法も spec で定義（従来維持 or 統一）。

### 共通方針
- 既存規約・命名・`@/` エイリアス・immutable patterns に合わせる。console.log を残さない。
- 認証・APIキーのロジックは変更しない（移設が中心）。

## 残リスク

- 認証（ログアウト）・APIキーUIの移設は副作用が出やすい。manual-smokes/review を必須にしている。
- モックにある「データ書き出し/取り込み」等が未実装機能の場合、本チケットでは扱わず別チケット化（飾りで置かない）。
- IA変更（新ナビ）はユーザー確認後に着手する。
