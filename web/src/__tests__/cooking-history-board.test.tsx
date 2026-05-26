import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CookingHistoryBoard } from "@/components/cooking-history-board";
import type { CookingHistoryItem } from "@/lib/cooking-history/types";

const from = vi.fn();
const storageFrom = vi.fn();
const compressImageFile = vi.fn();
const buildCookingHistoryPhotoStoragePath = vi.fn();

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({
    from,
    storage: {
      from: storageFrom
    }
  })
}));

vi.mock("@/lib/photos/compress", () => ({
  buildCookingHistoryPhotoStoragePath: () => buildCookingHistoryPhotoStoragePath(),
  compressImageFile: (file: File) => compressImageFile(file)
}));

const baseHistory: CookingHistoryItem = {
  id: "history-1",
  user_id: "user-1",
  cooked_at: "2026-05-24T10:00:00.000Z",
  recipe_id: null,
  recipe_name: "カレー",
  meal_schedule_id: null,
  note: "辛さ控えめ",
  rating: 4,
  created_at: "2026-05-24T10:00:00.000Z",
  updated_at: "2026-05-24T10:00:00.000Z",
  photos: []
};

function renderBoard(props?: Partial<React.ComponentProps<typeof CookingHistoryBoard>>) {
  return render(
    <CookingHistoryBoard
      initialHistory={props?.initialHistory ?? []}
      userId={props?.userId ?? "user-1"}
    />
  );
}

function insertQuery(data: unknown, error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data, error });
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));
  return { insert, select, single };
}

describe("CookingHistoryBoard", () => {
  beforeEach(() => {
    from.mockReset();
    storageFrom.mockReset();
    compressImageFile.mockReset();
    buildCookingHistoryPhotoStoragePath.mockReset();
    buildCookingHistoryPhotoStoragePath.mockReturnValue("user-1/cooking-history/photo-1.jpg");
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();
  });

  it("shows cooking history with and without photos", () => {
    renderBoard({
      initialHistory: [
        {
          ...baseHistory,
          photos: [
            {
              id: "photo-1",
              user_id: "user-1",
              bucket_id: "photos",
              storage_path: "user-1/cooking-history/photo-1.jpg",
              usage_type: "cooking_history",
              cooking_history_id: "history-1",
              content_type: "image/jpeg",
              byte_size: 100,
              width: 1024,
              height: 768,
              signed_url: "https://signed.example/photo.jpg",
              created_at: "2026-05-24T10:00:00.000Z",
              updated_at: "2026-05-24T10:00:00.000Z"
            }
          ]
        },
        { ...baseHistory, id: "history-2", recipe_name: "味噌汁", photos: [] }
      ]
    });

    expect(screen.getByRole("heading", { name: "料理履歴" })).toBeTruthy();
    expect(screen.getAllByText("カレー").length).toBeGreaterThan(0);
    expect(screen.getByAltText("カレーの完成写真")).toBeTruthy();
    expect(screen.getByText("味噌汁")).toBeTruthy();
    expect(screen.getAllByText("写真なし").length).toBeGreaterThan(0);
  });

  it("filters history and switches calendar and analysis views", () => {
    renderBoard({
      initialHistory: [
        baseHistory,
        { ...baseHistory, id: "history-2", recipe_name: "味噌汁", note: "朝食", rating: null, cooked_at: "2026-05-25T08:00:00.000Z", photos: [] }
      ]
    });

    fireEvent.change(screen.getByLabelText("料理履歴検索"), { target: { value: "味噌" } });
    expect(screen.getByText("味噌汁")).toBeTruthy();
    expect(screen.queryByText("辛さ控えめ")).toBeNull();

    fireEvent.change(screen.getByLabelText("料理履歴検索"), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("料理履歴評価フィルタ"), { target: { value: "1" } });
    expect(screen.getAllByText("カレー").length).toBeGreaterThan(0);
    expect(screen.queryByText("味噌汁")).toBeNull();

    fireEvent.change(screen.getByLabelText("料理履歴評価フィルタ"), { target: { value: "all" } });
    fireEvent.click(screen.getByRole("tab", { name: "カレンダー" }));
    expect(screen.getByLabelText("料理履歴カレンダー")).toBeTruthy();
    expect(screen.getByText("2026年5月")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "振り返り" }));
    expect(screen.getByLabelText("料理履歴振り返り")).toBeTruthy();
    expect(screen.getByText("最近よく作った")).toBeTruthy();
    expect(screen.getByText("ジャンル傾向")).toBeTruthy();
  });

  it("adds cooking history without a photo for the authenticated user", async () => {
    const cookingInsert = insertQuery({ ...baseHistory, id: "history-new", recipe_name: "親子丼", rating: null, photos: undefined });
    from.mockReturnValue({ insert: cookingInsert.insert });

    renderBoard();

    fireEvent.change(screen.getByLabelText("料理名"), { target: { value: "親子丼" } });
    fireEvent.change(screen.getByLabelText("調理日時"), { target: { value: "2026-05-24T19:30" } });
    fireEvent.change(screen.getByLabelText("メモ"), { target: { value: "卵を半熟にした" } });
    fireEvent.click(screen.getByRole("button", { name: "料理履歴を保存" }));

    await waitFor(() => {
      expect(from).toHaveBeenCalledWith("cooking_history");
      expect(cookingInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          recipe_name: "親子丼",
          note: "卵を半熟にした",
          rating: null
        })
      );
    });
    expect(await screen.findByText("写真なしで料理履歴を保存しました。")).toBeTruthy();
    expect(screen.getAllByText("親子丼").length).toBeGreaterThan(0);
    expect(storageFrom).not.toHaveBeenCalled();
  });

  it("compresses and uploads a cooking history photo", async () => {
    const cookingInsert = insertQuery({ ...baseHistory, id: "history-new", recipe_name: "焼き魚" });
    const photoInsert = insertQuery({
      id: "photo-new",
      user_id: "user-1",
      bucket_id: "photos",
      storage_path: "user-1/cooking-history/photo-1.jpg",
      usage_type: "cooking_history",
      cooking_history_id: "history-new",
      content_type: "image/jpeg",
      byte_size: 10,
      width: 1024,
      height: 768,
      created_at: "2026-05-24T10:00:00.000Z",
      updated_at: "2026-05-24T10:00:00.000Z"
    });
    const upload = vi.fn().mockResolvedValue({ error: null });
    const remove = vi.fn().mockResolvedValue({ error: null });
    const createSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: "https://signed.example/new.jpg" }, error: null });
    const compressedBlob = new Blob(["compressed"], { type: "image/jpeg" });

    from.mockImplementation((table: string) => {
      if (table === "cooking_history") return { insert: cookingInsert.insert };
      if (table === "photos") return { insert: photoInsert.insert };
      return {};
    });
    storageFrom.mockReturnValue({ upload, remove, createSignedUrl });
    compressImageFile.mockResolvedValue({
      blob: compressedBlob,
      byteSize: compressedBlob.size,
      contentType: "image/jpeg",
      width: 1024,
      height: 768
    });

    renderBoard();

    fireEvent.change(screen.getByLabelText("料理名"), { target: { value: "焼き魚" } });
    fireEvent.change(screen.getByLabelText("調理日時"), { target: { value: "2026-05-24T20:00" } });
    fireEvent.change(screen.getByLabelText("評価"), { target: { value: "5" } });
    fireEvent.change(screen.getByLabelText("写真を選ぶ"), {
      target: {
        files: [new File(["photo"], "dinner.jpg", { type: "image/jpeg" })]
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "料理履歴を保存" }));

    await waitFor(() => {
      expect(upload).toHaveBeenCalledWith("user-1/cooking-history/photo-1.jpg", compressedBlob, {
        contentType: "image/jpeg",
        upsert: false
      });
      expect(photoInsert.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: "user-1",
          bucket_id: "photos",
          storage_path: "user-1/cooking-history/photo-1.jpg",
          usage_type: "cooking_history",
          cooking_history_id: "history-new",
          content_type: "image/jpeg"
        })
      );
      expect(createSignedUrl).toHaveBeenCalledWith("user-1/cooking-history/photo-1.jpg", 60 * 30);
    });
    expect(await screen.findByText("完成写真付きで料理履歴を保存しました。")).toBeTruthy();
    expect(screen.getByAltText("焼き魚の完成写真")).toBeTruthy();
  });

  it("keeps the history text when photo upload fails", async () => {
    const cookingInsert = insertQuery({ ...baseHistory, id: "history-new", recipe_name: "パスタ" });
    const upload = vi.fn().mockResolvedValue({ error: new Error("upload failed") });

    from.mockReturnValue({ insert: cookingInsert.insert });
    storageFrom.mockReturnValue({ upload });
    compressImageFile.mockResolvedValue({
      blob: new Blob(["compressed"], { type: "image/jpeg" }),
      byteSize: 10,
      contentType: "image/jpeg",
      width: 1024,
      height: 768
    });

    renderBoard();

    fireEvent.change(screen.getByLabelText("料理名"), { target: { value: "パスタ" } });
    fireEvent.change(screen.getByLabelText("写真を選ぶ"), {
      target: {
        files: [new File(["photo"], "pasta.jpg", { type: "image/jpeg" })]
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "料理履歴を保存" }));

    expect(await screen.findByText(/原因: 完成写真をStorageへ保存できませんでした。/)).toBeTruthy();
    expect(screen.getAllByText("パスタ").length).toBeGreaterThan(0);
    expect(screen.getAllByText("写真なし").length).toBeGreaterThan(0);
    expect(from).not.toHaveBeenCalledWith("photos");
  });
});
