import { describe, expect, it } from "vitest";
import { getPendingContent } from "@/lib/auth/pending-content";

describe("getPendingContent", () => {
  it("shows a waiting-for-approval message for pending", () => {
    const content = getPendingContent("pending");
    expect(content.title).toBe("承認待ち");
    expect(content.lead).toContain("承認");
  });

  it("shows a disabled message for disabled", () => {
    const content = getPendingContent("disabled");
    expect(content.title).toBe("利用停止中");
    expect(content.lead).toContain("利用できません");
  });

  it("falls back to the neutral pending message for approved", () => {
    const content = getPendingContent("approved");
    expect(content.title).toBe("承認待ち");
  });
});
