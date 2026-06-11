"use client";

import { useMemo, useState } from "react";
import { TodayDashboard } from "@/components/today-dashboard";
import { RecipeThumb } from "@/components/ui/recipe-thumb";
import { useShellNavigation, useShellSubView, type ModeId, type ShellLeafId } from "@/components/web-mode-shell";
import type { StockItem } from "@/lib/inventory/types";
import type { CookCandidate, MealSchedule, Recipe, ShoppingItem } from "@/lib/recipes/types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { useRecipeImageUrls } from "@/lib/photos/use-recipe-image-urls";

const HOME_HERO_IMAGE = "/images/hero/home-hero.webp";

type SummaryCard = {
  key: string;
  label: string;
  count: number;
  hint: string;
  group: ModeId;
  leaf: ShellLeafId;
};

type FeaturedRecipes = {
  title: string;
  eyebrow: string;
  recipes: Recipe[];
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
  recipes?: Recipe[];
};

/** cooked_on_history（日付配列）の最新日を返す。空なら空文字。 */
function latestCookedDate(recipe: Recipe): string {
  if (recipe.cooked_on_history.length === 0) return "";
  return [...recipe.cooked_on_history].sort((a, b) => b.localeCompare(a))[0] ?? "";
}

/**
 * 既存データ（recipes）から写真カードで紹介するレシピを選ぶ。新規クエリは増やさない。
 * 1) 最近作ったレシピ（cooked_on_history あり、最新日降順）
 * 2) なければお気に入り（is_favorite）
 * どちらも無ければ null（枠を出さない）。
 */
function pickFeaturedRecipes(recipes: Recipe[]): FeaturedRecipes | null {
  const recentlyCooked = recipes
    .filter((recipe) => recipe.cooked_on_history.length > 0)
    .sort((a, b) => latestCookedDate(b).localeCompare(latestCookedDate(a)))
    .slice(0, 6);
  if (recentlyCooked.length > 0) {
    return { title: "最近作ったレシピ", eyebrow: "Recently cooked", recipes: recentlyCooked };
  }

  const favorites = recipes.filter((recipe) => recipe.is_favorite).slice(0, 6);
  if (favorites.length > 0) {
    return { title: "お気に入りレシピ", eyebrow: "Favorites", recipes: favorites };
  }

  return null;
}

/** レシピカードの補足テキスト（ジャンル優先、無ければ調理回数）。 */
function featuredHint(recipe: Recipe): string {
  const genre = recipe.genre.filter(Boolean).slice(0, 2).join(" / ");
  if (genre) return genre;
  if (recipe.cook_count > 0) return `${recipe.cook_count}回作った`;
  return "レシピを見る";
}

export function HomeDashboard({
  inventoryCount,
  recipeCount,
  mealCount,
  historyCount,
  cookCandidates,
  inventoryItems,
  mealSchedules,
  shoppingItems,
  recipes = []
}: HomeDashboardProps) {
  const { selectShellLeaf } = useShellSubView();
  const { requestViewRecipe } = useShellNavigation();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const recipeImageUrls = useRecipeImageUrls(recipes, supabase);

  const summaryCards: SummaryCard[] = [
    { key: "inventory", label: "在庫", count: inventoryCount, hint: "食材の残量と期限", group: "ingredients", leaf: "inventory" },
    { key: "recipes", label: "レシピ", count: recipeCount, hint: "保存済みレシピ", group: "recipes", leaf: "recipes" },
    { key: "meals", label: "献立", count: mealCount, hint: "予定の確認", group: "recipes", leaf: "schedule" },
    { key: "history", label: "料理の記録", count: historyCount, hint: "最近の料理履歴", group: "cooking", leaf: "timeline" }
  ];

  const featured = pickFeaturedRecipes(recipes);

  return (
    <div className="home-dashboard">
      <HomeHero />

      {featured ? (
        <section className="home-feature" aria-labelledby="home-feature-heading">
          <div className="section-heading compact-section-heading">
            <p className="eyebrow">{featured.eyebrow}</p>
            <h2 id="home-feature-heading">{featured.title}</h2>
          </div>
          <div className="home-feature-grid">
            {featured.recipes.map((recipe) => (
              <button
                className="home-feature-card"
                key={recipe.id}
                onClick={() => requestViewRecipe(recipe.id)}
                type="button"
                title={`${recipe.name}の調理ビューを開く`}
              >
                <RecipeThumb imageUrl={recipeImageUrls.get(recipe.id) ?? null} recipe={recipe} size="card" />
                <div className="home-feature-meta">
                  <strong className="home-feature-name">{recipe.name}</strong>
                  <small className="home-feature-hint">{featuredHint(recipe)}</small>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="home-summary" aria-label="サマリー">
        <div className="home-summary-grid">
          {summaryCards.map((card) => (
            <button
              className="home-summary-card"
              key={card.key}
              onClick={() => selectShellLeaf(card.group, card.leaf)}
              type="button"
              data-tooltip={card.hint}
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

/**
 * ホーム上部のヒーロー。`home-hero.webp` があればイラストを併記し、無い/読込失敗時は
 * 従来のテキストヒーローにフォールバックする（§8.1）。テキストは常に表示するため、
 * 画像ゼロでもレイアウトは崩れない。
 */
function HomeHero() {
  const [artFailed, setArtFailed] = useState(false);

  return (
    <section className="home-hero" aria-labelledby="home-hero-heading">
      <div className="home-hero-text">
        <p className="eyebrow">WELCOME</p>
        <h2 id="home-hero-heading">ようこそ！今日は何を作りましょう?</h2>
        <p className="home-hero-sub">在庫とレシピの状況をまとめて確認できます。</p>
      </div>
      {artFailed ? null : (
        // eslint-disable-next-line @next/next/no-img-element -- 静的デモ画像。onError フォールバックのため next/image は使わない（§8.4）。
        <img
          className="home-hero-art"
          src={HOME_HERO_IMAGE}
          alt=""
          aria-hidden="true"
          loading="lazy"
          onError={() => setArtFailed(true)}
        />
      )}
    </section>
  );
}
