---
ticket_id: TKT-0161-web-desktop-settings-screen
status: passed
execution_mode: static_only
target_evals:
  - pwa_mobile_ui
  - auth_and_rls_policy
  - ai_server_route
---

# Manual Smokes

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## target_evals

- pwa_mobile_ui: スマホでの設定画面入口（ステータスバーのアカウント表示タップ）と下部タブ3つ温存。
- auth_and_rls_policy: ログアウト導線の移設・併存（設定セクション／PC上部バー）。ログイン必須・RLSは不変。
- ai_server_route: Gemini APIキー入力の設定への移設に伴うAI実行（スキャン／レシピ生成）の継続動作。

## executed_checks

- `/verify TKT-0161`（lint / typecheck / test / build）すべて pass。policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present）pass。
- 自動テスト（Vitest + @testing-library、全132件緑）で以下を検証:
  - PC設定ギアクリックで設定3セクション（Gemini APIキー／本日のAI残り回数／アカウント）が表示され、ボードがアンマウントされる（web-mode-shell.test.tsx）。
  - スマホ ステータスバーのアカウントボタン（メール）クリックで設定へ遷移（web-mode-shell.test.tsx）。
  - 設定画面のAPIキー入力が `type="password"` マスクで localStorage に保存される（settings-panel.test.tsx）。
  - 設定画面にログアウトボタンが存在し、戻るボタンで onClose が呼ばれる（settings-panel.test.tsx）。
  - APIキー未入力時、スキャン／レシピ生成が接頭辞「原因: ユーザー自身のGemini APIキーが未入力です。」のエラーで停止し、サーバーへ fetch しない（inventory-board / recipe-meal-workspace test）。
- コード差分上、Service Role Key・写真URL・APIキー平文のブラウザ出力やログ出力が増えていないことを確認（review.md 参照）。

## skipped_checks

- 実機ブラウザでの目視スモーク（要人手）:
  - PCサイドバー「設定」→3セクション表示→APIキー入力・保存→食材スキャン/レシピ生成が保存キーで実行できる。
  - APIキー削除→ボードのAI実行が「設定画面で登録」エラーになる。
  - ログアウト（設定セクション／PC上部バー両方）が `/login` へ遷移する。
  - スマホ幅で設定が全画面表示され、下部タブで戻れる／下部タブが3つのまま。
  - 理由: ヘッドレス自動テストとverifyでロジック・配線・非露出は担保済み。最終的な見た目・遷移体感は実機確認が望ましい。

## open_risks

- 実機での全画面化・遷移体感は未目視（上記 skipped）。
- `.photo-empty` の説明文が旧表現（「入力したGemini APIキーで」）のまま。実害小、別途調整余地。
