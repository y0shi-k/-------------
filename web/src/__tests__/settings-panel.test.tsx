import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { SettingsPanel } from "@/components/settings-panel";
import { setUserSynonymGroups } from "@/lib/ingredients/name-match";

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

  afterEach(() => {
    localStorage.clear();
    // name-match のモジュール状態を初期化して次のテストに漏らさない
    setUserSynonymGroups([]);
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

  it("renders the synonym dictionary section", () => {
    renderPanel();

    expect(
      screen.getByRole("region", { name: "食材名の同義語辞書" })
    ).toBeTruthy();
    expect(
      screen.getByRole("textbox", { name: "ユーザー同義語辞書" })
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "保存" })).toBeTruthy();
  });

  it("入力して保存ボタンを押すと localStorage に JSON が保存される", () => {
    renderPanel();

    const textarea = screen.getByRole("textbox", {
      name: "ユーザー同義語辞書",
    }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "かしわ＝鶏肉" } });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    const raw = localStorage.getItem("stock-master:user-synonym-groups:v1");
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw!)).toEqual([["かしわ", "鶏肉"]]);
  });

  it("保存後にフィードバックメッセージが表示される", () => {
    renderPanel();

    const textarea = screen.getByRole("textbox", {
      name: "ユーザー同義語辞書",
    }) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "A＝B\n1語のみ" } });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));

    // 有効グループ1件（「1語のみ」は2語未満で無視）
    expect(
      screen.getByText("1 グループを保存しました（無効な行は無視）")
    ).toBeTruthy();
  });
});
