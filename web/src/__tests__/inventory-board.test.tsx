import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InventoryBoard } from "@/components/inventory-board";
import type { StockItem } from "@/lib/inventory/types";
import type { ShoppingItem } from "@/lib/recipes/types";
import type { AiUsageSummary } from "@/lib/ai/usage";

const from = vi.fn();
const storageFrom = vi.fn();
const compressImageFile = vi.fn();
const compressIngredientImageFile = vi.fn();
const buildPhotoStoragePath = vi.fn();
const buildInventoryImageStoragePath = vi.fn();
const buildUserIngredientImageStoragePath = vi.fn();
const refresh = vi.fn();
const shellAiMocks = vi.hoisted(() => ({
  aiUsageSummary: null as AiUsageSummary | null,
  refreshAiUsage: vi.fn(async () => {})
}));
const shellSubViewMocks = vi.hoisted(() => ({
  selectedSubViews: {
    ingredients: "inventory" as "inventory" | "shopping",
    recipes: "recipes",
    cooking: "timeline"
  },
  selectShellLeaf: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh
  })
}));

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({
    from,
    storage: {
      from: storageFrom
    }
  })
}));

vi.mock("@/components/web-mode-shell", () => ({
  useShellAiUsage: () => ({
    aiUsageSummary: shellAiMocks.aiUsageSummary,
    refreshAiUsage: shellAiMocks.refreshAiUsage
  }),
  useShellSubView: () => ({
    activeDesktopTarget: { group: "ingredients", kind: "mode", leaf: shellSubViewMocks.selectedSubViews.ingredients },
    selectedSubViews: shellSubViewMocks.selectedSubViews,
    selectShellLeaf: shellSubViewMocks.selectShellLeaf
  })
}));

vi.mock("@/lib/photos/compress", () => ({
  buildInventoryImageStoragePath: (userId: string, itemId: string, extension: string) => buildInventoryImageStoragePath(userId, itemId, extension),
  buildPhotoStoragePath: () => buildPhotoStoragePath(),
  buildUserIngredientImageStoragePath: (userId: string, normalizedName: string, extension: string) => buildUserIngredientImageStoragePath(userId, normalizedName, extension),
  compressImageFile: (file: File) => compressImageFile(file),
  compressIngredientImageFile: (file: File) => compressIngredientImageFile(file),
  imageExtensionFromContentType: (contentType: string) => (contentType === "image/webp" ? "webp" : "jpg")
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
  image_storage_path: null,
  created_at: "2026-05-24T00:00:00Z",
  updated_at: "2026-05-24T00:00:00Z"
};

const baseShoppingItem: ShoppingItem = {
  id: "shopping-1",
  user_id: "user-1",
  name: "玉ねぎ",
  required_quantity: 1,
  unit: "個",
  status: "未購入",
  linked_recipe_name: "カレー",
  source_type: "meal_schedule",
  purchased_at: null,
  created_at: "2026-05-24T00:00:00.000Z",
  updated_at: "2026-05-24T00:00:00.000Z"
};

function insertSingleQuery(data: unknown, error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data, error });
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  return { insert, select, single };
}

function updateSingleQuery(data: unknown, error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data, error });
  const select = vi.fn(() => ({ single }));
  const eqUser = vi.fn(() => ({ select }));
  const eqId = vi.fn(() => ({ eq: eqUser }));
  const update = vi.fn(() => ({ eq: eqId }));
  return { update, eqId, eqUser, select, single };
}

function deleteInQuery(error: unknown = null) {
  const inIds = vi.fn().mockResolvedValue({ error });
  const eqUser = vi.fn(() => ({ in: inIds }));
  const deleteRows = vi.fn(() => ({ eq: eqUser }));
  return { deleteRows, eqUser, inIds };
}

function renderBoard(props?: Partial<React.ComponentProps<typeof InventoryBoard>>) {
  return render(
    <InventoryBoard
      initialInventoryItems={props?.initialInventoryItems ?? []}
      initialShoppingItems={props?.initialShoppingItems ?? []}
      initialStorageLocations={props?.initialStorageLocations ?? []}
      userId={props?.userId ?? "user-1"}
    />
  );
}

function openShoppingView() {
  fireEvent.click(screen.getByRole("button", { name: "買い物リスト" }));
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
    shellAiMocks.aiUsageSummary = null;
    shellAiMocks.refreshAiUsage.mockReset();
    shellAiMocks.refreshAiUsage.mockResolvedValue(undefined);
    shellSubViewMocks.selectedSubViews = {
      ingredients: "inventory",
      recipes: "recipes",
      cooking: "timeline"
    };
    shellSubViewMocks.selectShellLeaf.mockReset();
    compressImageFile.mockReset();
    compressIngredientImageFile.mockReset();
    buildPhotoStoragePath.mockReset();
    buildInventoryImageStoragePath.mockReset();
    buildUserIngredientImageStoragePath.mockReset();
    buildPhotoStoragePath.mockReturnValue("user-1/ingredient-scan/photo-1.jpg");
    buildInventoryImageStoragePath.mockReturnValue("user-1/inventory-images/item-1/image.webp");
    buildUserIngredientImageStoragePath.mockReturnValue("user-1/ingredient-images/milk/image.webp");
    global.fetch = vi.fn();
    localStorage.clear();
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
  });

  it("shows inventory list and add choices", () => {
    renderBoard({
      initialInventoryItems: [{ ...baseItem, id: "inventory-1", name: "卵", unit: "個", quantity: 6 }]
    });

    expect(screen.getByRole("heading", { name: "在庫" })).toBeTruthy();
    expect(screen.getByText("卵")).toBeTruthy();
    expect(screen.getByRole("img", { name: "卵" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "期限順 ▲" })).toBeTruthy();
    openIngredientModal();
    expect(screen.getByRole("heading", { name: "食材を追加" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "画像スキャン" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "手動で追加" })).toBeTruthy();
  });

  it("opens the shopping list from the shell subview selection", async () => {
    shellSubViewMocks.selectedSubViews = {
      ingredients: "shopping",
      recipes: "recipes",
      cooking: "timeline"
    };

    renderBoard({ initialShoppingItems: [baseShoppingItem] });

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "買い物リスト" })).toBeTruthy();
    });
    expect(screen.getByText("玉ねぎ")).toBeTruthy();
  });

  it("reports internal inventory view changes back to the shell", () => {
    renderBoard();

    openShoppingView();

    expect(shellSubViewMocks.selectShellLeaf).toHaveBeenCalledWith("ingredients", "shopping");
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
    fireEvent.change(screen.getByLabelText("単位を検索・追加"), { target: { value: "丁" } });
    fireEvent.keyDown(screen.getByLabelText("単位を検索・追加"), { key: "Enter" });
    fireEvent.change(screen.getByLabelText("換算先数量"), { target: { value: "300" } });
    fireEvent.change(screen.getByLabelText("換算先単位を検索・追加"), { target: { value: "g" } });
    fireEvent.keyDown(screen.getByLabelText("換算先単位を検索・追加"), { key: "Enter" });
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

  it("uploads an inventory image and remembers it for the same ingredient name", async () => {
    const inserted = { ...baseItem, id: "item-1", name: "牛乳", image_storage_path: null };
    const single = vi.fn().mockResolvedValue({ data: inserted, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const eqUser = vi.fn().mockResolvedValue({ error: null });
    const eqId = vi.fn(() => ({ eq: eqUser }));
    const update = vi.fn(() => ({ eq: eqId }));
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const upload = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const createSignedUrl = vi.fn(async (path: string) => ({ data: { signedUrl: `https://signed/${path}` } }));
    const compressedBlob = new Blob(["ingredient"], { type: "image/webp" });

    storageFrom.mockReturnValue({ createSignedUrl, remove, upload });
    from.mockImplementation((table: string) => {
      if (table === "inventory_items") return { insert, update };
      if (table === "user_ingredient_images") return { upsert };
      return {};
    });
    compressIngredientImageFile.mockResolvedValue({
      blob: compressedBlob,
      byteSize: compressedBlob.size,
      contentType: "image/webp",
      width: 800,
      height: 600
    });

    renderBoard();
    openManualAdd();

    fireEvent.change(screen.getByLabelText("品名"), { target: { value: "牛乳" } });
    fireEvent.change(screen.getByLabelText("画像を選ぶ"), {
      target: { files: [new File(["photo"], "milk.jpg", { type: "image/jpeg" })] }
    });
    expect(screen.getByAltText("選択した食材画像のプレビュー")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "在庫に追加" }));

    await waitFor(() => {
      expect(upload).toHaveBeenCalledWith("user-1/inventory-images/item-1/image.webp", compressedBlob, {
        contentType: "image/webp",
        upsert: false
      });
      expect(update).toHaveBeenCalledWith({ image_storage_path: "user-1/inventory-images/item-1/image.webp" });
      expect(upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          normalized_name: "牛乳",
          display_name: "牛乳",
          image_storage_path: "user-1/ingredient-images/milk/image.webp"
        }),
        { onConflict: "user_id,normalized_name" }
      );
    });
    expect(await screen.findByText("在庫に追加しました。")).toBeTruthy();
  });

  it("shows inventory insert errors inside the modal and logs details for debugging", async () => {
    const dbError = { code: "42703", message: "column inventory_items.unit_conversion does not exist" };
    const single = vi.fn().mockResolvedValue({ data: null, error: dbError });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    from.mockReturnValue({ insert });

    renderBoard();
    openManualAdd();

    fireEvent.change(screen.getByLabelText("品名"), { target: { value: "豆腐" } });
    fireEvent.click(screen.getByRole("button", { name: "在庫に追加" }));

    const dialog = screen.getByRole("dialog", { name: "食材をリストへ" });
    expect(
      await within(dialog).findByText(
        "原因: 在庫をDBへ保存できませんでした。影響: 入力した食材は在庫一覧に追加されません。修正方法: ログイン状態と入力内容を確認してください。"
      )
    ).toBeTruthy();
    expect(consoleError).toHaveBeenCalledWith("[InventoryBoard] inventory_items insert failed", dbError);

    consoleError.mockRestore();
  });

  it("creates a new storage location from the picker and saves it to the master table", async () => {
    const newLocation = {
      id: "loc-1",
      user_id: "user-1",
      name: "床下収納",
      sort_order: 1,
      created_at: "2026-05-31T00:00:00.000Z",
      updated_at: "2026-05-31T00:00:00.000Z"
    };
    const locationInsert = insertSingleQuery(newLocation);
    from.mockImplementation((table: string) => {
      if (table === "storage_locations") return { insert: locationInsert.insert };
      return {};
    });

    renderBoard();
    openManualAdd();

    // ジャンルと同じタグピッカーで、未存在の保存場所を入力→Enterで新規作成。
    const locationInput = screen.getByLabelText("保存場所を検索・追加");
    fireEvent.change(locationInput, { target: { value: "床下収納" } });
    fireEvent.keyDown(locationInput, { key: "Enter" });

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("storage_locations");
      expect(locationInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: "user-1", name: "床下収納", sort_order: expect.any(Number) })
      );
    });
    // 選択値としてチップ表示される。
    expect(screen.getByText("床下収納", { selector: ".genre-tag-name" })).toBeTruthy();
  });

  it("rejects incomplete unit conversion settings", async () => {
    renderBoard();
    openManualAdd();

    fireEvent.change(screen.getByLabelText("品名"), { target: { value: "ひき肉" } });
    fireEvent.change(screen.getByLabelText("換算先数量"), { target: { value: "150" } });
    fireEvent.click(screen.getByRole("button", { name: "在庫に追加" }));

    expect(await screen.findByText("単位換算は「1 本 = 1000 ml」のように換算先の数量と単位を入力してください。")).toBeTruthy();
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
    expect(screen.getByText("写真は非公開で保存し、入力したGemini APIキーでAI解析します。APIキーはDBに保存しません。")).toBeTruthy();
  });

  it("disables the AI scan button when the daily scan limit is reached", async () => {
    shellAiMocks.aiUsageSummary = {
      ok: true,
      recipe_generation: { used: 5, limit: 20, remaining: 15 },
      ingredient_scan: { used: 10, limit: 10, remaining: 0 },
      total: { used: 15, limit: 30, remaining: 15 }
    };
    renderBoard();
    openPhotoScan();

    fireEvent.change(screen.getByLabelText("写真を撮る"), {
      target: { files: [new File(["photo"], "ingredient.jpg", { type: "image/jpeg" })] }
    });

    // 残量メーターは設定画面へ集約済み（ボード内には表示しない）。
    // ボードでは上限到達時にAI解析ボタンが無効化されることのみを保証する。
    await waitFor(() => {
      expect((screen.getByRole("button", { name: "AI解析する" }) as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it("requires a user-owned Gemini API key before scanning a photo", async () => {
    renderBoard();
    openPhotoScan();

    fireEvent.change(screen.getByLabelText("写真を撮る"), {
      target: {
        files: [new File(["photo"], "ingredient.jpg", { type: "image/jpeg" })]
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "AI解析する" }));

    expect(await screen.findByText(/原因: ユーザー自身のGemini APIキーが未入力です。/)).toBeTruthy();
    expect(storageFrom).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("compresses, uploads, scans a selected photo, and saves selected candidates into inventory", async () => {
    localStorage.setItem("stock-master:user-gemini-api-key", "user-owned-test-key");
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
        body: JSON.stringify({ photoId: "photo-1", geminiApiKey: "user-owned-test-key" })
      });
    });
    expect(await screen.findByText("1件の候補を見つけました。確認してから在庫に追加してください。")).toBeTruthy();
    // AI解析後に context の refreshAiUsage が呼ばれること
    await waitFor(() => {
      expect(shellAiMocks.refreshAiUsage).toHaveBeenCalled();
    });
    expect(screen.getByText("ヨーグルト")).toBeTruthy();
    expect(screen.getByRole("img", { name: "ヨーグルト" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "選択した候補を在庫に追加" }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("inventory_items");
      expect(inventoryInsert).toHaveBeenCalledWith([aiItem]);
    });
    expect(await screen.findByText("1件を在庫に追加しました。")).toBeTruthy();
  });

  it("shows a clear error when photo upload fails", async () => {
    localStorage.setItem("stock-master:user-gemini-api-key", "user-owned-test-key");
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
    localStorage.setItem("stock-master:user-gemini-api-key", "user-owned-test-key");
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

  it("adds a manual shopping item from the shopping tab", async () => {
    const manualShopping = { ...baseShoppingItem, id: "shopping-manual", name: "牛乳", required_quantity: 2, unit: "本", linked_recipe_name: "", source_type: "manual" };
    const shoppingInsert = insertSingleQuery(manualShopping);
    from.mockReturnValue({ insert: shoppingInsert.insert });

    renderBoard();
    openShoppingView();

    fireEvent.change(screen.getByLabelText("買い物の品名"), { target: { value: "牛乳" } });
    fireEvent.change(screen.getByLabelText("買い物の数量"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("買い物の単位を検索・追加"), { target: { value: "本" } });
    fireEvent.keyDown(screen.getByLabelText("買い物の単位を検索・追加"), { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "手動追加" }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("shopping_items");
      expect(shoppingInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          name: "牛乳",
          required_quantity: 2,
          unit: "本",
          status: "未購入",
          linked_recipe_name: "",
          source_type: "manual"
        })
      );
    });
    expect(await screen.findByText("牛乳 を買い物リストへ追加しました。")).toBeTruthy();
  });

  it("marks a shopping item as purchased", async () => {
    const purchased = { ...baseShoppingItem, status: "購入済", purchased_at: "2026-05-24T10:00:00.000Z" };
    const shoppingUpdate = updateSingleQuery(purchased);
    from.mockReturnValue({ update: shoppingUpdate.update });

    renderBoard({ initialShoppingItems: [baseShoppingItem] });
    openShoppingView();

    fireEvent.click(screen.getByRole("button", { name: "購入済み" }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("shopping_items");
      expect(shoppingUpdate.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "購入済",
          purchased_at: expect.any(String)
        })
      );
    });
    expect(await screen.findByText("玉ねぎ を購入済みにしました。")).toBeTruthy();
    expect(within(screen.getByLabelText("購入済み")).getByText("玉ねぎ")).toBeTruthy();
  });

  it("bulk deletes selected shopping items", async () => {
    const deleteRows = deleteInQuery();
    from.mockReturnValue({ delete: deleteRows.deleteRows });

    renderBoard({
      initialShoppingItems: [
        baseShoppingItem,
        { ...baseShoppingItem, id: "shopping-2", name: "じゃがいも" }
      ]
    });
    openShoppingView();

    fireEvent.click(screen.getAllByLabelText("選択")[0]);
    fireEvent.click(screen.getAllByLabelText("選択")[1]);
    fireEvent.click(screen.getByRole("button", { name: "選択削除" }));
    expect(await screen.findByLabelText("削除確認")).toBeTruthy();
    fireEvent.click(within(screen.getByLabelText("削除確認")).getByRole("button", { name: "削除する" }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("shopping_items");
      expect(deleteRows.inIds).toHaveBeenCalledWith("id", ["shopping-1", "shopping-2"]);
    });
    expect(await screen.findByText("買い物を2件削除しました。")).toBeTruthy();
  });
});
