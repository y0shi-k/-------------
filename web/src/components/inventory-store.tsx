"use client";

import { createContext, type Dispatch, type ReactNode, type SetStateAction, useContext, useState } from "react";
import type { StockItem, StorageLocation } from "@/lib/inventory/types";
import type { ShoppingItem } from "@/lib/recipes/types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

// ---------------------------------------------------------------------------
// 型
// ---------------------------------------------------------------------------

type InventoryState = {
  inventoryItems: StockItem[];
  archivedInventoryItems: StockItem[];
  storageLocations: StorageLocation[];
  shoppingItems: ShoppingItem[];
};

type InventoryActions = {
  setInventoryItems: Dispatch<SetStateAction<StockItem[]>>;
  setArchivedInventoryItems: Dispatch<SetStateAction<StockItem[]>>;
  setStorageLocations: Dispatch<SetStateAction<StorageLocation[]>>;
  setShoppingItems: Dispatch<SetStateAction<ShoppingItem[]>>;
  refetch: (userId: string) => Promise<void>;
  refetchShoppingItems: (userId: string) => Promise<void>;
};

type InventoryStoreContextValue = InventoryState & InventoryActions;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const InventoryStoreContext = createContext<InventoryStoreContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

type InventoryStoreProviderProps = {
  children: ReactNode;
  initialInventoryItems: StockItem[];
  initialArchivedInventoryItems: StockItem[];
  initialStorageLocations: StorageLocation[];
  initialShoppingItems: ShoppingItem[];
};

export function InventoryStoreProvider({
  children,
  initialInventoryItems,
  initialArchivedInventoryItems,
  initialStorageLocations,
  initialShoppingItems
}: InventoryStoreProviderProps) {
  const [inventoryItems, setInventoryItems] = useState<StockItem[]>(
    initialInventoryItems.filter((item) => !item.archived_at && item.quantity > 0)
  );
  const [archivedInventoryItems, setArchivedInventoryItems] = useState<StockItem[]>(initialArchivedInventoryItems);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>(initialStorageLocations);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(initialShoppingItems);

  async function refetch(userId: string): Promise<void> {
    const supabase = createBrowserSupabaseClient();

    const [{ data: active }, { data: archived }, { data: locations }] = await Promise.all([
      supabase
        .from("inventory_items")
        .select("*")
        .eq("user_id", userId)
        .is("archived_at", null)
        .gt("quantity", 0)
        .order("created_at", { ascending: false }),
      supabase
        .from("inventory_items")
        .select("*")
        .eq("user_id", userId)
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false })
        .limit(50),
      supabase
        .from("storage_locations")
        .select("*")
        .eq("user_id", userId)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true })
    ]);

    if (active) setInventoryItems(active as StockItem[]);
    if (archived) setArchivedInventoryItems(archived as StockItem[]);
    if (locations) setStorageLocations(locations as StorageLocation[]);
  }

  async function refetchShoppingItems(userId: string): Promise<void> {
    const supabase = createBrowserSupabaseClient();

    const { data } = await supabase
      .from("shopping_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) setShoppingItems(data as ShoppingItem[]);
  }

  const value: InventoryStoreContextValue = {
    inventoryItems,
    archivedInventoryItems,
    storageLocations,
    shoppingItems,
    setInventoryItems,
    setArchivedInventoryItems,
    setStorageLocations,
    setShoppingItems,
    refetch,
    refetchShoppingItems
  };

  return <InventoryStoreContext.Provider value={value}>{children}</InventoryStoreContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useInventoryStore(): InventoryStoreContextValue {
  const ctx = useContext(InventoryStoreContext);
  if (!ctx) {
    throw new Error("useInventoryStore must be used within InventoryStoreProvider");
  }
  return ctx;
}
