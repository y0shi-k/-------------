# TKT-0203 実装レポート

## 結論

画像署名URLを path 単位で module スコープにキャッシュする共有基盤 `web/src/lib/photos/signed-url-cache.ts` を新設した。コンポーネント再マウント（モード往復）を越えて同一 path に同一URLを返すため、再ダウンロードの根本原因（毎回新トークン発行）を断つ土台ができた。本チケットでは既存の表示箇所は変更していない（差し替えは TKT-0204）。

## 変更内容

- `getCachedUserImageSignedUrl(client, path, ttl?)`: path→{url, expiresAt} の module-level キャッシュ。満了マージン（既定5分）内ならキャッシュ済みURLを返し、満了間近/未キャッシュのみ `createUserImageSignedUrl` で再発行して保存する。
- in-flight Promise dedup: 同一 path の解決中 Promise を Map に保持し、並行呼び出しを1回の `createSignedUrl` に集約する（finally で除去）。
- `invalidateUserImageSignedUrl(path)`: 該当 path のキャッシュ・in-flight エントリを破棄する。
- `useCachedSignedUrls(client, paths)`: paths 集合が変わったときだけ解決を走らせ `Map<path, url>` を返す共有フック（既存 `use-recipe-image-urls` の signatureKey 方式＋active フラグを踏襲）。
- `__resetSignedUrlCacheForTest()`: テスト分離用にキャッシュ・in-flight を全破棄する。
- 既存の `createUserImageSignedUrl` / `USER_IMAGE_SIGNED_URL_TTL_SECONDS`（`user-image.ts`）を再利用する薄いラッパ層として実装。

## 変更ファイル

- `web/src/lib/photos/signed-url-cache.ts`（新規）
- `web/src/lib/photos/__tests__/signed-url-cache.test.ts`（新規）
- `project-os/artifacts/TKT-0203-signed-url-cache-foundation/verify.json`
- `project-os/artifacts/TKT-0203-signed-url-cache-foundation/report.md`

## テスト観点（vitest・5件 pass）

- path 空 → null、`createSignedUrl` を呼ばない
- キャッシュヒット: 2回目は `createSignedUrl` を呼ばず同一URLを返す
- 満了マージン経過で再発行する（fake timers）
- in-flight dedup: 並行3呼び出しで `createSignedUrl` は1回のみ
- invalidate 後は再発行する

## セキュリティ / eval 注記

- 【非危険】読み取り側の署名URL再利用のみ。DBスキーマ / RLS / auth / アップロード経路 / バケット公開設定は一切変更していない。
- `photo_upload_storage` eval が `image|画像` / `Storage` 語彙で過剰マッチしうるが、**実Storage・公開設定・RLSは無変更**（backlog 0f/0a と同方針の report 記録運用）。
- service role key はブラウザで使わない。APIキー・秘密鍵の追加・直書きなし。GAS/Spreadsheet/Drive 依存の追加なし。
- キャッシュは module-level（SPA セッション内で保持、`router.refresh()` でも生存、フルリロードでリセット＝許容）。

## 確認結果

- `npm run lint`: pass（既存警告 `web/src/lib/format/quantity-notation.ts:75` のみ残存・本変更と無関係）
- `npm run typecheck`: pass
- `npm run test`: pass（36 files / 301 tests）
- `npm run build`: pass
- `bash harness/bin/verify_web.sh TKT-0203-signed-url-cache-foundation`: VERIFY_PASSED（policy 全 pass）
