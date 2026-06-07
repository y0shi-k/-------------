---
id: TKT-0203-signed-url-cache-foundation
title: 画像署名URLの共有キャッシュ基盤（module キャッシュ＋共有フック）
status: draft
goal: path 単位で署名URLを module スコープに保持し、コンポーネント再マウントを越えて同一URLを返す土台を作る（再ダウンロードの根本原因を断つ）。
acceptance:
  - 新規 `web/src/lib/photos/signed-url-cache.ts` に module-level の path→{url, expiresAt} キャッシュと in-flight Promise dedup が実装される
  - `getCachedUserImageSignedUrl(client, path)` が、満了マージン（既定: TTLの満了5分前）内ならキャッシュ済みURLを返し、満了が近い/未キャッシュの path のみ `createUserImageSignedUrl` で再発行して保存する
  - 同一 path への並行呼び出しが1回の `createSignedUrl` に集約される（in-flight dedup）
  - `invalidateUserImageSignedUrl(path)` で該当 path のキャッシュエントリが破棄される
  - 共有 React フック `useCachedSignedUrls(client, paths)` が `Map<path, url>` を返し、paths 集合が変わったときだけ解決を走らせる
  - vitest で「キャッシュヒット（2回目は createSignedUrl を呼ばない）」「満了マージン経過で再発行」「in-flight dedup」「invalidate 後の再発行」を検証する
  - 既存の `createUserImageSignedUrl` / `USER_IMAGE_SIGNED_URL_TTL_SECONDS`（`web/src/lib/photos/user-image.ts`）を再利用し、TTL は既存定数に合わせる
  - Web版verify（lint/typecheck/test/build）が通る
required_evals:
  - web_project_bootstrap
eval_selection_mode: auto
changed_paths:
  - web/src/lib/photos/signed-url-cache.ts
  - web/src/lib/photos/__tests__/signed-url-cache.test.ts
  - project-os/artifacts/TKT-0203-signed-url-cache-foundation/
required_gates:
  - spec_ready
  - implementation_ready
  - verify_passed
  - report_ready
related_specs:
  - SPEC-0203-signed-url-cache
related_artifacts:
  - artifacts/TKT-0203-signed-url-cache-foundation/verify.json
  - artifacts/TKT-0203-signed-url-cache-foundation/report.md
owner_role: implementer
owner_notes:
  - 【非危険】読み取り側の署名URL再利用のみ。DBスキーマ/RLS/auth/アップロード経路・バケット公開設定は一切変更しない。
  - `photo_upload_storage` eval が `photo|image|写真|画像`・`Storage` の語彙で過剰マッチしうるが、実Storage/公開設定/RLSは無変更。実装後 `/check-gates` で match した場合も report に「読み取り専用キャッシュ・Storageセキュリティ無変更」と記録する運用（backlog 0f/0a と同方針）。
  - 現役正本はWeb版。Canvas版 `app.html` は編集しない。GAS/Spreadsheet/Driveを使わない。APIキー・Supabase秘密鍵を直書きしない。service role key をブラウザで使わない。
  - 既存の署名ヘルパ正本: `web/src/lib/photos/user-image.ts`（`createUserImageSignedUrl` / `SignedUrlCapableClient` / `USER_IMAGE_SIGNED_URL_TTL_SECONDS = 60*30`）。本チケットはこれをラップする薄い層。
  - キャッシュは module-level（SPA セッション内で全アンマウントを越えて保持）。Context より単純で、`router.refresh()` でも SPA は生存するため保持される。フルリロードでリセットされるのは許容。
  - path はコンテンツ識別子として安定（再アップロードは別 path）前提。よって path をキー、value にURL＋expiresAt を持つ。expiresAt は発行時刻＋TTL から算出。
  - in-flight dedup: 同一 path の解決中 Promise を Map に保持し、解決完了で除去。多数コンポーネント同時マウント時の createSignedUrl 連打を防ぐ。
  - `useCachedSignedUrls(client, paths)` は既存 `use-recipe-image-urls.ts` の signatureKey 方式（paths を sort して join、集合変化時のみ effect 実行、cleanup で active フラグ）に倣う。TKT-0204/0205 が共通利用する。
  - イミュータブル更新を守る（Map は新インスタンスで setState）。テストは vitest（既存テスト構成に合わせ `__tests__` 配置）。フックのテストが重ければ純関数（getCached/invalidate）中心でも可、ただし dedup と満了は必ず検証する。
  - verify は `/verify TKT-0203-signed-url-cache-foundation`。
---

# Summary

`web/src/lib/photos/signed-url-cache.ts` を新設し、path→署名URL を module スコープでキャッシュする。
`getCachedUserImageSignedUrl` / `invalidateUserImageSignedUrl` / 共有フック `useCachedSignedUrls` を提供し、
TKT-0204（既存箇所差し替え）・TKT-0205（料理履歴）が乗る土台を作る。本チケットでは既存の表示箇所は変更しない。

## 実装メモ

- 依存元: `user-image.ts` の `createUserImageSignedUrl(client, path)`（失敗時 null）。これをラップする。
- データ構造:
  - `cache: Map<string, { url: string; expiresAt: number }>`（module-level）
  - `inflight: Map<string, Promise<string | null>>`（module-level）
- `getCachedUserImageSignedUrl(client, path, ttl = USER_IMAGE_SIGNED_URL_TTL_SECONDS)`:
  1. path 空 → null。
  2. cache ヒット & `expiresAt - now > SAFETY_MARGIN_MS`（例 5分）→ url 返却。
  3. inflight にあればそれを await。
  4. なければ `createUserImageSignedUrl` を呼び、成功なら cache に `expiresAt = now + ttl*1000` で保存。inflight は finally で除去。
- `invalidateUserImageSignedUrl(path)`: cache.delete(path)（inflight は触らない or 同時 delete）。
- `useCachedSignedUrls(client, paths)`: 既存 `use-recipe-image-urls.ts` の構造を踏襲（signatureKey で集合変化検知、active フラグで unmount 後の setState 防止）。返り値 `Map<path, url>`。
- テスト観点（vitest）: ①2回目はモック createSignedUrl が呼ばれない ②満了マージン経過で再発行 ③同一 path 並行呼び出しで createSignedUrl 1回 ④invalidate 後に再発行。

## 非対象

- 既存の表示コンポーネント・フックの差し替え（= TKT-0204 / TKT-0205）
- アップロード時の cacheControl 付与（= TKT-0206）
- DBスキーマ・RLS・auth・Storage バケット設定の変更

## 依存チケット

- なし（TKT-0204 / TKT-0205 の土台。TKT-0206 とは独立）
