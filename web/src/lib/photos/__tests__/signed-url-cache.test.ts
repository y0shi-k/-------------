import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetSignedUrlCacheForTest,
  getCachedUserImageSignedUrl,
  invalidateUserImageSignedUrl
} from "@/lib/photos/signed-url-cache";
import { USER_IMAGE_SIGNED_URL_TTL_SECONDS } from "@/lib/photos/user-image";

/** createSignedUrl 呼び出し回数を数えられるモッククライアントを作る。 */
function makeClient() {
  const createSignedUrl = vi.fn(async (path: string) => ({
    data: { signedUrl: `https://signed.example/${path}?token=${Math.random()}` }
  }));
  const client = {
    storage: {
      from: () => ({ createSignedUrl })
    }
  };
  return { client, createSignedUrl };
}

describe("getCachedUserImageSignedUrl", () => {
  beforeEach(() => {
    __resetSignedUrlCacheForTest();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("path 空なら null を返し createSignedUrl を呼ばない", async () => {
    const { client, createSignedUrl } = makeClient();

    expect(await getCachedUserImageSignedUrl(client, "")).toBeNull();
    expect(await getCachedUserImageSignedUrl(client, null)).toBeNull();
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it("キャッシュヒット: 2回目は createSignedUrl を呼ばず同一URLを返す", async () => {
    const { client, createSignedUrl } = makeClient();

    const first = await getCachedUserImageSignedUrl(client, "user/a.jpg");
    const second = await getCachedUserImageSignedUrl(client, "user/a.jpg");

    expect(createSignedUrl).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it("満了マージン経過で再発行する", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-07T00:00:00Z"));
    const { client, createSignedUrl } = makeClient();

    const first = await getCachedUserImageSignedUrl(client, "user/a.jpg");

    // TTL の満了5分前を越えて時間を進める（TTL - 4分）。
    vi.setSystemTime(new Date(Date.now() + (USER_IMAGE_SIGNED_URL_TTL_SECONDS - 4 * 60) * 1000));
    const second = await getCachedUserImageSignedUrl(client, "user/a.jpg");

    expect(createSignedUrl).toHaveBeenCalledTimes(2);
    expect(second).not.toBe(first);
  });

  it("in-flight dedup: 同一 path の並行呼び出しは createSignedUrl 1回に集約する", async () => {
    const { client, createSignedUrl } = makeClient();

    const [a, b, c] = await Promise.all([
      getCachedUserImageSignedUrl(client, "user/a.jpg"),
      getCachedUserImageSignedUrl(client, "user/a.jpg"),
      getCachedUserImageSignedUrl(client, "user/a.jpg")
    ]);

    expect(createSignedUrl).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  it("invalidate 後は再発行する", async () => {
    const { client, createSignedUrl } = makeClient();

    const first = await getCachedUserImageSignedUrl(client, "user/a.jpg");
    invalidateUserImageSignedUrl("user/a.jpg");
    const second = await getCachedUserImageSignedUrl(client, "user/a.jpg");

    expect(createSignedUrl).toHaveBeenCalledTimes(2);
    expect(second).not.toBe(first);
  });
});
