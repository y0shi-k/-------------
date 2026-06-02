import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { WebModeShell, useShellAiUsage } from "@/components/web-mode-shell";

const rpc = vi.fn();

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({ rpc })
}));

function renderShell() {
  return render(
    <WebModeShell
      childrenByMode={{
        ingredients: <div>食材管理の中身</div>,
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

  it("starts from the ingredient mode and shows a persistent status", async () => {
    await act(async () => {
      renderShell();
    });

    expect(screen.getByRole("heading", { name: "料理レシピ・食材管理" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("食材管理");
    expect(screen.getAllByText("在庫 5件").length).toBeGreaterThan(0);
    expect(screen.getByText("食材管理の中身")).toBeTruthy();
    expect(screen.queryByText("献立レシピの中身")).toBeNull();
  });

  it("switches between the three Canvas-style modes", async () => {
    await act(async () => {
      renderShell();
    });

    fireEvent.click(screen.getAllByRole("button", { name: /献立/ })[0]);
    expect(screen.getByRole("status").textContent).toContain("献立・レシピ");
    expect(screen.getByText("献立レシピの中身")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: /記録/ })[0]);
    expect(screen.getByRole("status").textContent).toContain("料理・記録");
    expect(screen.getByText("料理記録の中身")).toBeTruthy();
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
    expect(await screen.findByText("合計 27/30")).toBeTruthy();
    expect(await screen.findByText("レシピ 18/20")).toBeTruthy();
    expect(await screen.findByText("写真 9/10")).toBeTruthy();
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
