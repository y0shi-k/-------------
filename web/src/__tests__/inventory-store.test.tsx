import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InventoryStoreProvider, useInventoryStore } from "@/components/inventory-store";
import type { StockItem, StorageLocation } from "@/lib/inventory/types";

function makeItem(id: string, name: string): StockItem {
  return {
    id,
    user_id: "user1",
    category: "食材",
    name,
    quantity: 1,
    unit: "個",
    unit_conversion: null,
    display_expires_on: null,
    effective_expires_on: null,
    storage_location: "冷蔵庫",
    status_note: "",
    source: "manual",
    image_storage_path: null,
    archived_at: null,
    archived_reason: null,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z"
  };
}

function ConsumerComponent() {
  const { inventoryItems, setInventoryItems } = useInventoryStore();
  return (
    <div>
      <span data-testid="count">{inventoryItems.length}</span>
      <button
        onClick={() => setInventoryItems((items) => [...items, makeItem("new", "追加食材")])}
      >
        追加
      </button>
    </div>
  );
}

const initialItems: StockItem[] = [makeItem("a", "たまご"), makeItem("b", "牛乳")];
const initialArchived: StockItem[] = [];
const initialLocations: StorageLocation[] = [];

describe("InventoryStoreProvider", () => {
  it("初期値が Consumer に伝播する", () => {
    render(
      <InventoryStoreProvider
        initialInventoryItems={initialItems}
        initialArchivedInventoryItems={initialArchived}
        initialStorageLocations={initialLocations}
        initialShoppingItems={[]}
      >
        <ConsumerComponent />
      </InventoryStoreProvider>
    );

    expect(screen.getByTestId("count").textContent).toBe("2");
  });

  it("setInventoryItems で更新すると Consumer に反映される", () => {
    render(
      <InventoryStoreProvider
        initialInventoryItems={initialItems}
        initialArchivedInventoryItems={initialArchived}
        initialStorageLocations={initialLocations}
        initialShoppingItems={[]}
      >
        <ConsumerComponent />
      </InventoryStoreProvider>
    );

    act(() => {
      screen.getByRole("button", { name: "追加" }).click();
    });

    expect(screen.getByTestId("count").textContent).toBe("3");
  });
});
