"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DeleteConfirmPanel } from "@/components/delete-confirm-panel";
import type { StockItem } from "@/lib/inventory/types";
import {
  CookCandidate,
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
  initialCookCandidates: CookCandidate[];
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

type PendingDelete = {
  confirm: () => void;
  message: string;
  target: string;
};

type ShoppingFormValues = {
  name: string;
  required_quantity: string;
  unit: string;
};

type ConsumptionDraft = {
  amount: string;
  ingredientName: string;
  requestedAmount: number;
  requestedUnit: string;
  stockItemId: string;
};

type AiRecipeMode = "generate" | "structure";
type RecipeWorkspaceView = "recipes" | "schedule";

type RecipeSearchLogic = "and" | "or";
type RecipeSearchMode = "name" | "ingredient" | "all";
type RecipeSort = "created_desc" | "updated_desc" | "name_asc" | "count_desc" | "ingredients_desc";
type CookingIngredientTab = "食材" | "調味料";
type CookingStepTab = "prep" | "steps";

const mealTypes: MealType[] = ["朝", "昼", "晩", "その他"];
const mealTypeOrder: Record<MealType, number> = { 朝: 0, 昼: 1, 晩: 2, その他: 3 };

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
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
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

function formatScheduleDayLabel(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    day: "numeric",
    month: "numeric",
    weekday: "short"
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

function formatRecipeDate(value: string) {
  if (!value) return "-";
  return value.slice(0, 10);
}

function filterAndSortRecipes(recipes: Recipe[], query: string, sort: RecipeSort, searchMode: RecipeSearchMode, searchLogic: RecipeSearchLogic) {
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? recipes.filter((recipe) => {
        const keywords = normalizedQuery.split(/\s+/).filter(Boolean);
        const nameHaystack = [recipe.name, recipe.source, ...recipe.genre].join(" ").toLowerCase();
        const ingredientHaystack = recipe.ingredients.map((ingredient) => ingredient.name).join(" ").toLowerCase();
        const matches = keywords.map((keyword) => {
          if (searchMode === "name") return nameHaystack.includes(keyword);
          if (searchMode === "ingredient") return ingredientHaystack.includes(keyword);
          return nameHaystack.includes(keyword) || ingredientHaystack.includes(keyword);
        });
        return searchLogic === "and" ? matches.every(Boolean) : matches.some(Boolean);
      })
    : recipes;

  return [...filtered].sort((a, b) => {
    if (sort === "name_asc") return a.name.localeCompare(b.name, "ja");
    if (sort === "count_desc") return b.cook_count - a.cook_count || a.name.localeCompare(b.name, "ja");
    if (sort === "ingredients_desc") return b.ingredients.length - a.ingredients.length || a.name.localeCompare(b.name, "ja");
    if (sort === "updated_desc") return b.updated_at.localeCompare(a.updated_at) || a.name.localeCompare(b.name, "ja");
    return b.created_at.localeCompare(a.created_at);
  });
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
  initialCookCandidates,
  initialInventoryItems,
  initialMealSchedules,
  initialRecipes,
  initialShoppingItems,
  userId
}: RecipeMealWorkspaceProps) {
  const initialScheduleStart = initialMealSchedules[0]?.scheduled_on ?? todayValue();
  const [recipes, setRecipes] = useState(initialRecipes);
  const [cookCandidates, setCookCandidates] = useState(initialCookCandidates);
  const [inventoryItemsForMeals, setInventoryItemsForMeals] = useState(initialInventoryItems);
  const [mealSchedules, setMealSchedules] = useState(initialMealSchedules);
  const [shoppingItems, setShoppingItems] = useState(initialShoppingItems);
  const [recipeValues, setRecipeValues] = useState<RecipeFormValues>(emptyRecipeFormValues);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState(initialRecipes[0]?.id ?? "");
  const [activeCookingRecipeId, setActiveCookingRecipeId] = useState("");
  const [scheduleWindowStart, setScheduleWindowStart] = useState(initialScheduleStart);
  const [scheduleDate, setScheduleDate] = useState(initialScheduleStart);
  const [scheduleMealType, setScheduleMealType] = useState<MealType>("晩");
  const [scheduleRecipeId, setScheduleRecipeId] = useState(initialRecipes[0]?.id ?? "");
  const [selectedScheduleId, setSelectedScheduleId] = useState(initialMealSchedules[0]?.id ?? "");
  const [selectedShortageKeys, setSelectedShortageKeys] = useState<string[]>([]);
  const [selectedShoppingIds, setSelectedShoppingIds] = useState<string[]>([]);
  const [shoppingValues, setShoppingValues] = useState<ShoppingFormValues>({ name: "", required_quantity: "1", unit: "個" });
  const [candidateReasons, setCandidateReasons] = useState("");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeSearchLogic, setRecipeSearchLogic] = useState<RecipeSearchLogic>("and");
  const [recipeSearchMode, setRecipeSearchMode] = useState<RecipeSearchMode>("name");
  const [recipeSort, setRecipeSort] = useState<RecipeSort>("created_desc");
  const [pendingDeleteRecipeId, setPendingDeleteRecipeId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [pendingConsumptionScheduleId, setPendingConsumptionScheduleId] = useState<string | null>(null);
  const [consumptionDrafts, setConsumptionDrafts] = useState<ConsumptionDraft[]>([]);
  const [cookingIngredientTab, setCookingIngredientTab] = useState<CookingIngredientTab>("食材");
  const [cookingStepTab, setCookingStepTab] = useState<CookingStepTab>("steps");
  const [highlightedIngredientName, setHighlightedIngredientName] = useState("");
  const [aiMode, setAiMode] = useState<AiRecipeMode>("generate");
  const [aiRequired, setAiRequired] = useState("");
  const [aiOptional, setAiOptional] = useState("");
  const [aiSourceText, setAiSourceText] = useState("");
  const [aiPreview, setAiPreview] = useState<RecipeFormValues | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [activeView, setActiveView] = useState<RecipeWorkspaceView>("recipes");
  const [isTextImportOpen, setIsTextImportOpen] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isRecipeEditorOpen, setIsRecipeEditorOpen] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId) ?? recipes[0] ?? null;
  const activeCookingRecipe = recipes.find((recipe) => recipe.id === activeCookingRecipeId) ?? null;
  const visibleRecipes = filterAndSortRecipes(recipes, recipeSearch, recipeSort, recipeSearchMode, recipeSearchLogic);
  const selectedSchedule = mealSchedules.find((schedule) => schedule.id === selectedScheduleId) ?? mealSchedules[0] ?? null;
  const scheduleDays = Array.from({ length: 7 }, (_, index) => addDays(scheduleWindowStart, index));
  const visibleMealSchedules = mealSchedules
    .filter((schedule) => scheduleDays.includes(schedule.scheduled_on))
    .sort((a, b) => a.scheduled_on.localeCompare(b.scheduled_on) || mealTypeOrder[a.meal_type] - mealTypeOrder[b.meal_type]);
  const shortageCandidates = buildShortageCandidates(selectedSchedule, recipes, inventoryItemsForMeals);
  const activeShortageKeys = selectedShortageKeys.filter((key) => shortageCandidates.some((item) => item.key === key));
  const openShoppingItems = shoppingItems.filter((item) => item.status === "未購入");
  const purchasedShoppingItems = shoppingItems.filter((item) => item.status === "購入済");
  const activeCookCandidates = cookCandidates.filter((item) => item.status === "候補");

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

  async function runAiRecipe(overrides?: Partial<{ mode: AiRecipeMode; required: string; optional: string; sourceText: string }>) {
    const mode = overrides?.mode ?? aiMode;
    const required = overrides?.required ?? aiRequired;
    const optional = overrides?.optional ?? aiOptional;
    const sourceText = overrides?.sourceText ?? aiSourceText;
    if (!required.trim() && !optional.trim() && !sourceText.trim()) {
      setFeedback({
        tone: "error",
        message: "原因: AIに渡す食材や本文が空です。影響: レシピ案を作れません。修正方法: 必須食材、任意食材、またはレシピ本文を入力してください。"
      });
      return;
    }

    setIsAiRunning(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/ai/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode,
          required,
          optional,
          sourceText
        })
      });
      const result = (await response.json().catch(() => ({}))) as { recipe?: RecipeFormValues; error?: string };

      if (!response.ok || !result.recipe) {
        setFeedback({
          tone: "error",
          message: result.error || "原因: AIレシピの取得に失敗しました。影響: プレビューを表示できません。修正方法: 時間を置いて再度お試しください。"
        });
        return;
      }

      setAiPreview(result.recipe);
      setFeedback({ tone: "success", message: "AIレシピ案を作成しました。内容を確認してからフォームへ反映してください。" });
    } catch {
      setFeedback({
        tone: "error",
        message: "原因: AIレシピ通信に失敗しました。影響: プレビューを表示できません。修正方法: 通信状態を確認してください。"
      });
    } finally {
      setIsAiRunning(false);
    }
  }

  function applyAiPreview() {
    if (!aiPreview) return;
    setRecipeValues(aiPreview);
    setEditingRecipeId(null);
    setIsTextImportOpen(false);
    setIsAiMenuOpen(false);
    setIsRecipeEditorOpen(true);
    setFeedback({ tone: "info", message: "AIレシピ案を入力フォームへ反映しました。内容を確認して保存してください。" });
  }

  function startEditRecipe(recipe: Recipe) {
    setRecipeValues(toRecipeFormValues(recipe));
    setEditingRecipeId(recipe.id);
    setSelectedRecipeId(recipe.id);
    setPendingDeleteRecipeId(null);
    setIsRecipeEditorOpen(true);
    setFeedback({ tone: "info", message: `${recipe.name} を編集中です。` });
  }

  function openNewRecipeEditor() {
    resetRecipeForm();
    setActiveView("recipes");
    setIsRecipeEditorOpen(true);
  }

  function closeRecipeEditor() {
    resetRecipeForm();
    setIsRecipeEditorOpen(false);
  }

  async function structureRecipeText() {
    setAiMode("structure");
    await runAiRecipe({ mode: "structure", required: "", optional: "", sourceText: aiSourceText });
  }

  async function generatePriorityRecipe() {
    const urgentItems = inventoryItemsForMeals
      .filter((item) => item.effective_expires_on || item.display_expires_on)
      .sort((a, b) => (a.effective_expires_on ?? a.display_expires_on ?? "").localeCompare(b.effective_expires_on ?? b.display_expires_on ?? ""))
      .slice(0, 5)
      .map((item) => `${item.name} ${item.quantity}${item.unit}`)
      .join(", ");
    setAiMode("generate");
    await runAiRecipe({ mode: "generate", required: urgentItems, optional: aiOptional, sourceText: "期限が近い食材を優先して使い切るレシピ" });
  }

  function openCookingViewer(recipe: Recipe) {
    setActiveCookingRecipeId(recipe.id);
    setSelectedRecipeId(recipe.id);
    setHighlightedIngredientName("");
    setFeedback({ tone: "info", message: `${recipe.name} の調理ビューアを開きました。` });
  }

  function requestDelete(target: string, message: string, confirm: () => void) {
    setPendingDelete({ target, message, confirm });
    setFeedback(null);
  }

  function stockOptionsForIngredient(ingredient: RecipeIngredient) {
    return inventoryItemsForMeals.filter((item) => item.category === ingredient.item_type && item.unit === ingredient.unit && item.quantity > 0);
  }

  function buildConsumptionDrafts(schedule: MealSchedule) {
    const recipe = recipes.find((item) => item.id === schedule.recipe_id);
    if (!recipe) return [];

    return recipe.ingredients.map((ingredient) => {
      const exactStock = stockOptionsForIngredient(ingredient).find((item) => item.name === ingredient.name);
      return {
        ingredientName: ingredient.name,
        requestedAmount: ingredient.amount,
        requestedUnit: ingredient.unit,
        amount: exactStock ? String(Math.min(ingredient.amount, exactStock.quantity)) : "0",
        stockItemId: exactStock?.id ?? ""
      };
    });
  }

  function updateConsumptionDraft(index: number, values: Partial<ConsumptionDraft>) {
    setConsumptionDrafts((items) => items.map((item, currentIndex) => (currentIndex === index ? { ...item, ...values } : item)));
  }

  async function deleteRecipe(recipe: Recipe) {
    setIsSaving(true);
    setFeedback(null);

    const { error } = await supabase.from("recipes").delete().eq("id", recipe.id).eq("user_id", userId);

    setIsSaving(false);

    if (error) {
      setFeedback({ tone: "error", message: "原因: レシピを削除できませんでした。影響: レシピ一覧に残ります。修正方法: ログイン状態を確認してください。" });
      return;
    }

    setRecipes((items) => items.filter((item) => item.id !== recipe.id));
    setMealSchedules((items) => items.map((item) => (item.recipe_id === recipe.id ? { ...item, recipe_id: null } : item)));
    setPendingDeleteRecipeId(null);
    if (selectedRecipeId === recipe.id) {
      const nextRecipe = recipes.find((item) => item.id !== recipe.id);
      setSelectedRecipeId(nextRecipe?.id ?? "");
      setScheduleRecipeId(nextRecipe?.id ?? "");
    }
    if (editingRecipeId === recipe.id) resetRecipeForm();
    setFeedback({ tone: "info", message: `${recipe.name} を削除しました。` });
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
    setIsRecipeEditorOpen(false);
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
    if (!scheduleDays.includes(String(data.scheduled_on))) {
      setScheduleWindowStart(String(data.scheduled_on));
    }
    setSelectedShortageKeys([]);
    setFeedback({ tone: "success", message: "献立に追加しました。" });
  }

  async function addCookCandidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const recipe = selectedRecipe;
    if (!recipe) {
      setFeedback({
        tone: "error",
        message: "原因: レシピが未選択です。影響: 作りたい候補に追加できません。修正方法: レシピを選んでください。"
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const { data, error } = await supabase
      .from("cook_candidates")
      .insert({
        user_id: userId,
        recipe_id: recipe.id,
        recipe_name: recipe.name,
        reasons: splitCsv(candidateReasons),
        status: "候補"
      })
      .select()
      .single();

    setIsSaving(false);

    if (error || !data) {
      setFeedback({ tone: "error", message: "原因: 作りたい候補をDBへ保存できませんでした。影響: 候補一覧に残りません。修正方法: ログイン状態を確認してください。" });
      return;
    }

    setCookCandidates((items) => [data as CookCandidate, ...items]);
    setCandidateReasons("");
    setFeedback({ tone: "success", message: `${recipe.name} を作りたい候補に追加しました。` });
  }

  async function deleteCookCandidate(candidate: CookCandidate) {
    setIsSaving(true);
    setFeedback(null);

    const { error } = await supabase.from("cook_candidates").delete().eq("id", candidate.id).eq("user_id", userId);

    setIsSaving(false);

    if (error) {
      setFeedback({ tone: "error", message: "原因: 作りたい候補を解除できませんでした。影響: 候補一覧に残ります。修正方法: ログイン状態を確認してください。" });
      return;
    }

    setCookCandidates((items) => items.filter((item) => item.id !== candidate.id));
    setFeedback({ tone: "info", message: `${candidate.recipe_name || "候補"} を作りたい候補から解除しました。` });
  }

  async function assignCandidateToSchedule(candidate: CookCandidate) {
    if (!scheduleDate) {
      setFeedback({
        tone: "error",
        message: "原因: 献立日付が未選択です。影響: 候補を献立へ追加できません。修正方法: 日付を選んでください。"
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
        recipe_id: candidate.recipe_id,
        recipe_name: candidate.recipe_name,
        status: "未完了"
      })
      .select()
      .single();

    setIsSaving(false);

    if (error || !data) {
      setFeedback({ tone: "error", message: "原因: 候補を献立へ保存できませんでした。影響: 献立に表示されません。修正方法: ログイン状態を確認してください。" });
      return;
    }

    setMealSchedules((items) => [data as MealSchedule, ...items]);
    setSelectedScheduleId(String(data.id));
    if (!scheduleDays.includes(String(data.scheduled_on))) {
      setScheduleWindowStart(String(data.scheduled_on));
    }
    setSelectedShortageKeys([]);
    setFeedback({ tone: "success", message: `${candidate.recipe_name || "候補"} を献立に追加しました。` });
  }

  async function moveSchedule(schedule: MealSchedule, days: number) {
    const nextDate = addDays(schedule.scheduled_on, days);
    setIsSaving(true);
    setFeedback(null);

    const { data, error } = await supabase
      .from("meal_schedules")
      .update({ scheduled_on: nextDate })
      .eq("id", schedule.id)
      .eq("user_id", userId)
      .select()
      .single();

    setIsSaving(false);

    if (error || !data) {
      setFeedback({ tone: "error", message: "原因: 献立の日付を移動できませんでした。影響: 予定日が変わりません。修正方法: ログイン状態を確認してください。" });
      return;
    }

    setMealSchedules((items) => items.map((item) => (item.id === schedule.id ? (data as MealSchedule) : item)));
    setSelectedScheduleId(schedule.id);
    if (!scheduleDays.includes(nextDate)) {
      setScheduleWindowStart(nextDate);
    }
    setFeedback({ tone: "success", message: `${schedule.recipe_name || "献立"} を ${formatScheduleDate(nextDate)} へ移動しました。` });
  }

  async function deleteSchedule(schedule: MealSchedule) {
    setIsSaving(true);
    setFeedback(null);

    const { error } = await supabase.from("meal_schedules").delete().eq("id", schedule.id).eq("user_id", userId);

    setIsSaving(false);

    if (error) {
      setFeedback({ tone: "error", message: "原因: 献立を削除できませんでした。影響: 予定が残ります。修正方法: ログイン状態を確認してください。" });
      return;
    }

    setMealSchedules((items) => items.filter((item) => item.id !== schedule.id));
    if (selectedScheduleId === schedule.id) {
      const nextSchedule = mealSchedules.find((item) => item.id !== schedule.id);
      setSelectedScheduleId(nextSchedule?.id ?? "");
      setSelectedShortageKeys([]);
    }
    setFeedback({ tone: "info", message: `${schedule.recipe_name || "献立"} を献立から削除しました。` });
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

    if (pendingConsumptionScheduleId !== schedule.id) {
      setPendingConsumptionScheduleId(schedule.id);
      setConsumptionDrafts(buildConsumptionDrafts(schedule));
      setSelectedScheduleId(schedule.id);
      setFeedback({ tone: "info", message: "消費量を確認してから、もう一度「消費して完了」を押してください。" });
      return;
    }

    const normalizedDrafts = consumptionDrafts.map((draft) => ({
      ...draft,
      consumedAmount: Number(draft.amount)
    }));
    const invalidDraft = normalizedDrafts.find((draft) => !Number.isFinite(draft.consumedAmount) || draft.consumedAmount < 0);
    if (invalidDraft) {
      setFeedback({ tone: "error", message: "原因: 消費量に不備があります。影響: 在庫を減算できません。修正方法: 0以上の数値に直してください。" });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const consumedRows: Array<{
      draft: ConsumptionDraft & { consumedAmount: number };
      nextQuantity: number;
      stockItem: StockItem;
    }> = [];
    for (const draft of normalizedDrafts) {
      if (!draft.stockItemId || draft.consumedAmount === 0) continue;
      const stockItem = inventoryItemsForMeals.find((item) => item.id === draft.stockItemId);
      if (!stockItem) continue;
      consumedRows.push({
        draft,
        stockItem,
        nextQuantity: Math.max(0, Number(stockItem.quantity || 0) - draft.consumedAmount)
      });
    }

    for (const row of consumedRows) {
      const { error: inventoryError } = await supabase
        .from("inventory_items")
        .update({ quantity: row.nextQuantity })
        .eq("id", row.stockItem.id)
        .eq("user_id", userId);

      if (inventoryError) {
        setIsSaving(false);
        setFeedback({ tone: "error", message: "原因: 在庫を減算できませんでした。影響: 調理完了と料理履歴の作成を中止しました。修正方法: ログイン状態と在庫データを確認してください。" });
        return;
      }
    }

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

    const { data: historyData, error: historyError } = await supabase
      .from("cooking_history")
      .insert({
        user_id: userId,
        cooked_at: completedAt,
        recipe_id: schedule.recipe_id,
        recipe_name: schedule.recipe_name,
        meal_schedule_id: schedule.id,
        note: "献立から調理完了",
        rating: null
      })
      .select()
      .single();

    setIsSaving(false);

    if (historyError || !historyData) {
      setMealSchedules((items) => items.map((item) => (item.id === schedule.id ? (updatedSchedule as MealSchedule) : item)));
      setFeedback({
        tone: "error",
        message: "原因: 料理履歴をDBへ保存できませんでした。影響: 献立は完了済みですが履歴に出ません。修正方法: 料理履歴で手動追加してください。"
      });
      return;
    }

    if (normalizedDrafts.length > 0) {
      const { error: consumptionError } = await supabase.from("cooking_consumption_events").insert(
        normalizedDrafts.map((draft) => {
          const stockItem = draft.stockItemId ? inventoryItemsForMeals.find((item) => item.id === draft.stockItemId) : null;
          return {
            user_id: userId,
            cooking_history_id: String(historyData.id),
            meal_schedule_id: schedule.id,
            recipe_id: schedule.recipe_id,
            ingredient_name: draft.ingredientName,
            requested_amount: draft.requestedAmount,
            requested_unit: draft.requestedUnit,
            consumed_amount: draft.consumedAmount,
            consumed_unit: draft.requestedUnit,
            stock_item_id: stockItem?.id ?? null,
            stock_item_name: stockItem?.name ?? "",
            substitute_for: stockItem && stockItem.name !== draft.ingredientName ? draft.ingredientName : ""
          };
        })
      );

      if (consumptionError) {
        setFeedback({
          tone: "error",
          message: "原因: 消費履歴を保存できませんでした。影響: 在庫と料理履歴は更新済みですが、消費内訳が残りません。修正方法: 必要なら料理履歴メモへ追記してください。"
        });
      }
    }

    setMealSchedules((items) => items.map((item) => (item.id === schedule.id ? (updatedSchedule as MealSchedule) : item)));
    setInventoryItemsForMeals((items) =>
      items.map((item) => {
        const consumed = consumedRows.find((row) => row.stockItem.id === item.id);
        return consumed ? { ...item, quantity: consumed.nextQuantity } : item;
      })
    );
    setPendingConsumptionScheduleId(null);
    setConsumptionDrafts([]);
    router.refresh();
    setFeedback({ tone: "success", message: `${schedule.recipe_name} を調理完了にしました。料理履歴にも記録済みです。` });
  }

  return (
    <section className="recipe-meal-workspace" aria-labelledby="recipe-meal-heading">
      <div className="section-heading sr-only">
        <p className="eyebrow">{activeView === "schedule" ? "MEAL SCHEDULE" : "RECIPE COLLECTION"}</p>
        <h2 id="recipe-meal-heading">献立・レシピ</h2>
        <h2 className="sr-only">レシピ・献立・買い物</h2>
      </div>

      <div className="canvas-mode-control recipe-subnav" aria-label="献立とレシピの表示切替">
        <button className="secondary-button compact-button" data-active={activeView === "recipes"} type="button" onClick={() => setActiveView("recipes")}>
          レシピ集
        </button>
        <button className="secondary-button compact-button" data-active={activeView === "schedule"} type="button" onClick={() => setActiveView("schedule")}>
          スケジュール
        </button>
      </div>

      {activeView === "recipes" ? (
        <div className="recipe-primary-actions" aria-label="レシピ追加">
          <button className="primary-button" type="button" onClick={openNewRecipeEditor}>+ 新規レシピ</button>
          <button className="secondary-button recipe-text-button" type="button" onClick={() => setIsTextImportOpen(true)}>テキストから追加</button>
          <button className="secondary-button recipe-ai-button" type="button" onClick={() => setIsAiMenuOpen(true)}>AI考案</button>
        </div>
      ) : null}

      {feedback ? (
        <p className="operation-message" data-tone={feedback.tone} role={feedback.tone === "error" ? "alert" : "status"}>
          {feedback.message}
        </p>
      ) : null}

      {pendingDelete ? (
        <DeleteConfirmPanel
          disabled={isSaving}
          message={pendingDelete.message}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            const action = pendingDelete.confirm;
            setPendingDelete(null);
            action();
          }}
          target={pendingDelete.target}
        />
      ) : null}

      {isTextImportOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="recipe-text-modal-heading">
          <section className="canvas-modal text-import-modal">
            <button className="modal-close-button" type="button" onClick={() => setIsTextImportOpen(false)} aria-label="閉じる">×</button>
            <p className="eyebrow">ADD RECIPE FROM TEXT</p>
            <h3 id="recipe-text-modal-heading">テキストからレシピを追加</h3>
            <label>
              レシピテキスト
              <textarea rows={8} value={aiSourceText} onChange={(event) => setAiSourceText(event.target.value)} placeholder="Webやメモからコピーしたレシピテキストをここに貼り付けてください..." />
            </label>
            <button className="primary-button" type="button" disabled={isAiRunning} onClick={structureRecipeText}>
              {isAiRunning ? "AIで構造化中" : "AIで構造化"}
            </button>
            {aiPreview ? (
              <div className="ai-preview">
                <span>構造化結果</span>
                <strong>{aiPreview.name}</strong>
                <p>{aiPreview.ingredients.map((item) => `${item.name}${item.amount}${item.unit}`).join(" / ")}</p>
                <button className="secondary-button compact-button" type="button" onClick={applyAiPreview}>編集モーダルで確認</button>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {isAiMenuOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="ai-menu-modal-heading">
          <section className="canvas-modal ai-add-modal">
            <button className="modal-close-button" type="button" onClick={() => setIsAiMenuOpen(false)} aria-label="閉じる">×</button>
            <p className="eyebrow">ADD RECIPE WITH AI</p>
            <h3 id="ai-menu-modal-heading">AI考案で追加</h3>
            <div className="ai-choice-grid">
              <button className="ai-choice-card danger-choice" type="button" disabled={isAiRunning} onClick={generatePriorityRecipe}>
                <span>優先消費レシピ</span>
                <small>期限が近い食材から考案</small>
              </button>
              <button className="ai-choice-card purple-choice" type="button" onClick={() => setAiMode("generate")}>
                <span>指定食材から</span>
                <small>使いたい食材を選んで考案</small>
              </button>
            </div>
            <label>
              必須食材
              <textarea rows={2} value={aiRequired} onChange={(event) => setAiRequired(event.target.value)} placeholder="例: 豚肉, キャベツ" />
            </label>
            <label>
              任意食材
              <textarea rows={2} value={aiOptional} onChange={(event) => setAiOptional(event.target.value)} placeholder="例: にんじん, しょうが" />
            </label>
            <button className="primary-button" type="button" disabled={isAiRunning} onClick={() => runAiRecipe({ mode: "generate" })}>
              {isAiRunning ? "考案中" : "指定食材で考案"}
            </button>
            {aiPreview ? (
              <div className="ai-preview">
                <span>AIレシピ案</span>
                <strong>{aiPreview.name}</strong>
                <p>{aiPreview.ingredients.map((item) => `${item.name}${item.amount}${item.unit}`).join(" / ")}</p>
                <button className="secondary-button compact-button" type="button" onClick={applyAiPreview}>編集モーダルで確認</button>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {isRecipeEditorOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="recipe-editor-heading">
          <section className="canvas-modal recipe-editor-modal">
            <button className="modal-close-button" type="button" onClick={closeRecipeEditor} aria-label="閉じる">×</button>
            <p className="eyebrow">RECIPE EDITOR</p>
            <h3 id="recipe-editor-heading">{editingRecipeId ? "レシピを編集" : "新規レシピ"}</h3>
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
                <button className="secondary-button" type="button" onClick={closeRecipeEditor}>
                  キャンセル
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <div className="recipe-meal-grid">
        {activeView === "recipes" ? (
        <section className="canvas-recipe-collection" aria-label="レシピ集">
          <section className="ai-recipe-panel inline-ai-panel canvas-hidden-compat" aria-label="AIレシピ">
            <div className="panel-title compact-title">
              <div>
                <span>AI</span>
                <h4>レシピ案を作る</h4>
              </div>
            </div>
            <div className="ai-mode-row">
              <button className="secondary-button compact-button" data-active={aiMode === "generate"} type="button" onClick={() => setAiMode("generate")}>
                食材から考案
              </button>
              <button className="secondary-button compact-button" data-active={aiMode === "structure"} type="button" onClick={() => setAiMode("structure")}>
                本文を構造化
              </button>
            </div>
            <label>
              必須食材
              <textarea rows={2} value={aiRequired} onChange={(event) => setAiRequired(event.target.value)} placeholder="例: 豚肉, キャベツ" />
            </label>
            <label>
              任意食材
              <textarea rows={2} value={aiOptional} onChange={(event) => setAiOptional(event.target.value)} placeholder="例: にんじん, しょうが" />
            </label>
            <label>
              レシピ本文・補足
              <textarea rows={4} value={aiSourceText} onChange={(event) => setAiSourceText(event.target.value)} placeholder="貼り付けたレシピ本文や希望を書く" />
            </label>
            <button className="primary-button" type="button" disabled={isAiRunning} onClick={() => runAiRecipe()}>
              {isAiRunning ? "AI実行中" : "AIレシピをプレビュー"}
            </button>
            {aiPreview ? (
              <div className="ai-preview">
                <span>{aiPreview.genre || "ジャンル未設定"}</span>
                <strong>{aiPreview.name}</strong>
                <p>{aiPreview.ingredients.map((item) => `${item.name}${item.amount}${item.unit}`).join(" / ")}</p>
                <button className="secondary-button compact-button" type="button" onClick={applyAiPreview}>
                  フォームへ反映
                </button>
              </div>
            ) : null}
          </section>

          <RecipeList
            disabled={isSaving}
            onCook={openCookingViewer}
            onEdit={startEditRecipe}
            onDelete={(recipe) => requestDelete(recipe.name, "このレシピを削除します。献立に紐づくレシピ参照も外れます。", () => deleteRecipe(recipe))}
            onSelect={setSelectedRecipeId}
            pendingDeleteRecipeId={pendingDeleteRecipeId}
            recipes={visibleRecipes}
            search={recipeSearch}
            searchLogic={recipeSearchLogic}
            searchMode={recipeSearchMode}
            selectedRecipeId={selectedRecipe?.id ?? ""}
            sort={recipeSort}
            onSearchChange={setRecipeSearch}
            onSearchLogicChange={setRecipeSearchLogic}
            onSearchModeChange={setRecipeSearchMode}
            onSortChange={setRecipeSort}
            totalCount={visibleRecipes.length}
          />
        </section>
        ) : null}

        {activeView === "recipes" && selectedRecipe ? (
        <section className="stock-panel recipe-detail-panel canvas-hidden-compat" aria-labelledby="recipe-detail-heading">
          <div className="panel-title">
            <div>
              <span>詳細</span>
              <h3 id="recipe-detail-heading">レシピ詳細</h3>
            </div>
          </div>
          <RecipeDetail recipe={selectedRecipe} />
          <button className="primary-button" type="button" disabled={!selectedRecipe} onClick={() => selectedRecipe && openCookingViewer(selectedRecipe)}>
            調理ビューを開く
          </button>

          {activeCookingRecipe ? (
            <CookingViewer
              highlightedIngredientName={highlightedIngredientName}
              ingredientTab={cookingIngredientTab}
              inventoryItems={inventoryItemsForMeals}
              onHighlightIngredient={setHighlightedIngredientName}
              onIngredientTabChange={setCookingIngredientTab}
              onStepTabChange={setCookingStepTab}
              recipe={activeCookingRecipe}
              stepTab={cookingStepTab}
            />
          ) : null}

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

          <section className="candidate-panel" aria-label="作りたい候補">
            <div className="panel-title compact-title">
              <div>
                <span>候補</span>
                <h4>作りたい候補</h4>
              </div>
              <strong>{activeCookCandidates.length}件</strong>
            </div>
            <form className="candidate-form" onSubmit={addCookCandidate}>
              <label>
                候補理由
                <input value={candidateReasons} onChange={(event) => setCandidateReasons(event.target.value)} placeholder="期限が近い, 家族リクエスト" />
              </label>
              <button className="primary-button compact-button" type="submit" disabled={isSaving || !selectedRecipe}>
                選択レシピを候補へ
              </button>
            </form>
            {activeCookCandidates.length === 0 ? (
              <p className="empty-list">作りたい候補はありません。</p>
            ) : (
              <div className="candidate-list">
                {activeCookCandidates.map((candidate) => (
                  <article className="candidate-item" key={candidate.id}>
                    <div className="item-main">
                      <span>作りたい</span>
                      <h4>{candidate.recipe_name || "レシピ名なし"}</h4>
                      <div className="reason-chip-row">
                        {candidate.reasons.length === 0 ? (
                          <small>理由未設定</small>
                        ) : (
                          candidate.reasons.map((reason, index) => <small key={`${candidate.id}-${reason}-${index}`}>{reason}</small>)
                        )}
                      </div>
                    </div>
                    <div className="candidate-actions">
                      <button className="secondary-button compact-button" type="button" disabled={isSaving} onClick={() => assignCandidateToSchedule(candidate)}>
                        献立へ追加
                      </button>
                      <button
                        className="danger-button compact-button"
                        type="button"
                        disabled={isSaving}
                        onClick={() => requestDelete(candidate.recipe_name || "候補", "この作りたい候補を解除します。レシピ本体は削除されません。", () => deleteCookCandidate(candidate))}
                      >
                        解除
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
        ) : null}

        {activeView === "schedule" ? (
        <section className="stock-panel schedule-board-panel" aria-labelledby="meal-list-heading">
          <div className="panel-title">
            <div>
              <span>献立</span>
              <h3 id="meal-list-heading">7日予定と買い物候補</h3>
            </div>
          </div>

          <div className="schedule-toolbar">
            <button className="secondary-button compact-button" type="button" onClick={() => setScheduleWindowStart(addDays(scheduleWindowStart, -7))}>
              前の7日
            </button>
            <button
              className="secondary-button compact-button"
              type="button"
              onClick={() => {
                setScheduleWindowStart(todayValue());
                setScheduleDate(todayValue());
              }}
            >
              今日
            </button>
            <button className="secondary-button compact-button" type="button" onClick={() => setScheduleWindowStart(addDays(scheduleWindowStart, 7))}>
              次の7日
            </button>
          </div>

          <form className="schedule-quick-add" onSubmit={saveSchedule}>
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
            <label>
              レシピ
              <select value={scheduleRecipeId} onChange={(event) => setScheduleRecipeId(event.target.value)} disabled={recipes.length === 0}>
                {recipes.map((recipe) => (
                  <option key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button compact-button" type="submit" disabled={isSaving || recipes.length === 0}>
              追加
            </button>
          </form>

          <div className="meal-week canvas-schedule-week" aria-label="7日献立">
            {scheduleDays.map((day) => {
              const daySchedules = visibleMealSchedules.filter((schedule) => schedule.scheduled_on === day);
              return (
                <section className="meal-day canvas-schedule-day" key={day}>
                  <button className="meal-day-heading" type="button" onClick={() => setScheduleDate(day)}>
                    <span>{formatScheduleDayLabel(day)}</span>
                    {day === todayValue() ? <em>今日</em> : null}
                  </button>
                  <div className="meal-list canvas-meal-slots">
                    {(["朝", "昼", "晩"] as MealType[]).map((mealType) => {
                      const schedule = daySchedules.find((item) => item.meal_type === mealType);
                      return (
                        <div className="meal-slot" key={`${day}-${mealType}`}>
                          <div className="meal-slot-heading">
                            <span>{mealType}</span>
                            <button
                              className="secondary-button compact-button meal-add-button"
                              type="button"
                              onClick={() => {
                                setScheduleDate(day);
                                setScheduleMealType(mealType);
                              }}
                              aria-label={`${formatScheduleDayLabel(day)} ${mealType}に追加`}
                            >
                              +
                            </button>
                          </div>
                          {schedule ? (
                            <article className="meal-item" data-active={selectedSchedule?.id === schedule.id}>
                              <button className="meal-select-button" type="button" onClick={() => setSelectedScheduleId(schedule.id)}>
                                <strong>{schedule.recipe_name || "レシピ名なし"}</strong>
                                <em>{schedule.status}</em>
                              </button>
                              <div className="meal-actions">
                                <button className="secondary-button compact-button" type="button" disabled={isSaving} onClick={() => moveSchedule(schedule, -1)}>
                                  前日
                                </button>
                                <button className="secondary-button compact-button" type="button" disabled={isSaving} onClick={() => moveSchedule(schedule, 1)}>
                                  翌日
                                </button>
                                <button className="secondary-button compact-button" type="button" disabled={isSaving || schedule.status === "完了"} onClick={() => completeSchedule(schedule)}>
                                  {pendingConsumptionScheduleId === schedule.id ? "消費して完了" : "調理完了"}
                                </button>
                                <button
                                  className="danger-button compact-button"
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => requestDelete(schedule.recipe_name || "献立", "この献立予定を削除します。料理履歴は削除されません。", () => deleteSchedule(schedule))}
                                >
                                  削除
                                </button>
                              </div>
                            </article>
                          ) : (
                            <p className="compact-empty">予定なし</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>

          {pendingConsumptionScheduleId && selectedSchedule?.id === pendingConsumptionScheduleId ? (
            <ConsumptionEditor
              drafts={consumptionDrafts}
              inventoryItems={inventoryItemsForMeals}
              onChange={updateConsumptionDraft}
              recipe={recipes.find((item) => item.id === selectedSchedule.recipe_id) ?? null}
            />
          ) : null}

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
                onClick={() => requestDelete(`${selectedShoppingIds.length}件の買い物`, "選択した買い物を削除します。元には戻せません。", deleteSelectedShoppingItems)}
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
        ) : null}
      </div>
    </section>
  );
}

function ConsumptionEditor({
  drafts,
  inventoryItems,
  onChange,
  recipe
}: {
  drafts: ConsumptionDraft[];
  inventoryItems: StockItem[];
  onChange: (index: number, values: Partial<ConsumptionDraft>) => void;
  recipe: Recipe | null;
}) {
  if (!recipe) {
    return <p className="empty-list">レシピが見つからないため、消費量を作成できません。</p>;
  }

  return (
    <section className="consumption-editor" aria-label="消費量確認">
      <div className="panel-title compact-title">
        <div>
          <span>消費確認</span>
          <h4>在庫から減らす量</h4>
        </div>
      </div>
      {drafts.length === 0 ? (
        <p className="empty-list">減算対象の材料はありません。このまま完了できます。</p>
      ) : (
        <div className="consumption-list">
          {drafts.map((draft, index) => {
            const ingredient = recipe.ingredients.find((item) => item.name === draft.ingredientName && item.unit === draft.requestedUnit);
            const options = ingredient
              ? inventoryItems.filter((item) => item.category === ingredient.item_type && item.unit === ingredient.unit && item.quantity > 0)
              : [];
            return (
              <article className="consumption-item" key={`${draft.ingredientName}-${draft.requestedUnit}-${index}`}>
                <div className="item-main">
                  <span>必要 {draft.requestedAmount}{draft.requestedUnit}</span>
                  <h4>{draft.ingredientName}</h4>
                </div>
                <label>
                  減らす在庫
                  <select value={draft.stockItemId} onChange={(event) => onChange(index, { stockItemId: event.target.value })}>
                    <option value="">減算しない</option>
                    {options.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} / {item.quantity}{item.unit} / {item.storage_location}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  消費量
                  <input min="0" step="0.1" type="number" value={draft.amount} onChange={(event) => onChange(index, { amount: event.target.value })} />
                </label>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function CookingViewer({
  highlightedIngredientName,
  ingredientTab,
  inventoryItems,
  onHighlightIngredient,
  onIngredientTabChange,
  onStepTabChange,
  recipe,
  stepTab
}: {
  highlightedIngredientName: string;
  ingredientTab: CookingIngredientTab;
  inventoryItems: StockItem[];
  onHighlightIngredient: (name: string) => void;
  onIngredientTabChange: (tab: CookingIngredientTab) => void;
  onStepTabChange: (tab: CookingStepTab) => void;
  recipe: Recipe | null;
  stepTab: CookingStepTab;
}) {
  if (!recipe) {
    return <p className="empty-list">レシピを選ぶと調理ビューを確認できます。</p>;
  }

  const visibleIngredients = recipe.ingredients.filter((ingredient) => ingredient.item_type === ingredientTab);
  const allIngredientNames = recipe.ingredients.map((ingredient) => ingredient.name).filter(Boolean);
  const visibleSteps = stepTab === "prep" ? recipe.prep_steps : recipe.steps;

  return (
    <section className="cooking-viewer" aria-label="調理ビューア">
      <div className="panel-title compact-title">
        <div>
          <span>調理中</span>
          <h4>{recipe.name}</h4>
        </div>
      </div>

      <div className="cooking-viewer-grid">
        <section className="cooking-viewer-pane" aria-label="材料と在庫">
          <div className="segmented-control">
            {mealIngredientTabs.map((tab) => (
              <button className="secondary-button compact-button" data-active={ingredientTab === tab} key={tab} type="button" onClick={() => onIngredientTabChange(tab)}>
                {tab}
              </button>
            ))}
          </div>
          {visibleIngredients.length === 0 ? (
            <p className="empty-list">{ingredientTab}はありません。</p>
          ) : (
            <div className="cooking-ingredient-list">
              {visibleIngredients.map((ingredient) => {
                const stockAmount = inventoryAmountByNameAndUnit(inventoryItems, ingredient.name, ingredient.unit);
                const status = stockAmount >= ingredient.amount ? "在庫あり" : stockAmount > 0 ? "不足" : "在庫なし";
                return (
                  <article className="cooking-ingredient-item" data-highlighted={highlightedIngredientName === ingredient.name} key={ingredient.id || ingredient.name}>
                    <div>
                      <strong>{ingredient.name}</strong>
                      <span>必要 {ingredient.amount}{ingredient.unit}</span>
                    </div>
                    <small data-status={status}>在庫 {stockAmount}{ingredient.unit} / {status}</small>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="cooking-viewer-pane" aria-label="手順">
          <div className="segmented-control">
            <button className="secondary-button compact-button" data-active={stepTab === "prep"} type="button" onClick={() => onStepTabChange("prep")}>
              下準備
            </button>
            <button className="secondary-button compact-button" data-active={stepTab === "steps"} type="button" onClick={() => onStepTabChange("steps")}>
              調理手順
            </button>
          </div>
          {visibleSteps.length === 0 ? (
            <p className="empty-list">{stepTab === "prep" ? "下準備" : "調理手順"}はありません。</p>
          ) : (
            <ol className="cooking-step-list">
              {visibleSteps.map((step, index) => {
                const matchedNames = allIngredientNames.filter((name) => step.includes(name));
                return (
                  <li className="cooking-step-item" key={`${step}-${index}`}>
                    <span>Step {index + 1}</span>
                    <p>{step}</p>
                    {matchedNames.length > 0 ? (
                      <div className="step-chip-row">
                        {matchedNames.map((name) => (
                          <button className="secondary-button compact-button" type="button" key={`${index}-${name}`} onClick={() => onHighlightIngredient(name)}>
                            {name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </section>
  );
}

const mealIngredientTabs: CookingIngredientTab[] = ["食材", "調味料"];

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
  onCook,
  onDelete,
  onEdit,
  onSelect,
  onSearchChange,
  onSearchLogicChange,
  onSearchModeChange,
  onSortChange,
  pendingDeleteRecipeId,
  recipes,
  search,
  searchLogic,
  searchMode,
  selectedRecipeId,
  sort,
  totalCount
}: {
  disabled: boolean;
  onCook: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  onEdit: (recipe: Recipe) => void;
  onSelect: (id: string) => void;
  onSearchChange: (value: string) => void;
  onSearchLogicChange: (value: RecipeSearchLogic) => void;
  onSearchModeChange: (value: RecipeSearchMode) => void;
  onSortChange: (value: RecipeSort) => void;
  pendingDeleteRecipeId: string | null;
  recipes: Recipe[];
  search: string;
  searchLogic: RecipeSearchLogic;
  searchMode: RecipeSearchMode;
  selectedRecipeId: string;
  sort: RecipeSort;
  totalCount: number;
}) {
  const searchTabs: Array<{ label: string; value: RecipeSearchMode }> = [
    { label: "レシピ名", value: "name" },
    { label: "食材", value: "ingredient" },
    { label: "すべて", value: "all" }
  ];
  const sortTabs: Array<{ label: string; value: RecipeSort }> = [
    { label: "登録日時", value: "created_desc" },
    { label: "更新日時", value: "updated_desc" },
    { label: "レシピ名", value: "name_asc" },
    { label: "調理回数", value: "count_desc" },
    { label: "材料数", value: "ingredients_desc" }
  ];

  return (
    <section className="recipe-browser" aria-label="レシピ一覧">
      <div className="recipe-search-controls">
        <div className="recipe-search-mode-tabs" aria-label="レシピ検索対象">
          {searchTabs.map((tab) => (
            <button data-active={searchMode === tab.value} key={tab.value} onClick={() => onSearchModeChange(tab.value)} type="button">
              {tab.label}
            </button>
          ))}
        </div>
        <div className="recipe-search-logic" aria-label="検索条件">
          <button data-active={searchLogic === "and"} onClick={() => onSearchLogicChange("and")} type="button">AND</button>
          <button data-active={searchLogic === "or"} onClick={() => onSearchLogicChange("or")} type="button">OR</button>
        </div>
        <div className="recipe-search-field">
          <input aria-label="レシピ検索" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="検索..." />
          {search ? <button aria-label="検索をクリア" onClick={() => onSearchChange("")} type="button">×</button> : null}
        </div>
        <select className="canvas-hidden-compat" aria-label="レシピの並び順" value={sort} onChange={(event) => onSortChange(event.target.value as RecipeSort)}>
          <option value="created_desc">登録が新しい順</option>
          <option value="updated_desc">更新が新しい順</option>
          <option value="name_asc">名前順</option>
          <option value="count_desc">調理回数が多い順</option>
          <option value="ingredients_desc">材料が多い順</option>
        </select>
      </div>
      <div className="recipe-sort-row">
        <span>並び</span>
        {sortTabs.map((tab) => (
          <button data-active={sort === tab.value} key={tab.value} onClick={() => onSortChange(tab.value)} type="button">
            {tab.label}{sort === tab.value ? "▼" : ""}
          </button>
        ))}
      </div>
      <div className="recipe-count-row">
        <span>{totalCount} レシピ</span>
        <small>同期は上部の同期ボタンで一括反映</small>
      </div>

      {recipes.length === 0 ? (
        <p className="empty-list">条件に合うレシピはありません。</p>
      ) : (
        <div className="recipe-list">
          {recipes.map((recipe) => (
            <article className="recipe-card" data-active={selectedRecipeId === recipe.id} key={recipe.id} onClick={() => onSelect(recipe.id)}>
              <div className="recipe-card-icon" aria-hidden="true">III</div>
              <button className="recipe-select-button" type="button" onClick={(event) => { event.stopPropagation(); onSelect(recipe.id); }}>
                <strong>{recipe.name}</strong>
                <small>
                  材料 {recipe.ingredients.length} 品目 | 調理回数 {recipe.cook_count} | 登録 {formatRecipeDate(recipe.created_at)}
                  {recipe.genre.slice(0, 3).map((genre) => (
                    <span className="recipe-genre-pill" key={genre}>#{genre}</span>
                  ))}
                </small>
              </button>
              <div className="recipe-card-actions">
                <button className="recipe-icon-button cook-button" type="button" disabled={disabled} onClick={(event) => { event.stopPropagation(); onCook(recipe); }} aria-label="料理する">
                  <span aria-hidden="true">III</span>
                </button>
                <button className="recipe-icon-button" type="button" disabled={disabled} onClick={(event) => { event.stopPropagation(); onEdit(recipe); }} aria-label="編集">
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="m16.9 4.1 3 3L8 19H5v-3L16.9 4.1Z" />
                  </svg>
                </button>
                <button className="recipe-icon-button" type="button" disabled={disabled} onClick={(event) => { event.stopPropagation(); onDelete(recipe); }} aria-label={pendingDeleteRecipeId === recipe.id ? "削除する" : "削除"}>
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6M14 10v6" />
                  </svg>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
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
