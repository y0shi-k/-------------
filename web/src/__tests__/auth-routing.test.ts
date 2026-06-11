import { describe, expect, it } from "vitest";
import { getAuthRedirectPath, isPublicPath } from "@/lib/auth/routing";

describe("auth routing — unauthenticated", () => {
  it("sends signed-out users to login for protected pages", () => {
    expect(getAuthRedirectPath("/", "unauthenticated")).toBe("/login");
  });

  it("still protects non-public pages for signed-out users", () => {
    expect(getAuthRedirectPath("/inventory", "unauthenticated")).toBe("/login");
  });

  it("keeps signed-out users on the login page", () => {
    expect(getAuthRedirectPath("/login", "unauthenticated")).toBeNull();
  });

  it("lets signed-out users reach the signup page", () => {
    expect(getAuthRedirectPath("/signup", "unauthenticated")).toBeNull();
  });

  it("lets signed-out users reach the auth confirm route", () => {
    expect(getAuthRedirectPath("/auth/confirm", "unauthenticated")).toBeNull();
  });

  it("lets signed-out users reach the forgot-password page", () => {
    expect(getAuthRedirectPath("/forgot-password", "unauthenticated")).toBeNull();
  });

  it("sends signed-out users away from the reset-password page (no recovery session)", () => {
    expect(getAuthRedirectPath("/reset-password", "unauthenticated")).toBe("/login");
  });

  it("sends signed-out users away from the pending page", () => {
    expect(getAuthRedirectPath("/pending", "unauthenticated")).toBe("/login");
  });
});

describe("auth routing — approved", () => {
  it("sends approved users away from the login page", () => {
    expect(getAuthRedirectPath("/login", "approved")).toBe("/");
  });

  it("sends approved users away from the signup page", () => {
    expect(getAuthRedirectPath("/signup", "approved")).toBe("/");
  });

  it("sends approved users away from the pending page", () => {
    expect(getAuthRedirectPath("/pending", "approved")).toBe("/");
  });

  it("does not interfere with approved users on data pages", () => {
    expect(getAuthRedirectPath("/", "approved")).toBeNull();
    expect(getAuthRedirectPath("/inventory", "approved")).toBeNull();
  });

  it("does not interfere with approved users on the auth confirm route", () => {
    expect(getAuthRedirectPath("/auth/confirm", "approved")).toBeNull();
  });

  it("lets approved users reach the reset-password page", () => {
    expect(getAuthRedirectPath("/reset-password", "approved")).toBeNull();
  });

  // forgot-password は公開パスのため middleware では素通し（approved の本人離脱はページ側 redirect で担保）。
  it("does not redirect approved users away from forgot-password at the middleware level", () => {
    expect(getAuthRedirectPath("/forgot-password", "approved")).toBeNull();
  });
});

describe.each(["pending", "disabled"] as const)("auth routing — %s", (state) => {
  it("keeps the user on the pending page", () => {
    expect(getAuthRedirectPath("/pending", state)).toBeNull();
  });

  it("locks data pages to /pending", () => {
    expect(getAuthRedirectPath("/", state)).toBe("/pending");
    expect(getAuthRedirectPath("/inventory", state)).toBe("/pending");
  });

  it("locks the api routes to /pending", () => {
    expect(getAuthRedirectPath("/api/ai/recipes", state)).toBe("/pending");
  });

  it("does not let the user back into login or signup", () => {
    expect(getAuthRedirectPath("/login", state)).toBe("/pending");
    expect(getAuthRedirectPath("/signup", state)).toBe("/pending");
  });

  it("still allows the auth confirm route (email links)", () => {
    expect(getAuthRedirectPath("/auth/confirm", state)).toBeNull();
    expect(getAuthRedirectPath("/auth", state)).toBeNull();
  });

  // recovery セッションでログイン状態の未承認ユーザーもパスワード再設定に到達できる必要がある。
  it("allows reaching the reset-password page (recovery session)", () => {
    expect(getAuthRedirectPath("/reset-password", state)).toBeNull();
  });

  // forgot-password はログイン済み未承認では /pending に固定する（再設定は recovery セッションで /reset-password を使う）。
  it("locks the forgot-password page to /pending", () => {
    expect(getAuthRedirectPath("/forgot-password", state)).toBe("/pending");
  });
});

describe("isPublicPath", () => {
  it("treats login, signup, forgot-password and auth routes as public", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/signup")).toBe(true);
    expect(isPublicPath("/forgot-password")).toBe(true);
    expect(isPublicPath("/auth")).toBe(true);
    expect(isPublicPath("/auth/confirm")).toBe(true);
  });

  it("treats reset-password, data pages and pending as non-public", () => {
    expect(isPublicPath("/reset-password")).toBe(false);
    expect(isPublicPath("/")).toBe(false);
    expect(isPublicPath("/inventory")).toBe(false);
    expect(isPublicPath("/pending")).toBe(false);
  });
});
