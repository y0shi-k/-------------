import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InventoryBoard } from "@/components/inventory-board";
import type { StockItem, StorageLocation } from "@/lib/inventory/types";

const from = vi.fn();
const storageFrom = vi.fn();
const compressImageFile = vi.fn();
const buildPhotoStoragePath = vi.fn();

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({
    from,
    storage: {
      from: storageFrom
    }
  })
}));

vi.mock("@/lib/photos/compress", () => ({
  buildPhotoStoragePath: () => buildPhotoStoragePath(),
  compressImageFile: (file: File) => compressImageFile(file)
}));

const baseItem: StockItem = {
  id: "item-1",
  user_id: "user-1",
  category: "食材",
  name: "牛乳",
  quantity: 1,
  unit: "本",
  unit_conversion: null,
  display_expires_on: "2026-05-30",
  effective_expires_on: null,
  storage_location: "冷蔵庫",
  status_note: "朝食用",
  source: "manual",
  created_at: "2026-05-24T00:00:00Z",
  updated_at: "2026-05-24T00:00:00Z"
};

const baseLocation: StorageLocation = {
  id: "location-1",
  user_id: "user-1",
  name: "冷蔵庫",
  sort_order: 0,
  created_at: "2026-05-24T00:00:00Z",
  updated_at: "2026-05-24T00:00:00Z"
};

function renderBoard(props?: Partial<React.ComponentProps<typeof InventoryBoard>>) {
  return render(
    <InventoryBoard
      initialInventoryItems={props?.initialInventoryItems ?? []}
      initialStorageLocations={props?.initialStorageLocations ?? []}
      userId={props?.userId ?? "user-1"}
    />
  );
}

function openIngredientModal() {
  fireEvent.click(screen.getByRole("button", { name: "食材を追加" }));
}

function openManualAdd() {
  openIngredientModal();
  fireEvent.click(screen.getByRole("button", { name: "手動で追加" }));
}

function openPhotoScan() {
  openIngredientModal();
  fireEvent.click(screen.getByRole("button", { name: "画像スキャン" }));
}

describe("InventoryBoard", () => {
  beforeEach(() => {
    from.mockReset();
    storageFrom.mockReset();
    compressImageFile.mockReset();
    buildPhotoStoragePath.mockReset();
    buildPhotoStoragePath.mockReturnValue("user-1/ingredient-scan/photo-1.jpg");
    global.fetch = vi.fn();
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
  });

  it("shows inventory list and add choices", () => {
    renderBoard({
      initialInventoryItems: [{ ...baseItem, id: "inventory-1", name: "卵", unit: "個", quantity: 6 }]
    });

    expect(screen.getByRole("heading", { name: "在庫" })).toBeTruthy();
    expect(screen.getByText("卵")).toBeTruthy();
    expect(screen.getByRole("button", { name: "期限順 ▲" })).toBeTruthy();
    openIngredientModal();
    expect(screen.getByRole("heading", { name: "食材を追加" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "画像スキャン" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "手動で追加" })).toBeTruthy();
  });

  it("adds a storage location candidate", async () => {
    const inserted = { ...baseLocation, id: "location-new", name: "野菜室" };
    const single = vi.fn().mockResolvedValue({ data: inserted, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    from.mockReturnValue({ insert });

    renderBoard();
    openManualAdd();

    fireEvent.change(screen.getByLabelText("追加する保存場所"), { target: { value: "野菜室" } });
    fireEvent.click(screen.getByRole("button", { name: "追加" }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("storage_locations");
      expect(insert).toHaveBeenCalledWith({ user_id: "user-1", name: "野菜室", sort_order: 0 });
    });
    expect(await screen.findByText("野菜室 を保存場所に追加しました。")).toBeTruthy();
    expect(screen.getAllByText("野菜室").length).toBeGreaterThan(0);
  });

  it("prevents deleting a storage location while it is used", () => {
    renderBoard({ initialInventoryItems: [baseItem], initialStorageLocations: [baseLocation] });
    openManualAdd();

    const deleteButtons = screen.getAllByRole("button", { name: "削除" }) as HTMLButtonElement[];
    expect(deleteButtons.some((button) => button.disabled)).toBe(true);
    expect(screen.getAllByText("1件").length).toBeGreaterThan(0);
  });

  it("adds a manual inventory item with the authenticated user id", async () => {
    const unitConversion = { fromQty: 1, fromUnit: "丁", toQty: 300, toUnit: "g" };
    const inserted = { ...baseItem, id: "inserted-1", name: "豆腐", quantity: 2, unit: "丁", unit_conversion: unitConversion };
    const single = vi.fn().mockResolvedValue({ data: inserted, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    from.mockReturnValue({ insert });

    renderBoard();
    openManualAdd();

    fireEvent.change(screen.getByLabelText("品名"), { target: { value: "豆腐" } });
    fireEvent.change(screen.getByLabelText("数量"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("単位"), { target: { value: "丁" } });
    fireEvent.change(screen.getByLabelText("換算元数量"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("換算元単位"), { target: { value: "丁" } });
    fireEvent.change(screen.getByLabelText("換算先数量"), { target: { value: "300" } });
    fireEvent.change(screen.getByLabelText("換算先単位"), { target: { value: "g" } });
    fireEvent.click(screen.getByRole("button", { name: "在庫に追加" }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("inventory_items");
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          name: "豆腐",
          quantity: 2,
          unit: "丁",
          unit_conversion: unitConversion
        })
      );
    });
    expect(await screen.findByText("在庫に追加しました。")).toBeTruthy();
    expect(screen.getByText("豆腐")).toBeTruthy();
    expect(screen.getByText("1丁 = 300g")).toBeTruthy();
  });

  it("rejects incomplete unit conversion settings", async () => {
    renderBoard();
    openManualAdd();

    fireEvent.change(screen.getByLabelText("品名"), { target: { value: "ひき肉" } });
    fireEvent.change(screen.getByLabelText("換算元数量"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("換算元単位"), { target: { value: "パック" } });
    fireEvent.click(screen.getByRole("button", { name: "在庫に追加" }));

    expect(await screen.findByText("単位換算は「1 パック = 150 g」のように数量と単位をすべて入力してください。")).toBeTruthy();
    expect(from).not.toHaveBeenCalledWith("inventory_items");
  });

  it("filters inventory by location tab", () => {
    renderBoard({
      initialInventoryItems: [
        { ...baseItem, id: "inventory-1", name: "卵", unit: "個", quantity: 6, storage_location: "冷蔵庫", category: "食材" },
        { ...baseItem, id: "inventory-2", name: "醤油", unit: "本", quantity: 1, storage_location: "常温棚", category: "調味料" }
      ]
    });

    fireEvent.click(screen.getByRole("button", { name: "常温棚 1" }));

    expect(screen.getByText("醤油")).toBeTruthy();
    expect(screen.queryByText("卵")).toBeNull();
  });

  it("decreases inventory quantity from the Canvas-style quantity controls", async () => {
    const updatedItem = { ...baseItem, quantity: 0 };
    const single = vi.fn().mockResolvedValue({ data: updatedItem, error: null });
    const select = vi.fn(() => ({ single }));
    const eqUser = vi.fn(() => ({ select }));
    const eqId = vi.fn(() => ({ eq: eqUser }));
    const update = vi.fn(() => ({ eq: eqId }));
    from.mockReturnValue({ update });

    renderBoard({ initialInventoryItems: [baseItem] });

    fireEvent.click(screen.getByRole("button", { name: "-" }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("inventory_items");
      expect(update).toHaveBeenCalledWith({ quantity: 0 });
    });
    await waitFor(() => {
      expect(screen.getByLabelText("牛乳の数量").textContent).toContain("0本");
    });
  });

  it("previews a selected photo and allows replacing it", () => {
    renderBoard();
    openPhotoScan();

    fireEvent.change(screen.getByLabelText("写真を撮る"), {
      target: {
        files: [new File(["photo"], "ingredient.jpg", { type: "image/jpeg" })]
      }
    });

    expect(screen.getByAltText("選択した食材写真のプレビュー")).toBeTruthy();
    expect(screen.getByRole("button", { name: "AI解析する" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "別の写真にする" }));

    expect(screen.queryByAltText("選択した食材写真のプレビュー")).toBeNull();
    expect(screen.getByText("写真は非公開で保存し、サーバー側でAI解析します。APIキーはブラウザへ出しません。")).toBeTruthy();
  });

  it("compresses, uploads, scans a selected photo, and saves selected candidates into inventory", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const photoSingle = vi.fn().mockResolvedValue({ data: { id: "photo-1" }, error: null });
    const photoSelect = vi.fn(() => ({ single: photoSingle }));
    const photoInsert = vi.fn(() => ({ select: photoSelect }));
    const inventoryOrder = vi.fn().mockResolvedValue({
      data: [{ ...baseItem, id: "ai-1", name: "ヨーグルト", source: "ai_photo" }],
      error: null
    });
    const inventorySelect = vi.fn(() => ({ order: inventoryOrder }));
    const inventoryInsert = vi.fn(() => ({ select: inventorySelect }));
    const compressedBlob = new Blob(["compressed"], { type: "image/jpeg" });
    const aiItem = {
      user_id: "user-1",
      category: "食材",
      name: "ヨーグルト",
      quantity: 1,
      unit: "個",
      unit_conversion: null,
      display_expires_on: null,
      effective_expires_on: null,
      storage_location: "冷蔵庫",
      status_note: "AI解析候補",
      source: "ai_photo"
    };

    storageFrom.mockReturnValue({ upload, remove });
    from.mockImplementation((table: string) => {
      if (table === "photos") return { insert: photoInsert };
      if (table === "inventory_items") return { insert: inventoryInsert };
      return {};
    });
    compressImageFile.mockResolvedValue({
      blob: compressedBlob,
      byteSize: compressedBlob.size,
      contentType: "image/jpeg",
      width: 1024,
      height: 768
    });
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ items: [aiItem] })
    } as Response);

    renderBoard();
    openPhotoScan();

    fireEvent.change(screen.getByLabelText("写真を撮る"), {
      target: {
        files: [new File(["photo"], "ingredient.jpg", { type: "image/jpeg" })]
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "AI解析する" }));

    await waitFor(() => {
      expect(storageFrom).toHaveBeenCalledWith("photos");
      expect(upload).toHaveBeenCalledWith("user-1/ingredient-scan/photo-1.jpg", compressedBlob, {
        contentType: "image/jpeg",
        upsert: false
      });
      expect(from).toHaveBeenCalledWith("photos");
      expect(photoInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          bucket_id: "photos",
          storage_path: "user-1/ingredient-scan/photo-1.jpg",
          usage_type: "ingredient_scan",
          content_type: "image/jpeg",
          byte_size: compressedBlob.size,
          width: 1024,
          height: 768
        })
      );
      expect(fetch).toHaveBeenCalledWith("/api/ai/scan-ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ photoId: "photo-1" })
      });
    });
    expect(await screen.findByText("1件の候補を見つけました。確認してから在庫に追加してください。")).toBeTruthy();
    expect(screen.getByText("ヨーグルト")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "選択した候補を在庫に追加" }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("inventory_items");
      expect(inventoryInsert).toHaveBeenCalledWith([aiItem]);
    });
    expect(await screen.findByText("1件を在庫に追加しました。")).toBeTruthy();
  });

  it("shows a clear error when photo upload fails", async () => {
    const upload = vi.fn().mockResolvedValue({ error: new Error("upload failed") });
    storageFrom.mockReturnValue({ upload });
    compressImageFile.mockResolvedValue({
      blob: new Blob(["compressed"], { type: "image/jpeg" }),
      byteSize: 10,
      contentType: "image/jpeg",
      width: 1024,
      height: 768
    });

    renderBoard();
    openPhotoScan();

    fireEvent.change(screen.getByLabelText("写真を撮る"), {
      target: {
        files: [new File(["photo"], "ingredient.jpg", { type: "image/jpeg" })]
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "AI解析する" }));

    expect(await screen.findByText(/原因: 写真をStorageへ保存できませんでした。/)).toBeTruthy();
    expect(from).not.toHaveBeenCalledWith("photos");
  });

  it("shows a clear error when ingredient scan fails", async () => {
    const upload = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const photoSingle = vi.fn().mockResolvedValue({ data: { id: "photo-1" }, error: null });
    const photoSelect = vi.fn(() => ({ single: photoSingle }));
    const insert = vi.fn(() => ({ select: photoSelect }));

    storageFrom.mockReturnValue({ upload, remove });
    from.mockImplementation((table: string) => {
      if (table === "photos") return { insert };
      return {};
    });
    compressImageFile.mockResolvedValue({
      blob: new Blob(["compressed"], { type: "image/jpeg" }),
      byteSize: 10,
      contentType: "image/jpeg",
      width: 1024,
      height: 768
    });
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({
        error: "原因: Gemini APIの解析に失敗しました。影響: 食材候補を作成できません。修正方法: 時間を置いて再度解析してください。"
      })
    } as Response);

    renderBoard();
    openPhotoScan();

    fireEvent.change(screen.getByLabelText("写真を撮る"), {
      target: {
        files: [new File(["photo"], "ingredient.jpg", { type: "image/jpeg" })]
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "AI解析する" }));

    expect(await screen.findByText(/原因: Gemini APIの解析に失敗しました。/)).toBeTruthy();
    expect(screen.queryByText("ヨーグルト")).toBeNull();
  });
});
