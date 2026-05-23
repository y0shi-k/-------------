import { describe, expect, it } from "vitest";
import { getAuthRedirectPath } from "@/lib/auth/routing";

describe("auth routing", () => {
  it("sends signed-out users to login for protected pages", () => {
    expect(getAuthRedirectPath("/", false)).toBe("/login");
  });

  it("keeps signed-out users on the login page", () => {
    expect(getAuthRedirectPath("/login", false)).toBeNull();
  });

  it("sends signed-in users away from the login page", () => {
    expect(getAuthRedirectPath("/login", true)).toBe("/");
  });
});
