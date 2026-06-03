---
ticket_id: TKT-0160-web-desktop-cooking-layout
status: passed
execution_mode: static_only
target_evals:
  - photo_upload_storage
  - supabase_schema_change
---

# Manual Smokes

## target_evals

- `photo_upload_storage`（🔴）: diff の `web/` パス + 正規表現 `photo|image|写真|Storage` への過剰マッチ。実際の写真取り込み・圧縮・Storage保存ロジックは無変更。
- `supabase_schema_change`（🔴）: diff の `web/` パス + 正規表現 `recipes|cooking_history|photos` への過剰マッチ（テストfixtureの `usage_type:"cooking_history"`・`bucket_id:"photos"`、モックの `recipes:"recipes"` に当たったもの）。migration / schema 変更は無し。

## executed_checks

- 静的確認: `git diff HEAD -- web supabase scripts` を精査し、Supabase migration・schema・RLS・Storage アップロード/保存（`upload(`・`storage.buckets`・`canvas.toDataURL`・`accept="image/*"` など）への変更が無いことを確認した。変更は `globals.css`（PC専用メディアクエリのレイアウト追加）、`cooking-history-board.tsx`（表示state同期・タブonClick）、テストのモック/ケース追加のみ。
- `supabase/` 配下に差分なし（`git status --porcelain` で確認）。
- 写真表示は既存の `photo.signed_url`（署名付き・短命URL）をそのまま使用。新たなURL/Storageパスのログ出力や公開化は無い。
- `/verify TKT-0160` で lint/typecheck/test/build + policy（RLS存在・秘密直書きなし・GAS非依存）が pass。

## skipped_checks

- 実機での写真撮影・プレビュー・撮り直し（`web_mobile_photo_capture`）: 本変更は写真取り込みUIに触れていないため静的確認に留めた。撮影フロー自体は本チケットのスコープ外。
- 実機ブラウザでのPC/スマホ目視（レイアウト崩れ確認）: 環境未接続のため未実施。report.md の「次の依頼」に記載。

## open_risks

- レイアウトの実機目視は未実施。広幅でのタイムライン複数カラム・カレンダーセル拡大時のサムネ/ドット表示は実画面での最終確認が望ましい。
- 写真/Storage 語彙による diff 過剰マッチは今後も同種のレイアウト変更で再発しうる（learnings に記録）。
