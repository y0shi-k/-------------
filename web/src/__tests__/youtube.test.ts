import { describe, expect, it } from "vitest";
import {
  buildYoutubeThumbnailCandidateUrls,
  extractYoutubeVideoId,
  findFirstYoutubeVideoId,
} from "@/lib/youtube";

// ---------------------------------------------------------------------------
// extractYoutubeVideoId — 正常系
// ---------------------------------------------------------------------------

describe("extractYoutubeVideoId: 正常系", () => {
  it("watch?v= 形式", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("watch?v= 形式（クエリが v= より前にある）", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("watch?v= 形式（si= などの追加クエリ付き）", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=abc123")).toBe("dQw4w9WgXcQ");
  });

  it("youtu.be/<id> 形式", () => {
    expect(extractYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("youtu.be/<id> 形式（si= クエリ付き）", () => {
    expect(extractYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ?si=abc123")).toBe("dQw4w9WgXcQ");
  });

  it("shorts/<id> 形式", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("shorts/<id> 形式（末尾スラッシュ付き）", () => {
    // URL パースで末尾スラッシュはパスに含まれるが id 取得には影響しない
    expect(extractYoutubeVideoId("https://www.youtube.com/shorts/dQw4w9WgXcQ/")).toBe("dQw4w9WgXcQ");
  });

  it("embed/<id> 形式", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("m.youtube.com ホスト（モバイル）", () => {
    expect(extractYoutubeVideoId("https://m.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("music.youtube.com ホスト", () => {
    expect(extractYoutubeVideoId("https://music.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("youtube.com（www なし）", () => {
    expect(extractYoutubeVideoId("https://youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("videoId にアンダースコア・ハイフンが含まれる（有効文字）", () => {
    // abc-_efg123 は11文字（A-Za-z0-9_- で構成）
    expect(extractYoutubeVideoId("https://www.youtube.com/watch?v=abc-_efg123")).toBe("abc-_efg123");
  });

  it("前後に空白がある URL でも抽出できる", () => {
    expect(extractYoutubeVideoId("  https://youtu.be/dQw4w9WgXcQ  ")).toBe("dQw4w9WgXcQ");
  });
});

// ---------------------------------------------------------------------------
// extractYoutubeVideoId — 異常系
// ---------------------------------------------------------------------------

describe("extractYoutubeVideoId: 異常系", () => {
  it("非 YouTube ドメインは null", () => {
    expect(extractYoutubeVideoId("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
  });

  it("偽装ドメイン evil-youtube.com は null", () => {
    expect(extractYoutubeVideoId("https://evil-youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
  });

  it("サブドメイン偽装 fake.youtube.com は null（ALLOWED_HOSTS 完全一致）", () => {
    expect(extractYoutubeVideoId("https://fake.youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
  });

  it("11文字未満の videoId は null", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/watch?v=short")).toBeNull();
  });

  it("11文字超の videoId は null", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/watch?v=toolongid123")).toBeNull();
  });

  it("videoId に無効文字（!）が含まれる場合は null", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgX!Q")).toBeNull();
  });

  it("v= クエリが無い watch URL は null", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/watch")).toBeNull();
  });

  it("非 URL 文字列は null", () => {
    expect(extractYoutubeVideoId("not a url")).toBeNull();
  });

  it("空文字は null", () => {
    expect(extractYoutubeVideoId("")).toBeNull();
  });

  it("YouTube トップページ URL（videoId なし）は null", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/")).toBeNull();
  });

  it("channel URL は null", () => {
    expect(extractYoutubeVideoId("https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw")).toBeNull();
  });

  it("http（非 https）の youtu.be も null ではなく正常抽出できる", () => {
    // プロトコルは ALLOWED_HOSTS チェック対象外のため http でも抽出できる
    expect(extractYoutubeVideoId("http://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
});

// ---------------------------------------------------------------------------
// findFirstYoutubeVideoId — 複数行テキスト（recipes.source 形式）
// ---------------------------------------------------------------------------

describe("findFirstYoutubeVideoId: 複数行テキスト", () => {
  it("1行だけ YouTube URL がある場合はその videoId を返す", () => {
    const source = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    expect(findFirstYoutubeVideoId(source)).toBe("dQw4w9WgXcQ");
  });

  it("複数行に YouTube URL があるとき最初の videoId を返す", () => {
    // どちらも11文字の有効 videoId
    const source = [
      "https://www.youtube.com/watch?v=FIRSTVIDEO1",
      "https://www.youtube.com/watch?v=SECONDVIDE0",
    ].join("\n");
    expect(findFirstYoutubeVideoId(source)).toBe("FIRSTVIDEO1");
  });

  it("非 URL 行が混在していても YouTube URL 行の videoId を返す", () => {
    const source = [
      "参考にしたレシピ",
      "https://example.com/recipe/123",
      "https://youtu.be/dQw4w9WgXcQ",
    ].join("\n");
    expect(findFirstYoutubeVideoId(source)).toBe("dQw4w9WgXcQ");
  });

  it("非 URL 行が先頭にあっても正しく取れる", () => {
    const source = [
      "クックパッド参照",
      "https://www.youtube.com/shorts/dQw4w9WgXcQ",
    ].join("\n");
    expect(findFirstYoutubeVideoId(source)).toBe("dQw4w9WgXcQ");
  });

  it("YouTube URL が一つもない場合は null を返す", () => {
    const source = [
      "参考レシピ",
      "https://example.com/recipe",
    ].join("\n");
    expect(findFirstYoutubeVideoId(source)).toBeNull();
  });

  it("空文字は null を返す", () => {
    expect(findFirstYoutubeVideoId("")).toBeNull();
  });

  it("空行のみのテキストは null を返す", () => {
    expect(findFirstYoutubeVideoId("\n\n\n")).toBeNull();
  });
});

describe("buildYoutubeThumbnailCandidateUrls", () => {
  it("有効な videoId から固定ホスト・固定パスの候補URLを返す", () => {
    const candidates = buildYoutubeThumbnailCandidateUrls("dQw4w9WgXcQ");

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]).toBe("https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg");
    for (const candidate of candidates) {
      const url = new URL(candidate);
      expect(url.hostname).toBe("img.youtube.com");
      expect(url.pathname).toMatch(/^\/vi\/dQw4w9WgXcQ\/(?:maxresdefault|sddefault|hqdefault|mqdefault)\.jpg$/);
    }
  });

  it("無効な videoId は候補URLを返さない", () => {
    expect(buildYoutubeThumbnailCandidateUrls("https://example.com/image.jpg")).toEqual([]);
    expect(buildYoutubeThumbnailCandidateUrls("short")).toEqual([]);
  });
});
