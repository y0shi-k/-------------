import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CookingHistoryBoard } from "@/components/cooking-history-board";
import type { CookingHistoryItem } from "@/lib/cooking-history/types";
import type { MealSchedule } from "@/lib/recipes/types";

const shellMocks = vi.hoisted(() => ({
  requestViewRecipe: vi.fn(),
  selectedSubViews: {
    ingredients: "inventory" as "inventory" | "shopping",
    recipes: "recipes" as "recipes" | "schedule",
    cooking: "timeline" as "calendar" | "timeline" | "insights"
  },
  selectShellLeaf: vi.fn()
}));

vi.mock("@/components/web-mode-shell", () => ({
  useShellNavigation: () => ({
    clearPendingRecipe: vi.fn(),
    pendingRecipeId: null,
    pendingRecipeOrigin: "recipes",
    returnToMode: vi.fn(),
    requestViewRecipe: shellMocks.requestViewRecipe
  }),
  useShellSubView: () => ({
    activeDesktopTarget: { group: "cooking", kind: "mode", leaf: shellMocks.selectedSubViews.cooking },
    selectedSubViews: shellMocks.selectedSubViews,
    selectShellLeaf: shellMocks.selectShellLeaf
  })
}));

vi.mock("@/components/cooking-record-edit-modal", () => ({
  CookingRecordEditModal: ({ item, onClose }: { item: CookingHistoryItem; onClose: () => void }) => (
    <div role="dialog" aria-label="料理記録を編集">
      <p>{item.recipe_name}を編集中</p>
      <button onClick={onClose} type="button">閉じる</button>
    </div>
  )
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn()
  })
}));

vi.mock("@/lib/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({})
}));

// 共有署名URLキャッシュは storage_path を同期解決する（テストでは即時に URL を返す）。
vi.mock("@/lib/photos/signed-url-cache", () => ({
  useCachedSignedUrls: (_client: unknown, paths: Array<string | null | undefined>) =>
    new Map(
      paths
        .filter((path): path is string => Boolean(path))
        .map((path) => [path, `https://signed.example/${path}`])
    )
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

function buildPhoto(id: string, signedUrl = `https://signed.example/${id}.jpg`) {
  return {
    id,
    user_id: "user-1",
    bucket_id: "photos",
    storage_path: `user-1/cooking-history/${id}.jpg`,
    usage_type: "cooking_history",
    cooking_history_id: "history-1",
    content_type: "image/jpeg",
    byte_size: 100,
    width: 1024,
    height: 768,
    signed_url: signedUrl,
    created_at: "2026-05-24T10:00:00.000Z",
    updated_at: "2026-05-24T10:00:00.000Z"
  };
}

const baseSchedule: MealSchedule = {
  id: "schedule-1",
  user_id: "user-1",
  scheduled_on: "2026-05-24",
  meal_type: "晩",
  recipe_id: "recipe-9",
  recipe_name: "肉じゃが",
  status: "未完了",
  completed_at: null,
  created_at: "2026-05-20T00:00:00.000Z",
  updated_at: "2026-05-20T00:00:00.000Z"
};

function renderBoard(props?: Partial<React.ComponentProps<typeof CookingHistoryBoard>>) {
  return render(
    <CookingHistoryBoard
      initialHistory={props?.initialHistory ?? []}
      initialInventoryItems={props?.initialInventoryItems ?? []}
      initialMealSchedules={props?.initialMealSchedules ?? []}
      userId={props?.userId ?? "user-1"}
    />
  );
}

describe("CookingHistoryBoard", () => {
  beforeEach(() => {
    shellMocks.requestViewRecipe.mockReset();
    shellMocks.selectShellLeaf.mockReset();
    shellMocks.selectedSubViews = {
      ingredients: "inventory",
      recipes: "recipes",
      cooking: "timeline"
    };
  });

  it("shows cooking history with and without photos", () => {
    renderBoard({
      initialHistory: [
        {
          ...baseHistory,
          photos: [buildPhoto("photo-1", "https://signed.example/photo.jpg")]
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

  it("shows a photo count badge and opens the read-only photo viewer", () => {
    renderBoard({
      initialHistory: [
        {
          ...baseHistory,
          photos: [buildPhoto("photo-1"), buildPhoto("photo-2")]
        }
      ]
    });

    expect(screen.getByText("📷2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "カレーの写真を表示" }));

    const dialog = screen.getByRole("dialog", { name: "カレー" });
    expect(within(dialog).getAllByAltText(/カレーの完成写真/)).toHaveLength(2);
    expect(within(dialog).getByLabelText("評価 4/5")).toBeTruthy();
    expect(within(dialog).getByText("辛さ控えめ")).toBeTruthy();
  });

  it("moves from the read-only photo viewer to the existing edit modal", () => {
    renderBoard({
      initialHistory: [
        {
          ...baseHistory,
          photos: [buildPhoto("photo-1"), buildPhoto("photo-2")]
        }
      ]
    });

    fireEvent.click(screen.getByRole("button", { name: "カレーの写真を表示" }));
    fireEvent.click(within(screen.getByRole("dialog", { name: "カレー" })).getByRole("button", { name: "編集" }));

    expect(screen.getByRole("dialog", { name: "料理記録を編集" })).toBeTruthy();
    expect(screen.getByText("カレーを編集中")).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: "カレー" })).toBeNull();
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

  it("shows the edit action for every history card and opens the edit modal", () => {
    renderBoard({
      initialHistory: [
        baseHistory,
        { ...baseHistory, id: "history-2", recipe_id: null, recipe_name: "手入力の記録" }
      ]
    });

    expect(screen.getAllByRole("button", { name: "編集" })).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: "編集" })[1]);
    expect(screen.getByRole("dialog", { name: "料理記録を編集" })).toBeTruthy();
    expect(screen.getByText("手入力の記録を編集中")).toBeTruthy();
  });

  it("moves the recipe viewer action into the photo modal (only when recipe_id exists)", () => {
    renderBoard({
      initialHistory: [
        baseHistory,
        { ...baseHistory, id: "history-2", recipe_id: null, recipe_name: "手入力ごはん" }
      ]
    });

    // カード本体には「レシピを見る」は無い（モーダルへ移設した）。
    expect(screen.queryByRole("button", { name: "レシピを見る" })).toBeNull();
    expect(screen.queryByRole("button", { name: "写真を開く" })).toBeNull();
    expect(screen.queryByRole("button", { name: "もう一度作る" })).toBeNull();

    // recipe_id ありの記録を開くとモーダル内に「レシピを見る」が出る。
    fireEvent.click(screen.getByRole("button", { name: "カレーの記録を開く" }));
    const dialog = screen.getByRole("dialog", { name: "カレー" });
    fireEvent.click(within(dialog).getByRole("button", { name: "レシピを見る" }));
    expect(shellMocks.requestViewRecipe).toHaveBeenCalledWith("recipe-1", "cooking");

    // recipe_id なしの記録を開いてもモーダルに「レシピを見る」は出ない。
    fireEvent.click(screen.getByRole("button", { name: "手入力ごはんの記録を開く" }));
    const manualDialog = screen.getByRole("dialog", { name: "手入力ごはん" });
    expect(within(manualDialog).queryByRole("button", { name: "レシピを見る" })).toBeNull();
  });

  it("opens the photo modal from the card body and from a thumbnail in the grid", () => {
    renderBoard({
      initialHistory: [
        { ...baseHistory, photos: [buildPhoto("p1"), buildPhoto("p2"), buildPhoto("p3")] }
      ]
    });

    // 2枚目以降のサムネクリックで写真モーダルが開く。
    fireEvent.click(screen.getByRole("button", { name: "カレーの写真 2を表示" }));
    expect(screen.getByRole("dialog", { name: "カレー" })).toBeTruthy();
  });

  it("collapses extra photos into a +N overflow tile that opens the photo modal", () => {
    renderBoard({
      initialHistory: [
        {
          ...baseHistory,
          photos: Array.from({ length: 9 }, (_, index) => buildPhoto(`p${index + 1}`))
        }
      ]
    });

    // 9枚 → 左1枚＋格子に上限6枚、残り2枚は最後のサムネに +2 オーバーレイ。
    expect(screen.getByText("+2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "他2枚を含む写真を表示" }));
    expect(screen.getByRole("dialog", { name: "カレー" })).toBeTruthy();
  });

  it("opens only the edit modal (not the photo modal) when the edit button is clicked", () => {
    renderBoard({ initialHistory: [baseHistory] });

    fireEvent.click(screen.getByRole("button", { name: "編集" }));
    expect(screen.getByRole("dialog", { name: "料理記録を編集" })).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: "カレー" })).toBeNull();
  });

  it("syncs the view tab selection to the shell sidebar leaf", () => {
    renderBoard({ initialHistory: [baseHistory] });

    fireEvent.click(screen.getByRole("tab", { name: "カレンダー" }));
    expect(shellMocks.selectShellLeaf).toHaveBeenCalledWith("cooking", "calendar");

    fireEvent.click(screen.getByRole("tab", { name: "振り返り" }));
    expect(shellMocks.selectShellLeaf).toHaveBeenCalledWith("cooking", "insights");
  });

  it("shows incomplete meal schedules as rows on the selected calendar day", () => {
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    renderBoard({
      // 記録は recipe_id なし → カレンダー詳細の「レシピを見る」は予定行のものだけになる。
      initialHistory: [{ ...baseHistory, recipe_id: null, cooked_at: `${key}T10:00:00.000Z` }],
      initialMealSchedules: [
        { ...baseSchedule, scheduled_on: key },
        { ...baseSchedule, id: "schedule-done", recipe_name: "完了済み献立", status: "完了", scheduled_on: key }
      ]
    });

    fireEvent.click(screen.getByRole("tab", { name: "カレンダー" }));
    expect(screen.getByLabelText("この日の未完了の献立予定")).toBeTruthy();
    expect(screen.getByText("肉じゃが")).toBeTruthy();
    // 完了済みの予定は予定行に出さない。
    expect(screen.queryByText("完了済み献立")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "レシピを見る" }));
    expect(shellMocks.requestViewRecipe).toHaveBeenCalledWith("recipe-9", "cooking");
  });

  it("renders the view driven by the shell sub-view selection", () => {
    shellMocks.selectedSubViews = {
      ingredients: "inventory",
      recipes: "recipes",
      cooking: "insights"
    };

    renderBoard({ initialHistory: [baseHistory] });

    expect(screen.getByLabelText("料理履歴振り返り")).toBeTruthy();
    expect(screen.queryByLabelText("料理履歴カレンダー")).toBeNull();
  });
});
