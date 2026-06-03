---
ticket_id: TKT-0161-web-desktop-settings-screen
status: passed
review_scope:
  - SPEC-0161-web-desktop-settings-screen
  - TKT-0161-web-desktop-settings-screen
---

# Review Record

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## checked_diff_paths

- web/src/components/settings-panel.tsx（新規）
- web/src/components/web-mode-shell.tsx
- web/src/components/inventory-board.tsx
- web/src/components/recipe-meal-workspace.tsx
- web/src/app/globals.css
- web/src/__tests__/settings-panel.test.tsx（新規）
- web/src/__tests__/web-mode-shell.test.tsx
- web/src/__tests__/inventory-board.test.tsx
- web/src/__tests__/recipe-meal-workspace.test.tsx

## checked_artifacts

- project-os/artifacts/TKT-0161/verify.json（status=pass）
- project-os/artifacts/TKT-0161/report.md
- project-os/artifacts/TKT-0161/manual-smokes.md

## subagent_usage

- impl-deep（Opus）に実装を委譲。route_model.py により auth_and_rls_policy / ai_server_route の危険evalを含むため deep 判定。verify/gate/finalize はオーケストレーターが実行。

## findings

- **[良] 設定画面は既存資産の再利用で実装**: `GeminiApiKeyPanel`・`AiUsageMeter`（variant="panel"）・`LogoutButton` をいずれも無改変で再配置。認証・キー保存ロジックに手を入れず方針（移設中心）を遵守。
- **[良/重要] キー読込の代替が正しく入っている**: ボードの localStorage 読込は従来 `GeminiApiKeyPanel` の useEffect 依存だった。パネル撤去に伴い inventory-board / recipe-meal-workspace それぞれにマウント時 `setGeminiApiKey(loadUserGeminiApiKey())` を追加（計画で指摘した落とし穴に対応済み）。AI実行のキー必須ガードは温存。
- **[良] 秘匿情報の非露出**: APIキーは `type="password"` 維持。差分に Service Role Key・写真URL・APIキー平文の新規ブラウザ出力やログ出力なし。verify の no_hardcoded_secret も pass。
- **[良] IA方針遵守**: 設定を主ナビに昇格させず、PC=サイドバー下部ギア（既存配線）、スマホ=ステータスバーのアカウントボタン。下部タブ3つ温存。ログアウトは設定に新設しつつPC上部バーは据え置き（既存テスト緑・認証回帰回避）。
- **[軽微] `.photo-empty` 文言の取り残し**: 「入力したGemini APIキーでAI解析します」が旧表現のまま。入力欄は設定へ移設済みのため文言上ズレ。テスト緑維持のため意図的据え置き。実害小。
- **[軽微] AI上限の機能別理由テキストがボードから消失**: 設定画面（panel）とステータスバー（statusbar・注記なし）へ集約。ボードは実行ボタン無効化で上限を表現。方針どおりだが、上限到達理由がボード上で読めなくなった点は仕様変更として記録。

## open_risks

- 実機ブラウザでの全画面化・ログアウト遷移・スマホ入口の目視は未実施（manual-smokes の skipped_checks）。
- gate判定が supabase_schema_change / photo_upload_storage を🔴で拾うが、これは changed_paths のヒューリスティック。実差分に schema/migration/Storage ロジックの変更はなく、verify の RLS/secret チェックも pass。

## verdict

- pass。方針（移設中心・ロジック不変・秘匿非露出）を満たし、verify 全項目 pass。残課題はいずれも軽微または人手目視で、ブロッカーなし。
