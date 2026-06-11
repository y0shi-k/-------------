import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAccountRole, fetchAccountStatus, resolveAuthState } from "@/lib/auth/account-status";

// profiles の1クエリ（select().eq().maybeSingle()）をモックするクライアント。
function clientReturning(result: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { client: { from } as unknown as SupabaseClient, from, select, eq };
}

describe("fetchAccountStatus", () => {
  it("returns approved for an approved row", async () => {
    const { client, from, select, eq } = clientReturning({ data: { status: "approved" }, error: null });

    await expect(fetchAccountStatus(client, "user-1")).resolves.toBe("approved");
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("status");
    expect(eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("returns disabled for a disabled row", async () => {
    const { client } = clientReturning({ data: { status: "disabled" }, error: null });
    await expect(fetchAccountStatus(client, "user-1")).resolves.toBe("disabled");
  });

  it("returns pending for a pending row", async () => {
    const { client } = clientReturning({ data: { status: "pending" }, error: null });
    await expect(fetchAccountStatus(client, "user-1")).resolves.toBe("pending");
  });

  it("falls back to pending when the row is missing (safe side)", async () => {
    const { client } = clientReturning({ data: null, error: null });
    await expect(fetchAccountStatus(client, "user-1")).resolves.toBe("pending");
  });

  it("falls back to pending when the query errors (safe side)", async () => {
    const { client } = clientReturning({ data: null, error: new Error("rls denied") });
    await expect(fetchAccountStatus(client, "user-1")).resolves.toBe("pending");
  });

  it("falls back to pending for an unknown status value", async () => {
    const { client } = clientReturning({ data: { status: "weird" }, error: null });
    await expect(fetchAccountStatus(client, "user-1")).resolves.toBe("pending");
  });
});

describe("resolveAuthState", () => {
  it("returns unauthenticated when no user id", async () => {
    const { client, from } = clientReturning({ data: { status: "approved" }, error: null });
    await expect(resolveAuthState(client, null)).resolves.toBe("unauthenticated");
    await expect(resolveAuthState(client, undefined)).resolves.toBe("unauthenticated");
    expect(from).not.toHaveBeenCalled();
  });

  it("returns the account status for a logged-in user", async () => {
    const { client } = clientReturning({ data: { status: "approved" }, error: null });
    await expect(resolveAuthState(client, "user-1")).resolves.toBe("approved");
  });
});

describe("fetchAccountRole", () => {
  it("returns admin for an admin row", async () => {
    const { client, from, select, eq } = clientReturning({ data: { role: "admin" }, error: null });

    await expect(fetchAccountRole(client, "user-1")).resolves.toBe("admin");
    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("role");
    expect(eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("returns member for a member row", async () => {
    const { client } = clientReturning({ data: { role: "member" }, error: null });
    await expect(fetchAccountRole(client, "user-1")).resolves.toBe("member");
  });

  it("falls back to member when the row is missing (safe side)", async () => {
    const { client } = clientReturning({ data: null, error: null });
    await expect(fetchAccountRole(client, "user-1")).resolves.toBe("member");
  });

  it("falls back to member when the query errors (safe side)", async () => {
    const { client } = clientReturning({ data: null, error: new Error("rls denied") });
    await expect(fetchAccountRole(client, "user-1")).resolves.toBe("member");
  });

  it("falls back to member for an unknown role value", async () => {
    const { client } = clientReturning({ data: { role: "superuser" }, error: null });
    await expect(fetchAccountRole(client, "user-1")).resolves.toBe("member");
  });
});
