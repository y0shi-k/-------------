---
id: TKT-0206-upload-cache-control
title: 写真アップロードに cacheControl を付与しブラウザHTTPキャッシュ寿命を延ばす
status: completed
goal: content-addressed path（再アップロードは別 path）前提で、アップロード時に長め＋immutable 相当の cacheControl を付け、署名URL再利用時のブラウザHTTPキャッシュ寿命を延ばす。
acceptance:
  - 各 `supabase.storage.from(...).upload(...)` の options に `cacheControl`（長め、例 `"31536000"`）が付与される
  - 対象は写真アップロードの全経路: `inventory-board.tsx`（2箇所）/ `recipe-meal-workspace.tsx` / `cooking-record-edit-modal.tsx` / `lib/photos/recipe-image-upload.ts`
  - 新規アップロードしたオブジェクトのレスポンスに想定どおりの `cache-control` が付き、同一署名URL再取得時にブラウザがキャッシュから返す（手動確認し manual-smokes.md に記録）
  - 写真Storageは非公開 `photos` バケットのまま（公開化しない）。バケット構成・RLS・auth・schema は変更しない
  - スマホ/タブレットで撮影→保存→表示の一連が従来どおり動く（撮影・プレビュー・撮り直し含む）
  - 既存オブジェクトには遡及せず（既存は Supabase 既定の 3600 のまま）、その旨を report に明記する
  - Web版verify（lint/typecheck/build）が通る
required_evals:
  - photo_upload_storage
eval_selection_mode: auto
changed_paths:
  - web/src/components/inventory-board.tsx
  - web/src/components/recipe-meal-workspace.tsx
  - web/src/components/cooking-record-edit-modal.tsx
  - web/src/lib/photos/recipe-image-upload.ts
  - project-os/artifacts/TKT-0206-upload-cache-control/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - manual_smokes_done
  - review_ready
  - report_ready
related_specs:
  - SPEC-0203-signed-url-cache
related_artifacts:
  - artifacts/TKT-0206-upload-cache-control/verify.json
  - artifacts/TKT-0206-upload-cache-control/manual-smokes.md
  - artifacts/TKT-0206-upload-cache-control/review.md
  - artifacts/TKT-0206-upload-cache-control/report.md
owner_role: implementer
owner_notes:
  - 【危険変更】photo_upload_storage。実際にアップロード経路（upload options）を変更するため manual-smokes.md / review.md 必須。完了にする前に「非公開バケットのまま」「撮影→保存→表示が回る」を確認する。
  - 現役正本はWeb版。Canvas版 `app.html` は編集しない。GAS/Spreadsheet/Driveを使わない。APIキー・Supabase秘密鍵を直書きしない。service role key をブラウザで使わない。
  - 既存アップロード箇所（cacheControl 未指定＝Supabase既定3600）:
    - `inventory-board.tsx:702`（料理写真）/ `inventory-board.tsx:960`・`:978`（食材画像・ユーザー画像）
    - `recipe-meal-workspace.tsx:2178`（料理写真）
    - `cooking-record-edit-modal.tsx:296`（料理写真）
    - `lib/photos/recipe-image-upload.ts:75`・`:100`（レシピ画像）
  - 変更は options に `cacheControl: "31536000"` を加えるだけ（`contentType` / `upsert` 等は維持）。`upsert:false` の content-addressed 運用なので長期キャッシュが安全。
  - 注意: 署名URLのトークンはレスポンスをキャッシュ可能にするだけで、URL文字列が変わればキャッシュキーは別になる。本チケットは TKT-0203/0204/0205 の「同一URL再利用」と組み合わせて初めてフル効果が出る（単独では既存3600から寿命を延ばすのみ）。
  - manual-smokes.md: 新規写真をアップロード→Network で `cache-control: ...max-age=31536000...` を確認。同一署名URL再取得でキャッシュ返却を確認。撮影・プレビュー・撮り直し・保存後の表示を確認。
  - review.md: 写真が公開バケット化していないか、storage path/URL が公開漏れしていないか、元画像を不要に保存していないか（圧縮前提が維持されているか）を確認。
  - 既存オブジェクトの cache-control を遡及変更する作業（再アップロード/メタ更新）は本チケット対象外。
  - verify は `/verify TKT-0206-upload-cache-control`。
---

# Summary

写真アップロードの全経路で `upload()` options に長期 `cacheControl` を付与し、署名URL再利用時の
ブラウザHTTPキャッシュ寿命を延ばす。content-addressed（`upsert:false`、再アップロードは別 path）運用のため
長期キャッシュが安全。非公開バケット・圧縮・撮影フローは一切変えない。危険変更（photo_upload_storage）として
manual-smokes / review を必須にする。

## 実装メモ

- 各 `.upload(path, blob, { contentType, upsert:false })` に `cacheControl: "31536000"` を追加。
- 既存オブジェクトには影響しない（新規アップロード分のみ）。report にその旨を明記。
- TKT-0203/0204/0205（同一URL再利用）と併用して初めて再DL解消のフル効果。単独着手も可能だが効果限定。

## 非対象

- 既存オブジェクトの cache-control 遡及更新
- 署名URL再利用ロジック（= TKT-0203/0204/0205）
- バケット公開化・RLS・schema・撮影/圧縮フローの変更

## 依存チケット

- なし（独立して実装可。ただし体感改善は TKT-0204/0205 と併用が前提）
