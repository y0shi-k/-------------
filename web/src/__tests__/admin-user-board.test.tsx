import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminUserBoard } from "@/components/admin-user-board";
import { buildStatusUpdate } from "@/lib/auth/admin-profiles";
import type { AdminProfile } from "@/lib/auth/admin-profiles";

// profiles.update().eq() をモックする。update に渡る列を検証できるよう update を expose する。
const updateMock = vi.fn();
const eqMock = vi.fn();

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({
    from: () => ({
      update: (...args: unknown[]) => {
        updateMock(...args);
        return { eq: (...eqArgs: unknown[]) => eqMock(...eqArgs) };
      }
    })
  })
}));

const ADMIN_ID = "admin-1";

function makeProfiles(): AdminProfile[] {
  return [
    {
      id: ADMIN_ID,
      email: "admin@example.com",
      status: "approved",
      role: "admin",
      approved_at: "2026-01-01T00:00:00.000Z",
      created_at: "2026-01-01T00:00:00.000Z"
    },
    {
      id: "pending-1",
      email: "newcomer@example.com",
      status: "pending",
      role: "member",
      approved_at: null,
      created_at: "2026-06-01T09:00:00.000Z"
    },
    {
      id: "approved-1",
      email: "member@example.com",
      status: "approved",
      role: "member",
      approved_at: "2026-05-01T09:00:00.000Z",
      created_at: "2026-04-01T09:00:00.000Z"
    }
  ];
}

describe("buildStatusUpdate", () => {
  it("approve / reactivate は approved と approved_at/by を記録する", () => {
    const now = "2026-06-11T00:00:00.000Z";
    expect(buildStatusUpdate("approve", ADMIN_ID, now)).toEqual({
      status: "approved",
      approved_at: now,
      approved_by: ADMIN_ID
    });
    expect(buildStatusUpdate("reactivate", ADMIN_ID, now)).toEqual({
      status: "approved",
      approved_at: now,
      approved_by: ADMIN_ID
    });
  });

  it("reject / disable は disabled にし approved_* をクリアする", () => {
    const now = "2026-06-11T00:00:00.000Z";
    expect(buildStatusUpdate("reject", ADMIN_ID, now)).toEqual({
      status: "disabled",
      approved_at: null,
      approved_by: null
    });
    expect(buildStatusUpdate("disable", ADMIN_ID, now)).toEqual({
      status: "disabled",
      approved_at: null,
      approved_by: null
    });
  });
});

describe("AdminUserBoard", () => {
  beforeEach(() => {
    updateMock.mockReset();
    eqMock.mockReset();
    eqMock.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderBoard() {
    render(<AdminUserBoard currentUserId={ADMIN_ID} initialProfiles={makeProfiles()} />);
  }

  it("承認待ち一覧と全ユーザー一覧を表示する", () => {
    renderBoard();

    const pendingSection = screen.getByRole("region", { name: "承認待ちの申請" });
    expect(within(pendingSection).getByText("newcomer@example.com")).toBeTruthy();
    expect(within(pendingSection).getByText(/申請日時/)).toBeTruthy();

    const allSection = screen.getByRole("region", { name: "全ユーザー一覧" });
    expect(within(allSection).getByText("admin@example.com")).toBeTruthy();
    expect(within(allSection).getByText("member@example.com")).toBeTruthy();
    expect(within(allSection).getByText("newcomer@example.com")).toBeTruthy();
  });

  it("承認操作で status/approved_at/approved_by のみを update する（role/email を送らない）", async () => {
    renderBoard();

    const pendingSection = screen.getByRole("region", { name: "承認待ちの申請" });
    fireEvent.click(within(pendingSection).getByRole("button", { name: "承認" }));

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));

    const payload = updateMock.mock.calls[0][0] as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(["approved_at", "approved_by", "status"]);
    expect(payload.status).toBe("approved");
    expect(payload.approved_by).toBe(ADMIN_ID);
    expect(payload.approved_at).toEqual(expect.any(String));
    expect(payload).not.toHaveProperty("role");
    expect(payload).not.toHaveProperty("email");

    expect(eqMock).toHaveBeenCalledWith("id", "pending-1");
  });

  it("自分自身の行には操作ボタンを出さない", () => {
    renderBoard();

    const allSection = screen.getByRole("region", { name: "全ユーザー一覧" });
    const adminRow = within(allSection).getByText("admin@example.com").closest("li") as HTMLElement;

    expect(within(adminRow).queryByRole("button")).toBeNull();
    expect(within(adminRow).getByText("自分のアカウント")).toBeTruthy();
  });

  it("拒否は確認パネルを経由してから update する", async () => {
    renderBoard();

    const pendingSection = screen.getByRole("region", { name: "承認待ちの申請" });
    fireEvent.click(within(pendingSection).getByRole("button", { name: "拒否" }));

    // 確認パネルが出るまでは update されない。
    expect(updateMock).not.toHaveBeenCalled();
    const dialog = screen.getByRole("alertdialog");
    expect(within(dialog).getByText("申請の拒否")).toBeTruthy();

    fireEvent.click(within(dialog).getByRole("button", { name: "拒否する" }));

    await waitFor(() => expect(updateMock).toHaveBeenCalledTimes(1));
    const payload = updateMock.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.status).toBe("disabled");
    expect(payload).not.toHaveProperty("role");
    expect(eqMock).toHaveBeenCalledWith("id", "pending-1");
  });
});
