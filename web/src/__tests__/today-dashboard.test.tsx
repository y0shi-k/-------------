import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TodayDashboard } from "@/components/today-dashboard";
import type { StockItem } from "@/lib/inventory/types";
import type { CookCandidate, MealSchedule, ShoppingItem } from "@/lib/recipes/types";

const inventoryItem: StockItem = {
  id: "stock-1",
  user_id: "user-1",
  category: "食材",
  name: "玉ねぎ",
  quantity: 2,
  unit: "個",
  unit_conversion: null,
  display_expires_on: "2026-05-27",
  effective_expires_on: null,
  storage_location: "冷蔵庫",
  status_note: "",
  source: "manual",
  image_storage_path: null,
  created_at: "2026-05-24T00:00:00.000Z",
  updated_at: "2026-05-24T00:00:00.000Z"
};

const schedule: MealSchedule = {
  id: "schedule-1",
  user_id: "user-1",
  scheduled_on: "2026-05-24",
  meal_type: "晩",
  recipe_id: "recipe-1",
  recipe_name: "カレー",
  status: "未完了",
  completed_at: null,
  created_at: "2026-05-24T00:00:00.000Z",
  updated_at: "2026-05-24T00:00:00.000Z"
};

const shoppingItem: ShoppingItem = {
  id: "shopping-1",
  user_id: "user-1",
  name: "牛乳",
  required_quantity: 1,
  unit: "本",
  status: "未購入",
  linked_recipe_name: "",
  source_type: "manual",
  purchased_at: null,
  created_at: "2026-05-24T00:00:00.000Z",
  updated_at: "2026-05-24T00:00:00.000Z"
};

const candidate: CookCandidate = {
  id: "candidate-1",
  user_id: "user-1",
  recipe_id: "recipe-1",
  recipe_name: "親子丼",
  reasons: ["家族リクエスト"],
  status: "候補",
  created_at: "2026-05-24T00:00:00.000Z",
  updated_at: "2026-05-24T00:00:00.000Z"
};

describe("TodayDashboard", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("summarizes today's schedule, expiring inventory, shopping, and candidates", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-24T09:00:00+09:00"));

    render(
      <TodayDashboard
        cookCandidates={[candidate]}
        inventoryItems={[inventoryItem]}
        mealSchedules={[schedule]}
        shoppingItems={[shoppingItem]}
      />
    );

    expect(screen.getByRole("heading", { name: "今日の確認" })).toBeTruthy();
    expect(screen.getByText("今日の献立")).toBeTruthy();
    expect(screen.getByText("カレー")).toBeTruthy();
    expect(screen.getByText("期限が近い在庫")).toBeTruthy();
    expect(screen.getByText("玉ねぎ")).toBeTruthy();
    expect(screen.getByText("未購入の買い物")).toBeTruthy();
    expect(screen.getByText("牛乳")).toBeTruthy();
    expect(screen.getByText("作りたい候補")).toBeTruthy();
    expect(screen.getByText("親子丼")).toBeTruthy();
  });
});
