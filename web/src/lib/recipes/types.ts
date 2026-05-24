export type MealType = "朝" | "昼" | "晩" | "その他";
export type MealScheduleStatus = "未完了" | "完了";
export type RecipeIngredientType = "食材" | "調味料";

export type RecipeIngredient = {
  id: string;
  user_id: string;
  recipe_id: string;
  item_type: RecipeIngredientType;
  name: string;
  amount: number;
  unit: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Recipe = {
  id: string;
  user_id: string;
  name: string;
  source: string;
  genre: string[];
  steps: string[];
  prep_steps: string[];
  cook_count: number;
  cooked_on_history: string[];
  created_at: string;
  updated_at: string;
  ingredients: RecipeIngredient[];
};

export type MealSchedule = {
  id: string;
  user_id: string;
  scheduled_on: string;
  meal_type: MealType;
  recipe_id: string | null;
  recipe_name: string;
  status: MealScheduleStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ShoppingItem = {
  id: string;
  user_id: string;
  name: string;
  required_quantity: number;
  unit: string;
  status: "未購入" | "購入済";
  linked_recipe_name: string;
  source_type: string;
  purchased_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CookCandidate = {
  id: string;
  user_id: string;
  recipe_id: string | null;
  recipe_name: string;
  reasons: string[];
  status: "候補" | "解除";
  created_at: string;
  updated_at: string;
};

export type RecipeIngredientFormValues = {
  item_type: RecipeIngredientType;
  name: string;
  amount: string;
  unit: string;
};

export type RecipeFormValues = {
  name: string;
  genre: string;
  source: string;
  prep_steps: string;
  steps: string;
  ingredients: RecipeIngredientFormValues[];
};

export const emptyRecipeIngredientFormValues: RecipeIngredientFormValues = {
  item_type: "食材",
  name: "",
  amount: "1",
  unit: "個"
};

export const emptyRecipeFormValues: RecipeFormValues = {
  name: "",
  genre: "",
  source: "",
  prep_steps: "",
  steps: "",
  ingredients: [{ ...emptyRecipeIngredientFormValues }]
};

export function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function toMultiline(values: string[]) {
  return values.join("\n");
}

export function toCsv(values: string[]) {
  return values.join(", ");
}

export function toRecipeFormValues(recipe: Recipe): RecipeFormValues {
  return {
    name: recipe.name,
    genre: toCsv(recipe.genre),
    source: recipe.source,
    prep_steps: toMultiline(recipe.prep_steps),
    steps: toMultiline(recipe.steps),
    ingredients:
      recipe.ingredients.length > 0
        ? recipe.ingredients.map((ingredient) => ({
            item_type: ingredient.item_type,
            name: ingredient.name,
            amount: String(ingredient.amount),
            unit: ingredient.unit
          }))
        : [{ ...emptyRecipeIngredientFormValues }]
  };
}
