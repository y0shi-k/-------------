---
id: TKT-0204-signed-url-cache-adoption
title: レシピ/食材/料理候補の署名URL取得を共有キャッシュ経由に統一
status: draft
goal: 再マウント（モード往復）でも同一署名URLを再利用し、画像の再ダウンロード・チラつきを解消する。
acceptance:
  - `web/src/lib/photos/use-recipe-image-urls.ts` の署名URL生成が TKT-0203 の共有キャッシュ（`getCachedUserImageSignedUrl` または `useCachedSignedUrls`）経由になる
  - `web/src/lib/photos/use-cooking-photo-candidates.ts` の各 `createUserImageSignedUrl` 呼び出しが共有キャッシュ経由になる
  - `web/src/components/inventory-board.tsx` の食材画像URL解決 effect（`createUserImageSignedUrl` を回している箇所）が共有キャッシュ経由になる
  - 食材⇄献立⇄記録のモードを往復しても、同じ画像が同一署名URL文字列で表示され、DevTools Network で画像が再リクエストされない（disk/memory cache から出る）ことを手動確認し report に記録する
  - 画像の差し替え・削除フロー（inventory-board / レシピ画像差し替え）で、対象 path が `invalidateUserImageSignedUrl` され、差し替え後に古い画像を表示し続けない
  - 既存フォールバック（署名失敗→固定デモ画像→頭文字プレースホルダ）が従来どおり動く
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - web_project_bootstrap
eval_selection_mode: auto
changed_paths:
  - web/src/lib/photos/use-recipe-image-urls.ts
  - web/src/lib/photos/use-cooking-photo-candidates.ts
  - web/src/components/inventory-board.tsx
  - web/src/components/recipe-meal-workspace.tsx
  - project-os/artifacts/TKT-0204-signed-url-cache-adoption/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0203-signed-url-cache
related_artifacts:
  - artifacts/TKT-0204-signed-url-cache-adoption/verify.json
  - artifacts/TKT-0204-signed-url-cache-adoption/report.md
owner_role: implementer
owner_notes:
  - 【非危険】読み取り側の署名URL再利用のみ。DBスキーマ/RLS/auth/アップロード経路・バケット公開設定は変更しない。
  - `photo_upload_storage` eval が画像/Storage語彙で過剰マッチしうるが実Storageセキュリティ無変更。`/check-gates` で match した場合も report に「読み取り専用キャッシュ・公開設定/RLS無変更」と記録する運用（backlog 0f/0a 同方針）。
  - 現役正本はWeb版。Canvas版 `app.html` は編集しない。GAS/Spreadsheet/Driveを使わない。APIキー・秘密鍵を直書きしない。service role key をブラウザで使わない。
  - 先行依存 TKT-0203 の API: `getCachedUserImageSignedUrl(client, path)` / `invalidateUserImageSignedUrl(path)` / `useCachedSignedUrls(client, paths)`。フックを使える箇所は `useCachedSignedUrls` で重複 effect を削減する。
  - 差し替え対象の既存実装:
    - `use-recipe-image-urls.ts:38` `createUserImageSignedUrl(client, recipe.image_storage_path)` → キャッシュ経由。既存の signatureKey 方式は `useCachedSignedUrls` に内包できるなら置換、難しければ `getCachedUserImageSignedUrl` に差し替えるだけでも可。
    - `use-cooking-photo-candidates.ts:92` `signedUrl: await createUserImageSignedUrl(client, row.storage_path)` → `getCachedUserImageSignedUrl` に差し替え。
    - `inventory-board.tsx:507` `const url = await createUserImageSignedUrl(supabase, path)` → 同上。`imageSignatureKey`（~L488）の集合検知ロジックは維持。
  - invalidate を入れる箇所: 画像差し替え・削除で storage_path が変わる/消えるフロー。新規 path 採用時は古い path を invalidate（または何もしなくても新 path は別キーなので最低限「削除時 invalidate」を入れる）。`recipe-meal-workspace.tsx` のレシピ画像差し替え・`inventory-board.tsx` の食材画像差し替え/削除を確認。
  - 表示コンポーネント（`RecipeThumb` / `IngredientIcon` / `photo-candidate-picker`）は URL を受け取るだけなので原則改修不要。URL 文字列が安定することが本質。
  - 手動確認: Chrome DevTools Network（Img フィルタ）で、モード往復時に画像行が `(disk cache)`/`(memory cache)` になり Status 200（再取得）が出ないこと。署名URLのクエリトークンが往復で変わらないこと。
  - verify は `/verify TKT-0204-signed-url-cache-adoption`。
---

# Summary

recipe/ingredient/cooking候補 の署名URL生成を TKT-0203 の共有キャッシュ経由に統一する。
再マウント時も同一URL文字列を返すことで、ブラウザ画像キャッシュがヒットし再ダウンロード・チラつきが消える。
画像差し替え・削除時は対象 path を invalidate して古いURL表示を防ぐ。

## 実装メモ

- 置換は「`createUserImageSignedUrl` 直呼び → `getCachedUserImageSignedUrl`」が基本。複数 path をまとめて解決する
  フック（`use-recipe-image-urls` / inventory-board の effect）は `useCachedSignedUrls` への置換を優先し、重複ロジックを減らす。
- `use-cooking-photo-candidates.ts` は行ごとに署名するため `getCachedUserImageSignedUrl` の `Promise.all` 維持で良い。
- invalidate: 削除フローは確実に入れる。差し替えで path が変わる場合は新 path が別キーになるため必須ではないが、旧 path のエントリ掃除として入れて良い。
- 回帰確認: 画像なし→プレースホルダ、署名失敗→デモ画像のフォールバック順（`recipe-thumb.tsx` / `ingredient-icon.tsx`）が不変であること。

## 非対象

- 料理履歴（`page.tsx` サーバ署名）の移行（= TKT-0205）
- アップロード cacheControl 付与（= TKT-0206）
- 表示フォールバックの仕様変更、next/image 移行

## 依存チケット

- TKT-0203-signed-url-cache-foundation（共有キャッシュ API）
