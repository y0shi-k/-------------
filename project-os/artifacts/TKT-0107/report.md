# TKT-0107 実装報告

Status: ready

> このartifactは日本語で記述する。コマンド名、ファイルパス、status値、API名などの識別子だけ英語を許容する。

## 実装したこと

- サーバー側でGemini食材解析を行う `POST /api/ai/scan-ingredients` を追加した。
- AIレスポンスを検証し、登録待ち候補へ整形する処理を追加した。
- `GEMINI_API_KEY` はサーバー環境変数からのみ読むようにした。
- ログインユーザーの文脈で、非公開Supabase Storageの写真をサーバー側から読み出すようにした。
- AI候補は `source: "ai_photo"` として `staging_items` に追加する。
- 写真パネルを、選択した写真を保存してAI解析し、登録待ち候補へ入れる流れに更新した。
- 解析処理、APIの安全確認、UIの成功/失敗表示に対するテストを追加した。

## 安全面

- 依存パッケージは追加していない。
- Supabase migrationは追加していない。
- Canvas版の `app.html` は変更していない。
- APIキー、Supabase秘密鍵、実写真URLは追加していない。
- WebコードにGAS、Spreadsheet、Drive依存は追加していない。
- AI結果は登録待ち候補のままで、在庫化にはユーザー確認が必要。

## 確認結果

- `npm run lint`: passed
- `npm run typecheck`: passed
- `npm run test`: passed、27件
- `npm run build`: passed
- Web版ポリシーチェック: passed

## 次

- 実機AIテスト前に、サーバー環境へ `GEMINI_API_KEY` を設定する。
- 次は `TKT-0108-cooking-history-photo-web` へ進む。
