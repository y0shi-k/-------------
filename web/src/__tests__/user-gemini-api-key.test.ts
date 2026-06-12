import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  clearUserGeminiApiKey,
  clearUserPaidGeminiApiKey,
  loadUserGeminiApiKey,
  loadUserGeminiApiKeys,
  saveUserGeminiApiKey,
  saveUserPaidGeminiApiKey
} from "@/lib/ai/user-gemini-api-key";

describe("user-gemini-api-key", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("loads the legacy key as the free key", () => {
    localStorage.setItem("stock-master:user-gemini-api-key", "legacy-key");

    expect(loadUserGeminiApiKey()).toBe("legacy-key");
    expect(loadUserGeminiApiKeys()).toEqual({ free: "legacy-key", paid: "" });
  });

  it("saves and clears free and paid keys separately", () => {
    saveUserGeminiApiKey(" free-key ");
    saveUserPaidGeminiApiKey(" paid-key ");

    expect(localStorage.getItem("stock-master:user-gemini-api-key:free")).toBe("free-key");
    expect(localStorage.getItem("stock-master:user-gemini-api-key:paid")).toBe("paid-key");
    expect(loadUserGeminiApiKeys()).toEqual({ free: "free-key", paid: "paid-key" });

    clearUserPaidGeminiApiKey();
    expect(loadUserGeminiApiKeys()).toEqual({ free: "free-key", paid: "" });

    clearUserGeminiApiKey();
    expect(loadUserGeminiApiKeys()).toEqual({ free: "", paid: "" });
  });

  it("removes the legacy key when the free key is cleared", () => {
    localStorage.setItem("stock-master:user-gemini-api-key", "legacy-key");

    clearUserGeminiApiKey();

    expect(localStorage.getItem("stock-master:user-gemini-api-key")).toBeNull();
    expect(loadUserGeminiApiKey()).toBe("");
  });
});
