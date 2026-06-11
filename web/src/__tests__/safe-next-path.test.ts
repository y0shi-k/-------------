import { describe, expect, it } from "vitest";
import { defaultNextPath, sanitizeNextPath } from "@/lib/auth/safe-next-path";

describe("sanitizeNextPath", () => {
  it("falls back to the default path for empty input", () => {
    expect(sanitizeNextPath(null)).toBe(defaultNextPath);
    expect(sanitizeNextPath(undefined)).toBe(defaultNextPath);
    expect(sanitizeNextPath("")).toBe(defaultNextPath);
  });

  it("allows relative paths starting with a single slash", () => {
    expect(sanitizeNextPath("/")).toBe("/");
    expect(sanitizeNextPath("/inventory")).toBe("/inventory");
    expect(sanitizeNextPath("/admin?tab=pending")).toBe("/admin?tab=pending");
  });

  it("rejects absolute URLs", () => {
    expect(sanitizeNextPath("https://evil.example.com")).toBe(defaultNextPath);
    expect(sanitizeNextPath("http://evil.example.com/path")).toBe(defaultNextPath);
  });

  it("rejects protocol-relative URLs", () => {
    expect(sanitizeNextPath("//evil.example.com")).toBe(defaultNextPath);
    expect(sanitizeNextPath("/\\evil.example.com")).toBe(defaultNextPath);
  });

  it("rejects values that do not start with a slash", () => {
    expect(sanitizeNextPath("evil.example.com")).toBe(defaultNextPath);
    expect(sanitizeNextPath("javascript:alert(1)")).toBe(defaultNextPath);
  });
});
