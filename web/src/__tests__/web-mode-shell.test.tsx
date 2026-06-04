import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { WebModeShell, useShellAiUsage, useShellSubView } from "@/components/web-mode-shell";

const rpc = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    replace: vi.fn()
  })
}));

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({ rpc })
}));

function SubViewProbe() {
  const { activeDesktopTarget, selectedSubViews } = useShellSubView();
  const target =
    activeDesktopTarget.kind === "mode"
      ? `${activeDesktopTarget.group}:${activeDesktopTarget.leaf}`
      : activeDesktopTarget.kind;

  return (
    <output aria-label="shell-subview">
      {target}|{selectedSubViews.ingredients}|{selectedSubViews.recipes}|{selectedSubViews.cooking}
    </output>
  );
}

function renderShell(options?: { withSubViewProbe?: boolean; home?: ReactNode }) {
  return render(
    <WebModeShell
      home={options?.home}
      childrenByMode={{
        ingredients: (
          <div>
            食材管理の中身
            {options?.withSubViewProbe ? <SubViewProbe /> : null}
          </div>
        ),
        recipes: <div>献立レシピの中身</div>,
        cooking: <div>料理記録の中身</div>
      }}
      historyCount={3}
      inventoryCount={5}
      mealCount={2}
      recipeCount={4}
      userEmail="user@example.com"
    />
  );
}

describe("WebModeShell", () => {
  beforeEach(() => {
    rpc.mockReset();
    rpc.mockResolvedValue({ data: { ok: false }, error: null });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts from the ingredient mode and shows a persistent status", async () => {
    await act(async () => {
      renderShell();
    });

    expect(screen.getByRole("heading", { name: "料理レシピ・食材管理" })).toBeTruthy();
    expect(screen.getAllByRole("status")[0].textContent).toContain("食材管理");
    expect(screen.getAllByText("在庫 5件").length).toBeGreaterThan(0);
    expect(screen.getByText("食材管理の中身")).toBeTruthy();
    expect(screen.queryByText("献立レシピの中身")).toBeNull();
  });

  it("switches between the three Canvas-style modes", async () => {
    await act(async () => {
      renderShell();
    });

    fireEvent.click(screen.getAllByRole("button", { name: /献立/ })[0]);
    expect(screen.getAllByRole("status")[0].textContent).toContain("献立・レシピ");
    expect(screen.getByText("献立レシピの中身")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: /記録/ })[0]);
    expect(screen.getAllByRole("status")[0].textContent).toContain("料理・記録");
    expect(screen.getByText("料理記録の中身")).toBeTruthy();
  });

  it("renders the desktop sidebar tree and topbar frame", async () => {
    await act(async () => {
      renderShell();
    });

    expect(screen.getByRole("complementary", { name: "PC主ナビ" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /ホーム/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /設定/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /在庫一覧/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /買い物リスト/ })).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /レシピ/ }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /献立スケジュール/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /カレンダー/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /タイムライン/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /インサイト/ })).toBeTruthy();
    expect(screen.getByRole("searchbox", { name: "検索スロット" })).toBeTruthy();
    expect(screen.getAllByText("user@example.com").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "ログアウト" }).length).toBeGreaterThan(0);
  });

  it("keeps selected group and leaf state for future subview wiring", async () => {
    await act(async () => {
      renderShell({ withSubViewProbe: true });
    });

    expect(screen.getByLabelText("shell-subview").textContent).toBe("ingredients:inventory|inventory|recipes|timeline");

    fireEvent.click(screen.getByRole("button", { name: /買い物リスト/ }));
    expect(screen.getByLabelText("shell-subview").textContent).toBe("ingredients:shopping|shopping|recipes|timeline");

    fireEvent.click(screen.getByRole("button", { name: /献立スケジュール/ }));
    expect(screen.getByText("献立レシピの中身")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: /^食材管理$/ })[0]);
    expect(screen.getByLabelText("shell-subview").textContent).toBe("ingredients:inventory|inventory|schedule|timeline");
  });

  it("opens the settings screen from the desktop gear with all three sections", async () => {
    await act(async () => {
      renderShell();
    });

    fireEvent.click(screen.getByRole("button", { name: /設定/ }));

    expect(screen.getByRole("region", { name: "Gemini APIキー設定" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "本日のAI残り回数" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "アカウント" })).toBeTruthy();
    expect(screen.getByLabelText("ユーザー自身のAPIキー")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "ログアウト" }).length).toBeGreaterThan(0);
    // ボードはアンマウントされ設定だけが描画される
    expect(screen.queryByText("食材管理の中身")).toBeNull();
  });

  it("lands on the home dashboard on desktop width (>=1024px)", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("min-width: 1024px"),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    );

    await act(async () => {
      renderShell({ home: <div>ホームの中身</div> });
    });

    await waitFor(() => {
      expect(screen.getByText("ホームの中身")).toBeTruthy();
    });
    expect(screen.getAllByRole("status")[0].textContent).toContain("ホーム");
    // ホーム表示中はモードボードを描画しない
    expect(screen.queryByText("食材管理の中身")).toBeNull();
  });

  it("shows the home content when the home nav button is clicked", async () => {
    await act(async () => {
      renderShell({ home: <div>ホームの中身</div> });
    });

    // matchMedia 未定義（スマホ相当）なので初期は食材管理
    expect(screen.getByText("食材管理の中身")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /ホーム/ }));
    expect(screen.getByText("ホームの中身")).toBeTruthy();
    expect(screen.queryByText("食材管理の中身")).toBeNull();
  });

  it("opens settings from the mobile status-bar account entry", async () => {
    await act(async () => {
      renderShell();
    });

    fireEvent.click(screen.getByRole("button", { name: "user@example.com" }));

    expect(screen.getByRole("region", { name: "Gemini APIキー設定" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "アカウント" })).toBeTruthy();
  });

  it("fetches AI usage summary on mount and renders statusbar meter when ok", async () => {
    rpc.mockResolvedValue({
      data: {
        ok: true,
        recipe_generation: { used: 2, limit: 20, remaining: 18 },
        ingredient_scan: { used: 1, limit: 10, remaining: 9 },
        total: { used: 3, limit: 30, remaining: 27 }
      },
      error: null
    });

    renderShell();

    await waitFor(() => {
      expect(rpc).toHaveBeenCalledWith("get_ai_usage_summary");
    });
    await screen.findAllByText("合計 27/30");
    expect(screen.getAllByText("合計 27/30").length).toBeGreaterThan(0);
    expect(screen.getAllByText("レシピ 18/20").length).toBeGreaterThan(0);
    expect(screen.getAllByText("写真 9/10").length).toBeGreaterThan(0);
  });

  it("renders nothing in statusbar meter when summary fetch fails", async () => {
    rpc.mockResolvedValue({ data: null, error: new Error("rpc error") });

    renderShell();

    await waitFor(() => {
      expect(rpc).toHaveBeenCalledWith("get_ai_usage_summary");
    });
    // ok: false なのでメーターは描画されない
    expect(screen.queryByText(/合計 /)).toBeNull();
  });
});

// useShellAiUsage がデフォルト値（null / noop）を安全に返すことを検証する
describe("useShellAiUsage (outside Provider)", () => {
  it("returns null summary and noop refreshAiUsage without crashing", () => {
    let captured: ReturnType<typeof useShellAiUsage> | undefined;

    function Probe() {
      captured = useShellAiUsage();
      return null;
    }

    render(<Probe />);
    expect(captured?.aiUsageSummary).toBeNull();
    expect(typeof captured?.refreshAiUsage).toBe("function");
    // noop を呼んでもエラーにならない
    expect(() => void captured?.refreshAiUsage()).not.toThrow();
  });
});
