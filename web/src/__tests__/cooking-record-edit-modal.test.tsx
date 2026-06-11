import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CookingRecordEditModal } from "@/components/cooking-record-edit-modal";
import type { CookingConsumptionEvent, CookingHistoryItem, CookingHistoryPhoto } from "@/lib/cooking-history/types";
import type { StockItem } from "@/lib/inventory/types";

// jsdom は objectURL を実装しないため、新規写真サムネ用にスタブする。
let objectUrlSeq = 0;
URL.createObjectURL = vi.fn(() => `blob:mock-${++objectUrlSeq}`);
URL.revokeObjectURL = vi.fn();

// 消費明細・レシピ材料の読み込みは空で解決させ、写真ドロップのUI挙動だけを検証する。
function makeQueryChain(data: unknown[] = []) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => Promise.resolve({ data, error: null }))
  };
  return chain;
}

const from = vi.fn(() => makeQueryChain());

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({ from })
}));

const baseItem: CookingHistoryItem = {
  id: "history-1",
  user_id: "user-1",
  cooked_at: "2026-05-24T10:00:00.000Z",
  recipe_id: null,
  recipe_name: "カレー",
  meal_schedule_id: null,
  note: "",
  rating: null,
  created_at: "2026-05-24T10:00:00.000Z",
  updated_at: "2026-05-24T10:00:00.000Z",
  photos: []
};

function renderModal() {
  const inventoryItems: StockItem[] = [];
  return render(
    <CookingRecordEditModal
      inventoryItems={inventoryItems}
      item={baseItem}
      onClose={vi.fn()}
      onSaved={vi.fn()}
      userId="user-1"
    />
  );
}

function dropFiles(files: File[]) {
  const area = screen.getByLabelText("完成写真");
  const dataTransfer = {
    files,
    types: ["Files"],
    dropEffect: "",
    items: []
  };
  fireEvent.drop(area, { dataTransfer });
}

describe("CookingRecordEditModal の完成写真ドロップ", () => {
  beforeEach(() => {
    from.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("画像を複数ドロップすると全件が追加候補に並ぶ", async () => {
    renderModal();
    // 読み込み完了（消費明細なしの案内）を待ってから操作する。
    await screen.findByText("消費量の明細はありません。写真・評価・コメントだけ編集できます。");

    const first = new File(["first"], "first.png", { type: "image/png" });
    const second = new File(["second"], "second.webp", { type: "image/webp" });
    dropFiles([first, second]);

    expect(await screen.findByRole("button", { name: "first.png を取り消す" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "second.webp を取り消す" })).toBeTruthy();
  });

  it("非画像ファイルをドロップしても追加されない", async () => {
    renderModal();
    await screen.findByText("消費量の明細はありません。写真・評価・コメントだけ編集できます。");

    const pdf = new File(["pdf"], "memo.pdf", { type: "application/pdf" });
    dropFiles([pdf]);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /を取り消す$/ })).toBeNull();
    });
  });

  it("クリップボードの画像を Ctrl+V で貼り付けると追加候補に並ぶ", async () => {
    renderModal();
    await screen.findByText("消費量の明細はありません。写真・評価・コメントだけ編集できます。");

    const area = screen.getByLabelText("完成写真");
    const pasted = new File(["pasted"], "clip.png", { type: "image/png" });
    fireEvent.paste(area, { clipboardData: { files: [pasted], types: ["Files"] } });

    expect(await screen.findByRole("button", { name: "clip.png を取り消す" })).toBeTruthy();
  });

  it("クリックでアクティブ化すると貼り付け案内が更新される", async () => {
    renderModal();
    await screen.findByText("消費量の明細はありません。写真・評価・コメントだけ編集できます。");

    const area = screen.getByLabelText("完成写真");
    expect(screen.getByText("クリックすると Ctrl+V で貼り付けできます")).toBeTruthy();

    fireEvent.focus(area);
    expect(area.getAttribute("data-active")).toBe("true");
    expect(screen.getByText("クリップボードから貼り付け可（Ctrl+V）")).toBeTruthy();
  });

  it("ドラッグ中はエリアにハイライトが付く", async () => {
    renderModal();
    await screen.findByText("消費量の明細はありません。写真・評価・コメントだけ編集できます。");

    const area = screen.getByLabelText("完成写真");
    fireEvent.dragOver(area, { dataTransfer: { types: ["Files"], dropEffect: "" } });
    expect(area.getAttribute("data-dragging-over")).toBe("true");

    fireEvent.drop(area, { dataTransfer: { files: [], types: ["Files"], dropEffect: "" } });
    expect(area.getAttribute("data-dragging-over")).toBe("false");
  });

  it("新規追加した写真がサムネ画像で表示される", async () => {
    renderModal();
    await screen.findByText("消費量の明細はありません。写真・評価・コメントだけ編集できます。");

    dropFiles([new File(["a"], "first.png", { type: "image/png" })]);

    const thumb = await screen.findByAltText("追加する写真 1（first.png）");
    expect(thumb.getAttribute("src")).toMatch(/^blob:mock-/);
  });
});

function makePhoto(id: string): CookingHistoryPhoto {
  return {
    id,
    user_id: "user-1",
    bucket_id: "photos",
    storage_path: `cooking/${id}.webp`,
    usage_type: "cooking_history",
    cooking_history_id: "history-1",
    content_type: "image/webp",
    byte_size: 1000,
    width: 800,
    height: 600,
    signed_url: `https://example.test/${id}.webp`,
    created_at: "2026-05-24T10:00:00.000Z",
    updated_at: "2026-05-24T10:00:00.000Z"
  };
}

function renderModalWithPhotos(photos: CookingHistoryPhoto[]) {
  return render(
    <CookingRecordEditModal
      inventoryItems={[]}
      item={{ ...baseItem, photos }}
      onClose={vi.fn()}
      onSaved={vi.fn()}
      userId="user-1"
    />
  );
}

describe("CookingRecordEditModal の既存写真削除UI", () => {
  beforeEach(() => {
    from.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("×で既存写真を即非表示にし「削除予定」表示が出る", async () => {
    renderModalWithPhotos([makePhoto("p1"), makePhoto("p2")]);
    await screen.findByText("消費量の明細はありません。写真・評価・コメントだけ編集できます。");

    const removeButtons = screen.getAllByRole("button", { name: "この写真を削除" });
    expect(removeButtons).toHaveLength(2);

    fireEvent.click(removeButtons[0]);

    expect(screen.getAllByRole("button", { name: "この写真を削除" })).toHaveLength(1);
    expect(screen.getByText(/削除予定 1件/)).toBeTruthy();
  });

  it("「元に戻す」で削除予定を復元する", async () => {
    renderModalWithPhotos([makePhoto("p1"), makePhoto("p2")]);
    await screen.findByText("消費量の明細はありません。写真・評価・コメントだけ編集できます。");

    fireEvent.click(screen.getAllByRole("button", { name: "この写真を削除" })[0]);
    expect(screen.getByText(/削除予定 1件/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "元に戻す" }));

    expect(screen.getAllByRole("button", { name: "この写真を削除" })).toHaveLength(2);
    expect(screen.queryByText(/削除予定/)).toBeNull();
  });
});

const baseConsumptionEvent: CookingConsumptionEvent = {
  id: "event-1",
  user_id: "user-1",
  cooking_history_id: "history-1",
  meal_schedule_id: null,
  recipe_id: "recipe-1",
  ingredient_name: "卵",
  requested_amount: 2,
  requested_unit: "個",
  consumed_amount: 2,
  consumed_unit: "個",
  stock_item_id: "stock-egg",
  stock_item_name: "卵",
  substitute_for: "",
  created_at: "2026-06-01T00:00:00.000Z"
};

const baseConsumptionStock: StockItem = {
  id: "stock-egg",
  user_id: "user-1",
  category: "食材",
  name: "卵",
  quantity: 5,
  unit: "個",
  unit_conversion: null,
  display_expires_on: null,
  effective_expires_on: null,
  storage_location: "冷蔵庫",
  status_note: "",
  source: "manual",
  image_storage_path: null,
  created_at: "2026-06-01T00:00:00.000Z",
  updated_at: "2026-06-01T00:00:00.000Z"
};

describe("ConsumptionEditList の在庫セレクト optgroup", () => {
  beforeEach(() => {
    from.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("消費明細がある場合、在庫セレクトに「おすすめ（同分類・同単位）」optgroup が表示される", async () => {
    // cooking_consumption_events に1件、recipe_ingredients は空で返す。
    const otherStock: StockItem = { ...baseConsumptionStock, id: "stock-other", name: "醤油", category: "調味料", unit: "ml" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (from as any).mockImplementation((table: string) => {
      if (table === "cooking_consumption_events") return makeQueryChain([baseConsumptionEvent]);
      return makeQueryChain([]);
    });

    render(
      <CookingRecordEditModal
        inventoryItems={[baseConsumptionStock, otherStock]}
        item={{ ...baseItem, recipe_id: "recipe-1" }}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        userId="user-1"
      />
    );

    // 消費量リストの表示を待つ。
    await waitFor(() => {
      expect(screen.queryByText("消費量を読み込んでいます...")).toBeNull();
    });

    const select = screen.getByLabelText("減らす在庫");
    const recommendedGroup = within(select).getByRole("group", { name: "おすすめ（同分類・同単位）" });
    expect(recommendedGroup).toBeTruthy();
    // 同分類・同単位の「卵」がおすすめに入っている。
    expect(within(recommendedGroup).getByRole("option", { name: /卵/ })).toBeTruthy();
  });

  it("同分類・同単位以外の在庫は「その他の在庫（代替材料）」に分類される", async () => {
    const otherStock: StockItem = { ...baseConsumptionStock, id: "stock-other", name: "醤油", category: "調味料", unit: "ml" };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (from as any).mockImplementation((table: string) => {
      if (table === "cooking_consumption_events") return makeQueryChain([baseConsumptionEvent]);
      return makeQueryChain([]);
    });

    render(
      <CookingRecordEditModal
        inventoryItems={[baseConsumptionStock, otherStock]}
        item={{ ...baseItem, recipe_id: "recipe-1" }}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        userId="user-1"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText("消費量を読み込んでいます...")).toBeNull();
    });

    const select = screen.getByLabelText("減らす在庫");
    const othersGroup = within(select).getByRole("group", { name: "その他の在庫（代替材料）" });
    expect(othersGroup).toBeTruthy();
    expect(within(othersGroup).getByRole("option", { name: /醤油/ })).toBeTruthy();
  });
});
