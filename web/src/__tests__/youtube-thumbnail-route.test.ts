import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/youtube/thumbnail/route";

function request(videoId: string) {
  return new Request(`http://localhost/api/youtube/thumbnail?videoId=${encodeURIComponent(videoId)}`);
}

describe("GET /api/youtube/thumbnail", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("fetches only fixed YouTube thumbnail URLs and returns an image response", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(new Blob(["thumbnail"], { type: "image/jpeg" }), {
        headers: { "content-type": "image/jpeg", "content-length": "9" },
        status: 200
      })
    );

    const response = await GET(request("8Pat_Puc-ck"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(fetch).toHaveBeenCalledWith("https://img.youtube.com/vi/8Pat_Puc-ck/maxresdefault.jpg", { redirect: "error" });
  });

  it("tries the next fixed candidate when maxresdefault is missing", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response("", { status: 404 }))
      .mockResolvedValueOnce(
        new Response(new Blob(["thumbnail"], { type: "image/jpeg" }), {
          headers: { "content-type": "image/jpeg" },
          status: 200
        })
      );

    const response = await GET(request("8Pat_Puc-ck"));

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenNthCalledWith(1, "https://img.youtube.com/vi/8Pat_Puc-ck/maxresdefault.jpg", { redirect: "error" });
    expect(fetch).toHaveBeenNthCalledWith(2, "https://img.youtube.com/vi/8Pat_Puc-ck/sddefault.jpg", { redirect: "error" });
  });

  it("rejects invalid videoId without fetching", async () => {
    const response = await GET(request("https://example.com/image.jpg"));

    expect(response.status).toBe(422);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects non-image responses", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("<html></html>", {
        headers: { "content-type": "text/html" },
        status: 200
      })
    );

    const response = await GET(request("8Pat_Puc-ck"));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: expect.stringContaining("許可された画像形式")
    });
  });
});
