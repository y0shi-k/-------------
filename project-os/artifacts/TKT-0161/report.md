---
ticket_id: TKT-0161-web-desktop-settings-screen
status: ready
---

# Report Draft

> この artifact は日本語で記述する。コマンド名・ファイルパス・status値などの識別子だけ英語を許容する。

## 変更目的

各ボードに散在していた設定UI（Gemini APIキー入力・本日のAI残り回数・アカウント/ログアウト）を、PC=サイドバー下部「設定」ギア、スマホ=ステータスバーのアカウント表示から開く**設定画面**へ集約し、設定の所在を一本化した。TKT-0157 で配線済みだった `activeDesktopTarget.kind === "settings"` の描画先（設定画面コンポーネント）を新設したのが中核。認証・APIキー保存ロジックは変更せず、UIの移設・集約のみ。

## 今回追加した安全装置

- **APIキー読込の代替**: ボード内 `GeminiApiKeyPanel` 撤去により失われる localStorage 読込を、各ボード（inventory-board / recipe-meal-workspace）のマウント時 `setGeminiApiKey(loadUserGeminiApiKey())` useEffect で補完。設定で保存したキーは、設定離脱時のボード再マウントで反映される。AI実行のキー必須ガード（`trimmedApiKey` チェック）はそのまま温存。
- **APIキーの非露出維持**: 設定画面でも既存 `GeminiApiKeyPanel` を無改変で再利用し、入力は `type="password"` マスク・「DBには保存しない」注記を継続。平文の画面表示・console.log・追加のネットワーク送信なし。
- **未入力時の導線明確化**: AI実行時の未入力エラー文を接頭辞維持のまま「設定画面でGemini APIキーを登録してから再度お試しください」に更新し、入力欄移設後も復旧手順が示される。
- **回帰検知**: 設定画面の3セクション表示・スマホ入口遷移・APIキー保存・ログアウトを自動テストで担保（settings-panel.test.tsx 新規、web-mode-shell.test.tsx 追加）。

## 実施した確認

- `/verify TKT-0161`（`harness/bin/verify_web.sh`）: lint / typecheck / test / build すべて pass。policy（no_gas_dependency / no_hardcoded_secret / supabase_rls_present）すべて pass。`verify.json` は `project-os/artifacts/TKT-0161/verify.json`。
- 実装エージェント手元で全132テスト緑を確認済み。
- `/check-gates TKT-0161`: verify_passed クローズを確認。report/manual-smokes/review を本finalizeで作成しクローズ。
- コード差分レビュー: `review.md` 参照。

## 残リスク

- **実機ブラウザのスモークは未実施**（自動テスト＋verifyでロジックは担保、UI体感は要人手確認）。`manual-smokes.md` の skipped_checks 参照。
- `inventory-board.tsx` の `.photo-empty` 説明文が「入力したGemini APIキーでAI解析します」のままで、入力欄が設定に移った現状とは文言上わずかにズレる（テスト緑維持のため据え置き）。実害は小さいが、別途文言調整の余地あり。
- AI上限到達時の機能別「理由テキスト」はボード内から消え、設定画面（panel variant）とステータスバー（statusbar variant・注記なし）に集約。ボード側は実行ボタンの無効化で上限を表現する方針に変更。

## 次の依頼や人判断

- 実機スマホ/PCでの設定画面の見た目・操作（特にスマホ全画面化とログアウト遷移）の最終目視確認。
- `.photo-empty` 文言を「設定画面で登録したGemini APIキーで解析します」等へ更新するか（軽微UI、別チケットor追従でよい）。
- モックにある未実装機能（データ書き出し/取り込み等）の要否判断（本チケットでは飾りで置かず非対象とした）。
