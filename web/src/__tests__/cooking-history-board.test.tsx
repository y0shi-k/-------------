import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CookingHistoryBoard } from "@/components/cooking-history-board";
import type { CookingHistoryItem } from "@/lib/cooking-history/types";

const shellMocks = vi.hoisted(() => ({
  requestViewRecipe: vi.fn()
}));

vi.mock("@/components/web-mode-shell", () => ({
  useShellNavigation: () => ({
    clearPendingRecipe: vi.fn(),
    pendingRecipeId: null,
    pendingRecipeOrigin: "recipes",
    returnToMode: vi.fn(),
    requestViewRecipe: shellMocks.requestViewRecipe
  })
}));

const baseHistory: CookingHistoryItem = {
  id: "history-1",
  user_id: "user-1",
  cooked_at: "2026-05-24T10:00:00.000Z",
  recipe_id: "recipe-1",
  recipe_name: "カレー",
  meal_schedule_id: null,
  note: "辛さ控えめ",
  rating: 4,
  created_at: "2026-05-24T10:00:00.000Z",
  updated_at: "2026-05-24T10:00:00.000Z",
  photos: []
};

function renderBoard(props?: Partial<React.ComponentProps<typeof CookingHistoryBoard>>) {
  return render(<CookingHistoryBoard initialHistory={props?.initialHistory ?? []} />);
}

describe("CookingHistoryBoard", () => {
  beforeEach(() => {
    shellMocks.requestViewRecipe.mockReset();
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
        { ...baseHistory, id: "history-2", recipe_id: null, recipe_name: "味噌汁", photos: [] }
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
        { ...baseHistory, id: "history-2", recipe_id: "recipe-2", recipe_name: "味噌汁", note: "朝食", rating: null, cooked_at: "2026-05-25T08:00:00.000Z", photos: [] }
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
    expect(screen.getByText(/年\d+月/)).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "振り返り" }));
    expect(screen.getByLabelText("料理履歴振り返り")).toBeTruthy();
    expect(screen.getByText("最近よく作った")).toBeTruthy();
    expect(screen.getByText("ジャンル傾向")).toBeTruthy();
  });

  it("removes the manual cooking history form", () => {
    renderBoard();

    expect(screen.queryByText("料理履歴を追加")).toBeNull();
    expect(screen.queryByLabelText("料理名")).toBeNull();
    expect(screen.queryByLabelText("写真を選ぶ")).toBeNull();
    expect(screen.getByText("料理履歴はまだありません。献立の「料理を完了する」から記録できます。")).toBeTruthy();
  });

  it("shows only the recipe viewer action when recipe_id exists", () => {
    renderBoard({
      initialHistory: [
        baseHistory,
        { ...baseHistory, id: "history-2", recipe_id: null, recipe_name: "手入力の記録" }
      ]
    });

    expect(screen.queryByRole("button", { name: "写真を開く" })).toBeNull();
    expect(screen.queryByRole("button", { name: "もう一度作る" })).toBeNull();
    expect(screen.getAllByRole("button", { name: "レシピを見る" })).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: "レシピを見る" }));
    expect(shellMocks.requestViewRecipe).toHaveBeenCalledWith("recipe-1", "cooking");
  });
});
