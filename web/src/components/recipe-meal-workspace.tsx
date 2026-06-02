"use client";

import { type ChangeEvent, FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AiUsageMeter } from "@/components/ai-usage-meter";
import { DeleteConfirmPanel } from "@/components/delete-confirm-panel";
import { GeminiApiKeyPanel } from "@/components/gemini-api-key-panel";
import { NumberField } from "@/components/number-field";
import { UnitPicker } from "@/components/unit-picker";
import { useShellAiUsage, useShellNavigation, useShellStatusMessage } from "@/components/web-mode-shell";
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
  RecipeIngredientType,
  splitCsv,
  splitLines,
  toRecipeFormValues
} from "@/lib/recipes/types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { buildCookingHistoryPhotoStoragePath, compressImageFile } from "@/lib/photos/compress";

type RecipeMealWorkspaceProps = {
  initialCookCandidates: CookCandidate[];
  initialInventoryItems: StockItem[];
  initialMealSchedules: MealSchedule[];
  initialRecipes: Recipe[];
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

type RecipeShoppingShortage = {
  key: string;
  name: string;
  recipeName: string;
  selected: boolean;
  shortageQuantity: number;
  type: RecipeIngredientType;
  unit: string;
};

type ConsumptionDraft = {
  amount: string;
  ingredientName: string;
  requestedAmount: number;
  requestedUnit: string;
  selected: boolean;
  stockItemId: string;
};

type AiRecipeMode = "generate" | "structure";
type RecipeWorkspaceView = "recipes" | "schedule";

type RecipeSearchLogic = "and" | "or";
type RecipeSearchMode = "name" | "ingredient" | "all";
type RecipeSort = "created_desc" | "updated_desc" | "name_asc" | "count_desc" | "ingredients_desc";
type CookingIngredientTab = "all" | "食材" | "調味料";
type CookingStepTab = "all" | "prep" | "steps";
type ShortageSelectionTab = "all" | "ingredients" | "seasonings";
type CookingViewerOrigin = "recipes" | "cooking";
type ConsumptionTab = "all" | "食材" | "調味料";

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

function recipeStepRows(value: string) {
  const rows = value.split(/\r?\n/);
  return rows.length > 0 ? rows : [""];
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

function scheduleDateTone(value: string): "today" | "sun" | "sat" | "weekday" {
  if (value === todayValue()) return "today";
  const weekday = new Date(`${value}T00:00:00`).getDay();
  if (weekday === 0) return "sun";
  if (weekday === 6) return "sat";
  return "weekday";
}

function inventoryAmountByNameAndUnit(items: StockItem[], name: string, unit: string) {
  return items
    .filter((item) => item.name === name && item.unit === unit)
    .reduce((total, item) => total + Number(item.quantity || 0), 0);
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

function compareRecipeWithInventory(recipe: Recipe, inventoryItems: StockItem[]) {
  return recipe.ingredients
    .map((ingredient, index) => {
      const stockAmount = inventoryAmountByNameAndUnit(inventoryItems, ingredient.name, ingredient.unit);
      const shortageQuantity = Math.max(0, ingredient.amount - stockAmount);
      return {
        key: `${ingredient.name}:${ingredient.unit}:${index}`,
        name: ingredient.name,
        selected: false,
        shortageQuantity,
        type: ingredient.item_type,
        unit: ingredient.unit,
        recipeName: recipe.name
      };
    })
    .filter((item) => item.name && item.shortageQuantity > 0);
}

export function RecipeMealWorkspace({
  initialCookCandidates,
  initialInventoryItems,
  initialMealSchedules,
  initialRecipes,
  userId
}: RecipeMealWorkspaceProps) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [cookCandidates, setCookCandidates] = useState(initialCookCandidates);
  const [inventoryItemsForMeals, setInventoryItemsForMeals] = useState(initialInventoryItems);
  const [mealSchedules, setMealSchedules] = useState(initialMealSchedules);
  const [recipeValues, setRecipeValues] = useState<RecipeFormValues>(emptyRecipeFormValues);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState(initialRecipes[0]?.id ?? "");
  const [activeCookingRecipeId, setActiveCookingRecipeId] = useState("");
  // Canvas版同様、7日ウィンドウは常に今日を中央（today-3〜today+3）に置く。
  const [scheduleWindowStart, setScheduleWindowStart] = useState(() => addDays(todayValue(), -3));
  const [scheduleDate, setScheduleDate] = useState(() => todayValue());
  const [scheduleMealType, setScheduleMealType] = useState<MealType>("晩");
  const [scheduleRecipeId, setScheduleRecipeId] = useState(initialRecipes[0]?.id ?? "");
  const [selectedScheduleId, setSelectedScheduleId] = useState(initialMealSchedules[0]?.id ?? "");
  const [candidateReasons, setCandidateReasons] = useState("");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeSearchLogic, setRecipeSearchLogic] = useState<RecipeSearchLogic>("and");
  const [recipeSearchMode, setRecipeSearchMode] = useState<RecipeSearchMode>("name");
  const [recipeSort, setRecipeSort] = useState<RecipeSort>("created_desc");
  const [pendingDeleteRecipeId, setPendingDeleteRecipeId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [pendingConsumptionScheduleId, setPendingConsumptionScheduleId] = useState<string | null>(null);
  const [consumptionDrafts, setConsumptionDrafts] = useState<ConsumptionDraft[]>([]);
  const [consumptionTab, setConsumptionTab] = useState<ConsumptionTab>("all");
  const [selectedCookingPhoto, setSelectedCookingPhoto] = useState<File | null>(null);
  const [cookingPhotoPreviewUrl, setCookingPhotoPreviewUrl] = useState<string | null>(null);
  const [cookingRating, setCookingRating] = useState("");
  const [cookingComment, setCookingComment] = useState("");
  const [cookingIngredientTab, setCookingIngredientTab] = useState<CookingIngredientTab>("all");
  const [cookingStepTab, setCookingStepTab] = useState<CookingStepTab>("all");
  const [cookingStockCheck, setCookingStockCheck] = useState(false);
  const [highlightedIngredientName, setHighlightedIngredientName] = useState("");
  const [aiMode, setAiMode] = useState<AiRecipeMode>("generate");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [aiRequired, setAiRequired] = useState("");
  const [aiOptional, setAiOptional] = useState("");
  const [aiSourceText, setAiSourceText] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [activeView, setActiveView] = useState<RecipeWorkspaceView>("recipes");
  const [isTextImportOpen, setIsTextImportOpen] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isRecipeEditorOpen, setIsRecipeEditorOpen] = useState(false);
  const [shortageSelectionItems, setShortageSelectionItems] = useState<RecipeShoppingShortage[]>([]);
  const [shortageSelectionTab, setShortageSelectionTab] = useState<ShortageSelectionTab>("all");
  const [shortageSelectionRecipeName, setShortageSelectionRecipeName] = useState("");
  const [pickerSlot, setPickerSlot] = useState<{ date: string; meal: MealType; replaceId?: string } | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const [cookingScheduleId, setCookingScheduleId] = useState<string | null>(null);
  const [cookingViewerOrigin, setCookingViewerOrigin] = useState<CookingViewerOrigin>("recipes");
  const [slotMenuId, setSlotMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "info" | "success" | "error" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cookingPhotoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { clearPendingRecipe, pendingRecipeId, pendingRecipeOrigin, returnToMode } = useShellNavigation();
  const { showStatusMessage } = useShellStatusMessage();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const { aiUsageSummary, refreshAiUsage } = useShellAiUsage();
  const recipeLimitReached = Boolean(
    aiUsageSummary?.ok && (aiUsageSummary.recipe_generation.remaining <= 0 || aiUsageSummary.total.remaining <= 0)
  );

  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId) ?? recipes[0] ?? null;
  const activeCookingRecipe = recipes.find((recipe) => recipe.id === activeCookingRecipeId) ?? null;
  const visibleRecipes = filterAndSortRecipes(recipes, recipeSearch, recipeSort, recipeSearchMode, recipeSearchLogic);
  const selectedSchedule = mealSchedules.find((schedule) => schedule.id === selectedScheduleId) ?? mealSchedules[0] ?? null;
  const slotMenuSchedule = slotMenuId ? mealSchedules.find((schedule) => schedule.id === slotMenuId) ?? null : null;
  const cookingSchedule = cookingScheduleId ? mealSchedules.find((schedule) => schedule.id === cookingScheduleId) ?? null : null;
  const scheduleDays = Array.from({ length: 7 }, (_, index) => addDays(scheduleWindowStart, index));
  const visibleMealSchedules = mealSchedules
    .filter((schedule) => scheduleDays.includes(schedule.scheduled_on))
    .sort((a, b) => a.scheduled_on.localeCompare(b.scheduled_on) || mealTypeOrder[a.meal_type] - mealTypeOrder[b.meal_type]);
  const activeCookCandidates = cookCandidates.filter((item) => item.status === "候補");
  const recipeIngredientEntries = recipeValues.ingredients.map((ingredient, index) => ({ ingredient, index }));
  const foodIngredientEntries = recipeIngredientEntries.filter(({ ingredient }) => ingredient.item_type === "食材");
  const seasoningIngredientEntries = recipeIngredientEntries.filter(({ ingredient }) => ingredient.item_type === "調味料");
  const prepStepEntries = recipeStepRows(recipeValues.prep_steps);
  const cookStepEntries = recipeStepRows(recipeValues.steps);
  const filteredShortageSelectionItems = shortageSelectionItems.filter((item) => {
    if (shortageSelectionTab === "ingredients") return item.type !== "調味料";
    if (shortageSelectionTab === "seasonings") return item.type === "調味料";
    return true;
  });
  const selectedShortageSelectionCount = shortageSelectionItems.filter((item) => item.selected).length;
  const allVisibleShortagesSelected = filteredShortageSelectionItems.length > 0 && filteredShortageSelectionItems.every((item) => item.selected);

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

  function addIngredientRow(itemType: RecipeIngredientType = "食材") {
    setRecipeValues((current) => ({
      ...current,
      ingredients: [...current.ingredients, { ...emptyRecipeIngredientFormValues, item_type: itemType }]
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

  function updateRecipeStep(key: "prep_steps" | "steps", index: number, value: string) {
    setRecipeValues((current) => {
      const rows = recipeStepRows(current[key]);
      const nextValues = value.split(/\r?\n/);
      rows.splice(index, 1, ...nextValues);
      return { ...current, [key]: rows.join("\n") };
    });
  }

  function addRecipeStep(key: "prep_steps" | "steps") {
    setRecipeValues((current) => {
      const rows = recipeStepRows(current[key]);
      return { ...current, [key]: [...rows, ""].join("\n") };
    });
  }

  function removeRecipeStep(key: "prep_steps" | "steps", index: number) {
    setRecipeValues((current) => {
      const rows = recipeStepRows(current[key]);
      const nextRows = rows.length > 1 ? rows.filter((_, currentIndex) => currentIndex !== index) : [""];
      return { ...current, [key]: nextRows.join("\n") };
    });
  }

  function closeShortageSelectionModal() {
    setShortageSelectionItems([]);
    setShortageSelectionRecipeName("");
    setShortageSelectionTab("all");
  }

  function toggleShortageSelection(key: string, selected: boolean) {
    setShortageSelectionItems((items) =>
      items.map((item) => (item.key === key ? { ...item, selected } : item))
    );
  }

  function toggleVisibleShortageSelection(selected: boolean) {
    const visibleKeys = new Set(filteredShortageSelectionItems.map((item) => item.key));
    setShortageSelectionItems((items) =>
      items.map((item) => (visibleKeys.has(item.key) ? { ...item, selected } : item))
    );
  }

  async function runAiRecipe(overrides?: Partial<{ mode: AiRecipeMode; required: string; optional: string; sourceText: string }>): Promise<RecipeFormValues | null> {
    const mode = overrides?.mode ?? aiMode;
    const required = overrides?.required ?? aiRequired;
    const optional = overrides?.optional ?? aiOptional;
    const sourceText = overrides?.sourceText ?? aiSourceText;
    if (!required.trim() && !optional.trim() && !sourceText.trim()) {
      setFeedback({
        tone: "error",
        message: "原因: AIに渡す食材や本文が空です。影響: レシピ案を作れません。修正方法: 必須食材、任意食材、またはレシピ本文を入力してください。"
      });
      return null;
    }

    const trimmedApiKey = geminiApiKey.trim();
    if (!trimmedApiKey) {
      setFeedback({
        tone: "error",
        message: "原因: ユーザー自身のGemini APIキーが未入力です。影響: AIレシピを実行できません。修正方法: Gemini APIキーを入力してから再度お試しください。"
      });
      return null;
    }

    if (recipeLimitReached) {
      setFeedback({
        tone: "error",
        message: "原因: 本日のAIレシピ生成の上限に達しました。影響: 今日はAIレシピ生成を実行できません。修正方法: 明日再度お試しください。"
      });
      return null;
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
          geminiApiKey: trimmedApiKey,
          required,
          optional,
          sourceText
        })
      });
      const result = (await response.json().catch(() => ({}))) as { recipe?: RecipeFormValues; error?: string };

      if (!response.ok || !result.recipe) {
        setFeedback({
          tone: "error",
          message: result.error || "原因: AIレシピの取得に失敗しました。影響: 編集モーダルを開けません。修正方法: 時間を置いて再度お試しください。"
        });
        return null;
      }

      return result.recipe;
    } catch {
      setFeedback({
        tone: "error",
        message: "原因: AIレシピ通信に失敗しました。影響: 編集モーダルを開けません。修正方法: 通信状態を確認してください。"
      });
      return null;
    } finally {
      setIsAiRunning(false);
      // 成功・429いずれの場合も残り回数表示を更新する。
      void refreshAiUsage();
    }
  }

  function applyRecipeToEditor(recipe: RecipeFormValues) {
    setRecipeValues(recipe);
    setEditingRecipeId(null);
    setIsTextImportOpen(false);
    setIsAiMenuOpen(false);
    setAiSourceText("");
    setIsRecipeEditorOpen(true);
    setFeedback({ tone: "info", message: "AIレシピ案を編集モーダルで開きました。内容を確認して保存してください。" });
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
    const recipe = await runAiRecipe({ mode: "structure", required: "", optional: "", sourceText: aiSourceText });
    if (recipe) applyRecipeToEditor(recipe);
  }

  async function generatePriorityRecipe() {
    const urgentItems = inventoryItemsForMeals
      .filter((item) => item.effective_expires_on || item.display_expires_on)
      .sort((a, b) => (a.effective_expires_on ?? a.display_expires_on ?? "").localeCompare(b.effective_expires_on ?? b.display_expires_on ?? ""))
      .slice(0, 5)
      .map((item) => `${item.name} ${item.quantity}${item.unit}`)
      .join(", ");
    setAiMode("generate");
    const recipe = await runAiRecipe({ mode: "generate", required: urgentItems, optional: aiOptional, sourceText: "期限が近い食材を優先して使い切るレシピ" });
    if (recipe) applyRecipeToEditor(recipe);
  }

  async function generateFromIngredients() {
    setAiMode("generate");
    const recipe = await runAiRecipe({ mode: "generate" });
    if (recipe) applyRecipeToEditor(recipe);
  }

  async function runInlineAiRecipe() {
    const recipe = await runAiRecipe();
    if (recipe) applyRecipeToEditor(recipe);
  }

  const openCookingViewer = useCallback((recipe: Recipe, origin: CookingViewerOrigin = "recipes") => {
    setActiveCookingRecipeId(recipe.id);
    setSelectedRecipeId(recipe.id);
    setHighlightedIngredientName("");
    setCookingViewerOrigin(origin);
  }, []);

  function closeCookingViewer() {
    const shouldReturnToCooking = cookingViewerOrigin === "cooking";
    setActiveCookingRecipeId("");
    setCookingScheduleId(null);
    setPendingConsumptionScheduleId(null);
    setCookingViewerOrigin("recipes");
    if (shouldReturnToCooking) {
      returnToMode("cooking");
    }
  }

  function resetCookingPhoto() {
    if (cookingPhotoPreviewUrl) URL.revokeObjectURL(cookingPhotoPreviewUrl);
    setSelectedCookingPhoto(null);
    setCookingPhotoPreviewUrl(null);
    if (cookingPhotoInputRef.current) {
      cookingPhotoInputRef.current.value = "";
    }
  }

  function resetCookingRecordDraft() {
    resetCookingPhoto();
    setCookingRating("");
    setCookingComment("");
  }

  function closeConsumptionModal() {
    setPendingConsumptionScheduleId(null);
    setConsumptionDrafts([]);
    setConsumptionTab("all");
    resetCookingRecordDraft();
  }

  function selectCookingPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      resetCookingRecordDraft();
      setFeedback({
        tone: "error",
        message: "原因: 画像ではないファイルです。影響: 完成写真を保存できません。修正方法: カメラで撮影するか画像を選んでください。"
      });
      return;
    }

    if (cookingPhotoPreviewUrl) URL.revokeObjectURL(cookingPhotoPreviewUrl);
    setSelectedCookingPhoto(file);
    setCookingPhotoPreviewUrl(URL.createObjectURL(file));
  }

  function setVisibleConsumptionSelected(selected: boolean) {
    if (!activeCookingRecipe) return;
    setConsumptionDrafts((items) =>
      items.map((draft) => {
        const ingredient = activeCookingRecipe.ingredients.find((item) => item.name === draft.ingredientName && item.unit === draft.requestedUnit);
        const visible = consumptionTab === "all" || ingredient?.item_type === consumptionTab;
        return visible ? { ...draft, selected } : draft;
      })
    );
  }

  function requestDelete(target: string, message: string, confirm: () => void) {
    setPendingDelete({ target, message, confirm });
    setFeedback(null);
  }

  // レイアウトを動かさない一時通知（Canvas版 showToast 相当）。
  const showToast = useCallback((message: string, tone: "info" | "success" | "error" = "info") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, tone });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  useEffect(() => () => {
    if (cookingPhotoPreviewUrl) URL.revokeObjectURL(cookingPhotoPreviewUrl);
  }, [cookingPhotoPreviewUrl]);

  useEffect(() => {
    if (!feedback) return;
    if (feedback.tone === "error") {
      showToast(feedback.message, "error");
      return;
    }
    showStatusMessage(feedback);
  }, [feedback, showStatusMessage, showToast]);

  useEffect(() => {
    if (!pendingRecipeId) return;
    const recipe = recipes.find((item) => item.id === pendingRecipeId);
    if (recipe) {
      openCookingViewer(recipe, pendingRecipeOrigin);
    } else {
      showStatusMessage({ message: "レシピが見つかりません", tone: "error" });
    }
    clearPendingRecipe();
  }, [clearPendingRecipe, openCookingViewer, pendingRecipeId, pendingRecipeOrigin, recipes, showStatusMessage]);

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
        selected: Boolean(exactStock) && Number(ingredient.amount) > 0,
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

  async function addScheduleEntry(date: string, meal: MealType, recipeId: string) {
    const recipe = recipes.find((item) => item.id === recipeId);
    if (!date || !recipe) {
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
        scheduled_on: date,
        meal_type: meal,
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
    setPickerSlot(null);
    setPickerQuery("");
    setFeedback({ tone: "success", message: "献立に追加しました。" });
  }

  async function saveSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await addScheduleEntry(scheduleDate, scheduleMealType, scheduleRecipeId);
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
    setFeedback({ tone: "success", message: `${candidate.recipe_name || "候補"} を献立に追加しました。` });
  }

  // Canvas版 handleScheduleDrop 相当: まず画面を即座に書き換え（楽観的更新）、保存はバックグラウンドで行う。
  // 通知はレイアウトを動かさないトーストにして、ドロップ時のブレと待ち時間をなくす。
  async function moveScheduleToSlot(schedule: MealSchedule, date: string, meal: MealType) {
    if (schedule.scheduled_on === date && schedule.meal_type === meal) return;

    const previousSchedules = mealSchedules;
    setMealSchedules((items) => items.map((item) => (item.id === schedule.id ? { ...item, scheduled_on: date, meal_type: meal } : item)));
    setSelectedScheduleId(schedule.id);
    if (!scheduleDays.includes(date)) {
      setScheduleWindowStart(date);
    }
    showToast(`${schedule.recipe_name || "献立"} を ${formatScheduleDate(date)} ${meal} へ移動しました。`, "success");

    const { data, error } = await supabase
      .from("meal_schedules")
      .update({ scheduled_on: date, meal_type: meal })
      .eq("id", schedule.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      setMealSchedules(previousSchedules);
      showToast("献立を移動できませんでした。ログイン状態を確認してください。", "error");
      return;
    }

    setMealSchedules((items) => items.map((item) => (item.id === schedule.id ? (data as MealSchedule) : item)));
  }

  // Canvas版 startScheduleSlotCooking 相当: 調理ビューアを開く。完了（消費）はビューア側で行う。
  function startSlotCooking(schedule: MealSchedule) {
    const recipe = recipes.find((item) => item.id === schedule.recipe_id);
    setSlotMenuId(null);
    if (!recipe) {
      showToast("この献立にはレシピが紐づいていません。", "error");
      return;
    }
    setCookingScheduleId(schedule.id);
    openCookingViewer(recipe);
  }

  // Canvas版 changeScheduleSlotRecipe 相当: ピッカーを開いてレシピを差し替える。
  function startSlotRecipeChange(schedule: MealSchedule) {
    setSlotMenuId(null);
    setPickerQuery("");
    setPickerSlot({ date: schedule.scheduled_on, meal: schedule.meal_type, replaceId: schedule.id });
  }

  async function replaceScheduleRecipe(scheduleId: string, recipeId: string) {
    const recipe = recipes.find((item) => item.id === recipeId);
    if (!recipe) return;

    setIsSaving(true);
    setFeedback(null);

    const { data, error } = await supabase
      .from("meal_schedules")
      .update({ recipe_id: recipe.id, recipe_name: recipe.name })
      .eq("id", scheduleId)
      .eq("user_id", userId)
      .select()
      .single();

    setIsSaving(false);

    if (error || !data) {
      setFeedback({ tone: "error", message: "原因: レシピを変更できませんでした。影響: 献立のレシピが変わりません。修正方法: ログイン状態を確認してください。" });
      return;
    }

    setMealSchedules((items) => items.map((item) => (item.id === scheduleId ? (data as MealSchedule) : item)));
    setPickerSlot(null);
    setPickerQuery("");
    showToast(`献立を ${recipe.name} に変更しました。`, "success");
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
    }
    setFeedback({ tone: "info", message: `${schedule.recipe_name || "献立"} を献立から削除しました。` });
  }

  async function addCurrentRecipeToShopping() {
    if (!editingRecipeId) {
      setFeedback({
        tone: "error",
        message: "原因: レシピがまだ保存されていません。影響: 買い物リストへ追加できません。修正方法: 先にレシピを保存してください。"
      });
      return;
    }

    const recipe = recipes.find((item) => item.id === editingRecipeId);
    if (!recipe) {
      setFeedback({
        tone: "error",
        message: "原因: 保存済みレシピを見つけられませんでした。影響: 買い物リストへ追加できません。修正方法: レシピを保存し直してから再度お試しください。"
      });
      return;
    }

    const shortages = compareRecipeWithInventory(recipe, inventoryItemsForMeals);
    if (shortages.length === 0) {
      setFeedback({ tone: "info", message: "在庫に十分な材料があります。" });
      return;
    }

    setShortageSelectionItems(shortages);
    setShortageSelectionRecipeName(recipe.name);
    setShortageSelectionTab("all");
  }

  async function confirmRecipeShortageSelection() {
    const selectedShortages = shortageSelectionItems.filter((item) => item.selected);
    if (selectedShortages.length === 0) {
      closeShortageSelectionModal();
      setFeedback({ tone: "info", message: "買い物リストには追加していません。" });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const { data, error } = await supabase
      .from("shopping_items")
      .insert(
        selectedShortages.map((item) => ({
          user_id: userId,
          name: item.name,
          required_quantity: item.shortageQuantity,
          unit: item.unit,
          status: "未購入",
          linked_recipe_name: item.recipeName,
          source_type: "recipe_detail"
        }))
      )
      .select();

    setIsSaving(false);

    if (error || !data) {
      setFeedback({
        tone: "error",
        message: "原因: 買い物リストをDBへ保存できませんでした。影響: 不足材料が買い物に残りません。修正方法: ログイン状態を確認してください。"
      });
      return;
    }

    closeShortageSelectionModal();
    setFeedback({ tone: "success", message: `${data.length}件の不足材料を買い物リストへ追加しました。` });
    router.refresh();
  }

  async function completeSchedule(schedule: MealSchedule) {
    if (schedule.status === "完了") {
      setFeedback({ tone: "info", message: "この献立は完了済みです。" });
      return;
    }

    if (pendingConsumptionScheduleId !== schedule.id) {
      setPendingConsumptionScheduleId(schedule.id);
      setConsumptionDrafts(buildConsumptionDrafts(schedule));
      setConsumptionTab("all");
      resetCookingRecordDraft();
      setSelectedScheduleId(schedule.id);
      setFeedback({ tone: "info", message: "消費量を確認してから「確定」を押してください。" });
      return;
    }

    const normalizedDrafts = consumptionDrafts.map((draft) => ({
      ...draft,
      consumedAmount: Number(draft.amount)
    }));
    const invalidDraft = normalizedDrafts.find((draft) => draft.selected && (!Number.isFinite(draft.consumedAmount) || draft.consumedAmount < 0));
    if (invalidDraft) {
      setFeedback({ tone: "error", message: "原因: 消費量に不備があります。影響: 在庫を減算できません。修正方法: 0以上の数値に直してください。" });
      return;
    }
    const ratingValue = cookingRating ? Number(cookingRating) : null;
    if (ratingValue !== null && (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5)) {
      setFeedback({ tone: "error", message: "原因: 評価の値に不備があります。影響: 料理履歴を保存できません。修正方法: ★1〜5の範囲で選んでください。" });
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
      if (!draft.selected || !draft.stockItemId || draft.consumedAmount === 0) continue;
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
        note: cookingComment.trim() || "献立から調理完了",
        rating: ratingValue
      })
      .select()
      .single();

    if (historyError || !historyData) {
      setIsSaving(false);
      setMealSchedules((items) => items.map((item) => (item.id === schedule.id ? (updatedSchedule as MealSchedule) : item)));
      setFeedback({
        tone: "error",
        message: "原因: 料理履歴をDBへ保存できませんでした。影響: 献立は完了済みですが履歴に出ません。修正方法: 料理履歴で手動追加してください。"
      });
      return;
    }

    // 実際に在庫から消費した材料だけを記録する（在庫が無い／消費0の行は記録しない＝Canvas版と同じ）。
    // requested_amount/consumed_amount には >= 0 のCHECK制約があるため、不正値の行を送らない。
    if (consumedRows.length > 0) {
      const { error: consumptionError } = await supabase.from("cooking_consumption_events").insert(
        consumedRows.map((row) => ({
          user_id: userId,
          cooking_history_id: String(historyData.id),
          meal_schedule_id: schedule.id,
          recipe_id: schedule.recipe_id,
          ingredient_name: row.draft.ingredientName,
          requested_amount: Number.isFinite(row.draft.requestedAmount) ? Math.max(0, row.draft.requestedAmount) : 0,
          requested_unit: row.draft.requestedUnit,
          consumed_amount: Math.max(0, row.draft.consumedAmount),
          consumed_unit: row.draft.requestedUnit,
          stock_item_id: row.stockItem.id,
          stock_item_name: row.stockItem.name,
          substitute_for: row.stockItem.name !== row.draft.ingredientName ? row.draft.ingredientName : ""
        }))
      );

      if (consumptionError) {
        setFeedback({
          tone: "error",
          message: "原因: 消費履歴を保存できませんでした。影響: 在庫と料理履歴は更新済みですが、消費内訳が残りません。修正方法: 必要なら料理履歴メモへ追記してください。"
        });
      }
    }

    let photoWarning = "";
    if (selectedCookingPhoto) {
      try {
        const compressed = await compressImageFile(selectedCookingPhoto);
        const storagePath = buildCookingHistoryPhotoStoragePath(userId);
        const { error: uploadError } = await supabase.storage.from("photos").upload(storagePath, compressed.blob, {
          contentType: compressed.contentType,
          upsert: false
        });

        if (uploadError) {
          photoWarning = "写真の保存に失敗しました。料理履歴は写真なしで保存済みです。";
        } else {
          const { error: photoInsertError } = await supabase.from("photos").insert({
            user_id: userId,
            bucket_id: "photos",
            storage_path: storagePath,
            usage_type: "cooking_history",
            cooking_history_id: String(historyData.id),
            content_type: compressed.contentType,
            byte_size: compressed.byteSize,
            width: compressed.width,
            height: compressed.height
          });

          if (photoInsertError) {
            await supabase.storage.from("photos").remove([storagePath]);
            photoWarning = "写真情報の保存に失敗しました。料理履歴は写真なしで保存済みです。";
          }
        }
      } catch {
        photoWarning = "写真の処理に失敗しました。料理履歴は写真なしで保存済みです。";
      }
    }

    setMealSchedules((items) => items.map((item) => (item.id === schedule.id ? (updatedSchedule as MealSchedule) : item)));
    setInventoryItemsForMeals((items) =>
      items.map((item) => {
        const consumed = consumedRows.find((row) => row.stockItem.id === item.id);
        return consumed ? { ...item, quantity: consumed.nextQuantity } : item;
      })
    );
    setIsSaving(false);
    setPendingConsumptionScheduleId(null);
    setConsumptionDrafts([]);
    setConsumptionTab("all");
    resetCookingRecordDraft();
    setActiveCookingRecipeId("");
    setCookingScheduleId(null);
    router.refresh();
    showToast(photoWarning || `${schedule.recipe_name} を調理完了にしました。料理履歴にも記録済みです。`, photoWarning ? "error" : "success");
  }

  return (
    <section className="recipe-meal-workspace" aria-labelledby="recipe-meal-heading">
      {toast ? (
        <div className="app-toast" data-tone={toast.tone} role="status" aria-live="polite">
          {toast.message}
        </div>
      ) : null}

      {activeCookingRecipe ? (
        <div className="cooking-overlay" role="dialog" aria-modal="true" aria-label="調理ビューア全画面">
          <header className="cooking-overlay-header">
            <button className="cooking-overlay-back" type="button" onClick={closeCookingViewer} aria-label="戻る">←</button>
            <div className="cooking-overlay-title">
              <h2>{activeCookingRecipe.name}</h2>
              {/^https?:\/\//.test(activeCookingRecipe.source) ? (
                <a href={activeCookingRecipe.source} target="_blank" rel="noreferrer">
                  {activeCookingRecipe.source}
                </a>
              ) : null}
            </div>
          </header>

          <div className="cooking-overlay-body">
            <CookingViewer
              highlightedIngredientName={highlightedIngredientName}
              ingredientTab={cookingIngredientTab}
              inventoryItems={inventoryItemsForMeals}
              onHighlightIngredient={setHighlightedIngredientName}
              onIngredientTabChange={setCookingIngredientTab}
              onStepTabChange={setCookingStepTab}
              onToggleStockCheck={() => setCookingStockCheck((value) => !value)}
              recipe={activeCookingRecipe}
              stepTab={cookingStepTab}
              stockCheck={cookingStockCheck}
            />
          </div>

          {cookingSchedule && cookingSchedule.recipe_id === activeCookingRecipe.id ? (
            <footer className="cooking-overlay-footer">
              <button
                className="primary-button cooking-complete-cta"
                type="button"
                disabled={isSaving || cookingSchedule.status === "完了"}
                onClick={() => completeSchedule(cookingSchedule)}
              >
                {cookingSchedule.status === "完了" ? "調理完了済み" : "料理を完了する"}
              </button>
            </footer>
          ) : null}
        </div>
      ) : null}

      {cookingSchedule && pendingConsumptionScheduleId === cookingSchedule.id ? (
        <div className="modal-backdrop consumption-backdrop" role="dialog" aria-modal="true" aria-labelledby="consumption-heading">
          <section className="canvas-modal consumption-modal">
            <button
              className="modal-close-button"
              type="button"
              onClick={closeConsumptionModal}
              aria-label="閉じる"
            >
              ×
            </button>
            <h3 id="consumption-heading">実際の消費量を調整</h3>
            <ConsumptionEditor
              drafts={consumptionDrafts}
              inventoryItems={inventoryItemsForMeals}
              onChange={updateConsumptionDraft}
              onSelectVisible={setVisibleConsumptionSelected}
              onTabChange={setConsumptionTab}
              recipe={activeCookingRecipe}
              tab={consumptionTab}
            />
            <section className="cooking-record-panel" aria-label="料理記録">
              <div className="panel-title compact-title">
                <div>
                  <span>料理記録</span>
                  <h4>写真・評価・コメント</h4>
                </div>
              </div>
              <div className="cooking-photo-picker">
                <label className="photo-file-button">
                  完成写真を撮る / 選ぶ
                  <input
                    accept="image/*"
                    capture="environment"
                    disabled={isSaving}
                    onChange={selectCookingPhoto}
                    ref={cookingPhotoInputRef}
                    type="file"
                  />
                </label>
                {cookingPhotoPreviewUrl ? (
                  <div className="photo-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="完成写真のプレビュー" src={cookingPhotoPreviewUrl} />
                  </div>
                ) : (
                  <p className="photo-empty">写真なしでも完了できます。</p>
                )}
                {selectedCookingPhoto ? (
                  <button className="secondary-button compact-button" type="button" onClick={resetCookingPhoto} disabled={isSaving}>
                    写真を外す
                  </button>
                ) : null}
              </div>
              <div className="cooking-rating-picker" aria-label="評価">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    aria-pressed={Number(cookingRating) === value}
                    data-active={Number(cookingRating) >= value}
                    disabled={isSaving}
                    key={value}
                    onClick={() => setCookingRating(cookingRating === String(value) ? "" : String(value))}
                    type="button"
                  >
                    ★
                  </button>
                ))}
              </div>
              <label className="cooking-comment-field">
                一言コメント
                <textarea
                  disabled={isSaving}
                  onChange={(event) => setCookingComment(event.target.value)}
                  placeholder="例：少し薄味。次回は味噌を多めにする"
                  rows={3}
                  value={cookingComment}
                />
              </label>
            </section>
            <div className="consumption-modal-actions">
              <button className="secondary-button" type="button" onClick={closeConsumptionModal}>
                キャンセル
              </button>
              <button className="primary-button consumption-confirm" type="button" disabled={isSaving} onClick={() => completeSchedule(cookingSchedule)}>
                確定
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <div className="section-heading sr-only">
        <p className="eyebrow">{activeView === "schedule" ? "MEAL SCHEDULE" : "RECIPE COLLECTION"}</p>
        <h2 id="recipe-meal-heading">献立・レシピ</h2>
        <h2 className="sr-only">レシピ・献立・買い物</h2>
      </div>

      <div className="canvas-mode-control recipe-subnav" aria-label="献立とレシピの表示切替">
        <button className="secondary-button compact-button" data-tab="recipes" data-active={activeView === "recipes"} type="button" onClick={() => setActiveView("recipes")}>
          レシピ集
        </button>
        <button className="secondary-button compact-button" data-tab="schedule" data-active={activeView === "schedule"} type="button" onClick={() => setActiveView("schedule")}>
          スケジュール
        </button>
      </div>

      {activeView === "recipes" ? (
        <div className="recipe-primary-actions" aria-label="レシピ追加">
          <button className="primary-button" type="button" onClick={openNewRecipeEditor}>+ 新規レシピ</button>
          <button className="secondary-button recipe-text-button" type="button" onClick={() => {
            setAiSourceText("");
            setIsTextImportOpen(true);
          }}>テキストから追加</button>
          <button className="secondary-button recipe-ai-button" type="button" onClick={() => setIsAiMenuOpen(true)}>AI考案</button>
        </div>
      ) : null}

      {feedback && feedback.tone !== "error" ? (
        <p className="sr-only" role="status">
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
            <button className="modal-close-button" type="button" onClick={() => {
              setAiSourceText("");
              setIsTextImportOpen(false);
            }} aria-label="閉じる">×</button>
            <p className="eyebrow">ADD RECIPE FROM TEXT</p>
            <h3 id="recipe-text-modal-heading">テキストからレシピを追加</h3>
            <GeminiApiKeyPanel apiKey={geminiApiKey} disabled={isAiRunning} id="recipe-text-gemini-api-key" onChange={setGeminiApiKey} />
            <AiUsageMeter summary={aiUsageSummary} feature="recipe_generation" />
            <label>
              レシピテキスト
              <textarea rows={8} value={aiSourceText} onChange={(event) => setAiSourceText(event.target.value)} placeholder="Webやメモからコピーしたレシピテキストをここに貼り付けてください..." />
            </label>
            <button className="primary-button" type="button" disabled={isAiRunning || recipeLimitReached} onClick={structureRecipeText}>
              {isAiRunning ? "AIで構造化中" : "AIで構造化"}
            </button>
          </section>
        </div>
      ) : null}

      {isAiMenuOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="ai-menu-modal-heading">
          <section className="canvas-modal ai-add-modal">
            <button className="modal-close-button" type="button" onClick={() => setIsAiMenuOpen(false)} aria-label="閉じる">×</button>
            <p className="eyebrow">ADD RECIPE WITH AI</p>
            <h3 id="ai-menu-modal-heading">AI考案で追加</h3>
            <GeminiApiKeyPanel apiKey={geminiApiKey} disabled={isAiRunning} id="recipe-menu-gemini-api-key" onChange={setGeminiApiKey} />
            <AiUsageMeter summary={aiUsageSummary} feature="recipe_generation" />
            <div className="ai-choice-grid">
              <button className="ai-choice-card danger-choice" type="button" disabled={isAiRunning || recipeLimitReached} onClick={generatePriorityRecipe}>
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
            <button className="primary-button" type="button" disabled={isAiRunning || recipeLimitReached} onClick={generateFromIngredients}>
              {isAiRunning ? "考案中" : "指定食材で考案"}
            </button>
          </section>
        </div>
      ) : null}

      {isRecipeEditorOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="recipe-editor-heading">
          <section className="canvas-modal recipe-editor-modal">
            <button className="modal-close-button" type="button" onClick={closeRecipeEditor} aria-label="閉じる">×</button>
            <h3 id="recipe-editor-heading">{editingRecipeId ? "レシピを編集" : "新規レシピ"}</h3>
            <form className="stock-form recipe-editor-form" onSubmit={saveRecipe}>
              <label>
                レシピ名
                <input value={recipeValues.name} onChange={(event) => updateRecipeValue("name", event.target.value)} placeholder="例: カレー" />
              </label>
              <div className="genre-field-label">
                <span>ジャンル</span>
                <GenreTagPicker value={recipeValues.genre} recipes={recipes} onChange={(csv) => updateRecipeValue("genre", csv)} />
              </div>
              <label>
                出典
                <textarea
                  aria-label="参考元"
                  rows={2}
                  value={recipeValues.source}
                  onChange={(event) => updateRecipeValue("source", event.target.value)}
                  placeholder="例: https://... または本の名前"
                />
              </label>

              <div className="ingredient-editor" aria-label="材料入力">
                <div className="ingredient-editor-heading">
                  <span>材料</span>
                  <button className="secondary-button compact-button" type="button" onClick={() => addIngredientRow("食材")}>
                    ＋ 材料を追加
                  </button>
                </div>
                {foodIngredientEntries.map(({ ingredient, index }) => (
                  <div className="ingredient-row canvas-recipe-item-row" key={`food-${index}-${ingredient.name}`}>
                    <span className="recipe-row-handle" aria-hidden="true">=</span>
                    <input aria-label="品名" value={ingredient.name} onChange={(event) => updateIngredient(index, { name: event.target.value, item_type: "食材" })} placeholder="品名" />
                    <NumberField
                      ariaLabel="数量"
                      placeholder="数量"
                      showSteppers={false}
                      value={ingredient.amount}
                      onChange={(next) => updateIngredient(index, { amount: next, item_type: "食材" })}
                    />
                    <UnitPicker value={ingredient.unit} onSelect={(unit) => updateIngredient(index, { unit, item_type: "食材" })} />
                    <button className="danger-button compact-button" type="button" onClick={() => removeIngredientRow(index)} aria-label="材料を削除">
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="ingredient-editor seasoning-editor" aria-label="調味料入力">
                <div className="ingredient-editor-heading">
                  <span>調味料</span>
                  <button className="secondary-button compact-button seasoning-add-button" type="button" onClick={() => addIngredientRow("調味料")}>
                    ＋ 調味料を追加
                  </button>
                </div>
                {seasoningIngredientEntries.map(({ ingredient, index }) => (
                  <div className="ingredient-row canvas-recipe-item-row" key={`seasoning-${index}-${ingredient.name}`}>
                    <span className="recipe-row-handle" aria-hidden="true">=</span>
                    <input aria-label="品名" value={ingredient.name} onChange={(event) => updateIngredient(index, { name: event.target.value, item_type: "調味料" })} placeholder="調味料名" />
                    <NumberField
                      ariaLabel="数量"
                      placeholder="数量"
                      showSteppers={false}
                      value={ingredient.amount}
                      onChange={(next) => updateIngredient(index, { amount: next, item_type: "調味料" })}
                    />
                    <UnitPicker value={ingredient.unit} onSelect={(unit) => updateIngredient(index, { unit, item_type: "調味料" })} />
                    <button className="danger-button compact-button" type="button" onClick={() => removeIngredientRow(index)} aria-label="調味料を削除">
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="recipe-step-sections">
                <div className="recipe-step-editor" aria-label="下ごしらえ入力">
                  <div className="ingredient-editor-heading">
                    <span>下ごしらえ</span>
                    <button className="secondary-button compact-button prep-add-button" type="button" onClick={() => addRecipeStep("prep_steps")}>
                      ＋ 下ごしらえを追加
                    </button>
                  </div>
                  {prepStepEntries.map((step, index) => (
                    <div className="recipe-step-row prep-step-row" key={`prep-${index}`}>
                      <span className="recipe-step-number" aria-hidden="true">{index + 1}</span>
                      <input
                        aria-label={`下ごしらえ ${index + 1}`}
                        value={step}
                        onChange={(event) => updateRecipeStep("prep_steps", index, event.target.value)}
                        placeholder="下ごしらえを入力"
                      />
                      <button className="danger-button compact-button" type="button" onClick={() => removeRecipeStep("prep_steps", index)} aria-label="下ごしらえを削除">
                        ×
                      </button>
                    </div>
                  ))}
                  <textarea
                    aria-label="下準備"
                    className="sr-only"
                    value={recipeValues.prep_steps}
                    onChange={(event) => updateRecipeValue("prep_steps", event.target.value)}
                  />
                </div>

                <div className="recipe-step-editor" aria-label="調理工程入力">
                  <div className="ingredient-editor-heading">
                    <span>調理工程</span>
                    <button className="secondary-button compact-button cook-add-button" type="button" onClick={() => addRecipeStep("steps")}>
                      ＋ 工程を追加
                    </button>
                  </div>
                  {cookStepEntries.map((step, index) => (
                    <div className="recipe-step-row cook-step-row" key={`cook-${index}`}>
                      <span className="recipe-step-number" aria-hidden="true">{index + 1}</span>
                      <input
                        aria-label={`調理工程 ${index + 1}`}
                        value={step}
                        onChange={(event) => updateRecipeStep("steps", index, event.target.value)}
                        placeholder="工程を入力"
                      />
                      <button className="danger-button compact-button" type="button" onClick={() => removeRecipeStep("steps", index)} aria-label="工程を削除">
                        ×
                      </button>
                    </div>
                  ))}
                  <textarea
                    aria-label="調理手順"
                    className="sr-only"
                    value={recipeValues.steps}
                    onChange={(event) => updateRecipeValue("steps", event.target.value)}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button className="secondary-button" type="button" onClick={closeRecipeEditor}>
                  キャンセル
                </button>
                <button className="secondary-button recipe-shopping-button" type="button" disabled={isSaving} onClick={addCurrentRecipeToShopping}>
                  買い物へ
                </button>
                <button className="primary-button" type="submit" disabled={isSaving} aria-label={editingRecipeId ? "レシピを更新" : "レシピを保存"}>
                  {editingRecipeId ? "更新" : "保存"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {shortageSelectionItems.length > 0 ? (
        <div className="modal-backdrop shortage-select-backdrop" role="dialog" aria-modal="true" aria-labelledby="shopping-shortage-heading">
          <section className="canvas-modal shopping-shortage-modal">
            <button className="modal-close-button" type="button" onClick={closeShortageSelectionModal} aria-label="閉じる">×</button>
            <h3 id="shopping-shortage-heading">買い物に追加するもの</h3>
            <p className="shopping-shortage-meta">{shortageSelectionRecipeName || "不足分を確認してください"}</p>
            <div className="shopping-shortage-tabs" aria-label="不足材料の表示切替">
              {[
                { count: shortageSelectionItems.length, label: "ALL", value: "all" as const },
                { count: shortageSelectionItems.filter((item) => item.type !== "調味料").length, label: "食材", value: "ingredients" as const },
                { count: shortageSelectionItems.filter((item) => item.type === "調味料").length, label: "調味料", value: "seasonings" as const }
              ].map((tab) => (
                <button data-active={shortageSelectionTab === tab.value} key={tab.value} onClick={() => setShortageSelectionTab(tab.value)} type="button">
                  {tab.label} <span>{tab.count}</span>
                </button>
              ))}
            </div>
            <label className="shopping-shortage-select-all">
              <input
                checked={allVisibleShortagesSelected}
                onChange={(event) => toggleVisibleShortageSelection(event.target.checked)}
                type="checkbox"
              />
              表示中をすべて選択
            </label>
            <div className="shopping-shortage-list">
              {filteredShortageSelectionItems.length === 0 ? (
                <p className="empty-list">該当する候補はありません。</p>
              ) : (
                filteredShortageSelectionItems.map((item) => (
                  <label className="shopping-shortage-option" key={item.key}>
                    <input checked={item.selected} onChange={(event) => toggleShortageSelection(item.key, event.target.checked)} type="checkbox" />
                    <span>
                      <strong>{item.name}</strong>
                      <small>不足 {item.shortageQuantity}{item.unit}</small>
                    </span>
                    <em data-type={item.type}>{item.type}</em>
                  </label>
                ))
              )}
            </div>
            <div className="shopping-shortage-actions">
              <button className="secondary-button" type="button" onClick={closeShortageSelectionModal}>
                あとで
              </button>
              <button className="primary-button" type="button" disabled={isSaving} onClick={confirmRecipeShortageSelection}>
                選択したものを追加
                <span>{selectedShortageSelectionCount}</span>
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {pickerSlot ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="schedule-picker-heading">
          <section className="canvas-modal schedule-picker-modal">
            <button
              className="modal-close-button"
              type="button"
              onClick={() => {
                setPickerSlot(null);
                setPickerQuery("");
              }}
              aria-label="閉じる"
            >
              ×
            </button>
            <h3 id="schedule-picker-heading">{pickerSlot.replaceId ? "別のレシピに変更" : "レシピを選ぶ"}</h3>
            <p className="schedule-picker-meta">
              {formatScheduleDayLabel(pickerSlot.date)} ・ {pickerSlot.meal}
            </p>
            {recipes.length === 0 ? (
              <p className="empty-list">レシピがありません。先に「レシピ集」でレシピを追加してください。</p>
            ) : (
              <>
                <input
                  className="schedule-picker-search"
                  type="search"
                  value={pickerQuery}
                  onChange={(event) => setPickerQuery(event.target.value)}
                  placeholder="レシピ名で絞り込み"
                  aria-label="レシピ名で絞り込み"
                />
                <div className="schedule-picker-list">
                  {recipes
                    .filter((recipe) => recipe.name.toLowerCase().includes(pickerQuery.trim().toLowerCase()))
                    .map((recipe) => (
                      <button
                        className="schedule-picker-option"
                        type="button"
                        key={recipe.id}
                        disabled={isSaving}
                        onClick={() =>
                          pickerSlot.replaceId
                            ? replaceScheduleRecipe(pickerSlot.replaceId, recipe.id)
                            : addScheduleEntry(pickerSlot.date, pickerSlot.meal, recipe.id)
                        }
                      >
                        <strong>{recipe.name}</strong>
                        {recipe.genre.length > 0 ? <small>{recipe.genre.join("・")}</small> : null}
                      </button>
                    ))}
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}

      {slotMenuSchedule ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="schedule-slot-menu-heading">
          <section className="canvas-modal schedule-slot-menu-modal">
            <button className="modal-close-button" type="button" onClick={() => setSlotMenuId(null)} aria-label="閉じる">
              ×
            </button>
            <h3 id="schedule-slot-menu-heading" className="schedule-slot-menu-title">
              {formatScheduleDayLabel(slotMenuSchedule.scheduled_on)} {slotMenuSchedule.meal_type}・{slotMenuSchedule.recipe_name || "レシピ名なし"}
            </h3>
            <div className="schedule-slot-menu-actions">
              <button
                className="slot-menu-button slot-menu-cook"
                type="button"
                disabled={isSaving}
                onClick={() => startSlotCooking(slotMenuSchedule)}
              >
                調理を開始
              </button>
              <button
                className="slot-menu-button slot-menu-change"
                type="button"
                disabled={isSaving || recipes.length === 0}
                onClick={() => startSlotRecipeChange(slotMenuSchedule)}
              >
                別のレシピに変更
              </button>
              <button
                className="slot-menu-button slot-menu-delete"
                type="button"
                disabled={isSaving}
                onClick={() => {
                  const target = slotMenuSchedule;
                  setSlotMenuId(null);
                  requestDelete(target.recipe_name || "献立", "この献立予定を削除します。料理履歴は削除されません。", () => deleteSchedule(target));
                }}
              >
                削除する
              </button>
            </div>
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
            <GeminiApiKeyPanel apiKey={geminiApiKey} disabled={isAiRunning} id="inline-recipe-gemini-api-key" onChange={setGeminiApiKey} />
            <AiUsageMeter summary={aiUsageSummary} feature="recipe_generation" />
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
            <button className="primary-button" type="button" disabled={isAiRunning || recipeLimitReached} onClick={runInlineAiRecipe}>
              {isAiRunning ? "AI実行中" : "AIレシピを編集モーダルで開く"}
            </button>
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
        <section className="stock-panel schedule-board-panel" aria-label="7日スケジュール">
          <div className="schedule-toolbar">
            <button className="schedule-nav-button" type="button" onClick={() => setScheduleWindowStart(addDays(scheduleWindowStart, -7))}>
              ← 前の週
            </button>
            <button
              className="schedule-nav-button schedule-nav-today"
              type="button"
              onClick={() => {
                setScheduleWindowStart(addDays(todayValue(), -3));
                setScheduleDate(todayValue());
              }}
            >
              今週
            </button>
            <button className="schedule-nav-button" type="button" onClick={() => setScheduleWindowStart(addDays(scheduleWindowStart, 7))}>
              次の週 →
            </button>
          </div>

          <div className="schedule-board" aria-label="7日献立">
            <button
              className="schedule-shift"
              type="button"
              onClick={() => setScheduleWindowStart(addDays(scheduleWindowStart, -1))}
              aria-label="スケジュールを1日前へ移動"
              title="1日前へ移動"
            >
              ↑
            </button>
            {scheduleDays.map((day) => {
              const daySchedules = visibleMealSchedules.filter((schedule) => schedule.scheduled_on === day);
              const tone = scheduleDateTone(day);
              return (
                <section className="schedule-day" data-tone={tone} key={day}>
                  <div className="schedule-day-badge">
                    <span>{formatScheduleDayLabel(day)}</span>
                    {tone === "today" ? <em>今日</em> : null}
                  </div>
                  <div className="schedule-day-slots">
                    {(["朝", "昼", "晩"] as MealType[]).map((mealType) => {
                      const schedule = daySchedules.find((item) => item.meal_type === mealType);
                      const isSelected = Boolean(schedule) && selectedSchedule?.id === schedule?.id;
                      return (
                        <div
                          className="schedule-slot"
                          data-empty={!schedule}
                          key={`${day}-${mealType}`}
                          onDragOver={(event) => {
                            event.preventDefault();
                            event.dataTransfer.dropEffect = "move";
                            event.currentTarget.classList.add("is-dragover");
                          }}
                          onDragLeave={(event) => {
                            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                              event.currentTarget.classList.remove("is-dragover");
                            }
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            event.currentTarget.classList.remove("is-dragover");
                            const id = event.dataTransfer.getData("text/plain");
                            if (!id) return;
                            const dragged = mealSchedules.find((item) => item.id === id);
                            if (dragged) moveScheduleToSlot(dragged, day, mealType);
                          }}
                        >
                          <div className="schedule-slot-head">
                            <span>{mealType}</span>
                            <button
                              className="schedule-add-button"
                              type="button"
                              onClick={() => setPickerSlot({ date: day, meal: mealType })}
                              aria-label={`${formatScheduleDayLabel(day)} ${mealType}に追加`}
                            >
                              ＋
                            </button>
                          </div>
                          {schedule ? (
                            <article
                              className="schedule-meal-card"
                              data-active={isSelected}
                              data-done={schedule.status === "完了"}
                              draggable
                              onDragStart={(event) => {
                                event.dataTransfer.effectAllowed = "move";
                                event.dataTransfer.setData("text/plain", schedule.id);
                                event.currentTarget.classList.add("is-dragging");
                              }}
                              onDragEnd={(event) => {
                                event.currentTarget.classList.remove("is-dragging");
                              }}
                            >
                              <button
                                className="schedule-meal-select"
                                type="button"
                                onClick={() => {
                                  setSelectedScheduleId(schedule.id);
                                  setSlotMenuId(schedule.id);
                                }}
                                aria-label={`${schedule.recipe_name || "レシピ名なし"} の操作`}
                              >
                                <span className="schedule-meal-handle" aria-hidden="true">≡</span>
                                <span className="schedule-meal-body">
                                  <strong>{schedule.recipe_name || "レシピ名なし"}</strong>
                                  {schedule.status === "完了" ? <em>完了</em> : null}
                                </span>
                              </button>
                            </article>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
            <button
              className="schedule-shift"
              type="button"
              onClick={() => setScheduleWindowStart(addDays(scheduleWindowStart, 1))}
              aria-label="スケジュールを1日後へ移動"
              title="1日後へ移動"
            >
              ↓
            </button>
          </div>
        </section>
        ) : null}
      </div>
    </section>
  );
}

const DEFAULT_RECIPE_GENRES = ["和食", "洋食", "中華", "韓国", "イタリアン", "エスニック", "その他"];

function genrePaletteIndex(genre: string) {
  const sum = Array.from(genre).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return sum % 7;
}

// Canvas版（AppSheet風）ジャンル選択UI: タグ表示＋検索/追加＋チェックリスト・ポップオーバー。
function GenreTagPicker({ value, onChange, recipes }: { value: string; onChange: (csv: string) => void; recipes: Recipe[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [draggingGenre, setDraggingGenre] = useState<string | null>(null);
  const [dragOverGenre, setDragOverGenre] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingGenreRef = useRef<string | null>(null);

  const selected = useMemo(() => splitCsv(value), [value]);
  const candidates = useMemo(() => {
    const set = new Set<string>();
    DEFAULT_RECIPE_GENRES.forEach((genre) => set.add(genre));
    recipes.forEach((recipe) => recipe.genre.forEach((genre) => genre && set.add(genre)));
    selected.forEach((genre) => set.add(genre));
    return Array.from(set);
  }, [recipes, selected]);

  const normalizedQuery = query.trim();
  const filtered = candidates.filter((genre) => !normalizedQuery || genre.toLowerCase().includes(normalizedQuery.toLowerCase()));
  const canCreate = Boolean(normalizedQuery) && !candidates.some((genre) => genre.toLowerCase() === normalizedQuery.toLowerCase());

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const commit = (next: string[]) => onChange(next.join(", "));
  const toggle = (genre: string) => commit(selected.includes(genre) ? selected.filter((item) => item !== genre) : [...selected, genre]);
  const addNew = (name: string) => {
    const genre = name.trim();
    setQuery("");
    if (!genre || selected.includes(genre)) return;
    commit([...selected, genre]);
  };
  const remove = (genre: string) => commit(selected.filter((item) => item !== genre));
  const reorder = (dragged: string, before: string | null) => {
    if (dragged === before) return;
    const withoutDragged = selected.filter((item) => item !== dragged);
    const beforeIndex = before ? withoutDragged.indexOf(before) : -1;
    const next = [...withoutDragged];
    if (beforeIndex >= 0) next.splice(beforeIndex, 0, dragged);
    else next.push(dragged);
    commit(next);
  };
  const getDropTarget = (container: HTMLElement, x: number, y: number) => {
    const chips = Array.from(container.querySelectorAll<HTMLElement>("[data-genre]:not(.dragging)"));
    return chips.find((chip) => {
      const rect = chip.getBoundingClientRect();
      const sameRowBefore = y >= rect.top && y <= rect.bottom && x < rect.left + rect.width / 2;
      const beforeRow = y < rect.top + rect.height / 2;
      return sameRowBefore || beforeRow;
    }) ?? null;
  };

  return (
    <div className="genre-picker" ref={containerRef}>
      <div className="genre-field" onClick={() => setOpen(true)}>
        {selected.length > 0 ? (
          <div
            className="genre-tags"
            onDragOver={(event) => {
              if (!draggingGenreRef.current) return;
              event.preventDefault();
              const target = getDropTarget(event.currentTarget, event.clientX, event.clientY);
              setDragOverGenre(target?.dataset.genre ?? null);
            }}
            onDrop={(event) => {
              const dragged = draggingGenreRef.current || event.dataTransfer.getData("text/plain");
              if (!dragged) return;
              event.preventDefault();
              const target = getDropTarget(event.currentTarget, event.clientX, event.clientY);
              reorder(dragged, target?.dataset.genre ?? null);
              draggingGenreRef.current = null;
              setDraggingGenre(null);
              setDragOverGenre(null);
            }}
          >
            {selected.map((genre) => (
              <span
                className={`genre-tag${draggingGenre === genre ? " dragging" : ""}${dragOverGenre === genre ? " genre-drag-over" : ""}`}
                data-genre={genre}
                data-palette={genrePaletteIndex(genre)}
                draggable
                key={genre}
                onDragStart={(event) => {
                  draggingGenreRef.current = genre;
                  setDraggingGenre(genre);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", genre);
                }}
                onDragEnd={() => {
                  draggingGenreRef.current = null;
                  setDraggingGenre(null);
                  setDragOverGenre(null);
                }}
              >
                <span className="genre-tag-name">#{genre}</span>
                <button
                  className="genre-tag-remove"
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    remove(genre);
                  }}
                  aria-label={`${genre} を外す`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
        <input
          className="genre-input"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              const first = filtered.find((genre) => !selected.includes(genre));
              if (first) toggle(first);
              else if (canCreate) addNew(normalizedQuery);
            } else if (event.key === "Escape") {
              setOpen(false);
            } else if (event.key === "Backspace" && !query && selected.length > 0) {
              remove(selected[selected.length - 1]);
            }
          }}
          placeholder="ジャンルを検索・追加"
          aria-label="ジャンルを検索・追加"
        />
        <button
          className="genre-icon-button genre-clear"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (query) setQuery("");
            else setOpen(false);
          }}
          aria-label="検索をクリア"
        >
          ×
        </button>
        <button
          className="genre-icon-button genre-add"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            if (normalizedQuery) addNew(normalizedQuery);
            else setOpen(true);
          }}
          aria-label="ジャンルを追加"
        >
          ＋
        </button>
      </div>
      {open ? (
        <div className="genre-popover">
          <div className="genre-popover-head">
            <span className="genre-selected-count">
              <span className="genre-selected-check" aria-hidden="true">✓</span>
              {selected.length} Selected
            </span>
            <span className="genre-popover-eyebrow">GENRE</span>
          </div>
          <div className="genre-popover-list">
            {filtered.map((genre) => {
              const isSelected = selected.includes(genre);
              return (
                <button className="genre-option" data-selected={isSelected} type="button" key={genre} onClick={() => toggle(genre)}>
                  <span className="genre-option-check" data-on={isSelected} aria-hidden="true">
                    ✓
                  </span>
                  <span className="genre-option-name">{genre}</span>
                </button>
              );
            })}
            {canCreate ? (
              <button className="genre-option genre-option-create" type="button" onClick={() => addNew(normalizedQuery)}>
                <span className="genre-option-check genre-option-create-icon" aria-hidden="true">
                  ＋
                </span>
                <span className="genre-option-name">新規ジャンル「{normalizedQuery}」を追加</span>
              </button>
            ) : null}
            {filtered.length === 0 && !canCreate ? <p className="genre-popover-empty">該当するジャンルはありません</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ConsumptionEditor({
  drafts,
  inventoryItems,
  onChange,
  onSelectVisible,
  onTabChange,
  recipe,
  tab
}: {
  drafts: ConsumptionDraft[];
  inventoryItems: StockItem[];
  onChange: (index: number, values: Partial<ConsumptionDraft>) => void;
  onSelectVisible: (selected: boolean) => void;
  onTabChange: (tab: ConsumptionTab) => void;
  recipe: Recipe | null;
  tab: ConsumptionTab;
}) {
  if (!recipe) {
    return <p className="empty-list">レシピが見つからないため、消費量を作成できません。</p>;
  }

  const rows = drafts
    .map((draft, index) => {
      const ingredient = recipe.ingredients.find((item) => item.name === draft.ingredientName && item.unit === draft.requestedUnit);
      const stockItem = inventoryItems.find((item) => item.id === draft.stockItemId);
      const amount = Number(draft.amount);
      return {
        draft,
        index,
        ingredient,
        isShortage: Boolean(draft.selected && stockItem && Number.isFinite(amount) && amount > Number(stockItem.quantity || 0)),
        options: ingredient
          ? inventoryItems.filter((item) => item.category === ingredient.item_type && item.unit === ingredient.unit && item.quantity > 0)
          : [],
        stockItem
      };
    })
    .filter((row) => tab === "all" || row.ingredient?.item_type === tab);
  const shortageNames = rows.filter((row) => row.isShortage).map((row) => row.draft.ingredientName);

  return (
    <section className="consumption-editor" aria-label="消費量確認">
      <div className="panel-title compact-title">
        <div>
          <span>消費確認</span>
          <h4>在庫から減らす量</h4>
        </div>
      </div>
      <div className="consumption-toolbar">
        <div className="consumption-tabs" role="tablist" aria-label="材料カテゴリ">
          {(["all", "食材", "調味料"] as ConsumptionTab[]).map((value) => (
            <button
              aria-selected={tab === value}
              data-active={tab === value}
              key={value}
              onClick={() => onTabChange(value)}
              role="tab"
              type="button"
            >
              {value === "all" ? "全" : value}
            </button>
          ))}
        </div>
        <div className="consumption-bulk-actions">
          <button className="secondary-button compact-button" type="button" onClick={() => onSelectVisible(true)}>
            全選択
          </button>
          <button className="secondary-button compact-button" type="button" onClick={() => onSelectVisible(false)}>
            全解除
          </button>
        </div>
      </div>
      {shortageNames.length ? (
        <p className="consumption-shortage">
          在庫不足: {shortageNames.join("、")} は確定すると在庫が0で止まります。
        </p>
      ) : null}
      {drafts.length === 0 ? (
        <p className="empty-list">減算対象の材料はありません。このまま完了できます。</p>
      ) : rows.length === 0 ? (
        <p className="empty-list">このカテゴリの材料はありません。</p>
      ) : (
        <div className="consumption-list">
          {rows.map(({ draft, index, ingredient, isShortage, options, stockItem }) => {
            return (
              <article className="consumption-item" data-selected={draft.selected} key={`${draft.ingredientName}-${draft.requestedUnit}-${index}`}>
                <div className="item-main">
                  <label className="consumption-check">
                    <input
                      checked={draft.selected}
                      onChange={(event) => onChange(index, { selected: event.target.checked })}
                      type="checkbox"
                    />
                    <span>
                      <small>必要 {draft.requestedAmount}{draft.requestedUnit} / {ingredient?.item_type ?? "未分類"}</small>
                      <strong>{draft.ingredientName}</strong>
                    </span>
                  </label>
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
                {isShortage && stockItem ? (
                  <p className="consumption-item-warning">
                    在庫 {stockItem.quantity}{stockItem.unit} に対して消費量が多いです。
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function chipifyStep(text: string, foodNames: string[], seasoningNames: string[], onHighlight: (name: string) => void) {
  const names = [
    ...foodNames.map((name) => ({ name, type: "食材" as const })),
    ...seasoningNames.map((name) => ({ name, type: "調味料" as const }))
  ]
    .filter((entry) => entry.name)
    .sort((a, b) => b.name.length - a.name.length);
  if (names.length === 0) return [text];

  const nodes: ReactNode[] = [];
  let remaining = text;
  let key = 0;
  let guard = 0;
  while (remaining.length > 0 && guard++ < 500) {
    let bestIdx = -1;
    let bestName: { name: string; type: "食材" | "調味料" } | null = null;
    for (const entry of names) {
      const idx = remaining.indexOf(entry.name);
      if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
        bestIdx = idx;
        bestName = entry;
      }
    }
    if (bestIdx === -1 || !bestName) {
      nodes.push(remaining);
      break;
    }
    if (bestIdx > 0) nodes.push(remaining.slice(0, bestIdx));
    const matched = bestName;
    nodes.push(
      <button className="cooking-step-chip" data-type={matched.type} type="button" key={`chip-${key++}`} onClick={() => onHighlight(matched.name)}>
        {matched.name}
      </button>
    );
    remaining = remaining.slice(bestIdx + matched.name.length);
  }
  return nodes;
}

function CookingViewer({
  highlightedIngredientName,
  ingredientTab,
  inventoryItems,
  onHighlightIngredient,
  onIngredientTabChange,
  onStepTabChange,
  onToggleStockCheck,
  recipe,
  stepTab,
  stockCheck
}: {
  highlightedIngredientName: string;
  ingredientTab: CookingIngredientTab;
  inventoryItems: StockItem[];
  onHighlightIngredient: (name: string) => void;
  onIngredientTabChange: (tab: CookingIngredientTab) => void;
  onStepTabChange: (tab: CookingStepTab) => void;
  onToggleStockCheck: () => void;
  recipe: Recipe | null;
  stepTab: CookingStepTab;
  stockCheck: boolean;
}) {
  if (!recipe) {
    return <p className="empty-list">レシピを選ぶと調理ビューを確認できます。</p>;
  }

  const foods = recipe.ingredients.filter((ingredient) => ingredient.item_type === "食材");
  const seasonings = recipe.ingredients.filter((ingredient) => ingredient.item_type === "調味料");
  const foodNames = foods.map((ingredient) => ingredient.name).filter(Boolean);
  const seasoningNames = seasonings.map((ingredient) => ingredient.name).filter(Boolean);
  const prepSteps = recipe.prep_steps;
  const cookSteps = recipe.steps;

  const renderIngredientGroup = (label: string, tone: "食材" | "調味料", items: RecipeIngredient[]) => {
    if (items.length === 0) return null;
    return (
      <div className="cooking-ing-group" key={label}>
        <p className="cooking-ing-group-label" data-tone={tone}>{label}</p>
        {items.map((ingredient) => {
          const stockAmount = inventoryAmountByNameAndUnit(inventoryItems, ingredient.name, ingredient.unit);
          const isShortage = ingredient.amount > 0 && stockAmount < ingredient.amount;
          const amountText = [ingredient.amount, ingredient.unit].filter(Boolean).join("");
          return (
            <article
              className="cooking-ing-card"
              data-detailed={stockCheck}
              data-shortage={stockCheck && isShortage}
              data-highlight={highlightedIngredientName === ingredient.name}
              key={ingredient.id || ingredient.name}
            >
              <div className="cooking-ing-info">
                <div className="cooking-ing-head">
                  <strong>{ingredient.name}</strong>
                  <span className="cooking-type-badge" data-type={ingredient.item_type}>
                    {ingredient.item_type === "調味料" ? "調味料" : "食材"}
                  </span>
                  {stockCheck ? (
                    <span className="cooking-stock-badge" data-shortage={isShortage}>{isShortage ? "不足" : "在庫あり"}</span>
                  ) : null}
                </div>
                {stockCheck ? (
                  <p className="cooking-stock-line" data-shortage={isShortage}>
                    在庫: {stockAmount}{ingredient.unit} / 必要: {ingredient.amount > 0 ? ingredient.amount : "—"}{ingredient.unit}
                  </p>
                ) : null}
              </div>
              <span className="cooking-ing-amount">{amountText || "—"}</span>
            </article>
          );
        })}
      </div>
    );
  };

  const renderStepGroup = (label: string, tone: "prep" | "cook", steps: string[]) => {
    if (steps.length === 0) return null;
    return (
      <div className="cooking-step-group" key={label}>
        <p className="cooking-step-group-label">{label}</p>
        {steps.map((step, index) => (
          <article className="cooking-step-card" key={`${label}-${index}`}>
            <span className="cooking-step-badge" data-tone={tone}>{index + 1}</span>
            <p className="cooking-step-text">{chipifyStep(step, foodNames, seasoningNames, onHighlightIngredient)}</p>
          </article>
        ))}
      </div>
    );
  };

  const ingredientTabs: { value: CookingIngredientTab; label: string; count: number; disabled: boolean }[] = [
    { value: "all", label: "ALL", count: foods.length + seasonings.length, disabled: foods.length + seasonings.length === 0 },
    { value: "食材", label: "材料", count: foods.length, disabled: foods.length === 0 },
    { value: "調味料", label: "調味料", count: seasonings.length, disabled: seasonings.length === 0 }
  ];
  const stepTabs: { value: CookingStepTab; label: string; count: number; disabled: boolean }[] = [
    { value: "all", label: "ALL", count: prepSteps.length + cookSteps.length, disabled: prepSteps.length + cookSteps.length === 0 },
    { value: "prep", label: "下ごしらえ", count: prepSteps.length, disabled: prepSteps.length === 0 },
    { value: "steps", label: "調理工程", count: cookSteps.length, disabled: cookSteps.length === 0 }
  ];

  return (
    <section className="cooking-viewer" aria-label="調理ビューア">
      <section className="cooking-pane cooking-pane-ing" aria-label="材料と在庫">
        <div className="cooking-pane-head">
          <span className="cooking-pane-eyebrow" data-tone="ing">材料</span>
          <div className="cooking-pane-head-right">
            <span className="cooking-pane-count">{foods.length + seasonings.length} 件</span>
            <button className="cooking-stock-toggle" data-on={stockCheck} type="button" onClick={onToggleStockCheck} aria-pressed={stockCheck}>
              <span className="cooking-stock-toggle-track"><span className="cooking-stock-toggle-knob" /></span>
              在庫
            </button>
          </div>
        </div>
        <div className="cooking-tabs" data-tone="ing">
          {ingredientTabs.map((tab) => (
            <button
              className="cooking-tab"
              data-active={ingredientTab === tab.value}
              disabled={tab.disabled}
              key={tab.value}
              type="button"
              onClick={() => onIngredientTabChange(tab.value)}
            >
              {tab.label}
              <span className="cooking-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="cooking-ing-list">
          {ingredientTab === "all" ? (
            <>
              {renderIngredientGroup("材料", "食材", foods)}
              {renderIngredientGroup("調味料", "調味料", seasonings)}
            </>
          ) : ingredientTab === "調味料" ? (
            renderIngredientGroup("調味料", "調味料", seasonings)
          ) : (
            renderIngredientGroup("材料", "食材", foods)
          )}
          {foods.length + seasonings.length === 0 ? <p className="empty-list">材料は登録されていません。</p> : null}
        </div>
      </section>

      <section className="cooking-pane cooking-pane-step" aria-label="手順">
        <div className="cooking-pane-head">
          <span className="cooking-pane-eyebrow" data-tone="step">手順</span>
          <span className="cooking-pane-hint">文中の材料をタップで照合</span>
        </div>
        <div className="cooking-tabs" data-tone="step">
          {stepTabs.map((tab) => (
            <button
              className="cooking-tab"
              data-active={stepTab === tab.value}
              disabled={tab.disabled}
              key={tab.value}
              type="button"
              onClick={() => onStepTabChange(tab.value)}
            >
              {tab.label}
              <span className="cooking-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="cooking-step-list">
          {stepTab === "all" ? (
            <>
              {renderStepGroup("下ごしらえ", "prep", prepSteps)}
              {renderStepGroup("調理工程", "cook", cookSteps)}
            </>
          ) : stepTab === "prep" ? (
            renderStepGroup("下ごしらえ", "prep", prepSteps)
          ) : (
            renderStepGroup("調理工程", "cook", cookSteps)
          )}
          {prepSteps.length + cookSteps.length === 0 ? <p className="empty-list">手順は登録されていません。</p> : null}
        </div>
      </section>
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
              <div className="recipe-card-main">
                <div className="recipe-card-heading">
                  <button className="recipe-select-button" type="button" onClick={(event) => { event.stopPropagation(); onSelect(recipe.id); }}>
                    <strong>{recipe.name}</strong>
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
                </div>
                <div className="recipe-card-meta-row">
                  <p className="recipe-card-meta">材料 {recipe.ingredients.length} 品目 | 調理回数 {recipe.cook_count} | 登録 {formatRecipeDate(recipe.created_at)}</p>
                  <RecipeListGenreSummary genres={recipe.genre} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function RecipeListGenreSummary({ genres }: { genres: string[] }) {
  if (genres.length === 0) return null;
  const visibleGenres = genres.slice(0, Math.min(3, genres.length));
  const hiddenGenres = genres.slice(visibleGenres.length);

  return (
    <div className="recipe-list-genre-summary">
      {visibleGenres.map((genre) => (
        <span className="recipe-genre-pill" data-palette={genrePaletteIndex(genre)} key={genre}>
          <span>#{genre}</span>
        </span>
      ))}
      {hiddenGenres.length > 0 ? (
        <span className="recipe-genre-more" data-tooltip={hiddenGenres.join("\n")} tabIndex={0}>
          +{hiddenGenres.length}
        </span>
      ) : null}
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
