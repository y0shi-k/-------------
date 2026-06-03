import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { SettingsPanel } from "@/components/settings-panel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    replace: vi.fn()
  })
}));

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) }
  })
}));

describe("SettingsPanel", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function renderPanel(onClose = vi.fn()) {
    render(<SettingsPanel userEmail="user@example.com" onClose={onClose} />);
    return { onClose };
  }

  it("renders the three settings sections", () => {
    renderPanel();

    expect(screen.getByRole("region", { name: "Gemini APIキー" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "本日のAI残り回数" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "アカウント" })).toBeTruthy();
    expect(screen.getByText("user@example.com")).toBeTruthy();
  });

  it("masks the API key input and persists it via the panel", () => {
    renderPanel();

    const input = screen.getByLabelText("ユーザー自身のAPIキー") as HTMLInputElement;
    expect(input.type).toBe("password");

    fireEvent.change(input, { target: { value: "user-owned-test-key" } });
    fireEvent.click(screen.getByRole("button", { name: "この端末に保存" }));

    expect(localStorage.getItem("stock-master:user-gemini-api-key")).toBe("user-owned-test-key");
    expect(input.value).toBe("user-owned-test-key");
  });

  it("renders the logout button and calls onClose from the back button", () => {
    const { onClose } = renderPanel();

    expect(screen.getByRole("button", { name: "ログアウト" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "戻る" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
