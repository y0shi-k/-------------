---
id: SPEC-0203-signed-url-cache
title: 画像署名URLの共有キャッシュ化（ページ遷移での再読み込み解消）
status: draft
scope:
  - 非公開 `photos` バケットのユーザー画像（レシピ・食材・料理記録の完成写真）の表示
  - 署名付きURL（`createSignedUrl`）の発行・再利用・無効化
  - レシピ/食材/料理候補/料理履歴の画像を表示する各クライアントコンポーネント
constraints:
  - 触らない範囲: DBスキーマ・RLS policy・認証・AIサーバーroute・CSV移行
  - 写真Storageの公開/非公開設定・バケット構成は変更しない（非公開 `photos` のまま）
  - Canvas版 `app.html` は凍結・参照専用（編集しない）
  - 個人データ・写真を扱うため、ログイン必須・Supabase RLS・Storage非公開・APIキー非露出を守る
acceptance:
  - 食材⇄献立⇄記録のモード往復で、同じ画像が同一署名URL文字列で再表示され、DevTools Network で画像が再リクエストされない（disk/memory cache から出る）
  - 署名URLは満了マージン内ならキャッシュから再利用され、満了が近い/過ぎた path のみ再発行される
  - 画像差し替え・削除時は対象 path のキャッシュが無効化され、古いURLを表示し続けない
  - `router.refresh()` 後も料理履歴の完成写真が再ダウンロードされない（T3 範囲）
  - 既存の表示フォールバック（署名失敗→固定デモ画像→頭文字プレースホルダ）が従来どおり動く
related_tickets:
  - TKT-0203-signed-url-cache-foundation
  - TKT-0204-signed-url-cache-adoption
  - TKT-0205-cooking-history-client-signing
  - TKT-0206-upload-cache-control
---

# Summary

画像のあるページ（食材一覧・レシピ・料理記録）へ遷移するたびに画像読み込みが走りチラつく問題を、
**path 単位で署名URLを共有キャッシュし、同一URL文字列を再利用する**ことで解消する正本。
reviewer はこの spec と各 TKT の artifacts だけで達成可否を判断できる。

## 背景

現状の2つの要因が重なり、再マウントのたびに画像が再ダウンロードされる:

1. **モード切替でアンマウントされる** — `web/src/components/web-mode-shell.tsx`（`{activeChildren}` のみ描画）は
   非アクティブモードをアンマウントする。再表示で再マウントされ、署名URLを発行する `useEffect`
   （`use-recipe-image-urls.ts` / `use-cooking-photo-candidates.ts` / `inventory-board.tsx` の食材画像 effect）が再実行される。
2. **署名URLが毎回新トークン** — `createUserImageSignedUrl`（`web/src/lib/photos/user-image.ts`）が毎回
   `createSignedUrl` を叩き、URL文字列が変わる。ブラウザの画像キャッシュキーは URL なので、同じ画像でも
   キャッシュミス＝再ダウンロードになる。署名URLをまたいで保持するキャッシュ層は存在しない。

アップロードは `cacheControl` 未指定（Supabase既定3600秒）のため、**URLさえ安定すれば1時間はブラウザキャッシュが効く**。
よって核心は「同一 path に対して同一URL文字列を再利用する共有キャッシュ」。

## 仕様

- **共有キャッシュ（TKT-0203）**: module スコープの `Map<path, { url; expiresAt }>` と in-flight `Map<path, Promise>`
  （同時マウント時の stampede 防止）。`getCachedUserImageSignedUrl(client, path)` は満了マージン内ならキャッシュ返却、
  そうでなければ `createUserImageSignedUrl` で発行し保存。`invalidateUserImageSignedUrl(path)` で破棄。
  共有 React フック `useCachedSignedUrls(client, paths)` が `Map<path,url>` を返す。
- **既存箇所の差し替え（TKT-0204）**: recipe/ingredient/cooking候補 の署名URL生成をキャッシュ経由に統一し、
  画像差し替え/削除フローで対象 path を invalidate。
- **料理履歴のクライアント署名化（TKT-0205）**: `page.tsx` のサーバ署名依存をやめ、`storage_path` を渡して
  クライアントの共有キャッシュで解決。`router.refresh()` 後の再DLも解消。
- **アップロード cacheControl（TKT-0206・危険変更）**: content-addressed path 前提で `cacheControl` を長め＋immutable 相当にし、
  ブラウザHTTPキャッシュ寿命を延ばす。既存オブジェクトには遡及しない。

- プロジェクト名: Stock Master（料理レシピ・食材管理アプリ）
- 現役正本（編集対象）: `web/`, `supabase/`, `scripts/`
- Canvas版 `app.html` / `要件定義書.md` は凍結・参照専用（編集しない）
- verify: `/verify`（= `harness/bin/verify_web.sh`）
- Web版ポリシー: GAS/Spreadsheet/Driveを使わず、Next.js + Supabase + Vercelで実装。APIキー・秘密鍵は環境変数で管理し、service role key をブラウザで使わない。

## 非対象

- DBスキーマ・RLS policy・認証・AIサーバーroute・CSV移行の変更
- 写真Storageの公開化・バケット構成変更（非公開 `photos` のまま）
- next/image への全面移行や画像最適化基盤の刷新
- アップロードUI・撮影/圧縮フロー自体の変更（TKT-0206 は cacheControl 付与のみ）

## Acceptance Example

- `project-os/artifacts/TKT-0203/` の vitest 結果で、キャッシュヒット/満了再発行/in-flight dedup/invalidate が検証されている
- `project-os/artifacts/TKT-0204/`・`TKT-0205/` の report に、モード往復・router.refresh で画像が再リクエストされない手動確認結果が記録されている
- TKT-0206（危険変更）は manual-smokes.md / review.md で「非公開バケットのまま」「撮影→保存→表示が回る」ことが確認されている
