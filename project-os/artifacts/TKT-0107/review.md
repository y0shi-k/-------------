# TKT-0107 レビュー

Status: ready

> このartifactは日本語で記述する。コマンド名、ファイルパス、status値、API名などの識別子だけ英語を許容する。

## checked_diff_paths

- `web/`
- `project-os/artifacts/TKT-0107/`

## 指摘事項

- ブロッカーは見つからなかった。

## セキュリティ確認

- Gemini API呼び出しは `web/src/app/api/ai/scan-ingredients/route.ts` のサーバー側APIに閉じている。
- `GEMINI_API_KEY` はサーバー側APIで `process.env` から読み、ブラウザへ渡していない。
- ブラウザからAPIへ送る値は `photoId` のみ。
- API側でログインユーザーを確認し、`photos` を `id`、`user_id`、`usage_type: ingredient_scan` で絞り込んでいる。
- Supabase Storageは非公開のままで、公開写真URLは生成していない。
- AI出力は `source: "ai_photo"` として `staging_items` に入り、自動で在庫確定しない。

## 残リスク

- AI抽出精度はGeminiの応答品質と写真の読みやすさに依存する。
- 実Gemini通信にはサーバー環境の有効な `GEMINI_API_KEY` が必要。テストではモックを使い、実キーは露出していない。
