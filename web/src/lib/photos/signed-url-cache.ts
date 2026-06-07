"use client";

/**
 * 署名付きURLの共有キャッシュ（module スコープ）。
 *
 * 課題: 画像のあるページに遷移するたびコンポーネントが再マウントされ、署名URLを毎回新トークンで
 * 発行し直すため、ブラウザの画像キャッシュがミスして再ダウンロードが走っていた。
 *
 * 対策: path をキーに署名URL＋満了時刻を module スコープへ保持し、再マウントを越えて同一URLを返す。
 * 同一 path への並行解決は in-flight Promise dedup で1回の発行に集約する。
 *
 * - module-level のため SPA セッション内で全アンマウントを越えて保持される（`router.refresh()` でも生存）。
 *   フルリロードでリセットされるのは許容。
 * - path はコンテンツ識別子として安定（再アップロードは別 path）前提。
 * - 既存の署名ヘルパ `createUserImageSignedUrl` をラップする薄い層。Storage/RLS/auth は一切変更しない。
 */

import { useEffect, useState } from "react";
import {
  createUserImageSignedUrl,
  USER_IMAGE_SIGNED_URL_TTL_SECONDS,
  type SignedUrlCapableClient
} from "@/lib/photos/user-image";

/** 満了の何ミリ秒前から「期限切れ間近」とみなして再発行するか（既定: 5分）。 */
export const SIGNED_URL_SAFETY_MARGIN_MS = 5 * 60 * 1000;

type CacheEntry = { url: string; expiresAt: number };

// module-level（SPA セッション内で全アンマウントを越えて保持）。
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<string | null>>();

/** テスト用: キャッシュと in-flight をすべて破棄する。 */
export function __resetSignedUrlCacheForTest(): void {
  cache.clear();
  inflight.clear();
}

/**
 * path 単位でキャッシュした署名URLを返す。
 * - キャッシュヒットかつ満了マージン内なら再発行せずキャッシュ済みURLを返す。
 * - 解決中の同一 path があればその Promise を await（in-flight dedup）。
 * - 未キャッシュ/満了間近なら `createUserImageSignedUrl` で発行して保存する。
 * - path 空・発行失敗は null（呼び出し側はフォールバック表示）。
 */
export async function getCachedUserImageSignedUrl(
  client: SignedUrlCapableClient,
  storagePath: string | null | undefined,
  ttlSeconds: number = USER_IMAGE_SIGNED_URL_TTL_SECONDS
): Promise<string | null> {
  if (!storagePath) {
    return null;
  }

  const now = Date.now();
  const cached = cache.get(storagePath);
  if (cached && cached.expiresAt - now > SIGNED_URL_SAFETY_MARGIN_MS) {
    return cached.url;
  }

  const pending = inflight.get(storagePath);
  if (pending) {
    return pending;
  }

  const promise = (async () => {
    const url = await createUserImageSignedUrl(client, storagePath, ttlSeconds);
    if (url) {
      cache.set(storagePath, { url, expiresAt: Date.now() + ttlSeconds * 1000 });
    }
    return url;
  })().finally(() => {
    inflight.delete(storagePath);
  });

  inflight.set(storagePath, promise);
  return promise;
}

/** 指定 path のキャッシュエントリを破棄する（画像差し替え・削除時に呼ぶ）。 */
export function invalidateUserImageSignedUrl(storagePath: string | null | undefined): void {
  if (!storagePath) {
    return;
  }
  cache.delete(storagePath);
  inflight.delete(storagePath);
}

/**
 * 複数 path の署名URLを共有キャッシュ経由で解決し `Map<path, url>` を返す共有フック。
 * - paths 集合が変わったときだけ解決を走らせる（signatureKey 方式）。
 * - cleanup の active フラグで unmount 後の setState を防ぐ。
 * - 失敗した path は Map に載せない（呼び出し側がフォールバック）。
 */
export function useCachedSignedUrls(
  client: SignedUrlCapableClient,
  paths: Array<string | null | undefined>
): Map<string, string> {
  const [urls, setUrls] = useState<Map<string, string>>(() => new Map());

  // path 集合の変化のみを検知（重複・順序差を吸収するため一意化＋ソート）。
  const uniquePaths = Array.from(new Set(paths.filter((path): path is string => Boolean(path))));
  const signatureKey = [...uniquePaths].sort().join(",");

  useEffect(() => {
    let active = true;

    if (uniquePaths.length === 0) {
      setUrls(new Map());
      return () => {
        active = false;
      };
    }

    async function resolveAll() {
      const entries = await Promise.all(
        uniquePaths.map(async (path) => {
          const url = await getCachedUserImageSignedUrl(client, path);
          return url ? ([path, url] as const) : null;
        })
      );
      if (!active) return;
      setUrls(new Map(entries.filter((entry): entry is readonly [string, string] => entry !== null)));
    }

    void resolveAll();
    return () => {
      active = false;
    };
    // signatureKey が path 集合の変化を表す。client はメモ化済み参照。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatureKey, client]);

  return urls;
}
