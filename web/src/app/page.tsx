import { redirect } from "next/navigation";
import { CookingHistoryBoard } from "@/components/cooking-history-board";
import { InventoryBoard } from "@/components/inventory-board";
import { RecipeMealWorkspace } from "@/components/recipe-meal-workspace";
import { WebModeShell } from "@/components/web-mode-shell";
import type { CookingHistoryItem, CookingHistoryPhoto } from "@/lib/cooking-history/types";
import type { StockItem, StorageLocation } from "@/lib/inventory/types";
import type { CookCandidate, MealSchedule, Recipe, RecipeIngredient, ShoppingItem } from "@/lib/recipes/types";
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
    { data: inventoryItems },
    { data: cookingHistory },
    { data: recipes },
    { data: recipeIngredients },
    { data: mealSchedules },
    { data: shoppingItems },
    { data: cookCandidates },
    { data: storageLocations }
  ] = await Promise.all([
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
      .order("created_at", { ascending: false }),
    supabase
      .from("cook_candidates")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "候補")
      .order("created_at", { ascending: false }),
    supabase
      .from("storage_locations")
      .select("*")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
  ]);
  const recipeRows = (recipes ?? []) as Omit<Recipe, "ingredients">[];
  const ingredientRows = (recipeIngredients ?? []) as RecipeIngredient[];
  const recipesWithIngredients = recipeRows.map((recipe) => ({
    ...recipe,
    genre: Array.isArray(recipe.genre) ? recipe.genre : [],
    prep_steps: Array.isArray(recipe.prep_steps) ? recipe.prep_steps : [],
    steps: Array.isArray(recipe.steps) ? recipe.steps : [],
    cooked_on_history: Array.isArray(recipe.cooked_on_history) ? recipe.cooked_on_history : [],
    is_favorite: Boolean(recipe.is_favorite),
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
    <main className="app-shell web-app-shell">
      <WebModeShell
        childrenByMode={{
          ingredients: (
            <InventoryBoard
              initialInventoryItems={(inventoryItems ?? []) as StockItem[]}
              initialShoppingItems={(shoppingItems ?? []) as ShoppingItem[]}
              initialStorageLocations={(storageLocations ?? []) as StorageLocation[]}
              key="ingredients"
              userId={user.id}
            />
          ),
          recipes: (
            <RecipeMealWorkspace
              initialInventoryItems={(inventoryItems ?? []) as StockItem[]}
              initialCookCandidates={(cookCandidates ?? []) as CookCandidate[]}
              initialMealSchedules={(mealSchedules ?? []) as MealSchedule[]}
              initialRecipes={recipesWithIngredients as Recipe[]}
              key="recipes"
              userId={user.id}
            />
          ),
          cooking: (
            <div className="cooking-record-stack" key="cooking">
              <CookingHistoryBoard
                initialHistory={cookingHistoryWithPhotos as CookingHistoryItem[]}
                initialInventoryItems={(inventoryItems ?? []) as StockItem[]}
                userId={user.id}
              />
            </div>
          )
        }}
        historyCount={cookingHistoryWithPhotos.length}
        inventoryCount={(inventoryItems ?? []).length}
        mealCount={(mealSchedules ?? []).length}
        recipeCount={recipesWithIngredients.length}
        userEmail={user.email ?? "ログイン中のユーザー"}
      />
    </main>
  );
}
