---
id: TKT-0246-dual-browser-gemini-api-key-fallback
title: Gemini APIキーを無料用・有料用の2本ブラウザ保存にし、無料エラー時だけ選択式で有料キー実行できるようにする
status: implementation_ready
goal: 現状ブラウザに1本だけ保存しているユーザーGemini APIキーを「無料用」「有料用」の2本に分け、AI実行は無料用を先に使い、エラー時にユーザー確認を挟んで有料用で再実行できるようにする
acceptance:
  - 設定UIで無料用Gemini APIキーと有料用Gemini APIキーを別々に入力・保存・削除できる
  - 既存のブラウザ保存キー `stock-master:user-gemini-api-key` がある場合、初回読み込み時は無料用キーとして扱われ、既存ユーザーが再入力なしで使い始められる
  - AIレシピ生成と食材写真解析は通常実行時に無料用Gemini APIキーを使う
  - 無料用Gemini APIキーが未入力の場合は、AI実行前に「無料用Gemini APIキーが未入力」と分かるエラーを出し、有料用へ自動切替しない
  - 無料用Gemini APIキーでGemini/API routeエラーになった場合、ユーザーに「無料APIで再試行」「有料APIで続行」「キャンセル」を選ばせるUIを出す
  - ユーザーが「有料APIで続行」を選んだ時だけ、有料用Gemini APIキーで同じAI処理を再実行する
  - 有料用Gemini APIキーが未入力の状態で「有料APIで続行」を選んだ場合は、設定画面で有料用キーを登録するよう案内し、再実行しない
  - 有料用キーへの切替は自動で行わない。料金が発生しうるため、必ずユーザー操作を挟む
  - サーバーAPI routeはリクエストで受け取った1本のGemini APIキーだけを `x-goog-api-key` に使い、無料/有料の判定やキー保存はサーバー側で行わない
  - Gemini APIキーはSupabase DBへ保存しない
  - Gemini APIキーはレスポンス、トースト、エラーメッセージ、console/log、report、verify成果物へ出さない
  - 既存のAI利用回数制限（consumeAiUsage / refundAiUsage）の挙動を壊さない。有料キー再実行も1回のAI実行として既存上限管理に従う
  - 食材写真解析で無料キー失敗後に有料キー実行する場合、写真アップロードをやり直さず、保存済みphotoIdsを再利用してAI解析だけ再実行する
  - Web版verify、manual smoke、reviewが通る
required_evals:
  - ai_server_route
  - pwa_mobile_ui
eval_selection_mode: manual
changed_paths:
  - web/src/lib/ai/user-gemini-api-key.ts
  - web/src/components/gemini-api-key-panel.tsx
  - web/src/components/inventory-board.tsx
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/app/api/ai/scan-ingredients/route.ts
  - web/src/app/api/ai/recipes/route.ts
  - web/src/__tests__/
  - project-os/artifacts/TKT-0246-dual-browser-gemini-api-key-fallback/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0150-user-owned-gemini-api-key
related_artifacts:
  - artifacts/TKT-0246-dual-browser-gemini-api-key-fallback/verify.json
  - artifacts/TKT-0246-dual-browser-gemini-api-key-fallback/manual-smokes.md
  - artifacts/TKT-0246-dual-browser-gemini-api-key-fallback/review.md
  - artifacts/TKT-0246-dual-browser-gemini-api-key-fallback/report.md
owner_role: implementer
owner_notes:
  - 危険変更。AI API RouteとAPIキー取り扱い、スマホUIに触れるため manual-smokes.md / review.md を必須にする
  - Canvas版 `app.html` は凍結・参照専用。編集しない
  - GAS / Google Spreadsheet / Google Drive は使わない
  - APIキー、Supabase秘密鍵、写真URL、Storage path を直書きしない
  - verify は `/verify TKT-0246-dual-browser-gemini-api-key-fallback`（= `harness/bin/verify_web.sh`）
---

# Summary

Gemini APIキーのブラウザ保存を1本から2本へ増やす。無料用キーを普段使いし、失敗時だけユーザー確認を挟んで有料用キーで同じ処理を再実行する。

目的は「普段は無料枠を使う」「無料キーで失敗した時だけ有料キーを使える」「有料利用は必ずユーザーが選ぶ」の3点。料金事故を避けるため、自動フォールバックは禁止する。

## 実装メモ

- APIキー保存
  - `web/src/lib/ai/user-gemini-api-key.ts` を、無料用・有料用の2本を扱える形へ拡張する
  - 新しい保存キー名は以下を使う
    - 無料用: `stock-master:user-gemini-api-key:free`
    - 有料用: `stock-master:user-gemini-api-key:paid`
  - 旧キー `stock-master:user-gemini-api-key` は後方互換として読み込む。無料用キーが未保存で旧キーがある場合、無料用として返す
  - 削除操作は無料用・有料用それぞれ独立させる。旧キーの扱いは、無料用削除時に旧キーも削除する

- 設定UI
  - `web/src/components/gemini-api-key-panel.tsx` を2入力に変更する
  - 表示ラベルは「無料Gemini APIキー」「有料Gemini APIキー」
  - どちらも `type="password"`、保存、削除、入力済み/未入力状態を持つ
  - 既存の「DBには保存しません。AI実行時だけサーバーへ送ります。」の説明は残し、有料キーには「料金が発生する可能性があります。無料API失敗時に選択した場合だけ使います。」を追加する
  - スマホ幅で2つの入力欄とボタンが横にはみ出さないようにする

- AIレシピ生成
  - `web/src/components/recipe-meal-workspace.tsx` のAI実行は、通常時に無料用キーを送る
  - 無料用キーのレスポンスがエラーだった場合、同じ入力内容（mode / required / optional / sourceText）を保持したまま選択UIを出す
  - 「無料APIで再試行」は無料用キーで同じリクエストを再送する
  - 「有料APIで続行」は有料用キーで同じリクエストを送る
  - 「キャンセル」は再送せず、入力内容と編集状態を維持する

- 食材写真解析
  - `web/src/components/inventory-board.tsx` の通常実行は無料用キーを送る
  - 写真は先にStorageへ保存されるため、無料キーで解析だけ失敗した場合は保存済み `photoIds` を保持する
  - 「無料APIで再試行」「有料APIで続行」は、写真アップロードを繰り返さず、保持した `photoIds` で `/api/ai/scan-ingredients` だけ再実行する
  - ユーザーがキャンセルした場合は、保存済み写真の扱いを既存方針に合わせる。すぐ削除する新処理は入れない（既存の写真保存/解析フローを壊さないため）

- サーバーAPI route
  - `web/src/app/api/ai/recipes/route.ts` と `web/src/app/api/ai/scan-ingredients/route.ts` は、受け取った `geminiApiKey` を使う既存契約を維持する
  - サーバー側に無料/有料の概念を持たせない。これによりサーバーでキーを2本扱わず、漏洩面を増やさない
  - エラーメッセージの「ユーザー自身のGemini APIキー」は、必要なら「Gemini APIキー」に一般化する。ただしAPIキー値は絶対に含めない

## UI/UX要件

- エラー後の選択UIは、既存のフィードバック表示に文字だけで埋め込まず、ユーザーが明確に選べるボタンにする
- ボタン文言は以下で統一する
  - `無料APIで再試行`
  - `有料APIで続行`
  - `キャンセル`
- 有料キー実行前には「有料APIキーを使用します。Google側で料金が発生する可能性があります。」の短い注意を表示する
- スマホで片手操作しやすいよう、選択ボタンは縦積みまたは折り返し可能にする
- 処理中は既存の `isAiRunning` / `isUploadingPhoto` 相当の状態に合わせて、二重送信できないようにする

## テスト

- `user-gemini-api-key` の単体テスト
  - 旧キーだけある場合、無料用キーとして読める
  - 無料用と有料用を別々に保存・削除できる
  - 無料用削除時に旧キーも削除される

- `recipe-meal-workspace` のテスト
  - 通常実行で無料用キーが `/api/ai/recipes` に送られる
  - 無料キー失敗時に3択UIが表示される
  - 「無料APIで再試行」で無料用キーが再送される
  - 「有料APIで続行」で有料用キーが送られる
  - 有料用キー未入力時は案内を出し、fetchしない
  - レスポンスや表示文にキー値が含まれない

- `inventory-board` のテスト
  - 通常実行で無料用キーが `/api/ai/scan-ingredients` に送られる
  - 無料キー失敗後、「有料APIで続行」で同じ `photoIds` が再利用され、写真アップロードが再実行されない
  - 有料用キー未入力時は案内を出し、AI解析fetchを追加実行しない
  - レスポンスや表示文にキー値が含まれない

- API route のテスト
  - 既存の `geminiApiKey` 受け取り契約が壊れていない
  - 受け取ったキーは `x-goog-api-key` にのみ使われる
  - エラーレスポンスにキー値が含まれない

## 手動確認

- 設定画面で無料用・有料用キーをそれぞれ保存、削除できる
- 旧キー保存済みブラウザで開いた時、無料用が入力済み扱いになる
- AIレシピ生成で無料用キーが成功する
- AIレシピ生成で無料用キー失敗時、3択が出る
- AIレシピ生成で有料用キーに切り替えて成功する
- 食材写真解析で無料用キーが成功する
- 食材写真解析で無料用キー失敗時、写真を再アップロードせず有料用キーで解析だけ再実行できる
- スマホ幅で設定UIと3択UIが崩れない
- ブラウザNetworkレスポンス、画面表示、サーバーログにAPIキー値が出ない

## 非対象

- サーバー環境変数 `GEMINI_API_KEY` を有料キーとして使う方式
- Supabase DBへのAPIキー保存
- APIキーの暗号化DB保存
- Google Cloud側の課金設定やAPIキー作成代行
- AI利用回数上限の仕様変更
- Canvas版 `app.html` の変更

## 残リスク

- ブラウザ保存は便利だが、共有端末やXSSがあるとAPIキー流出リスクがある。設定UIとreportで「DBには保存しないが、この端末のブラウザには保存される」ことを明記する
- 有料キーは料金が発生しうるため、自動切替に変更しない。将来変更する場合は別チケットで確認UIと上限設定を再設計する
- 食材写真解析で無料キー失敗後にキャンセルした場合、写真レコードが残る可能性がある。既存フローを優先し、本チケットでは削除自動化を入れない
