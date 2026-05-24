import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SetupStatus } from "@/components/setup-status";
import { setupSteps } from "@/lib/navigation";

describe("SetupStatus", () => {
  it("shows the bootstrap status steps", () => {
    render(<SetupStatus steps={setupSteps} />);

    expect(screen.getByRole("heading", { name: "Web版の準備状況" })).toBeTruthy();
    expect(screen.getByText("Web版の器")).toBeTruthy();
    expect(screen.getByText("Supabase接続")).toBeTruthy();
    expect(screen.getByText("自分だけログイン")).toBeTruthy();
    expect(screen.getByText("在庫と登録待ち")).toBeTruthy();
  });
});
