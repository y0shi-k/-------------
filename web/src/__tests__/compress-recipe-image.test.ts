import { describe, expect, it } from "vitest";
import { imageExtensionFromContentType } from "@/lib/photos/compress";

describe("imageExtensionFromContentType", () => {
  it("WebP は webp 拡張子", () => {
    expect(imageExtensionFromContentType("image/webp")).toBe("webp");
  });

  it("WebP 以外（JPEG フォールバック）は jpg 拡張子", () => {
    expect(imageExtensionFromContentType("image/jpeg")).toBe("jpg");
    expect(imageExtensionFromContentType("image/png")).toBe("jpg");
  });
});
