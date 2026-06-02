import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AiUsageMeter } from "@/components/ai-usage-meter";
import type { AiUsageSummary } from "@/lib/ai/usage";

function summary(overrides: Partial<AiUsageSummary> = {}): AiUsageSummary {
  return {
    ok: true,
    recipe_generation: { used: 1, limit: 20, remaining: 19 },
    ingredient_scan: { used: 1, limit: 10, remaining: 9 },
    total: { used: 2, limit: 30, remaining: 28 },
    ...overrides
  };
}

describe("AiUsageMeter (panel variant)", () => {
  it("renders nothing when summary is missing or not ok", () => {
    const { container, rerender } = render(<AiUsageMeter summary={null} />);
    expect(container.firstChild).toBeNull();

    rerender(<AiUsageMeter summary={summary({ ok: false })} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows per-feature and total remaining counts", () => {
    render(<AiUsageMeter summary={summary()} />);

    expect(screen.getByText("レシピ 19/20")).toBeTruthy();
    expect(screen.getByText("写真 9/10")).toBeTruthy();
    expect(screen.getByText("合計 28/30")).toBeTruthy();
  });

  it("shows the label in panel variant", () => {
    render(<AiUsageMeter summary={summary()} />);
    expect(screen.getByText("本日のAI残り")).toBeTruthy();
  });

  it("shows the feature-limit note when the highlighted feature is exhausted", () => {
    render(
      <AiUsageMeter
        summary={summary({ ingredient_scan: { used: 10, limit: 10, remaining: 0 } })}
        feature="ingredient_scan"
      />
    );

    expect(screen.getByText(/食材写真解析の上限に達しました/)).toBeTruthy();
  });

  it("prefers the total-limit note when the total is exhausted", () => {
    render(
      <AiUsageMeter
        summary={summary({ total: { used: 30, limit: 30, remaining: 0 } })}
        feature="recipe_generation"
      />
    );

    expect(screen.getByText(/本日のAI合計上限に達しました/)).toBeTruthy();
  });
});

describe("AiUsageMeter (statusbar variant)", () => {
  it("renders nothing when summary is missing or not ok", () => {
    const { container, rerender } = render(<AiUsageMeter summary={null} variant="statusbar" />);
    expect(container.firstChild).toBeNull();

    rerender(<AiUsageMeter summary={summary({ ok: false })} variant="statusbar" />);
    expect(container.firstChild).toBeNull();
  });

  it("shows 3 badges without label or note", () => {
    render(<AiUsageMeter summary={summary()} variant="statusbar" />);

    expect(screen.getByText("レシピ 19/20")).toBeTruthy();
    expect(screen.getByText("写真 9/10")).toBeTruthy();
    expect(screen.getByText("合計 28/30")).toBeTruthy();
    expect(screen.queryByText("本日のAI残り")).toBeNull();
    expect(screen.queryByText(/上限に達しました/)).toBeNull();
  });

  it("sets data-variant attribute to statusbar on root element", () => {
    const { container } = render(<AiUsageMeter summary={summary()} variant="statusbar" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.variant).toBe("statusbar");
  });

  it("does not show the exhaustion note even when exhausted", () => {
    render(
      <AiUsageMeter
        summary={summary({ total: { used: 30, limit: 30, remaining: 0 } })}
        feature="recipe_generation"
        variant="statusbar"
      />
    );

    expect(screen.queryByText(/上限に達しました/)).toBeNull();
  });
});
