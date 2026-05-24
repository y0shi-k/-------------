import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InventoryBoard } from "@/components/inventory-board";
import type { StockItem } from "@/lib/inventory/types";

const from = vi.fn();

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({
    from
  })
}));

const baseItem: StockItem = {
  id: "item-1",
  user_id: "user-1",
  category: "食材",
  name: "牛乳",
  quantity: 1,
  unit: "本",
  display_expires_on: "2026-05-30",
  effective_expires_on: null,
  storage_location: "冷蔵庫",
  status_note: "朝食用",
  source: "manual",
  created_at: "2026-05-24T00:00:00Z",
  updated_at: "2026-05-24T00:00:00Z"
};

function renderBoard(props?: Partial<React.ComponentProps<typeof InventoryBoard>>) {
  return render(
    <InventoryBoard
      initialInventoryItems={props?.initialInventoryItems ?? []}
      initialStagingItems={props?.initialStagingItems ?? []}
      userId={props?.userId ?? "user-1"}
    />
  );
}

describe("InventoryBoard", () => {
  beforeEach(() => {
    from.mockReset();
  });

  it("shows staging and inventory lists", () => {
    renderBoard({
      initialInventoryItems: [{ ...baseItem, id: "inventory-1", name: "卵", unit: "個", quantity: 6 }],
      initialStagingItems: [baseItem]
    });

    expect(screen.getByRole("heading", { name: "在庫と登録待ち" })).toBeTruthy();
    expect(screen.getByText("牛乳")).toBeTruthy();
    expect(screen.getByText("卵")).toBeTruthy();
    expect(screen.getByRole("button", { name: "在庫へ確定" })).toBeTruthy();
  });

  it("adds a manual staging item with the authenticated user id", async () => {
    const inserted = { ...baseItem, id: "inserted-1", name: "豆腐", quantity: 2, unit: "丁" };
    const single = vi.fn().mockResolvedValue({ data: inserted, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    from.mockReturnValue({ insert });

    renderBoard();

    fireEvent.change(screen.getByLabelText("品名"), { target: { value: "豆腐" } });
    fireEvent.change(screen.getByLabelText("数量"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("単位"), { target: { value: "丁" } });
    fireEvent.click(screen.getByRole("button", { name: "登録待ちに追加" }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("staging_items");
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          name: "豆腐",
          quantity: 2,
          unit: "丁"
        })
      );
    });
    expect(await screen.findByText("登録待ちに追加しました。")).toBeTruthy();
    expect(screen.getByText("豆腐")).toBeTruthy();
  });

  it("moves a staging item into inventory and removes it from staging", async () => {
    const insertedInventory = { ...baseItem, id: "inventory-1" };
    const insertSingle = vi.fn().mockResolvedValue({ data: insertedInventory, error: null });
    const insertSelect = vi.fn(() => ({ single: insertSingle }));
    const insert = vi.fn(() => ({ select: insertSelect }));
    const eqSecond = vi.fn().mockResolvedValue({ error: null });
    const eqFirst = vi.fn(() => ({ eq: eqSecond }));
    const deleteItem = vi.fn(() => ({ eq: eqFirst }));

    from.mockImplementation((table: string) => {
      if (table === "inventory_items") return { insert };
      return { delete: deleteItem };
    });

    renderBoard({ initialStagingItems: [baseItem] });

    fireEvent.click(screen.getByRole("button", { name: "在庫へ確定" }));

    await waitFor(() => {
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          name: "牛乳"
        })
      );
      expect(deleteItem).toHaveBeenCalled();
    });
    expect(await screen.findByText("牛乳 を在庫へ確定しました。")).toBeTruthy();
  });
});
