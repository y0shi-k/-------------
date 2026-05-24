import { redirect } from "next/navigation";
import { CookingHistoryBoard } from "@/components/cooking-history-board";
import { InventoryBoard } from "@/components/inventory-board";
import { RecipeMealWorkspace } from "@/components/recipe-meal-workspace";
import { SetupStatus } from "@/components/setup-status";
import { LogoutButton } from "@/components/logout-button";
import type { CookingHistoryItem, CookingHistoryPhoto } from "@/lib/cooking-history/types";
import type { StockItem } from "@/lib/inventory/types";
import type { MealSchedule, Recipe, RecipeIngredient, ShoppingItem } from "@/lib/recipes/types";
import { setupSteps } from "@/lib/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    { data: stagingItems },
    { data: inventoryItems },
    { data: cookingHistory },
    { data: recipes },
    { data: recipeIngredients },
    { data: mealSchedules },
    { data: shoppingItems }
  ] = await Promise.all([
    supabase
      .from("staging_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("inventory_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("cooking_history")
      .select("*")
      .eq("user_id", user.id)
      .order("cooked_at", { ascending: false })
      .limit(30),
    supabase
      .from("recipes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("recipe_ingredients")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("meal_schedules")
      .select("*")
      .eq("user_id", user.id)
      .order("scheduled_on", { ascending: true }),
    supabase
      .from("shopping_items")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
  ]);
  const recipeRows = (recipes ?? []) as Omit<Recipe, "ingredients">[];
  const ingredientRows = (recipeIngredients ?? []) as RecipeIngredient[];
  const recipesWithIngredients = recipeRows.map((recipe) => ({
    ...recipe,
    genre: Array.isArray(recipe.genre) ? recipe.genre : [],
    prep_steps: Array.isArray(recipe.prep_steps) ? recipe.prep_steps : [],
    steps: Array.isArray(recipe.steps) ? recipe.steps : [],
    cooked_on_history: Array.isArray(recipe.cooked_on_history) ? recipe.cooked_on_history : [],
    ingredients: ingredientRows.filter((ingredient) => ingredient.recipe_id === recipe.id)
  }));
  const cookingHistoryRows = (cookingHistory ?? []) as Omit<CookingHistoryItem, "photos">[];
  const historyIds = cookingHistoryRows.map((item) => item.id);
  const { data: historyPhotos } =
    historyIds.length > 0
      ? await supabase
          .from("photos")
          .select("*")
          .eq("user_id", user.id)
          .eq("usage_type", "cooking_history")
          .in("cooking_history_id", historyIds)
          .order("created_at", { ascending: false })
      : { data: [] };
  const signedPhotos = await Promise.all(
    ((historyPhotos ?? []) as CookingHistoryPhoto[]).map(async (photo) => {
      const { data } = await supabase.storage.from(photo.bucket_id).createSignedUrl(photo.storage_path, 60 * 30);
      return { ...photo, signed_url: data?.signedUrl ?? null };
    })
  );
  const cookingHistoryWithPhotos = cookingHistoryRows.map((item) => ({
    ...item,
    photos: signedPhotos.filter((photo) => photo.cooking_history_id === item.id)
  }));

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Stock Master</p>
          <h1 id="page-title">在庫管理のWeb版ホーム</h1>
          <p className="lead">
            {user.email ?? "ログイン中のユーザー"} の在庫、レシピ、献立、料理履歴だけを扱います。
          </p>
        </div>
        <div className="summary-box" aria-label="今回の範囲">
          <span>Scope</span>
          <strong>TKT-0109</strong>
          <p>レシピ、献立、買い物、調理完了をSupabaseへ保存します。</p>
          <LogoutButton />
        </div>
      </section>

      <RecipeMealWorkspace
        initialInventoryItems={(inventoryItems ?? []) as StockItem[]}
        initialMealSchedules={(mealSchedules ?? []) as MealSchedule[]}
        initialRecipes={recipesWithIngredients as Recipe[]}
        initialShoppingItems={(shoppingItems ?? []) as ShoppingItem[]}
        userId={user.id}
      />
      <CookingHistoryBoard
        initialHistory={cookingHistoryWithPhotos as CookingHistoryItem[]}
        key={cookingHistoryWithPhotos.map((item) => item.id).join(":")}
        userId={user.id}
      />
      <InventoryBoard
        initialInventoryItems={(inventoryItems ?? []) as StockItem[]}
        initialStagingItems={(stagingItems ?? []) as StockItem[]}
        userId={user.id}
      />
      <SetupStatus steps={setupSteps} />
    </main>
  );
}
