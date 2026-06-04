"use client";

import { TodayDashboard } from "@/components/today-dashboard";
import { useShellSubView, type ModeId, type ShellLeafId } from "@/components/web-mode-shell";
import type { StockItem } from "@/lib/inventory/types";
import type { CookCandidate, MealSchedule, ShoppingItem } from "@/lib/recipes/types";

type SummaryCard = {
  key: string;
  label: string;
  count: number;
  hint: string;
  group: ModeId;
  leaf: ShellLeafId;
};

type HomeDashboardProps = {
  inventoryCount: number;
  recipeCount: number;
  mealCount: number;
  historyCount: number;
  cookCandidates: CookCandidate[];
  inventoryItems: StockItem[];
  mealSchedules: MealSchedule[];
  shoppingItems: ShoppingItem[];
};

export function HomeDashboard({
  inventoryCount,
  recipeCount,
  mealCount,
  historyCount,
  cookCandidates,
  inventoryItems,
  mealSchedules,
  shoppingItems
}: HomeDashboardProps) {
  const { selectShellLeaf } = useShellSubView();

  const summaryCards: SummaryCard[] = [
    { key: "inventory", label: "在庫", count: inventoryCount, hint: "食材の残量と期限", group: "ingredients", leaf: "inventory" },
    { key: "recipes", label: "レシピ", count: recipeCount, hint: "保存済みレシピ", group: "recipes", leaf: "recipes" },
    { key: "meals", label: "献立", count: mealCount, hint: "予定の確認", group: "recipes", leaf: "schedule" },
    { key: "history", label: "料理の記録", count: historyCount, hint: "最近の料理履歴", group: "cooking", leaf: "timeline" }
  ];

  return (
    <div className="home-dashboard">
      <section className="home-hero" aria-labelledby="home-hero-heading">
        <p className="eyebrow">WELCOME</p>
        <h2 id="home-hero-heading">ようこそ！今日は何を作りましょう?</h2>
        <p className="home-hero-sub">在庫とレシピの状況をまとめて確認できます。</p>
      </section>

      <section className="home-summary" aria-label="サマリー">
        <div className="home-summary-grid">
          {summaryCards.map((card) => (
            <button
              className="home-summary-card"
              key={card.key}
              onClick={() => selectShellLeaf(card.group, card.leaf)}
              type="button"
            >
              <span className="home-summary-count">{card.count}</span>
              <strong className="home-summary-label">{card.label}</strong>
              <small className="home-summary-hint">{card.hint}</small>
            </button>
          ))}
        </div>
      </section>

      <TodayDashboard
        cookCandidates={cookCandidates}
        inventoryItems={inventoryItems}
        mealSchedules={mealSchedules}
        shoppingItems={shoppingItems}
      />
    </div>
  );
}
