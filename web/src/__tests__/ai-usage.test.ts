import { describe, expect, it, vi } from "vitest";
import { consumeAiUsage, getAiUsageSummary, refundAiUsage } from "@/lib/ai/usage";
import type { SupabaseClient } from "@supabase/supabase-js";

function clientWithRpc(rpc: ReturnType<typeof vi.fn>) {
  return { rpc } as unknown as Pick<SupabaseClient, "rpc">;
}

describe("consumeAiUsage", () => {
  it("forwards the feature and returns the reservation result", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: { ok: true, event_id: "event-1", remaining_feature: 19, remaining_total: 29 },
      error: null
    });

    const result = await consumeAiUsage(clientWithRpc(rpc), "recipe_generation");

    expect(rpc).toHaveBeenCalledWith("consume_ai_usage", { p_feature: "recipe_generation" });
    expect(result).toEqual({ ok: true, event_id: "event-1", remaining_feature: 19, remaining_total: 29 });
  });

  it("returns a non-ok result when the rpc errors", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: new Error("rpc failed") });

    const result = await consumeAiUsage(clientWithRpc(rpc), "ingredient_scan");

    expect(result).toEqual({ ok: false });
  });
});

describe("refundAiUsage", () => {
  it("returns true only when the rpc deletes a row", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });

    await expect(refundAiUsage(clientWithRpc(rpc), "event-1")).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("refund_ai_usage", { p_event_id: "event-1" });
  });

  it("returns false when the rpc errors", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: new Error("rpc failed") });

    await expect(refundAiUsage(clientWithRpc(rpc), "event-1")).resolves.toBe(false);
  });
});

describe("getAiUsageSummary", () => {
  it("returns the summary from the rpc", async () => {
    const summary = {
      ok: true,
      recipe_generation: { used: 1, limit: 20, remaining: 19 },
      ingredient_scan: { used: 0, limit: 10, remaining: 10 },
      total: { used: 1, limit: 30, remaining: 29 }
    };
    const rpc = vi.fn().mockResolvedValue({ data: summary, error: null });

    await expect(getAiUsageSummary(clientWithRpc(rpc))).resolves.toEqual(summary);
  });

  it("returns a non-ok fallback when the rpc errors", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: new Error("rpc failed") });

    const result = await getAiUsageSummary(clientWithRpc(rpc));

    expect(result.ok).toBe(false);
    expect(result.total).toEqual({ used: 0, limit: 0, remaining: 0 });
  });
});
