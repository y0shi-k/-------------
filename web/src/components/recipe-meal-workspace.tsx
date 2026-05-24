"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { StockItem } from "@/lib/inventory/types";
import {
  emptyRecipeFormValues,
  emptyRecipeIngredientFormValues,
  MealSchedule,
  MealType,
  Recipe,
  RecipeFormValues,
  RecipeIngredient,
  RecipeIngredientFormValues,
  ShoppingItem,
  splitCsv,
  splitLines,
  toRecipeFormValues
} from "@/lib/recipes/types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type RecipeMealWorkspaceProps = {
  initialInventoryItems: StockItem[];
  initialMealSchedules: MealSchedule[];
  initialRecipes: Recipe[];
  initialShoppingItems: ShoppingItem[];
  userId: string;
};

type Feedback = {
  tone: "success" | "error" | "info";
  message: string;
};

type ShoppingFormValues = {
  name: string;
  required_quantity: string;
  unit: string;
};

const mealTypes: MealType[] = ["朝", "昼", "晩", "その他"];

type NormalizedRecipeForm =
  | {
      data: {
        genre: string[];
        ingredients: Array<{
          amount: number;
          item_type: RecipeIngredientFormValues["item_type"];
          name: string;
          sort_order: number;
          unit: string;
        }>;
        name: string;
        prep_steps: string[];
        source: string;
        steps: string[];
      };
    }
  | { error: string };

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeRecipeForm(values: RecipeFormValues): NormalizedRecipeForm {
  const name = values.name.trim();
  if (!name) {
    return { error: "原因: レシピ名が未入力です。影響: レシピを保存できません。修正方法: レシピ名を入力してください。" };
  }

  const ingredients = values.ingredients.map((ingredient, index) => {
    const amount = Number(ingredient.amount);
    return {
      item_type: ingredient.item_type,
      name: ingredient.name.trim(),
      amount,
      unit: ingredient.unit.trim(),
      sort_order: index
    };
  });
  const invalidIngredient = ingredients.find((ingredient) => !ingredient.name || !ingredient.unit || !Number.isFinite(ingredient.amount) || ingredient.amount < 0);
  if (invalidIngredient) {
    return {
      error: "原因: 材料の品名、数量、単位に不備があります。影響: レシピを保存できません。修正方法: 空欄とマイナス数量を直してください。"
    };
  }

  return {
    data: {
      name,
      source: values.source.trim(),
      genre: splitCsv(values.genre),
      prep_steps: splitLines(values.prep_steps),
      steps: splitLines(values.steps),
      ingredients
    }
  };
}

function formatScheduleDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium"
  }).format(new Date(`${value}T00:00:00`));
}

function inventoryAmountByNameAndUnit(items: StockItem[], name: string, unit: string) {
  return items
    .filter((item) => item.name === name && item.unit === unit)
    .reduce((total, item) => total + Number(item.quantity || 0), 0);
}

function toShortageKey(name: string, unit: string, recipeName: string) {
  return `${recipeName}:${name}:${unit}`;
}

function shoppingSourceLabel(item: ShoppingItem) {
  if (item.source_type === "meal_schedule") return item.linked_recipe_name ? `献立: ${item.linked_recipe_name}` : "献立由来";
  return "手動追加";
}

function buildShortageCandidates(schedule: MealSchedule | null, recipes: Recipe[], inventoryItems: StockItem[]) {
  if (!schedule?.recipe_id) return [];
  const recipe = recipes.find((item) => item.id === schedule.recipe_id);
  if (!recipe) return [];

  return recipe.ingredients
    .filter((ingredient) => ingredient.item_type === "食材")
    .map((ingredient) => {
      const stockAmount = inventoryAmountByNameAndUnit(inventoryItems, ingredient.name, ingredient.unit);
      const shortageQuantity = Math.max(0, ingredient.amount - stockAmount);
      return {
        key: toShortageKey(ingredient.name, ingredient.unit, recipe.name),
        name: ingredient.name,
        requiredQuantity: ingredient.amount,
        shortageQuantity,
        unit: ingredient.unit,
        recipeName: recipe.name
      };
    })
    .filter((item) => item.shortageQuantity > 0);
}

export function RecipeMealWorkspace({
  initialInventoryItems,
  initialMealSchedules,
  initialRecipes,
  initialShoppingItems,
  userId
}: RecipeMealWorkspaceProps) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [mealSchedules, setMealSchedules] = useState(initialMealSchedules);
  const [shoppingItems, setShoppingItems] = useState(initialShoppingItems);
  const [recipeValues, setRecipeValues] = useState<RecipeFormValues>(emptyRecipeFormValues);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState(initialRecipes[0]?.id ?? "");
  const [scheduleDate, setScheduleDate] = useState(todayValue);
  const [scheduleMealType, setScheduleMealType] = useState<MealType>("晩");
  const [scheduleRecipeId, setScheduleRecipeId] = useState(initialRecipes[0]?.id ?? "");
  const [selectedScheduleId, setSelectedScheduleId] = useState(initialMealSchedules[0]?.id ?? "");
  const [selectedShortageKeys, setSelectedShortageKeys] = useState<string[]>([]);
  const [selectedShoppingIds, setSelectedShoppingIds] = useState<string[]>([]);
  const [shoppingValues, setShoppingValues] = useState<ShoppingFormValues>({ name: "", required_quantity: "1", unit: "個" });
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId) ?? recipes[0] ?? null;
  const selectedSchedule = mealSchedules.find((schedule) => schedule.id === selectedScheduleId) ?? mealSchedules[0] ?? null;
  const shortageCandidates = buildShortageCandidates(selectedSchedule, recipes, initialInventoryItems);
  const activeShortageKeys = selectedShortageKeys.filter((key) => shortageCandidates.some((item) => item.key === key));
  const openShoppingItems = shoppingItems.filter((item) => item.status === "未購入");
  const purchasedShoppingItems = shoppingItems.filter((item) => item.status === "購入済");

  function updateShoppingValue<K extends keyof ShoppingFormValues>(key: K, value: ShoppingFormValues[K]) {
    setShoppingValues((current) => ({ ...current, [key]: value }));
  }

  function resetRecipeForm() {
    setRecipeValues(emptyRecipeFormValues);
    setEditingRecipeId(null);
  }

  function updateRecipeValue<K extends keyof RecipeFormValues>(key: K, value: RecipeFormValues[K]) {
    setRecipeValues((current) => ({ ...current, [key]: value }));
  }

  function updateIngredient(index: number, values: Partial<RecipeIngredientFormValues>) {
    setRecipeValues((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, currentIndex) =>
        currentIndex === index ? { ...ingredient, ...values } : ingredient
      )
    }));
  }

  function addIngredientRow() {
    setRecipeValues((current) => ({
      ...current,
      ingredients: [...current.ingredients, { ...emptyRecipeIngredientFormValues }]
    }));
  }

  function removeIngredientRow(index: number) {
    setRecipeValues((current) => ({
      ...current,
      ingredients:
        current.ingredients.length > 1
          ? current.ingredients.filter((_, currentIndex) => currentIndex !== index)
          : current.ingredients
    }));
  }

  function startEditRecipe(recipe: Recipe) {
    setRecipeValues(toRecipeFormValues(recipe));
    setEditingRecipeId(recipe.id);
    setSelectedRecipeId(recipe.id);
    setFeedback({ tone: "info", message: `${recipe.name} を編集中です。` });
  }

  async function saveRecipe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeRecipeForm(recipeValues);
    if ("error" in normalized) {
      setFeedback({ tone: "error", message: normalized.error });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const recipePayload = {
      user_id: userId,
      name: normalized.data.name,
      source: normalized.data.source,
      genre: normalized.data.genre,
      prep_steps: normalized.data.prep_steps,
      steps: normalized.data.steps
    };

    const recipeRequest = editingRecipeId
      ? supabase
          .from("recipes")
          .update(recipePayload)
          .eq("id", editingRecipeId)
          .eq("user_id", userId)
          .select()
          .single()
      : supabase.from("recipes").insert(recipePayload).select().single();

    const { data: savedRecipe, error: recipeError } = await recipeRequest;
    if (recipeError || !savedRecipe) {
      setIsSaving(false);
      setFeedback({
        tone: "error",
        message: "原因: レシピをDBへ保存できませんでした。影響: 材料も保存されません。修正方法: ログイン状態と入力内容を確認してください。"
      });
      return;
    }

    const recipeId = String(savedRecipe.id);
    if (editingRecipeId) {
      const { error: deleteError } = await supabase
        .from("recipe_ingredients")
        .delete()
        .eq("recipe_id", recipeId)
        .eq("user_id", userId);
      if (deleteError) {
        setIsSaving(false);
        setFeedback({
          tone: "error",
          message: "原因: 古い材料を更新できませんでした。影響: レシピ材料が混ざる可能性があります。修正方法: 画面を更新して再編集してください。"
        });
        return;
      }
    }

    const ingredientPayload = normalized.data.ingredients.map((ingredient) => ({
      user_id: userId,
      recipe_id: recipeId,
      item_type: ingredient.item_type,
      name: ingredient.name,
      amount: ingredient.amount,
      unit: ingredient.unit,
      sort_order: ingredient.sort_order
    }));
    const { data: savedIngredients, error: ingredientError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientPayload)
      .select();

    setIsSaving(false);

    if (ingredientError || !savedIngredients) {
      setFeedback({
        tone: "error",
        message: "原因: 材料をDBへ保存できませんでした。影響: レシピ本文だけ保存済みの可能性があります。修正方法: レシピを開き直して材料を再保存してください。"
      });
      return;
    }

    const mergedRecipe = {
      ...(savedRecipe as Omit<Recipe, "ingredients">),
      ingredients: savedIngredients as RecipeIngredient[]
    } as Recipe;
    setRecipes((items) => {
      if (editingRecipeId) {
        return items.map((item) => (item.id === mergedRecipe.id ? mergedRecipe : item));
      }
      return [mergedRecipe, ...items];
    });
    setSelectedRecipeId(mergedRecipe.id);
    setScheduleRecipeId((current) => current || mergedRecipe.id);
    resetRecipeForm();
    setFeedback({ tone: "success", message: editingRecipeId ? "レシピを更新しました。" : "レシピを追加しました。" });
  }

  async function saveSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const recipe = recipes.find((item) => item.id === scheduleRecipeId);
    if (!scheduleDate || !recipe) {
      setFeedback({
        tone: "error",
        message: "原因: 日付またはレシピが未選択です。影響: 献立を保存できません。修正方法: 日付とレシピを選んでください。"
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const { data, error } = await supabase
      .from("meal_schedules")
      .insert({
        user_id: userId,
        scheduled_on: scheduleDate,
        meal_type: scheduleMealType,
        recipe_id: recipe.id,
        recipe_name: recipe.name,
        status: "未完了"
      })
      .select()
      .single();

    setIsSaving(false);

    if (error || !data) {
      setFeedback({
        tone: "error",
        message: "原因: 献立をDBへ保存できませんでした。影響: スケジュールに表示されません。修正方法: ログイン状態を確認してください。"
      });
      return;
    }

    setMealSchedules((items) => [data as MealSchedule, ...items]);
    setSelectedScheduleId(String(data.id));
    setSelectedShortageKeys([]);
    setFeedback({ tone: "success", message: "献立に追加しました。" });
  }

  function toggleShortage(key: string, checked: boolean) {
    setSelectedShortageKeys((current) => {
      if (checked) return [...new Set([...current, key])];
      return current.filter((item) => item !== key);
    });
  }

  async function addShortagesToShopping() {
    const selectedCandidates = shortageCandidates.filter((item) => activeShortageKeys.includes(item.key));
    if (selectedCandidates.length === 0) {
      setFeedback({
        tone: "error",
        message: "原因: 買い物に追加する食材が未選択です。影響: 買い物リストへ追加できません。修正方法: 不足食材にチェックを入れてください。"
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const { data, error } = await supabase
      .from("shopping_items")
      .insert(
        selectedCandidates.map((item) => ({
          user_id: userId,
          name: item.name,
          required_quantity: item.shortageQuantity,
          unit: item.unit,
          status: "未購入",
          linked_recipe_name: item.recipeName,
          source_type: "meal_schedule"
        }))
      )
      .select();

    setIsSaving(false);

    if (error || !data) {
      setFeedback({
        tone: "error",
        message: "原因: 買い物リストをDBへ保存できませんでした。影響: 不足食材が買い物に残りません。修正方法: ログイン状態を確認してください。"
      });
      return;
    }

    setShoppingItems((items) => [...(data as ShoppingItem[]), ...items]);
    setSelectedShortageKeys([]);
    setFeedback({ tone: "success", message: `${data.length}件を買い物リストへ追加しました。` });
  }

  async function addManualShoppingItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const quantity = Number(shoppingValues.required_quantity);
    const name = shoppingValues.name.trim();
    const unit = shoppingValues.unit.trim();

    if (!name || !unit || !Number.isFinite(quantity) || quantity <= 0) {
      setFeedback({
        tone: "error",
        message: "原因: 買い物の品名、数量、単位に不備があります。影響: 買い物リストへ追加できません。修正方法: 空欄と0以下の数量を直してください。"
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const { data, error } = await supabase
      .from("shopping_items")
      .insert({
        user_id: userId,
        name,
        required_quantity: quantity,
        unit,
        status: "未購入",
        linked_recipe_name: "",
        source_type: "manual"
      })
      .select()
      .single();

    setIsSaving(false);

    if (error || !data) {
      setFeedback({
        tone: "error",
        message: "原因: 買い物をDBへ保存できませんでした。影響: 買い物リストに残りません。修正方法: ログイン状態を確認してください。"
      });
      return;
    }

    setShoppingItems((items) => [data as ShoppingItem, ...items]);
    setShoppingValues({ name: "", required_quantity: "1", unit: "個" });
    setFeedback({ tone: "success", message: `${name} を買い物リストへ追加しました。` });
  }

  async function markShoppingPurchased(item: ShoppingItem) {
    if (item.status === "購入済") {
      setFeedback({ tone: "info", message: "この買い物は購入済みです。" });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const purchasedAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("shopping_items")
      .update({ status: "購入済", purchased_at: purchasedAt })
      .eq("id", item.id)
      .eq("user_id", userId)
      .select()
      .single();

    setIsSaving(false);

    if (error || !data) {
      setFeedback({ tone: "error", message: "原因: 購入済みに更新できませんでした。影響: 買い物が未購入のまま残ります。修正方法: ログイン状態を確認してください。" });
      return;
    }

    setShoppingItems((items) => items.map((current) => (current.id === item.id ? (data as ShoppingItem) : current)));
    setSelectedShoppingIds((ids) => ids.filter((id) => id !== item.id));
    setFeedback({ tone: "success", message: `${item.name} を購入済みにしました。` });
  }

  function toggleShoppingSelected(itemId: string) {
    setSelectedShoppingIds((ids) => (ids.includes(itemId) ? ids.filter((id) => id !== itemId) : [...ids, itemId]));
  }

  async function deleteSelectedShoppingItems() {
    if (selectedShoppingIds.length === 0) return;

    setIsSaving(true);
    setFeedback(null);

    const { error } = await supabase.from("shopping_items").delete().eq("user_id", userId).in("id", selectedShoppingIds);

    setIsSaving(false);

    if (error) {
      setFeedback({ tone: "error", message: "原因: 買い物を一括削除できませんでした。影響: 選択した買い物が残ります。修正方法: ログイン状態を確認してください。" });
      return;
    }

    const deletedCount = selectedShoppingIds.length;
    setShoppingItems((items) => items.filter((item) => !selectedShoppingIds.includes(item.id)));
    setSelectedShoppingIds([]);
    setFeedback({ tone: "info", message: `買い物を${deletedCount}件削除しました。` });
  }

  async function completeSchedule(schedule: MealSchedule) {
    if (schedule.status === "完了") {
      setFeedback({ tone: "info", message: "この献立は完了済みです。" });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const completedAt = new Date().toISOString();
    const { data: updatedSchedule, error: scheduleError } = await supabase
      .from("meal_schedules")
      .update({
        status: "完了",
        completed_at: completedAt
      })
      .eq("id", schedule.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (scheduleError || !updatedSchedule) {
      setIsSaving(false);
      setFeedback({
        tone: "error",
        message: "原因: 献立を完了に更新できませんでした。影響: 料理履歴も作成されません。修正方法: ログイン状態を確認してください。"
      });
      return;
    }

    const { error: historyError } = await supabase.from("cooking_history").insert({
      user_id: userId,
      cooked_at: completedAt,
      recipe_id: schedule.recipe_id,
      recipe_name: schedule.recipe_name,
      meal_schedule_id: schedule.id,
      note: "献立から調理完了",
      rating: null
    });

    setIsSaving(false);

    if (historyError) {
      setMealSchedules((items) => items.map((item) => (item.id === schedule.id ? (updatedSchedule as MealSchedule) : item)));
      setFeedback({
        tone: "error",
        message: "原因: 料理履歴をDBへ保存できませんでした。影響: 献立は完了済みですが履歴に出ません。修正方法: 料理履歴で手動追加してください。"
      });
      return;
    }

    setMealSchedules((items) => items.map((item) => (item.id === schedule.id ? (updatedSchedule as MealSchedule) : item)));
    router.refresh();
    setFeedback({ tone: "success", message: `${schedule.recipe_name} を調理完了にしました。料理履歴にも記録済みです。` });
  }

  return (
    <section className="recipe-meal-workspace" aria-labelledby="recipe-meal-heading">
      <div className="section-heading">
        <p className="eyebrow">Recipes & Meals</p>
        <h2 id="recipe-meal-heading">レシピ・献立・買い物</h2>
      </div>

      {feedback ? (
        <p className="operation-message" data-tone={feedback.tone} role={feedback.tone === "error" ? "alert" : "status"}>
          {feedback.message}
        </p>
      ) : null}

      <div className="recipe-meal-grid">
        <section className="stock-panel" aria-labelledby="recipe-form-heading">
          <div className="panel-title">
            <div>
              <span>レシピ</span>
              <h3 id="recipe-form-heading">{editingRecipeId ? "レシピを編集" : "レシピを追加"}</h3>
            </div>
            <strong>{recipes.length}件</strong>
          </div>

          <form className="stock-form" onSubmit={saveRecipe}>
            <label>
              レシピ名
              <input value={recipeValues.name} onChange={(event) => updateRecipeValue("name", event.target.value)} placeholder="例: カレー" />
            </label>
            <div className="form-row two-columns">
              <label>
                ジャンル
                <input value={recipeValues.genre} onChange={(event) => updateRecipeValue("genre", event.target.value)} placeholder="和食, 作り置き" />
              </label>
              <label>
                参考元
                <input value={recipeValues.source} onChange={(event) => updateRecipeValue("source", event.target.value)} placeholder="メモやURL" />
              </label>
            </div>

            <div className="ingredient-editor" aria-label="材料入力">
              <div className="ingredient-editor-heading">
                <span>材料</span>
                <button className="secondary-button compact-button" type="button" onClick={addIngredientRow}>
                  材料を追加
                </button>
              </div>
              {recipeValues.ingredients.map((ingredient, index) => (
                <div className="ingredient-row" key={`${index}-${ingredient.name}`}>
                  <label>
                    種別
                    <select
                      value={ingredient.item_type}
                      onChange={(event) => updateIngredient(index, { item_type: event.target.value as RecipeIngredientFormValues["item_type"] })}
                    >
                      <option value="食材">食材</option>
                      <option value="調味料">調味料</option>
                    </select>
                  </label>
                  <label>
                    品名
                    <input value={ingredient.name} onChange={(event) => updateIngredient(index, { name: event.target.value })} placeholder="玉ねぎ" />
                  </label>
                  <label>
                    数量
                    <input
                      min="0"
                      step="0.1"
                      type="number"
                      value={ingredient.amount}
                      onChange={(event) => updateIngredient(index, { amount: event.target.value })}
                    />
                  </label>
                  <label>
                    単位
                    <input value={ingredient.unit} onChange={(event) => updateIngredient(index, { unit: event.target.value })} placeholder="個" />
                  </label>
                  <button className="danger-button compact-button" type="button" onClick={() => removeIngredientRow(index)}>
                    削除
                  </button>
                </div>
              ))}
            </div>

            <div className="form-row two-columns">
              <label>
                下準備
                <textarea
                  rows={4}
                  value={recipeValues.prep_steps}
                  onChange={(event) => updateRecipeValue("prep_steps", event.target.value)}
                  placeholder="1行に1手順"
                />
              </label>
              <label>
                調理手順
                <textarea
                  rows={4}
                  value={recipeValues.steps}
                  onChange={(event) => updateRecipeValue("steps", event.target.value)}
                  placeholder="1行に1手順"
                />
              </label>
            </div>
            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={isSaving}>
                {editingRecipeId ? "レシピを更新" : "レシピを保存"}
              </button>
              {editingRecipeId ? (
                <button className="secondary-button" type="button" onClick={resetRecipeForm}>
                  編集をやめる
                </button>
              ) : null}
            </div>
          </form>

          <RecipeList
            disabled={isSaving}
            onEdit={startEditRecipe}
            onSelect={setSelectedRecipeId}
            recipes={recipes}
            selectedRecipeId={selectedRecipe?.id ?? ""}
          />
        </section>

        <section className="stock-panel" aria-labelledby="recipe-detail-heading">
          <div className="panel-title">
            <div>
              <span>詳細</span>
              <h3 id="recipe-detail-heading">レシピ詳細</h3>
            </div>
          </div>
          <RecipeDetail recipe={selectedRecipe} />

          <form className="stock-form schedule-form" onSubmit={saveSchedule}>
            <h4>献立へ追加</h4>
            <div className="form-row two-columns">
              <label>
                日付
                <input type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} />
              </label>
              <label>
                食事
                <select value={scheduleMealType} onChange={(event) => setScheduleMealType(event.target.value as MealType)}>
                  {mealTypes.map((mealType) => (
                    <option key={mealType} value={mealType}>
                      {mealType}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              献立レシピ
              <select value={scheduleRecipeId} onChange={(event) => setScheduleRecipeId(event.target.value)} disabled={recipes.length === 0}>
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="submit" disabled={isSaving || recipes.length === 0}>
              献立に追加
            </button>
          </form>
        </section>

        <section className="stock-panel" aria-labelledby="meal-list-heading">
          <div className="panel-title">
            <div>
              <span>献立</span>
              <h3 id="meal-list-heading">予定と買い物候補</h3>
            </div>
          </div>

          {mealSchedules.length === 0 ? (
            <p className="empty-list">献立はありません。レシピを選んで予定に追加してください。</p>
          ) : (
            <div className="meal-list">
              {mealSchedules.map((schedule) => (
                <article className="meal-item" data-active={selectedSchedule?.id === schedule.id} key={schedule.id}>
                  <button className="meal-select-button" type="button" onClick={() => setSelectedScheduleId(schedule.id)}>
                    <span>{formatScheduleDate(schedule.scheduled_on)} / {schedule.meal_type}</span>
                    <strong>{schedule.recipe_name || "レシピ名なし"}</strong>
                    <em>{schedule.status}</em>
                  </button>
                  <button className="secondary-button" type="button" disabled={isSaving || schedule.status === "完了"} onClick={() => completeSchedule(schedule)}>
                    調理完了
                  </button>
                </article>
              ))}
            </div>
          )}

          <div className="shortage-panel">
            <div className="panel-title compact-title">
              <div>
                <span>不足食材</span>
                <h4>買い物へ追加</h4>
              </div>
            </div>
            {shortageCandidates.length === 0 ? (
              <p className="empty-list">選択中の献立に不足食材はありません。同じ単位の在庫だけを比較しています。</p>
            ) : (
              <div className="shortage-list">
                {shortageCandidates.map((item) => (
                  <label className="shortage-item" key={item.key}>
                    <input
                      type="checkbox"
                      checked={activeShortageKeys.includes(item.key)}
                      onChange={(event) => toggleShortage(item.key, event.target.checked)}
                    />
                    <span>
                      {item.name} {item.shortageQuantity}{item.unit}
                    </span>
                    <small>必要量 {item.requiredQuantity}{item.unit}</small>
                  </label>
                ))}
              </div>
            )}
            <button className="primary-button" type="button" disabled={isSaving || shortageCandidates.length === 0} onClick={addShortagesToShopping}>
              選択食材を買い物へ
            </button>
          </div>

          <div className="shopping-preview">
            <div className="shopping-heading-row">
              <h4>買い物リスト</h4>
              <button
                className="danger-button compact-button"
                type="button"
                disabled={isSaving || selectedShoppingIds.length === 0}
                onClick={deleteSelectedShoppingItems}
              >
                選択削除
              </button>
            </div>

            <form className="shopping-add-form" onSubmit={addManualShoppingItem}>
              <input
                aria-label="買い物の品名"
                value={shoppingValues.name}
                onChange={(event) => updateShoppingValue("name", event.target.value)}
                placeholder="買うもの"
              />
              <input
                aria-label="買い物の数量"
                min="0"
                step="0.1"
                type="number"
                value={shoppingValues.required_quantity}
                onChange={(event) => updateShoppingValue("required_quantity", event.target.value)}
                placeholder="1"
              />
              <input
                aria-label="買い物の単位"
                value={shoppingValues.unit}
                onChange={(event) => updateShoppingValue("unit", event.target.value)}
                placeholder="個"
              />
              <button className="primary-button compact-button" type="submit" disabled={isSaving}>
                手動追加
              </button>
            </form>

            <ShoppingListSection
              emptyText="未購入の買い物はありません。"
              items={openShoppingItems}
              onMarkPurchased={markShoppingPurchased}
              onSelect={toggleShoppingSelected}
              selectedIds={selectedShoppingIds}
              title="未購入"
            />
            <ShoppingListSection
              emptyText="購入済みの買い物はありません。"
              items={purchasedShoppingItems}
              onSelect={toggleShoppingSelected}
              selectedIds={selectedShoppingIds}
              title="購入済み"
            />
          </div>
        </section>
      </div>
    </section>
  );
}

function ShoppingListSection({
  emptyText,
  items,
  onMarkPurchased,
  onSelect,
  selectedIds,
  title
}: {
  emptyText: string;
  items: ShoppingItem[];
  onMarkPurchased?: (item: ShoppingItem) => void;
  onSelect: (id: string) => void;
  selectedIds: string[];
  title: string;
}) {
  return (
    <section className="shopping-list-section" aria-label={title}>
      <div className="shopping-list-title">
        <span>{title}</span>
        <strong>{items.length}件</strong>
      </div>
      {items.length === 0 ? (
        <p className="empty-list">{emptyText}</p>
      ) : (
        <div className="stock-list">
          {items.map((item) => (
            <article className="stock-item compact-stock-item shopping-item" key={item.id}>
              <label className="select-row">
                <input checked={selectedIds.includes(item.id)} onChange={() => onSelect(item.id)} type="checkbox" />
                選択
              </label>
              <div className="item-main">
                <span>{shoppingSourceLabel(item)}</span>
                <h4>{item.name}</h4>
                <p>{item.required_quantity}{item.unit} / {item.status}</p>
              </div>
              {onMarkPurchased ? (
                <button className="secondary-button compact-button" type="button" onClick={() => onMarkPurchased(item)}>
                  購入済み
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function RecipeList({
  disabled,
  onEdit,
  onSelect,
  recipes,
  selectedRecipeId
}: {
  disabled: boolean;
  onEdit: (recipe: Recipe) => void;
  onSelect: (id: string) => void;
  recipes: Recipe[];
  selectedRecipeId: string;
}) {
  if (recipes.length === 0) {
    return <p className="empty-list">レシピはありません。まずは1件追加してください。</p>;
  }

  return (
    <div className="recipe-list">
      {recipes.map((recipe) => (
        <article className="recipe-card" data-active={selectedRecipeId === recipe.id} key={recipe.id}>
          <button className="recipe-select-button" type="button" onClick={() => onSelect(recipe.id)}>
            <span>{recipe.genre.join(", ") || "ジャンル未設定"}</span>
            <strong>{recipe.name}</strong>
            <small>{recipe.ingredients.length}材料</small>
          </button>
          <button className="secondary-button compact-button" type="button" disabled={disabled} onClick={() => onEdit(recipe)}>
            編集
          </button>
        </article>
      ))}
    </div>
  );
}

function RecipeDetail({ recipe }: { recipe: Recipe | null }) {
  if (!recipe) {
    return <p className="empty-list">レシピを選ぶと材料と手順を確認できます。</p>;
  }

  const foodIngredients = recipe.ingredients.filter((ingredient) => ingredient.item_type === "食材");
  const seasoningIngredients = recipe.ingredients.filter((ingredient) => ingredient.item_type === "調味料");

  return (
    <div className="recipe-detail">
      <h4>{recipe.name}</h4>
      {recipe.source ? <p className="item-note">参考元: {recipe.source}</p> : null}
      <IngredientSummary title="食材" ingredients={foodIngredients} />
      <IngredientSummary title="調味料" ingredients={seasoningIngredients} />
      <StepSummary title="下準備" steps={recipe.prep_steps} />
      <StepSummary title="調理手順" steps={recipe.steps} />
    </div>
  );
}

function IngredientSummary({ ingredients, title }: { ingredients: RecipeIngredient[]; title: string }) {
  return (
    <section className="recipe-detail-section">
      <h5>{title}</h5>
      {ingredients.length === 0 ? (
        <p className="item-note">未設定</p>
      ) : (
        <ul>
          {ingredients.map((ingredient) => (
            <li key={ingredient.id || `${ingredient.name}-${ingredient.sort_order}`}>
              {ingredient.name} {ingredient.amount}{ingredient.unit}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StepSummary({ steps, title }: { steps: string[]; title: string }) {
  return (
    <section className="recipe-detail-section">
      <h5>{title}</h5>
      {steps.length === 0 ? (
        <p className="item-note">未設定</p>
      ) : (
        <ol>
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
    </section>
  );
}
