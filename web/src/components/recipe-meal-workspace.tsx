"use client";

import { type ChangeEvent, Fragment, FormEvent, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DeleteConfirmPanel } from "@/components/delete-confirm-panel";
import { NumberField } from "@/components/number-field";
import {
  detectNotation,
  displayQuantity,
  formatQuantity,
  formatQuantityForInput,
  isFractionalUnit,
  quantityToNumber,
  roundQuantity
} from "@/lib/format/numeric";
import { getQuantityNotation, setQuantityNotation } from "@/lib/format/quantity-notation";
import { getCustomFractions } from "@/lib/format/fraction-candidates";
import { PhotoCandidatePicker } from "@/components/photo-candidate-picker";
import { UnitPicker } from "@/components/unit-picker";
import { RecipeThumb } from "@/components/ui/recipe-thumb";
import {
  RecipeFilterControls,
  type RecipeSearchLogic,
  type RecipeSearchMode,
  type RecipeSort
} from "@/components/recipe-filter-controls";
import { useInventoryStore } from "@/components/inventory-store";
import { useShellAiUsage, useShellNavigation, useShellStatusMessage, useShellSubView, type RecipeShellLeaf } from "@/components/web-mode-shell";
import type { StockItem } from "@/lib/inventory/types";
import { conversionFactorToUnit, convertToStockUnit, stockAmountInUnit } from "@/lib/inventory/unit-conversion";
import { resolveConsumeUnitForStock, resolveConsumedStockAmount } from "@/lib/recipes/consumption-units";
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
  ShoppingItem,
  splitCsv,
  splitLines,
  toRecipeFormValues
} from "@/lib/recipes/types";
import { loadUserGeminiApiKeys, type UserGeminiApiKeys } from "@/lib/ai/user-gemini-api-key";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { buildCookingHistoryPhotoStoragePath, compressImageFile, compressRecipeImageFile } from "@/lib/photos/compress";
import { computeRollbackQuantityUpdates, type RollbackConsumptionEvent } from "@/lib/cooking-history/rollback";
import { copyPhotoStorageObject, deleteRecipeImage, setRecipeImageFromCandidate, setRecipeImageFromYoutubeThumbnail, uploadRecipeImage } from "@/lib/photos/recipe-image-upload";
import { useImageFileDrop } from "@/lib/photos/use-image-file-drop";
import { useCookingPhotoCandidates, type CookingPhotoCandidate, type CookingPhotoCandidateClient } from "@/lib/photos/use-cooking-photo-candidates";
import { useRecipeImageUrls } from "@/lib/photos/use-recipe-image-urls";
import { invalidateUserImageSignedUrl } from "@/lib/photos/signed-url-cache";
import { PHOTOS_BUCKET } from "@/lib/photos/user-image";
import { findMatchingStock, ingredientNameMatchScore, matchesIngredientName } from "@/lib/ingredients/name-match";
import { findFirstYoutubeVideoId } from "@/lib/youtube";

type RecipeMealWorkspaceProps = {
  initialCookCandidates: CookCandidate[];
  initialMealSchedules: MealSchedule[];
  initialRecipes: Recipe[];
  userId: string;
};

type Feedback = {
  tone: "success" | "error" | "info";
  message: string;
};

type PendingDelete = {
  confirmLabel?: string;
  confirm: () => void;
  message: string;
  target: string;
  title?: string;
  tone?: "danger" | "default";
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
  // 消費量の入力単位。既定はレシピ単位（requestedUnit）。換算マッチ在庫を選んだときだけ
  // レシピ単位 / 在庫単位を切り替えられる。同単位なら常に requestedUnit と同じ。
  consumeUnit: string;
  ingredientName: string;
  requestedAmount: number;
  requestedUnit: string;
  stockItemId: string;
};

// 完了モーダルの一括操作。default=在庫がある行に既定量、zero=表示中の行を0にする。
type ConsumptionBulkMode = "default" | "zero";

type AiRecipeMode = "generate" | "structure";
type AiApiKeyKind = "free" | "paid";
type RecipeWorkspaceView = "recipes" | "schedule";

type CookingIngredientTab = "all" | "食材" | "調味料";
type CookingStepTab = "all" | "prep" | "steps";
type CookingStepKind = "prep_steps" | "steps";
type ShortageSelectionTab = "all" | "ingredients" | "seasonings";
type CookingViewerOrigin = "recipes" | "cooking";
type CookingMediaTab = "video" | "photo";
type ConsumptionTab = "all" | "食材" | "調味料";
type PhotoCandidatePickerTarget = "recipe-image" | "cooking-photo";
type RecipeImagePreviewKind = "candidate" | "file" | "saved" | "youtube";
type YoutubeThumbnailStatus =
  | { status: "loading"; videoId: string }
  | { status: "ready"; videoId: string }
  | { error: string; status: "error"; videoId: string };

type CookingStepDraft = {
  id: string;
  kind: CookingStepKind;
  text: string;
};

type CookingIngredientDraft = {
  ingredient: RecipeIngredient;
};

type CookingReorderSnapshot = {
  ingredients: CookingIngredientDraft[];
  steps: CookingStepDraft[];
};

function archiveFieldsForCookingQuantity(quantity: number) {
  if (quantity > 0) {
    return { archived_at: null, archived_reason: null };
  }
  return { archived_at: new Date().toISOString(), archived_reason: "cooking_zero" };
}

const mealTypes: MealType[] = ["朝", "昼", "晩", "その他"];

// レシピ画面からのスケジュール追加モーダルで選べる食事タイプ（Canvas版の朝/昼/晩に合わせる）。
const scheduleAddMealTypes: MealType[] = ["朝", "昼", "晩"];

// スケジュール追加ミニカレンダーの表示日数（今日から30日）。
const SCHEDULE_ADD_DAYS = 30;
const scheduleMealTypes: MealType[] = ["朝", "昼", "晩"];
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
          group_index: number;
          unit: string;
        }>;
        name: string;
        prep_steps: string[];
        source: string;
        steps: string[];
      };
    }
  | { error: string };

type AiRecipeRequestInput = {
  mode: AiRecipeMode;
  required: string;
  optional: string;
  sourceText: string;
};

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

// 在庫アイテムの数量を、記憶された表示形式（分数 or 小数）に従って表示する。g/cc は常に小数。
function stockQuantityDisplay(item: { id: string; unit: string; quantity: number }): string {
  return displayQuantity(
    item.quantity,
    isFractionalUnit(item.unit) ? getQuantityNotation(item.id) : "decimal",
    getCustomFractions()
  );
}

function recipeStepRows(value: string) {
  const rows = value.split(/\r?\n/);
  return rows.length > 0 ? rows : [""];
}

function buildCookingStepDrafts(recipe: Recipe): CookingStepDraft[] {
  return [
    ...recipe.prep_steps.map((text, index) => ({ id: `${recipe.id}-prep-${index}-${text}`, kind: "prep_steps" as const, text })),
    ...recipe.steps.map((text, index) => ({ id: `${recipe.id}-cook-${index}-${text}`, kind: "steps" as const, text }))
  ];
}

function buildCookingIngredientDrafts(recipe: Recipe): CookingIngredientDraft[] {
  return recipe.ingredients
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((ingredient) => ({ ingredient }));
}

function cloneCookingReorderSnapshot(snapshot: CookingReorderSnapshot): CookingReorderSnapshot {
  return {
    ingredients: snapshot.ingredients.map((draft) => ({ ingredient: { ...draft.ingredient } })),
    steps: snapshot.steps.map((draft) => ({ ...draft }))
  };
}

function splitCookingStepDrafts(drafts: CookingStepDraft[]) {
  return {
    prep_steps: drafts.filter((draft) => draft.kind === "prep_steps").map((draft) => draft.text),
    steps: drafts.filter((draft) => draft.kind === "steps").map((draft) => draft.text)
  };
}

function sameStringList(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameIngredientFormOrder(left: RecipeIngredientFormValues[], right: RecipeIngredientFormValues[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameIngredientOrder(left: CookingIngredientDraft[], right: RecipeIngredient[]) {
  const sortedRight = right.slice().sort((a, b) => a.sort_order - b.sort_order);
  return (
    left.length === sortedRight.length &&
    left.every(
      (value, index) =>
        value.ingredient.id === sortedRight[index]?.id &&
        value.ingredient.item_type === sortedRight[index]?.item_type &&
        (value.ingredient.group_index ?? 0) === (sortedRight[index]?.group_index ?? 0)
    )
  );
}

// 調味料サブグループ見出しに使うひらがな。範囲外は `G{rank}` でフォールバックする。
const SEASONING_GROUP_LABELS = [
  "あ", "い", "う", "え", "お", "か", "き", "く", "け", "こ",
  "さ", "し", "す", "せ", "そ", "た", "ち", "つ", "て", "と"
];

// item_type内のグループ出現順(rank, 1始まり)からサブグループ見出しを導出する。
// 食材=A,B,C…（英大文字）、調味料=あ,い,う…（ひらがな）。範囲外は番号でフォールバック。
function subgroupLabel(itemType: "食材" | "調味料", rank: number): string {
  if (rank <= 0) return "";
  if (itemType === "食材") {
    return rank <= 26 ? String.fromCharCode(64 + rank) : `G${rank}`;
  }
  return SEASONING_GROUP_LABELS[rank - 1] ?? `G${rank}`;
}

// item_type内の正のgroup_indexを出現順に並べ、各group_indexのrank(1始まり)を返す。
// 番号の欠番や非連番は出現順のrankで吸収する（DBの番号は連番でなくてよい）。
function subgroupRankMap(items: CookingIngredientDraft[]): Map<number, number> {
  return subgroupRankMapForItems(items.map((draft) => draft.ingredient));
}

type SubgroupItem = {
  item_type: "食材" | "調味料";
  group_index: number;
};

function subgroupRankMapForItems<T extends SubgroupItem>(items: T[]): Map<number, number> {
  const order: number[] = [];
  for (const item of items) {
    const groupIndex = item.group_index ?? 0;
    if (groupIndex > 0 && !order.includes(groupIndex)) order.push(groupIndex);
  }
  const map = new Map<number, number>();
  order.forEach((groupIndex, index) => map.set(groupIndex, index + 1));
  return map;
}

function subgroupRuns<T extends SubgroupItem>(items: T[]): { groupIndex: number; entries: { item: T; sectionIndex: number }[] }[] {
  const runs: { groupIndex: number; entries: { item: T; sectionIndex: number }[] }[] = [];
  items.forEach((item, sectionIndex) => {
    const groupIndex = item.group_index ?? 0;
    const last = runs[runs.length - 1];
    if (last && last.groupIndex === groupIndex) {
      last.entries.push({ item, sectionIndex });
    } else {
      runs.push({ groupIndex, entries: [{ item, sectionIndex }] });
    }
  });
  return runs;
}

function replaceSubgroupList<T extends SubgroupItem>(
  current: T[],
  tone: "食材" | "調味料",
  mutate: (list: T[]) => T[]
): T[] {
  const foods = current.filter((item) => item.item_type === "食材");
  const seasonings = current.filter((item) => item.item_type === "調味料");
  return tone === "食材" ? [...mutate(foods), ...seasonings] : [...foods, ...mutate(seasonings)];
}

function groupSubgroupItems<T extends SubgroupItem>(
  list: T[],
  selectedIds: string[],
  getId: (item: T) => string,
  updateGroupIndex: (item: T, groupIndex: number) => T
): T[] {
  const selectedSet = new Set(selectedIds);
  const used = new Set(list.map((item) => item.group_index ?? 0).filter((groupIndex) => groupIndex > 0));
  let newIndex = 1;
  while (used.has(newIndex)) newIndex += 1;
  const firstPos = list.findIndex((item) => selectedSet.has(getId(item)));
  if (firstPos < 0) return list;
  const insertAt = list.slice(0, firstPos).filter((item) => !selectedSet.has(getId(item))).length;
  const selected = list.filter((item) => selectedSet.has(getId(item))).map((item) => updateGroupIndex(item, newIndex));
  const rest = list.filter((item) => !selectedSet.has(getId(item)));
  const result = [...rest];
  result.splice(insertAt, 0, ...selected);
  return result;
}

function clearSubgroupItems<T extends SubgroupItem>(
  list: T[],
  targetIds: string[],
  getId: (item: T) => string,
  updateGroupIndex: (item: T, groupIndex: number) => T
): T[] {
  const targetSet = new Set(targetIds);
  const cleared = list.filter((item) => targetSet.has(getId(item))).map((item) => updateGroupIndex(item, 0));
  const rest = list.filter((item) => !targetSet.has(getId(item)));
  return [...rest, ...cleared];
}

function normalizeRecipeForm(values: RecipeFormValues): NormalizedRecipeForm {
  const name = values.name.trim();
  if (!name) {
    return { error: "原因: レシピ名が未入力です。影響: レシピを保存できません。修正方法: レシピ名を入力してください。" };
  }

  const ingredients = values.ingredients.map((ingredient, index) => {
    const amount = quantityToNumber(ingredient.amount);
    return {
      item_type: ingredient.item_type,
      name: ingredient.name.trim(),
      amount,
      unit: ingredient.unit.trim(),
      sort_order: index,
      group_index: ingredient.group_index ?? 0
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

function scheduleDeleteMessage(schedule: MealSchedule) {
  // この予定の登録時に追加した未購入の買い物リスト項目があれば、一緒に削除する（購入済みは残す）。
  const shoppingNote = "この予定に紐づく未購入の買い物リスト項目も一緒に削除します。";
  if (schedule.status === "完了") {
    return `在庫を戻して献立を削除します。料理履歴と消費記録も削除されます。完成写真は残ります。${shoppingNote}`;
  }
  return `この献立予定を削除します。料理履歴は削除されません。${shoppingNote}`;
}

function inventoryAmountByNameAndUnit(items: StockItem[], name: string, unit: string) {
  // 名前が一致する在庫を unit へ換算（同単位は factor=1、unit_conversion があれば換算）して合算する。
  // stockAmountInUnit が non-null の在庫だけを採用し、同一在庫を二重計上しない
  // （同単位一致と換算一致は conversionFactorToUnit 内で排他的に評価される）。
  return items
    .filter((item) => matchesIngredientName(item.name, name))
    .reduce((total, item) => {
      const amount = stockAmountInUnit(item, unit);
      return amount === null ? total : total + amount;
    }, 0);
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

function recipeForCandidate(candidate: CookCandidate, recipes: Recipe[]) {
  return recipes.find((recipe) => recipe.id === candidate.recipe_id) ?? recipes.find((recipe) => recipe.name === candidate.recipe_name) ?? null;
}

export function RecipeMealWorkspace({
  initialCookCandidates,
  initialMealSchedules,
  initialRecipes,
  userId
}: RecipeMealWorkspaceProps) {
  const { inventoryItems: inventoryItemsForMeals, setInventoryItems: setInventoryItemsForMeals, setShoppingItems, refetch } = useInventoryStore();
  const [recipes, setRecipes] = useState(initialRecipes);
  const [cookCandidates, setCookCandidates] = useState(initialCookCandidates);
  const [mealSchedules, setMealSchedules] = useState(initialMealSchedules);
  const [recipeValues, setRecipeValues] = useState<RecipeFormValues>(emptyRecipeFormValues);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  // 編集中レシピの「保存済み画像 path」。差し替え時の旧 object 削除や、表示の起点に使う。
  const [editingRecipeImagePath, setEditingRecipeImagePath] = useState<string | null>(null);
  // 編集中レシピの保存済み画像の署名付きURL（プレビュー表示用）。
  const [editingRecipeImageUrl, setEditingRecipeImageUrl] = useState<string | null>(null);
  // 新規選択した画像ファイル（保存時にアップロードする。未保存の状態）。
  const [recipeImageFile, setRecipeImageFile] = useState<File | null>(null);
  const [recipeImageCandidate, setRecipeImageCandidate] = useState<CookingPhotoCandidate | null>(null);
  // 新規選択画像のプレビュー（object URL）。
  const [recipeImagePreviewUrl, setRecipeImagePreviewUrl] = useState<string | null>(null);
  // 既存画像を削除する操作を選んだか（保存時に Storage/DB から消す）。
  const [recipeImageRemoved, setRecipeImageRemoved] = useState(false);
  const [youtubeThumbnailStatus, setYoutubeThumbnailStatus] = useState<YoutubeThumbnailStatus | null>(null);
  const [youtubeThumbnailDismissedVideoId, setYoutubeThumbnailDismissedVideoId] = useState<string | null>(null);
  const [youtubeThumbnailReplacementVideoId, setYoutubeThumbnailReplacementVideoId] = useState<string | null>(null);
  const [youtubeThumbnailRetryKey, setYoutubeThumbnailRetryKey] = useState(0);
  // 編集モーダルでサブグルーピング選択中の材料行index。同一 item_type 内だけ複数選択できる。
  const [recipeSelectedIngredientKeys, setRecipeSelectedIngredientKeys] = useState<string[]>([]);
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
  const [recipeFavoriteOnly, setRecipeFavoriteOnly] = useState(false);
  const [pendingDeleteRecipeId, setPendingDeleteRecipeId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [pendingConsumptionScheduleId, setPendingConsumptionScheduleId] = useState<string | null>(null);
  const [consumptionDrafts, setConsumptionDrafts] = useState<ConsumptionDraft[]>([]);
  const [consumptionTab, setConsumptionTab] = useState<ConsumptionTab>("all");
  const [selectedCookingPhoto, setSelectedCookingPhoto] = useState<File | null>(null);
  const [selectedCookingPhotoCandidate, setSelectedCookingPhotoCandidate] = useState<CookingPhotoCandidate | null>(null);
  const [cookingPhotoPreviewUrl, setCookingPhotoPreviewUrl] = useState<string | null>(null);
  const [cookingRating, setCookingRating] = useState("");
  const [cookingComment, setCookingComment] = useState("");
  const [cookingIngredientTab, setCookingIngredientTab] = useState<CookingIngredientTab>("all");
  const [cookingStepTab, setCookingStepTab] = useState<CookingStepTab>("all");
  const [cookingStepDrafts, setCookingStepDrafts] = useState<CookingStepDraft[]>([]);
  const [cookingIngredientDrafts, setCookingIngredientDrafts] = useState<CookingIngredientDraft[]>([]);
  // サブグルーピング選択中の材料id（同一 item_type 内に限定）。空配列＝未選択。
  const [cookingSelectedIngredientIds, setCookingSelectedIngredientIds] = useState<string[]>([]);
  const [cookingReorderUndoStack, setCookingReorderUndoStack] = useState<CookingReorderSnapshot[]>([]);
  const [cookingReorderRedoStack, setCookingReorderRedoStack] = useState<CookingReorderSnapshot[]>([]);
  const [cookingStockCheck, setCookingStockCheck] = useState(false);
  const [highlightedIngredientName, setHighlightedIngredientName] = useState("");
  const [aiMode, setAiMode] = useState<AiRecipeMode>("generate");
  const [geminiApiKeys, setGeminiApiKeys] = useState<UserGeminiApiKeys>({ free: "", paid: "" });
  const [pendingAiRecipeRetry, setPendingAiRecipeRetry] = useState<AiRecipeRequestInput | null>(null);
  const [aiRequired, setAiRequired] = useState("");
  const [aiOptional, setAiOptional] = useState("");
  const [aiSourceText, setAiSourceText] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // 消費ダイアログを開く際の在庫再取得中フラグ。二重タップ・取得中の再入を防ぐ。
  const [isOpeningConsumption, setIsOpeningConsumption] = useState(false);
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [activeView, setActiveView] = useState<RecipeWorkspaceView>("recipes");
  const [isTextImportOpen, setIsTextImportOpen] = useState(false);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isRecipeEditorOpen, setIsRecipeEditorOpen] = useState(false);
  const [photoCandidatePickerTarget, setPhotoCandidatePickerTarget] = useState<PhotoCandidatePickerTarget | null>(null);
  const [shortageSelectionItems, setShortageSelectionItems] = useState<RecipeShoppingShortage[]>([]);
  const [shortageSelectionTab, setShortageSelectionTab] = useState<ShortageSelectionTab>("all");
  const [shortageSelectionRecipeName, setShortageSelectionRecipeName] = useState("");
  // 不足モーダルがスケジュール登録起点で開かれた場合の、紐づくスケジュール id。
  // 買い物 INSERT 時に meal_schedule_id として保存し、スケジュール削除時の連動削除に使う。
  // レシピ詳細の「買い物へ」など、スケジュール起点でない場合は null。
  const [shortageSelectionScheduleId, setShortageSelectionScheduleId] = useState<string | null>(null);
  const [pickerSlot, setPickerSlot] = useState<{ date: string; meal: MealType; replaceId?: string } | null>(null);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerSearchLogic, setPickerSearchLogic] = useState<RecipeSearchLogic>("and");
  const [pickerSearchMode, setPickerSearchMode] = useState<RecipeSearchMode>("name");
  const [pickerSort, setPickerSort] = useState<RecipeSort>("created_desc");
  const [pickerFavoriteOnly, setPickerFavoriteOnly] = useState(false);
  // レシピ画面（詳細ヘッダー／各カード）からのスケジュール追加モーダル状態。
  // recipeId が立つとモーダルが開き、日付を選ぶと朝/昼/晩の食事選択ステップへ進む。
  const [scheduleAddRecipeId, setScheduleAddRecipeId] = useState<string | null>(null);
  const [scheduleAddSelectedDate, setScheduleAddSelectedDate] = useState<string | null>(null);
  const [cookingScheduleId, setCookingScheduleId] = useState<string | null>(null);
  const [cookingViewerOrigin, setCookingViewerOrigin] = useState<CookingViewerOrigin>("recipes");
  // 調理ビューのヘッダー写真ブロックの開閉状態（初期: 開）。
  const [isCookingPhotoOpen, setIsCookingPhotoOpen] = useState(true);
  // 調理ビューの写真エリアで写真/動画どちらを表示するか。
  // YouTube URL があるレシピは動画を初期表示（openCookingViewer で都度リセット）。
  const [cookingMediaTab, setCookingMediaTab] = useState<CookingMediaTab>("video");
  const [slotMenuId, setSlotMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "info" | "success" | "error" } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cookingPhotoInputRef = useRef<HTMLInputElement>(null);
  const recipeImageInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { clearPendingRecipe, pendingRecipeId, pendingRecipeOrigin, returnToMode } = useShellNavigation();
  const { showStatusMessage } = useShellStatusMessage();
  const { selectedSubViews, selectShellLeaf } = useShellSubView();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const photoCandidateClient = supabase as unknown as CookingPhotoCandidateClient;
  // 一覧・詳細・候補で使うユーザー登録画像の署名付きURL（recipe.id -> url）。
  const recipeImageUrls = useRecipeImageUrls(recipes, supabase);
  const {
    candidates: cookingPhotoCandidates,
    error: cookingPhotoCandidatesError,
    loading: cookingPhotoCandidatesLoading
  } = useCookingPhotoCandidates(photoCandidateClient, userId, Boolean(photoCandidatePickerTarget));
  const { aiUsageSummary, refreshAiUsage } = useShellAiUsage();
  const recipeLimitReached = Boolean(
    aiUsageSummary?.ok && (aiUsageSummary.recipe_generation.remaining <= 0 || aiUsageSummary.total.remaining <= 0)
  );

  const selectedRecipe = recipes.find((recipe) => recipe.id === selectedRecipeId) ?? recipes[0] ?? null;
  const activeCookingRecipe = recipes.find((recipe) => recipe.id === activeCookingRecipeId) ?? null;
  const cookingStepParts = splitCookingStepDrafts(cookingStepDrafts);
  const hasCookingStepOrderChanges = Boolean(
    activeCookingRecipe &&
      (!sameStringList(cookingStepParts.prep_steps, activeCookingRecipe.prep_steps) ||
        !sameStringList(cookingStepParts.steps, activeCookingRecipe.steps))
  );
  const hasCookingIngredientOrderChanges = Boolean(activeCookingRecipe && !sameIngredientOrder(cookingIngredientDrafts, activeCookingRecipe.ingredients));
  const hasCookingReorderChanges = hasCookingStepOrderChanges || hasCookingIngredientOrderChanges;
  const canUndoCookingReorder = cookingReorderUndoStack.length > 0;
  const canRedoCookingReorder = cookingReorderRedoStack.length > 0;
  const favoriteFilteredRecipes = recipeFavoriteOnly ? recipes.filter((recipe) => recipe.is_favorite) : recipes;
  const visibleRecipes = filterAndSortRecipes(favoriteFilteredRecipes, recipeSearch, recipeSort, recipeSearchMode, recipeSearchLogic);
  const selectedSchedule = mealSchedules.find((schedule) => schedule.id === selectedScheduleId) ?? mealSchedules[0] ?? null;
  const slotMenuSchedule = slotMenuId ? mealSchedules.find((schedule) => schedule.id === slotMenuId) ?? null : null;
  const cookingSchedule = cookingScheduleId ? mealSchedules.find((schedule) => schedule.id === cookingScheduleId) ?? null : null;
  const scheduleDays = Array.from({ length: 7 }, (_, index) => addDays(scheduleWindowStart, index));
  // スケジュール追加モーダル: 対象レシピと、今日から30日分の日付＋日付ごとの献立件数。
  const scheduleAddRecipe = scheduleAddRecipeId ? recipes.find((recipe) => recipe.id === scheduleAddRecipeId) ?? null : null;
  const scheduleAddDays = Array.from({ length: SCHEDULE_ADD_DAYS }, (_, index) => addDays(todayValue(), index));
  const scheduleCountByDate = mealSchedules.reduce<Record<string, number>>((acc, schedule) => {
    acc[schedule.scheduled_on] = (acc[schedule.scheduled_on] ?? 0) + 1;
    return acc;
  }, {});
  const visibleMealSchedules = mealSchedules
    .filter((schedule) => scheduleDays.includes(schedule.scheduled_on))
    .sort((a, b) => a.scheduled_on.localeCompare(b.scheduled_on) || mealTypeOrder[a.meal_type] - mealTypeOrder[b.meal_type]);
  const activeCookCandidates = cookCandidates.filter((item) => item.status === "候補");
  const recipeIngredientEntries = recipeValues.ingredients.map((ingredient, index) => ({ ingredient, index }));
  const foodIngredientEntries = recipeIngredientEntries.filter(({ ingredient }) => ingredient.item_type === "食材");
  const seasoningIngredientEntries = recipeIngredientEntries.filter(({ ingredient }) => ingredient.item_type === "調味料");
  const selectedRecipeIngredientEntries = recipeIngredientEntries.filter(({ index }) => recipeSelectedIngredientKeys.includes(String(index)));
  const prepStepEntries = recipeStepRows(recipeValues.prep_steps);
  const cookStepEntries = recipeStepRows(recipeValues.steps);
  const filteredShortageSelectionItems = shortageSelectionItems.filter((item) => {
    if (shortageSelectionTab === "ingredients") return item.type !== "調味料";
    if (shortageSelectionTab === "seasonings") return item.type === "調味料";
    return true;
  });
  const selectedShortageSelectionCount = shortageSelectionItems.filter((item) => item.selected).length;
  const allVisibleShortagesSelected = filteredShortageSelectionItems.length > 0 && filteredShortageSelectionItems.every((item) => item.selected);
  const recipeYoutubeVideoId = useMemo(() => findFirstYoutubeVideoId(recipeValues.source), [recipeValues.source]);
  const canUseYoutubeThumbnailPreview =
    Boolean(recipeYoutubeVideoId) &&
    !recipeImageFile &&
    !recipeImageCandidate &&
    !recipeImageRemoved &&
    (!editingRecipeImagePath || youtubeThumbnailReplacementVideoId === recipeYoutubeVideoId);
  const shouldLoadYoutubeThumbnail =
    canUseYoutubeThumbnailPreview && recipeYoutubeVideoId !== null && youtubeThumbnailDismissedVideoId !== recipeYoutubeVideoId;
  const youtubeThumbnailUrl = shouldLoadYoutubeThumbnail
    ? `/api/youtube/thumbnail?videoId=${encodeURIComponent(recipeYoutubeVideoId)}&retry=${youtubeThumbnailRetryKey}`
    : null;

  useEffect(() => {
    setGeminiApiKeys(loadUserGeminiApiKeys());
  }, []);

  useEffect(() => {
    setActiveView(selectedSubViews.recipes);
  }, [selectedSubViews.recipes]);

  useEffect(() => {
    if (!shouldLoadYoutubeThumbnail || !recipeYoutubeVideoId) {
      setYoutubeThumbnailStatus(null);
      return;
    }
    setYoutubeThumbnailStatus({ status: "loading", videoId: recipeYoutubeVideoId });
  }, [recipeYoutubeVideoId, shouldLoadYoutubeThumbnail, youtubeThumbnailRetryKey]);

  function switchRecipeView(view: RecipeShellLeaf) {
    setActiveView(view);
    selectShellLeaf("recipes", view);
  }

  // プレビュー用の object URL をメモリリークさせないよう、アンマウント/差し替え時に解放する。
  useEffect(() => {
    return () => {
      if (recipeImagePreviewUrl) {
        URL.revokeObjectURL(recipeImagePreviewUrl);
      }
    };
  }, [recipeImagePreviewUrl]);

  function clearRecipeImageDraft() {
    setRecipeImagePreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setRecipeImageFile(null);
    setRecipeImageCandidate(null);
    setRecipeImageRemoved(false);
    setYoutubeThumbnailDismissedVideoId(null);
    setYoutubeThumbnailReplacementVideoId(null);
    if (recipeImageInputRef.current) {
      recipeImageInputRef.current.value = "";
    }
  }

  function resetRecipeForm() {
    setRecipeValues(emptyRecipeFormValues);
    setEditingRecipeId(null);
    setRecipeSelectedIngredientKeys([]);
    setEditingRecipeImagePath(null);
    setEditingRecipeImageUrl(null);
    clearRecipeImageDraft();
  }

  function setRecipeImageDraftFromFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFeedback({
        tone: "error",
        message: "原因: 画像以外のファイルが選ばれました。影響: 画像を登録できません。修正方法: 画像ファイル（JPEG/PNG/WebPなど）を選び直してください。"
      });
      return;
    }
    setRecipeImagePreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setRecipeImageFile(file);
    setRecipeImageCandidate(null);
    setRecipeImageRemoved(false);
    setYoutubeThumbnailReplacementVideoId(null);
    if (recipeYoutubeVideoId) {
      setYoutubeThumbnailDismissedVideoId(recipeYoutubeVideoId);
    }
  }

  function selectRecipeImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setRecipeImageDraftFromFile(file);
  }

  function choosePhotoCandidate(candidate: CookingPhotoCandidate) {
    if (photoCandidatePickerTarget === "recipe-image") {
      setRecipeImagePreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      setRecipeImageFile(null);
      setRecipeImageRemoved(false);
      setRecipeImageCandidate(candidate);
      setYoutubeThumbnailReplacementVideoId(null);
      if (recipeYoutubeVideoId) {
        setYoutubeThumbnailDismissedVideoId(recipeYoutubeVideoId);
      }
      if (recipeImageInputRef.current) {
        recipeImageInputRef.current.value = "";
      }
      setPhotoCandidatePickerTarget(null);
      return;
    }

    if (photoCandidatePickerTarget === "cooking-photo") {
      if (cookingPhotoPreviewUrl) URL.revokeObjectURL(cookingPhotoPreviewUrl);
      setSelectedCookingPhoto(null);
      setCookingPhotoPreviewUrl(null);
      setSelectedCookingPhotoCandidate(candidate);
      if (cookingPhotoInputRef.current) {
        cookingPhotoInputRef.current.value = "";
      }
      setPhotoCandidatePickerTarget(null);
    }
  }

  function removeRecipeImage() {
    if (recipeYoutubeVideoId && canUseYoutubeThumbnailPreview && youtubeThumbnailDismissedVideoId !== recipeYoutubeVideoId) {
      setYoutubeThumbnailDismissedVideoId(recipeYoutubeVideoId);
      setYoutubeThumbnailStatus(null);
      return;
    }
    // 新規選択中ならその下書きだけ取り消す。保存済み画像があれば「削除」を予約する。
    clearRecipeImageDraft();
    if (editingRecipeImagePath) {
      setRecipeImageRemoved(true);
    }
  }

  function cancelRecipeImageChange() {
    clearRecipeImageDraft();
  }

  function retryYoutubeThumbnailPreview() {
    setYoutubeThumbnailDismissedVideoId(null);
    if (recipeYoutubeVideoId) {
      setYoutubeThumbnailReplacementVideoId(recipeYoutubeVideoId);
      setYoutubeThumbnailStatus({ status: "loading", videoId: recipeYoutubeVideoId });
      showToast("YouTubeサムネイルを再取得しています。画像欄で結果を確認できます。", "success");
    } else {
      setYoutubeThumbnailStatus(null);
    }
    setYoutubeThumbnailRetryKey((current) => current + 1);
  }

  function markYoutubeThumbnailReady(videoId: string) {
    setYoutubeThumbnailStatus((current) => (current?.videoId === videoId ? { status: "ready", videoId } : current));
  }

  function markYoutubeThumbnailError(videoId: string) {
    setYoutubeThumbnailStatus((current) =>
      current?.videoId === videoId
        ? {
            status: "error",
            videoId,
            error:
              "原因: YouTubeサムネイルを取得できませんでした。影響: 画像は自動登録されません。修正方法: URLを確認するか、画像を手動で選んでください。"
          }
        : current
    );
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

  // 編集モーダルの材料・調味料をD&Dで並び替える。並び替えは同一 item_type 内に限定し、
  // セクションをまたぐ移動は行わない。`recipeValues.ingredients` を immutable に入れ替えるだけで、
  // 保存時に既存の `normalizeRecipeForm`（表示順→`sort_order` 採番）へそのまま乗る。
  function moveIngredient(fromIndex: number, targetType: RecipeIngredientType, targetSectionIndex: number, targetGroupIndex = 0) {
    setRecipeValues((current) => {
      const items = current.ingredients;
      const moving = items[fromIndex];
      if (!moving || moving.item_type !== targetType) return current;
      const remaining = items.filter((_, currentIndex) => currentIndex !== fromIndex);
      const foods = remaining.filter((ingredient) => ingredient.item_type === "食材");
      const seasonings = remaining.filter((ingredient) => ingredient.item_type === "調味料");
      const targetList = targetType === "食材" ? foods : seasonings;
      const insertIndex = Math.max(0, Math.min(targetSectionIndex, targetList.length));
      targetList.splice(insertIndex, 0, { ...moving, group_index: targetGroupIndex });
      const next = [...foods, ...seasonings];
      if (sameIngredientFormOrder(items, next)) return current;
      return { ...current, ingredients: next };
    });
    setRecipeSelectedIngredientKeys([]);
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
    setRecipeSelectedIngredientKeys((current) => current.filter((key) => key !== String(index)));
  }

  function toggleRecipeIngredientSelection(index: number, ingredient: RecipeIngredientFormValues, additive: boolean) {
    const key = String(index);
    setRecipeSelectedIngredientKeys((current) => {
      if (!additive) {
        return current.length === 1 && current[0] === key ? [] : [key];
      }
      if (current.length > 0) {
        const firstType = recipeValues.ingredients[Number(current[0])]?.item_type;
        if (firstType && firstType !== ingredient.item_type) {
          return [key];
        }
      }
      return current.includes(key) ? current.filter((value) => value !== key) : [...current, key];
    });
  }

  function replaceRecipeIngredientSubgroup(
    tone: RecipeIngredientType,
    mutate: (
      list: Array<RecipeIngredientFormValues & { selectionKey: string }>
    ) => Array<RecipeIngredientFormValues & { selectionKey: string }>
  ) {
    setRecipeValues((current) => {
      const keyed = current.ingredients.map((ingredient, index) => ({ ...ingredient, selectionKey: String(index) }));
      const next = replaceSubgroupList(keyed, tone, mutate).map(({ item_type, name, amount, unit, group_index }) => ({
        item_type,
        name,
        amount,
        unit,
        group_index
      }));
      return { ...current, ingredients: next };
    });
  }

  function groupSelectedRecipeIngredients(tone: RecipeIngredientType) {
    const selectedInTone = selectedRecipeIngredientEntries.filter(({ ingredient }) => ingredient.item_type === tone);
    if (selectedInTone.length < 2) return;
    const selectedKeys = selectedInTone.map(({ index }) => String(index));
    replaceRecipeIngredientSubgroup(tone, (list) =>
      groupSubgroupItems(
        list,
        selectedKeys,
        (item) => item.selectionKey,
        (item, groupIndex) => ({ ...item, group_index: groupIndex })
      )
    );
    setRecipeSelectedIngredientKeys([]);
  }

  function clearRecipeIngredientGroup(tone: RecipeIngredientType, keys: string[]) {
    if (keys.length === 0) return;
    replaceRecipeIngredientSubgroup(tone, (list) =>
      clearSubgroupItems(
        list,
        keys,
        (item) => item.selectionKey,
        (item, groupIndex) => ({ ...item, group_index: groupIndex })
      )
    );
    setRecipeSelectedIngredientKeys((current) => current.filter((key) => !keys.includes(key)));
  }

  function ungroupSelectedRecipeIngredients(tone: RecipeIngredientType) {
    const keys = selectedRecipeIngredientEntries
      .filter(({ ingredient }) => ingredient.item_type === tone && (ingredient.group_index ?? 0) > 0)
      .map(({ index }) => String(index));
    clearRecipeIngredientGroup(tone, keys);
  }

  function ungroupRecipeSubgroup(tone: RecipeIngredientType, groupIndex: number) {
    const keys = recipeIngredientEntries
      .filter(({ ingredient }) => ingredient.item_type === tone && (ingredient.group_index ?? 0) === groupIndex)
      .map(({ index }) => String(index));
    clearRecipeIngredientGroup(tone, keys);
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
    setShortageSelectionScheduleId(null);
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

  async function runAiRecipe(overrides?: Partial<AiRecipeRequestInput>, apiKeyKind: AiApiKeyKind = "free"): Promise<RecipeFormValues | null> {
    const input: AiRecipeRequestInput = {
      mode: overrides?.mode ?? aiMode,
      required: overrides?.required ?? aiRequired,
      optional: overrides?.optional ?? aiOptional,
      sourceText: overrides?.sourceText ?? aiSourceText
    };
    const { mode, required, optional, sourceText } = input;
    if (!required.trim() && !optional.trim() && !sourceText.trim()) {
      setFeedback({
        tone: "error",
        message: "原因: AIに渡す食材や本文が空です。影響: レシピ案を作れません。修正方法: 必須食材、任意食材、またはレシピ本文を入力してください。"
      });
      return null;
    }

    const trimmedApiKey = geminiApiKeys[apiKeyKind].trim();
    if (!trimmedApiKey) {
      setFeedback({
        tone: "error",
        message:
          apiKeyKind === "free"
            ? "原因: 無料用Gemini APIキーが未入力です。影響: AIレシピを実行できません。修正方法: 設定画面で無料用Gemini APIキーを登録してから再度お試しください。"
            : "原因: 有料Gemini APIキーが未入力です。影響: 有料APIで続行できません。修正方法: 設定画面で有料用Gemini APIキーを登録してから再度お試しください。"
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
    setPendingAiRecipeRetry(null);
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
        if (apiKeyKind === "free") {
          setPendingAiRecipeRetry(input);
        }
        setFeedback({
          tone: "error",
          message: result.error || "原因: AIレシピの取得に失敗しました。影響: 編集モーダルを開けません。修正方法: 時間を置いて再度お試しください。"
        });
        return null;
      }

      return result.recipe;
    } catch {
      if (apiKeyKind === "free") {
        setPendingAiRecipeRetry(input);
      }
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

  async function retryAiRecipe(apiKeyKind: AiApiKeyKind) {
    if (!pendingAiRecipeRetry) return;
    const recipe = await runAiRecipe(pendingAiRecipeRetry, apiKeyKind);
    if (recipe) applyRecipeToEditor(recipe);
  }

  function cancelAiRecipeRetry() {
    setPendingAiRecipeRetry(null);
    setFeedback({ tone: "info", message: "AIレシピの再実行をキャンセルしました。入力内容はそのまま残しています。" });
  }

  function applyRecipeToEditor(recipe: RecipeFormValues) {
    setRecipeValues(recipe);
    setEditingRecipeId(null);
    setEditingRecipeImagePath(null);
    setEditingRecipeImageUrl(null);
    clearRecipeImageDraft();
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
    clearRecipeImageDraft();
    setEditingRecipeImagePath(recipe.image_storage_path);
    // 既存の保存済み画像はカード一覧用の署名付きURLを使い回す（無ければプレビューはプレースホルダ）。
    setEditingRecipeImageUrl(recipeImageUrls.get(recipe.id) ?? null);
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
    setIsCookingPhotoOpen(true);
    // YouTube URL があるレシピは動画を初期表示、無ければ写真へフォールバック。
    setCookingMediaTab(findFirstYoutubeVideoId(recipe.source ?? "") ? "video" : "photo");
  }, []);

  useEffect(() => {
    if (!activeCookingRecipe) {
      setCookingStepDrafts([]);
      setCookingIngredientDrafts([]);
      setCookingReorderUndoStack([]);
      setCookingReorderRedoStack([]);
      return;
    }
    setCookingStepDrafts(buildCookingStepDrafts(activeCookingRecipe));
    setCookingIngredientDrafts(buildCookingIngredientDrafts(activeCookingRecipe));
    setCookingSelectedIngredientIds([]);
    setCookingReorderUndoStack([]);
    setCookingReorderRedoStack([]);
  }, [activeCookingRecipe]);

  function closeCookingViewer() {
    const shouldReturnToCooking = cookingViewerOrigin === "cooking";
    setActiveCookingRecipeId("");
    setCookingScheduleId(null);
    setPendingConsumptionScheduleId(null);
    setCookingStepDrafts([]);
    setCookingIngredientDrafts([]);
    setCookingSelectedIngredientIds([]);
    setCookingReorderUndoStack([]);
    setCookingReorderRedoStack([]);
    setCookingViewerOrigin("recipes");
    if (shouldReturnToCooking) {
      returnToMode("cooking");
    }
  }

  function editActiveCookingRecipe(recipe: Recipe) {
    setActiveCookingRecipeId("");
    setCookingScheduleId(null);
    setPendingConsumptionScheduleId(null);
    setCookingStepDrafts([]);
    setCookingIngredientDrafts([]);
    setCookingSelectedIngredientIds([]);
    setCookingReorderUndoStack([]);
    setCookingReorderRedoStack([]);
    setCookingViewerOrigin("recipes");
    startEditRecipe(recipe);
  }

  function resetCookingPhoto() {
    if (cookingPhotoPreviewUrl) URL.revokeObjectURL(cookingPhotoPreviewUrl);
    setSelectedCookingPhoto(null);
    setSelectedCookingPhotoCandidate(null);
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

  function applyCookingPhotoFile(file: File) {
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
    setSelectedCookingPhotoCandidate(null);
    setCookingPhotoPreviewUrl(URL.createObjectURL(file));
  }

  function selectCookingPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    applyCookingPhotoFile(file);
  }

  // 料理完成写真エリアへのファイルD&D（複数ドロップ時は先頭1件のみ採用＝既存の単一選択挙動に合わせる）。
  function handleCookingPhotoDrop(files: File[]) {
    const file = files[0];
    if (file) applyCookingPhotoFile(file);
  }

  function setVisibleConsumptionAmount(mode: ConsumptionBulkMode) {
    if (!activeCookingRecipe) return;
    setConsumptionDrafts((items) =>
      items.map((draft) => {
        const ingredient = activeCookingRecipe.ingredients.find((item) => item.name === draft.ingredientName && item.unit === draft.requestedUnit);
        const visible = consumptionTab === "all" || ingredient?.item_type === consumptionTab;
        if (!visible) return draft;
        if (mode === "zero") {
          return { ...draft, amount: "0" };
        }
        // default: 在庫を選んでいる行だけ既定量（min(必要量, 在庫量)）を入れる。在庫未選択の行は0のまま。
        // 換算マッチ時は consumeUnit に合わせた在庫総量と比較する（既定は requestedUnit）。
        const stockItem = inventoryItemsForMeals.find((item) => item.id === draft.stockItemId);
        if (!stockItem) return draft;
        const consumeUnit = draft.consumeUnit || draft.requestedUnit;
        // requestedAmount はレシピ単位。consumeUnit が在庫単位なら必要量も在庫単位へ換算して比較する。
        const requestedInConsumeUnit =
          consumeUnit === draft.requestedUnit
            ? draft.requestedAmount
            : (convertToStockUnit(draft.requestedAmount, stockItem, draft.requestedUnit) ?? draft.requestedAmount);
        const stockInConsumeUnit = stockAmountInUnit(stockItem, consumeUnit) ?? Number(stockItem.quantity || 0);
        return {
          ...draft,
          amount: formatQuantityForInput(Math.min(requestedInConsumeUnit, stockInConsumeUnit), {
            allowFraction: isFractionalUnit(consumeUnit)
          })
        };
      })
    );
  }

  function requestDelete(target: string, message: string, confirm: () => void, options?: Pick<PendingDelete, "confirmLabel" | "title" | "tone">) {
    setPendingDelete({ target, message, confirm, ...options });
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
    return inventoryItemsForMeals.filter(
      (item) =>
        item.category === ingredient.item_type &&
        conversionFactorToUnit(item, ingredient.unit) !== null &&
        item.quantity > 0
    );
  }

  // 消費ダイアログを開く瞬間に在庫を再取得し、共有ストアも更新する。
  // 食材管理ボードでの追加・補充を自動マッチングへ反映するための最小リフェッチ。
  // select 列・並び順は page.tsx の初回フェッチ（"*" / archived_at null / quantity>0 / created_at desc）と揃える。
  // 取得したデータはローカル変数として返し、setState の反映待ちに依存しない（stale-read 回避）。
  // 失敗時は null を返し、呼び出し側で既存スナップショットへフォールバックする（操作はブロックしない）。
  async function fetchFreshInventoryForMeals(): Promise<StockItem[] | null> {
    try {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("user_id", userId)
        .is("archived_at", null)
        .gt("quantity", 0)
        .order("created_at", { ascending: false });

      if (error || !data) return null;
      const fresh = data as StockItem[];
      // ストアも即時更新することで、在庫一覧タブへ切り替えた際にリロードなしで反映される。
      setInventoryItemsForMeals(fresh);
      return fresh;
    } catch (error) {
      // ネットワーク例外で throw されると呼び出し側の isOpeningConsumption が解除されないため、ここで握って null を返す
      console.error("在庫の再取得に失敗しました:", error);
      return null;
    }
  }

  // 在庫リストは明示引数で受け取る。ダイアログを開く直前の再取得結果（fresh）を
  // setState の反映待ちに依存せず即座に使うため（stale read 回避）。
  function buildConsumptionDrafts(schedule: MealSchedule, inventoryItems: StockItem[] = inventoryItemsForMeals) {
    const recipe = recipes.find((item) => item.id === schedule.recipe_id);
    if (!recipe) return [];

    return recipe.ingredients.map((ingredient) => {
      const exactStock = findMatchingStock(ingredient.name, ingredient.item_type, ingredient.unit, inventoryItems);
      // 初期消費量はレシピ単位で min(必要量, 在庫の換算後総量)。
      // 例: 必要 300g・在庫 5パック×80g=400g → min(300, 400)=300g。同単位は従来どおり quantity と一致。
      const stockAmount = exactStock ? stockAmountInUnit(exactStock, ingredient.unit) : null;
      return {
        ingredientName: ingredient.name,
        requestedAmount: ingredient.amount,
        requestedUnit: ingredient.unit,
        consumeUnit: ingredient.unit,
        amount:
          exactStock && stockAmount !== null
            ? formatQuantityForInput(Math.min(ingredient.amount, stockAmount), { allowFraction: isFractionalUnit(ingredient.unit) })
            : "0",
        stockItemId: exactStock?.id ?? ""
      };
    });
  }

  function updateConsumptionDraft(index: number, values: Partial<ConsumptionDraft>) {
    setConsumptionDrafts((items) =>
      items.map((item, currentIndex) => {
        if (currentIndex !== index) return item;
        const next = { ...item, ...values };
        // 在庫を別在庫へ切り替えたとき（ユーザーが単位を明示指定していない場合）は consumeUnit を決め直す。
        // 換算成立 or 同単位 or 未選択 → レシピ単位へ戻す。
        // 換算不能な単位不一致在庫 → 在庫単位へ自動切替し、入力値をリセットする（誤初期値を残さない）。
        if (values.stockItemId !== undefined && values.stockItemId !== item.stockItemId && values.consumeUnit === undefined) {
          const stockItem = next.stockItemId ? inventoryItemsForMeals.find((stock) => stock.id === next.stockItemId) ?? null : null;
          const resolved = resolveConsumeUnitForStock(stockItem, item.requestedUnit);
          next.consumeUnit = resolved.consumeUnit;
          if (resolved.resetAmount && values.amount === undefined) {
            next.amount = "0";
          }
        }
        return next;
      })
    );
  }

  async function deleteRecipe(recipe: Recipe) {
    setIsSaving(true);
    setFeedback(null);

    const { error } = await supabase.from("recipes").delete().eq("id", recipe.id).eq("user_id", userId);

    if (error) {
      setIsSaving(false);
      setFeedback({ tone: "error", message: "原因: レシピを削除できませんでした。影響: レシピ一覧に残ります。修正方法: ログイン状態を確認してください。" });
      return;
    }

    // レシピ本体の削除に成功したら、紐づく画像 object も後始末する（孤児ファイルを残さない）。
    // 失敗しても表示に影響はないため、削除自体は成功扱いとする。
    if (recipe.image_storage_path) {
      await supabase.storage.from("photos").remove([recipe.image_storage_path]);
    }

    setIsSaving(false);

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
      sort_order: ingredient.sort_order,
      group_index: ingredient.group_index
    }));
    const { data: savedIngredients, error: ingredientError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientPayload)
      .select();

    if (ingredientError || !savedIngredients) {
      setIsSaving(false);
      setFeedback({
        tone: "error",
        message: "原因: 材料をDBへ保存できませんでした。影響: レシピ本文だけ保存済みの可能性があります。修正方法: レシピを開き直して材料を再保存してください。"
      });
      return;
    }

    // 画像（任意）の保存。本文・材料の保存後に行う。失敗してもレシピ本文は保存済みなので、
    // 画像だけ未反映であることを明示してフィードバックする。
    const imageResult = await persistRecipeImageChange(recipeId, (savedRecipe as { image_storage_path: string | null }).image_storage_path ?? null, normalized.data.source);
    if (!imageResult.ok) {
      setIsSaving(false);
      setFeedback({ tone: "error", message: imageResult.error });
      return;
    }

    setIsSaving(false);

    const mergedRecipe = {
      ...(savedRecipe as Omit<Recipe, "ingredients">),
      image_storage_path: imageResult.imagePath,
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
    const successMessage = editingRecipeId ? "レシピを更新しました。" : "レシピを追加しました。";
    setFeedback({
      tone: imageResult.warning ? "info" : "success",
      message: imageResult.warning
        ? `${successMessage} ${imageResult.warning}`
        : imageResult.staleRemovalFailed
          ? `${successMessage} ただし古い画像ファイルの削除に失敗しました。表示には影響しませんが、不要ファイルが残る場合があります。`
          : successMessage
    });
  }

  /**
   * レシピ画像の差分（新規アップロード／削除）を Storage と DB に反映する。
   * 戻り値の `imagePath` は反映後の最終 path（変更なしなら現状維持）。
   */
  async function persistRecipeImageChange(
    recipeId: string,
    currentImagePath: string | null,
    source: string
  ): Promise<{ ok: true; imagePath: string | null; staleRemovalFailed: boolean; warning?: string } | { ok: false; error: string }> {
    if (recipeImageCandidate) {
      const result = await setRecipeImageFromCandidate(supabase, {
        userId,
        recipeId,
        candidatePath: recipeImageCandidate.storagePath,
        candidateContentType: recipeImageCandidate.contentType,
        previousPath: currentImagePath
      });
      if (!result.ok) {
        return { ok: false, error: `${result.error}（レシピ本文は保存済みです）` };
      }
      if (currentImagePath && currentImagePath !== result.storagePath) {
        invalidateUserImageSignedUrl(currentImagePath);
      }
      return { ok: true, imagePath: result.storagePath, staleRemovalFailed: result.staleRemovalFailed };
    }

    // 新規画像を選んでいる場合: 圧縮 → アップロード → DB 更新（差し替え時は旧 object を削除）。
    if (recipeImageFile) {
      let compressed;
      try {
        compressed = await compressRecipeImageFile(recipeImageFile);
      } catch {
        return { ok: false, error: "原因: 選んだ画像を処理できませんでした。影響: 画像は登録されません（レシピ本文は保存済み）。修正方法: 別の画像ファイルを選び直してください。" };
      }

      const result = await uploadRecipeImage(supabase, {
        userId,
        recipeId,
        compressed,
        previousPath: currentImagePath
      });
      if (!result.ok) {
        return { ok: false, error: `${result.error}（レシピ本文は保存済みです）` };
      }
      if (currentImagePath && currentImagePath !== result.storagePath) {
        invalidateUserImageSignedUrl(currentImagePath);
      }
      return { ok: true, imagePath: result.storagePath, staleRemovalFailed: result.staleRemovalFailed };
    }

    // 既存画像の削除を予約していた場合: DB を null に戻し、Storage object を削除する。
    if (recipeImageRemoved && currentImagePath) {
      const result = await deleteRecipeImage(supabase, { userId, recipeId, storagePath: currentImagePath });
      if (!result.ok) {
        return { ok: false, error: `${result.error}（レシピ本文は保存済みです）` };
      }
      invalidateUserImageSignedUrl(currentImagePath);
      return { ok: true, imagePath: null, staleRemovalFailed: result.staleRemovalFailed };
    }

    const sourceYoutubeVideoId = findFirstYoutubeVideoId(source);
    const shouldReplaceWithYoutubeThumbnail =
      Boolean(sourceYoutubeVideoId) && (!currentImagePath || youtubeThumbnailReplacementVideoId === sourceYoutubeVideoId);
    const youtubeVideoId = !recipeImageRemoved && shouldReplaceWithYoutubeThumbnail ? sourceYoutubeVideoId : null;
    const youtubeThumbnailReady = youtubeThumbnailStatus?.status === "ready" && youtubeThumbnailStatus.videoId === youtubeVideoId;
    if (youtubeVideoId) {
      if (youtubeThumbnailDismissedVideoId === youtubeVideoId || !youtubeThumbnailReady) {
        return { ok: true, imagePath: currentImagePath, staleRemovalFailed: false };
      }
      const result = await setRecipeImageFromYoutubeThumbnail(supabase, {
        userId,
        recipeId,
        videoId: youtubeVideoId,
        previousPath: currentImagePath,
        fetcher: (_url, init) => fetch(`/api/youtube/thumbnail?videoId=${encodeURIComponent(youtubeVideoId)}`, init)
      });
      if (!result.ok) {
        return {
          ok: true,
          imagePath: currentImagePath,
          staleRemovalFailed: false,
          warning: `${result.error} レシピ本文と材料は保存済みです。`
        };
      }
      return { ok: true, imagePath: result.storagePath, staleRemovalFailed: result.staleRemovalFailed };
    }

    // 画像に変更なし。
    return { ok: true, imagePath: currentImagePath, staleRemovalFailed: false };
  }

  // 戻り値: 登録に成功したら作成された献立の id（string）、失敗時は null。
  // 既存呼び出し（saveSchedule / pickerSlot からの replace 以外の登録）は戻り値を無視するため非破壊。
  async function addScheduleEntry(date: string, meal: MealType, recipeId: string): Promise<string | null> {
    const recipe = recipes.find((item) => item.id === recipeId);
    if (!date || !recipe) {
      setFeedback({
        tone: "error",
        message: "原因: 日付またはレシピが未選択です。影響: 献立を保存できません。修正方法: 日付とレシピを選んでください。"
      });
      return null;
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
      return null;
    }

    setMealSchedules((items) => [data as MealSchedule, ...items]);
    setSelectedScheduleId(String(data.id));
    if (!scheduleDays.includes(String(data.scheduled_on))) {
      setScheduleWindowStart(String(data.scheduled_on));
    }
    setPickerSlot(null);
    // レシピ画面からのスケジュール追加モーダルも、登録成功時はここで閉じる。
    setScheduleAddRecipeId(null);
    setScheduleAddSelectedDate(null);
    setFeedback({ tone: "success", message: "献立に追加しました。" });
    return String(data.id);
  }

  // レシピ画面（詳細ヘッダー／各カード）からスケジュール追加モーダルを開く。日付選択ステップから始める。
  function openScheduleAddModal(recipeId: string) {
    setScheduleAddRecipeId(recipeId);
    setScheduleAddSelectedDate(null);
  }

  function closeScheduleAddModal() {
    setScheduleAddRecipeId(null);
    setScheduleAddSelectedDate(null);
  }

  // 登録成立後の在庫不足チェック。不足があれば既存の不足選択モーダルを開く（新規DB導線は作らない）。
  // レシピ起点フロー（assignScheduleFromRecipe）とスケジュール「＋」の新規追加（addScheduleFromPicker）で共有する。
  // scheduleId は紐づくスケジュール id。買い物 INSERT 時に meal_schedule_id として保存する。
  function openShortageModalForScheduledRecipe(recipeId: string, scheduleId: string) {
    const recipe = recipes.find((item) => item.id === recipeId);
    if (!recipe) return;
    // 既存の在庫比較・不足選択モーダルをそのまま再利用する。
    const shortages = compareRecipeWithInventory(recipe, inventoryItemsForMeals);
    if (shortages.length === 0) return;
    setShortageSelectionItems(shortages);
    setShortageSelectionRecipeName(recipe.name);
    setShortageSelectionTab("all");
    setShortageSelectionScheduleId(scheduleId);
  }

  // 食事タイプ選択で登録を確定する。登録は既存 addScheduleEntry を再利用する（テーブル直叩きしない）。
  async function assignScheduleFromRecipe(meal: MealType) {
    if (!scheduleAddRecipeId || !scheduleAddSelectedDate) return;
    // addScheduleEntry が成功時に scheduleAddRecipeId を null にするため、先に控える。
    const recipeId = scheduleAddRecipeId;
    const scheduleId = await addScheduleEntry(scheduleAddSelectedDate, meal, recipeId);
    // 登録が成立した場合のみ在庫不足を確認する。登録の成否と買い物追加は独立。
    if (!scheduleId) return;
    openShortageModalForScheduledRecipe(recipeId, scheduleId);
  }

  // スケジュール「＋」のレシピ選択（新規追加）からの確定。登録成立後にレシピ起点と同じ不足チェックを通す。
  async function addScheduleFromPicker(date: string, meal: MealType, recipeId: string) {
    const scheduleId = await addScheduleEntry(date, meal, recipeId);
    if (!scheduleId) return;
    openShortageModalForScheduledRecipe(recipeId, scheduleId);
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
    router.refresh();
  }

  // お気に入りの切替（TKT-0167）。moveScheduleToSlot 同様、まず画面を即時反転（楽観的更新）し、
  // 保存はバックグラウンド。失敗時は前状態へロールバックし、レイアウトを動かさないトーストで通知する。
  // is_favorite はトグル専用更新にして、既存の saveRecipe payload には含めない（責務分離）。
  async function toggleRecipeFavorite(recipe: Recipe) {
    const previousRecipes = recipes;
    const nextFavorite = !recipe.is_favorite;
    setRecipes((items) => items.map((item) => (item.id === recipe.id ? { ...item, is_favorite: nextFavorite } : item)));

    const { error } = await supabase
      .from("recipes")
      .update({ is_favorite: nextFavorite })
      .eq("id", recipe.id)
      .eq("user_id", userId);

    if (error) {
      setRecipes(previousRecipes);
      showToast("お気に入りを更新できませんでした。ログイン状態を確認してください。", "error");
    }
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

  // レシピ選択モーダルを開く。picker 専用状態は毎回初期値へリセットし、レシピ一覧側状態と独立させる。
  function openPicker(slot: { date: string; meal: MealType; replaceId?: string }) {
    setPickerSearch("");
    setPickerSearchLogic("and");
    setPickerSearchMode("name");
    setPickerSort("created_desc");
    setPickerFavoriteOnly(false);
    setPickerSlot(slot);
  }

  // Canvas版 changeScheduleSlotRecipe 相当: ピッカーを開いてレシピを差し替える。
  function startSlotRecipeChange(schedule: MealSchedule) {
    setSlotMenuId(null);
    openPicker({ date: schedule.scheduled_on, meal: schedule.meal_type, replaceId: schedule.id });
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
    showToast(`献立を ${recipe.name} に変更しました。`, "success");
  }

  async function deleteSchedule(schedule: MealSchedule) {
    setIsSaving(true);
    setFeedback(null);

    let rollbackUpdates: ReturnType<typeof computeRollbackQuantityUpdates> = [];
    if (schedule.status === "完了") {
      const rollbackResult = await rollbackCompletedSchedule(schedule);
      if (!rollbackResult.ok) {
        setIsSaving(false);
        setFeedback({ tone: "error", message: rollbackResult.message });
        return;
      }
      rollbackUpdates = rollbackResult.updates;
    }

    // この予定に紐づく未購入の買い物リスト項目を、スケジュール削除より前に明示削除する。
    // FK は on delete set null（meal_schedule_id）のため、先に予定を消すと紐付けが失われる。順序厳守。
    const { data: removedShopping, error: shoppingError } = await supabase
      .from("shopping_items")
      .delete()
      .eq("meal_schedule_id", schedule.id)
      .eq("user_id", userId)
      .eq("status", "未購入")
      .select("id");

    if (shoppingError) {
      setIsSaving(false);
      setFeedback({
        tone: "error",
        message: "原因: 関連する買い物リスト項目を削除できませんでした。影響: 献立は削除していません。修正方法: ログイン状態を確認して再度お試しください。"
      });
      return;
    }

    const removedShoppingCount = removedShopping?.length ?? 0;

    const { error } = await supabase.from("meal_schedules").delete().eq("id", schedule.id).eq("user_id", userId);

    setIsSaving(false);

    if (error) {
      setFeedback({ tone: "error", message: "原因: 献立を削除できませんでした。影響: 予定が残ります。修正方法: ログイン状態を確認してください。" });
      return;
    }

    setMealSchedules((items) => items.filter((item) => item.id !== schedule.id));
    // ロールバックで在庫を戻す。戻した結果 quantity>0 になった item を追加するため refetch が必要だが、
    // 現ストアに存在しない item（quantity=0 で除外済み）は map で更新できない。
    // ロールバック対象は completeSchedule 時に除外された item のため、ここでは再追加のために rollbackUpdates から合成する。
    setInventoryItemsForMeals((items) => {
      const updated = items.map((item) => {
        const update = rollbackUpdates.find((entry) => entry.id === item.id);
        return update ? { ...item, quantity: update.nextQuantity, ...archiveFieldsForCookingQuantity(update.nextQuantity) } : item;
      });
      // ストアに存在しない item（消費で quantity=0 になりフィルタ済み）は rollbackUpdates の stockItem から補完できないため refetch で最新化。
      // rollbackUpdates に id があっても items に存在しない場合は void refetch を非同期で発火する（UI を止めない）。
      const missingIds = rollbackUpdates.filter((u) => !items.some((item) => item.id === u.id));
      if (missingIds.length > 0) {
        // ストアから欠けた item があれば refetch して最新データを取得する（非同期・エラーは無視）。
        supabase
          .from("inventory_items")
          .select("*")
          .eq("user_id", userId)
          .is("archived_at", null)
          .gt("quantity", 0)
          .order("created_at", { ascending: false })
          .then(({ data }) => {
            if (data) setInventoryItemsForMeals(data as StockItem[]);
          });
      }
      return updated.filter((item) => item.quantity > 0);
    });
    if (selectedScheduleId === schedule.id) {
      const nextSchedule = mealSchedules.find((item) => item.id !== schedule.id);
      setSelectedScheduleId(nextSchedule?.id ?? "");
    }
    // 削除した買い物リスト項目を共有ストアから除去し、他ボードへリロードなしで反映する（TKT-0244）。
    if (removedShoppingCount > 0) {
      const removedIds = new Set(removedShopping?.map((item) => item.id) ?? []);
      setShoppingItems((items) => items.filter((item) => !removedIds.has(item.id)));
    }
    void refetch(userId);
    const baseMessage = `${schedule.recipe_name || "献立"} を献立から削除しました。`;
    const shoppingMessage = removedShoppingCount > 0 ? ` 関連する未購入の買い物リスト ${removedShoppingCount}件も削除しました。` : "";
    setFeedback({ tone: "info", message: baseMessage + shoppingMessage });
  }

  async function rollbackCompletedSchedule(schedule: MealSchedule): Promise<{ message: string; ok: false } | { ok: true; updates: ReturnType<typeof computeRollbackQuantityUpdates> }> {
    const { data: events, error: eventsError } = await supabase
      .from("cooking_consumption_events")
      .select("stock_item_id, consumed_amount")
      .eq("meal_schedule_id", schedule.id)
      .eq("user_id", userId);

    if (eventsError || !events) {
      return {
        ok: false,
        message: "原因: 消費記録を確認できませんでした。影響: 在庫を戻せないため処理を中止しました。修正方法: ログイン状態を確認し、再読込してからもう一度お試しください。"
      };
    }

    const updates = computeRollbackQuantityUpdates(events as RollbackConsumptionEvent[], inventoryItemsForMeals).filter((update) => !update.missing);
    for (const update of updates) {
      const { error: inventoryError } = await supabase
        .from("inventory_items")
        .update({
          quantity: update.nextQuantity,
          ...archiveFieldsForCookingQuantity(update.nextQuantity)
        })
        .eq("id", update.id)
        .eq("user_id", userId);

      if (inventoryError) {
        return {
          ok: false,
          message: "原因: 在庫を戻せませんでした。影響: 完了解除または削除を中止しました。修正方法: 再読込して在庫状態を確認してからもう一度お試しください。"
        };
      }
    }

    const { error: consumptionDeleteError } = await supabase
      .from("cooking_consumption_events")
      .delete()
      .eq("meal_schedule_id", schedule.id)
      .eq("user_id", userId);
    if (consumptionDeleteError) {
      return {
        ok: false,
        message: "原因: 消費記録を削除できませんでした。影響: 在庫を戻した後の整理が止まりました。修正方法: 再読込して料理履歴を確認してください。"
      };
    }

    const { error: historyDeleteError } = await supabase.from("cooking_history").delete().eq("meal_schedule_id", schedule.id).eq("user_id", userId);
    if (historyDeleteError) {
      return {
        ok: false,
        message: "原因: 料理履歴を削除できませんでした。影響: 献立の完了状態はまだ変更していません。修正方法: 再読込して料理履歴を確認してください。"
      };
    }

    return { ok: true, updates };
  }

  async function uncompleteSchedule(schedule: MealSchedule) {
    if (schedule.status !== "完了") {
      setFeedback({ tone: "info", message: "この献立は未完了です。" });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const rollbackResult = await rollbackCompletedSchedule(schedule);
    if (!rollbackResult.ok) {
      setIsSaving(false);
      setFeedback({ tone: "error", message: rollbackResult.message });
      return;
    }

    const { data, error } = await supabase
      .from("meal_schedules")
      .update({ status: "未完了", completed_at: null })
      .eq("id", schedule.id)
      .eq("user_id", userId)
      .select()
      .single();

    setIsSaving(false);

    if (error || !data) {
      setFeedback({
        tone: "error",
        message: "原因: 献立を未完了に戻せませんでした。影響: 在庫と履歴の巻き戻し後に表示状態だけが残る可能性があります。修正方法: 再読込して状態を確認してください。"
      });
      return;
    }

    setMealSchedules((items) => items.map((item) => (item.id === schedule.id ? (data as MealSchedule) : item)));
    // ロールバックで在庫を戻す。quantity=0 でストアから除外済みの item は再追加が必要なため refetch 発火。
    setInventoryItemsForMeals((items) => {
      const updated = items.map((item) => {
        const update = rollbackResult.updates.find((entry) => entry.id === item.id);
        return update ? { ...item, quantity: update.nextQuantity, ...archiveFieldsForCookingQuantity(update.nextQuantity) } : item;
      });
      const missingIds = rollbackResult.updates.filter((u) => !items.some((item) => item.id === u.id));
      if (missingIds.length > 0) {
        supabase
          .from("inventory_items")
          .select("*")
          .eq("user_id", userId)
          .is("archived_at", null)
          .gt("quantity", 0)
          .order("created_at", { ascending: false })
          .then(({ data: freshData }) => {
            if (freshData) setInventoryItemsForMeals(freshData as StockItem[]);
          });
      }
      return updated.filter((item) => item.quantity > 0);
    });
    void refetch(userId);
    showToast(`${schedule.recipe_name || "献立"} の完了を取り消し、在庫を戻しました。`, "success");
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
    // レシピ詳細からの買い物追加はスケジュール起点ではないため、紐付けを持たせない。
    setShortageSelectionScheduleId(null);
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
          source_type: "recipe_detail",
          // スケジュール起点で開いた場合のみ紐付け。レシピ詳細起点や手動は null。
          meal_schedule_id: shortageSelectionScheduleId
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
    // 共有ストアへ買い物リストを反映させ、他ボード（在庫）へリロードなしで同期する（TKT-0244）。
    setShoppingItems((items) => [...(data as ShoppingItem[]), ...items]);
    // 必要に応じて他の mutation との整合性チェック用に非同期リフレッシュも開始（オプション）。
    
  }

  function moveCookingStep(draggedId: string, targetKind: CookingStepKind, targetIndex: number) {
    if (!cookingStepDrafts.some((item) => item.id === draggedId)) return;
    pushCookingReorderUndo();
    setCookingStepDrafts((current) => {
      const dragged = current.find((item) => item.id === draggedId);
      if (!dragged) return current;
      const remaining = current.filter((item) => item.id !== draggedId);
      const prepSteps = remaining.filter((item) => item.kind === "prep_steps");
      const cookSteps = remaining.filter((item) => item.kind === "steps");
      const moved = { ...dragged, kind: targetKind };
      const targetList = targetKind === "prep_steps" ? prepSteps : cookSteps;
      const insertIndex = Math.max(0, Math.min(targetIndex, targetList.length));
      targetList.splice(insertIndex, 0, moved);
      return [...prepSteps, ...cookSteps];
    });
  }

  function moveCookingIngredient(
    draggedId: string,
    targetType: "食材" | "調味料",
    targetIndex: number,
    // 移動先のサブグループ group_index。ドロップ先の隣接行/グループから引き継ぐ（未指定＝未グループ）。
    targetGroupIndex = 0
  ) {
    if (!cookingIngredientDrafts.some((item) => item.ingredient.id === draggedId)) return;
    pushCookingReorderUndo();
    setCookingIngredientDrafts((current) => {
      const dragged = current.find((item) => item.ingredient.id === draggedId);
      if (!dragged) return current;
      const remaining = current.filter((item) => item.ingredient.id !== draggedId);
      const foods = remaining.filter((item) => item.ingredient.item_type === "食材");
      const seasonings = remaining.filter((item) => item.ingredient.item_type === "調味料");
      const moved: CookingIngredientDraft = {
        ingredient: { ...dragged.ingredient, item_type: targetType, group_index: targetGroupIndex }
      };
      const targetList = targetType === "食材" ? foods : seasonings;
      const insertIndex = Math.max(0, Math.min(targetIndex, targetList.length));
      targetList.splice(insertIndex, 0, moved);
      return [...foods, ...seasonings];
    });
  }

  // 行クリックでサブグルーピング選択をトグルする。修飾キー(Cmd/Ctrl)で複数選択。
  // 選択は同一 item_type 内に限定（別 item_type の行を足すと選択を切り替える）。
  function toggleCookingIngredientSelection(ingredient: RecipeIngredient, additive: boolean) {
    const id = ingredient.id;
    setCookingSelectedIngredientIds((current) => {
      if (!additive) {
        return current.length === 1 && current[0] === id ? [] : [id];
      }
      if (current.length > 0) {
        const firstType = cookingIngredientDrafts.find((draft) => draft.ingredient.id === current[0])?.ingredient.item_type;
        if (firstType && firstType !== ingredient.item_type) {
          return [id];
        }
      }
      return current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
    });
  }

  // 同一 item_type の foods/seasonings 一覧だけを差し替える純粋ヘルパー。
  function regroupCookingDrafts(
    current: CookingIngredientDraft[],
    tone: "食材" | "調味料",
    mutate: (list: Array<CookingIngredientDraft & SubgroupItem>) => Array<CookingIngredientDraft & SubgroupItem>
  ): CookingIngredientDraft[] {
    const keyed = current.map((draft) => ({ ...draft, item_type: draft.ingredient.item_type, group_index: draft.ingredient.group_index ?? 0 }));
    return replaceSubgroupList(keyed, tone, mutate).map((draft) => ({ ingredient: draft.ingredient }));
  }

  // 選択中の行を同一 item_type 内で1サブグループにまとめる。未使用の最小 group_index を割り当て、
  // 表示が崩れないよう選択行を先頭出現位置にまとめて連続させる。
  function groupSelectedCookingIngredients(tone: "食材" | "調味料") {
    const ids = cookingSelectedIngredientIds;
    if (ids.length < 2) return;
    pushCookingReorderUndo();
    setCookingIngredientDrafts((current) =>
      regroupCookingDrafts(current, tone, (list) =>
        groupSubgroupItems(
          list,
          ids,
          (draft) => draft.ingredient.id,
          (draft, groupIndex) => ({ ...draft, group_index: groupIndex, ingredient: { ...draft.ingredient, group_index: groupIndex } })
        )
      )
    );
    setCookingSelectedIngredientIds([]);
  }

  // 指定 id 群の group_index を 0 に戻し、未グループの末尾へ寄せる（サブグループの連続性を保つ）。
  function clearCookingIngredientGroup(tone: "食材" | "調味料", ids: string[]) {
    if (ids.length === 0) return;
    pushCookingReorderUndo();
    setCookingIngredientDrafts((current) =>
      regroupCookingDrafts(current, tone, (list) =>
        clearSubgroupItems(
          list,
          ids,
          (draft) => draft.ingredient.id,
          (draft, groupIndex) => ({ ...draft, group_index: groupIndex, ingredient: { ...draft.ingredient, group_index: groupIndex } })
        )
      )
    );
    setCookingSelectedIngredientIds((current) => current.filter((id) => !ids.includes(id)));
  }

  // ラベル隣「グループ解除」: 選択中の行を解除する。
  function ungroupSelectedCookingIngredients(tone: "食材" | "調味料") {
    const grouped = cookingIngredientDrafts
      .filter((draft) => cookingSelectedIngredientIds.includes(draft.ingredient.id))
      .filter((draft) => (draft.ingredient.group_index ?? 0) > 0)
      .map((draft) => draft.ingredient.id);
    clearCookingIngredientGroup(tone, grouped);
  }

  // サブグループ見出し「解除」: そのグループ(group_index)の全行を解除する。
  function ungroupCookingSubgroup(tone: "食材" | "調味料", groupIndex: number) {
    const ids = cookingIngredientDrafts
      .filter((draft) => draft.ingredient.item_type === tone && (draft.ingredient.group_index ?? 0) === groupIndex)
      .map((draft) => draft.ingredient.id);
    clearCookingIngredientGroup(tone, ids);
  }

  function currentCookingReorderSnapshot(): CookingReorderSnapshot {
    return cloneCookingReorderSnapshot({
      ingredients: cookingIngredientDrafts,
      steps: cookingStepDrafts
    });
  }

  function pushCookingReorderUndo() {
    const snapshot = currentCookingReorderSnapshot();
    setCookingReorderUndoStack((current) => [...current.slice(-19), snapshot]);
    setCookingReorderRedoStack([]);
  }

  function undoCookingReorder() {
    const previous = cookingReorderUndoStack.at(-1);
    if (!previous) return;
    const current = currentCookingReorderSnapshot();
    setCookingReorderUndoStack((items) => items.slice(0, -1));
    setCookingReorderRedoStack((items) => [...items.slice(-19), current]);
    const restored = cloneCookingReorderSnapshot(previous);
    setCookingStepDrafts(restored.steps);
    setCookingIngredientDrafts(restored.ingredients);
    setCookingSelectedIngredientIds([]);
  }

  function redoCookingReorder() {
    const next = cookingReorderRedoStack.at(-1);
    if (!next) return;
    const current = currentCookingReorderSnapshot();
    setCookingReorderRedoStack((items) => items.slice(0, -1));
    setCookingReorderUndoStack((items) => [...items.slice(-19), current]);
    const restored = cloneCookingReorderSnapshot(next);
    setCookingStepDrafts(restored.steps);
    setCookingIngredientDrafts(restored.ingredients);
    setCookingSelectedIngredientIds([]);
  }

  async function saveCookingReorder(recipe: Recipe): Promise<boolean> {
    if (!hasCookingReorderChanges) {
      showToast("並び替えの変更はありません。", "info");
      return true;
    }

    const nextSteps = splitCookingStepDrafts(cookingStepDrafts);
    const nextIngredients = cookingIngredientDrafts.map((draft, index) => ({ ...draft.ingredient, sort_order: index }));
    setIsSaving(true);
    setFeedback(null);

    let savedRecipe: Omit<Recipe, "ingredients"> | null = null;

    if (hasCookingStepOrderChanges) {
      const { data, error } = await supabase
        .from("recipes")
        .update({
          prep_steps: nextSteps.prep_steps,
          steps: nextSteps.steps
        })
        .eq("id", recipe.id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error || !data) {
        setIsSaving(false);
        setFeedback({
          tone: "error",
          message: "原因: 手順の並び替えを保存できませんでした。影響: レシピ本体の順番はまだ変わっていません。修正方法: ログイン状態を確認して、もう一度保存してください。"
        });
        return false;
      }

      savedRecipe = data as Omit<Recipe, "ingredients">;
    }

    if (hasCookingIngredientOrderChanges) {
      for (const ingredient of nextIngredients) {
        const { error } = await supabase
          .from("recipe_ingredients")
          .update({
            item_type: ingredient.item_type,
            sort_order: ingredient.sort_order,
            group_index: ingredient.group_index
          })
          .eq("id", ingredient.id)
          .eq("recipe_id", recipe.id)
          .eq("user_id", userId);

        if (error) {
          setIsSaving(false);
          setFeedback({
            tone: "error",
            message: "原因: 材料の並び替えを保存できませんでした。影響: レシピ本体の材料順はまだ変わっていません。修正方法: ログイン状態を確認して、もう一度保存してください。"
          });
          return false;
        }
      }
    }

    setIsSaving(false);

    setRecipes((items) =>
      items.map((item) =>
        item.id === recipe.id
          ? {
              ...item,
              ingredients: hasCookingIngredientOrderChanges ? nextIngredients : item.ingredients,
              prep_steps: savedRecipe?.prep_steps ?? item.prep_steps,
              steps: savedRecipe?.steps ?? item.steps,
              updated_at: savedRecipe?.updated_at ?? item.updated_at
            }
          : item
      )
    );
    setCookingStepDrafts((current) =>
      current.map((draft, index) => ({
        ...draft,
        id: `${recipe.id}-${draft.kind === "prep_steps" ? "prep" : "cook"}-${index}-${draft.text}`
      }))
    );
    setCookingIngredientDrafts(nextIngredients.map((ingredient) => ({ ingredient })));
    setCookingSelectedIngredientIds([]);
    setCookingReorderUndoStack([]);
    setCookingReorderRedoStack([]);
    showToast("並び替えを保存しました。", "success");
    router.refresh();
    return true;
  }

  async function completeAfterSavingCookingReorder(schedule: MealSchedule, recipe: Recipe) {
    const saved = await saveCookingReorder(recipe);
    if (saved) {
      await completeSchedule(schedule);
    }
  }

  // 「並び替えを確定」はレシピ本体を上書きするため、保存前に確認を挟む。
  // 確認パターンは調理完了前確認と同じ requestDelete / DeleteConfirmPanel を流用する。
  function requestSaveCookingReorder(recipe: Recipe) {
    if (!hasCookingReorderChanges) return;
    requestDelete(
      recipe.name,
      "レシピ本体の材料・手順の並びを、この順番で上書きします。よろしいですか？",
      () => {
        void saveCookingReorder(recipe);
      },
      { confirmLabel: "並びを確定", title: "並び替え確認", tone: "default" }
    );
  }

  function requestCompleteSchedule(schedule: MealSchedule, recipe: Recipe) {
    if (!hasCookingReorderChanges) {
      void completeSchedule(schedule);
      return;
    }

    requestDelete(
      recipe.name,
      "並び替えがまだ保存されていません。並び替えを保存してから調理完了へ進みますか？",
      () => {
        void completeAfterSavingCookingReorder(schedule, recipe);
      },
      { confirmLabel: "保存して完了", title: "並び替え確認", tone: "default" }
    );
  }

  async function completeSchedule(schedule: MealSchedule) {
    if (schedule.status === "完了") {
      setFeedback({ tone: "info", message: "この献立は完了済みです。" });
      return;
    }

    if (pendingConsumptionScheduleId !== schedule.id) {
      // 取得中の再入を防ぐ（二重タップ対策）。
      if (isOpeningConsumption) return;
      setIsOpeningConsumption(true);

      // ダイアログを開く瞬間に在庫を再取得し、共有ストアへ即時反映する（食材管理での追加・補充を自動マッチングへ反映）。
      // 取得結果（fresh）をローカル変数のまま buildConsumptionDrafts に渡す（setState の反映待ちに依存しない stale-read 回避）。
      // fetchFreshInventoryForMeals 内で setInventoryItemsForMeals(fresh) を呼ぶため、在庫一覧タブ切替でも即時反映される。
      // 取得失敗時は既存スナップショットでフォールバックし、操作はブロックしない。
      const fresh = await fetchFreshInventoryForMeals();
      const inventoryForDrafts = fresh ?? inventoryItemsForMeals;

      setPendingConsumptionScheduleId(schedule.id);
      setConsumptionDrafts(buildConsumptionDrafts(schedule, inventoryForDrafts));
      setConsumptionTab("all");
      resetCookingRecordDraft();
      setSelectedScheduleId(schedule.id);
      setFeedback({ tone: "info", message: "消費量を確認してから「確定」を押してください。" });
      setIsOpeningConsumption(false);
      return;
    }

    const normalizedDrafts = consumptionDrafts.map((draft) => ({
      ...draft,
      consumedAmount: quantityToNumber(draft.amount)
    }));
    const invalidDraft = normalizedDrafts.find((draft) => draft.stockItemId && (!Number.isFinite(draft.consumedAmount) || draft.consumedAmount < 0));
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
      // consumedStockAmount: 在庫単位へ換算した減算量（DB保存・在庫減算・rollback の基準）。
      // converted: consumeUnit ≠ 在庫単位 で換算消費したか（残量の分数表示判定に使う）。
      consumedStockAmount: number;
      converted: boolean;
      draft: ConsumptionDraft & { consumedAmount: number };
      nextQuantity: number;
      stockItem: StockItem;
    }> = [];
    let conversionErrorDraft: (typeof normalizedDrafts)[number] | undefined;
    for (const draft of normalizedDrafts) {
      if (!draft.stockItemId || draft.consumedAmount === 0) continue;
      const stockItem = inventoryItemsForMeals.find((item) => item.id === draft.stockItemId);
      if (!stockItem) continue;
      const consumeUnit = draft.consumeUnit || draft.requestedUnit;
      // consumeUnit（レシピ単位 or 在庫単位）の入力量を在庫単位の減算量へ換算する。同単位なら素通し。
      const result = resolveConsumedStockAmount(draft.consumedAmount, stockItem, consumeUnit);
      if (!result.ok) {
        conversionErrorDraft = draft;
        break;
      }
      consumedRows.push({
        consumedStockAmount: result.consumedStockAmount,
        converted: result.converted,
        draft,
        stockItem,
        nextQuantity: roundQuantity(Math.max(0, Number(stockItem.quantity || 0) - result.consumedStockAmount))
      });
    }
    if (conversionErrorDraft) {
      setIsSaving(false);
      // 換算不可在庫を選んだまま consumeUnit がレシピ単位（在庫単位と不一致）で確定したケース。
      // レシピ単位の値を在庫単位に流用して誤減算しないよう、単位切替を促してブロックする。
      const blockedStock = inventoryItemsForMeals.find((item) => item.id === conversionErrorDraft?.stockItemId);
      const stockUnit = blockedStock?.unit ?? "在庫単位";
      const recipeUnit = conversionErrorDraft.requestedUnit;
      setFeedback({
        tone: "error",
        message: `原因: 在庫の単位（${stockUnit}）とレシピの単位（${recipeUnit}）が異なり換算できません。影響: 在庫を減算できません。修正方法: 消費量の単位を在庫の単位（${stockUnit}）へ切り替えてください。`
      });
      return;
    }

    for (const row of consumedRows) {
      const { error: inventoryError } = await supabase
        .from("inventory_items")
        .update({
          quantity: row.nextQuantity,
          ...archiveFieldsForCookingQuantity(row.nextQuantity)
        })
        .eq("id", row.stockItem.id)
        .eq("user_id", userId);

      if (inventoryError) {
        setIsSaving(false);
        setFeedback({ tone: "error", message: "原因: 在庫を減算できませんでした。影響: 調理完了と料理履歴の作成を中止しました。修正方法: ログイン状態と在庫データを確認してください。" });
        return;
      }

      // 減らすときに使った形式（分数 or 小数）を記憶し、在庫一覧の残量を同じ形式で表示する。
      // 換算消費（consumeUnit ≠ 在庫単位）時は入力表記が在庫単位の残量と一致しないため、
      // 在庫単位が分数許可なら fraction を優先する（例 残 3.5 → 「3 1/2」）。
      setQuantityNotation(
        row.stockItem.id,
        isFractionalUnit(row.stockItem.unit)
          ? row.converted
            ? "fraction"
            : detectNotation(row.draft.amount)
          : "decimal"
      );
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
          // consumed_* は在庫単位で保存する（rollback が quantity へ直接足し戻すため）。
          // 同単位ケースは従来と同値（consumedStockAmount === consumedAmount, stockItem.unit === requestedUnit）。
          consumed_amount: Math.max(0, row.consumedStockAmount),
          consumed_unit: row.stockItem.unit,
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
    if (selectedCookingPhotoCandidate) {
      const storagePath = buildCookingHistoryPhotoStoragePath(userId);
      const copyResult = await copyPhotoStorageObject(supabase, {
        contentType: selectedCookingPhotoCandidate.contentType,
        fromPath: selectedCookingPhotoCandidate.storagePath,
        toPath: storagePath
      });
      if (!copyResult.ok) {
        photoWarning = "過去の完成写真のコピーに失敗しました。料理履歴は写真なしで保存済みです。";
      } else {
        const { error: photoInsertError } = await supabase.from("photos").insert({
          user_id: userId,
          bucket_id: PHOTOS_BUCKET,
          storage_path: storagePath,
          usage_type: "cooking_history",
          cooking_history_id: String(historyData.id),
          content_type: selectedCookingPhotoCandidate.contentType,
          byte_size: selectedCookingPhotoCandidate.byteSize,
          width: selectedCookingPhotoCandidate.width,
          height: selectedCookingPhotoCandidate.height
        });

        if (photoInsertError) {
          await supabase.storage.from(PHOTOS_BUCKET).remove([storagePath]);
          photoWarning = "写真情報の保存に失敗しました。料理履歴は写真なしで保存済みです。";
        }
      }
    } else if (selectedCookingPhoto) {
      try {
        const compressed = await compressImageFile(selectedCookingPhoto);
        const storagePath = buildCookingHistoryPhotoStoragePath(userId);
        const { error: uploadError } = await supabase.storage.from(PHOTOS_BUCKET).upload(storagePath, compressed.blob, {
          contentType: compressed.contentType,
          cacheControl: "31536000",
          upsert: false
        });

        if (uploadError) {
          photoWarning = "写真の保存に失敗しました。料理履歴は写真なしで保存済みです。";
        } else {
          const { error: photoInsertError } = await supabase.from("photos").insert({
            user_id: userId,
            bucket_id: PHOTOS_BUCKET,
            storage_path: storagePath,
            usage_type: "cooking_history",
            cooking_history_id: String(historyData.id),
            content_type: compressed.contentType,
            byte_size: compressed.byteSize,
            width: compressed.width,
            height: compressed.height
          });

          if (photoInsertError) {
            await supabase.storage.from(PHOTOS_BUCKET).remove([storagePath]);
            photoWarning = "写真情報の保存に失敗しました。料理履歴は写真なしで保存済みです。";
          }
        }
      } catch {
        photoWarning = "写真の処理に失敗しました。料理履歴は写真なしで保存済みです。";
      }
    }

    setMealSchedules((items) => items.map((item) => (item.id === schedule.id ? (updatedSchedule as MealSchedule) : item)));
    // 在庫減算後に quantity<=0 になった item はストアから除外する（ストアは quantity>0 のみ保持の方針）。
    setInventoryItemsForMeals((items) =>
      items
        .map((item) => {
          const consumed = consumedRows.find((row) => row.stockItem.id === item.id);
          return consumed ? { ...item, quantity: consumed.nextQuantity, ...archiveFieldsForCookingQuantity(consumed.nextQuantity) } : item;
        })
        .filter((item) => item.quantity > 0)
    );
    setIsSaving(false);
    setPendingConsumptionScheduleId(null);
    setConsumptionDrafts([]);
    setConsumptionTab("all");
    resetCookingRecordDraft();
    setActiveCookingRecipeId("");
    setCookingScheduleId(null);
    void refetch(userId);
    showToast(photoWarning || `${schedule.recipe_name} を調理完了にしました。料理履歴にも記録済みです。`, photoWarning ? "error" : "success");
  }

  // 料理完成写真エリアのドラッグ&ドロップ＋クリックでアクティブ化してのCtrl+V貼り付け（クリック選択は従来どおり）。
  const cookingPhotoDrop = useImageFileDrop({ disabled: isSaving, onFiles: handleCookingPhotoDrop });

  const renderRecipeIngredientEditor = (
    label: "材料" | "調味料",
    tone: RecipeIngredientType,
    entries: { ingredient: RecipeIngredientFormValues; index: number }[],
    addButtonClassName = ""
  ) => {
    const rankMap = subgroupRankMapForItems(entries.map(({ ingredient }) => ingredient));
    const runs = subgroupRuns(entries.map(({ ingredient, index }) => ({ ...ingredient, index })));
    const selectedInTone = selectedRecipeIngredientEntries.filter(({ ingredient }) => ingredient.item_type === tone);
    const canGroup = selectedInTone.length >= 2;
    const canUngroup = selectedInTone.some(({ ingredient }) => (ingredient.group_index ?? 0) > 0);

    const renderRow = (ingredient: RecipeIngredientFormValues, index: number, sectionIndex: number) => {
      const isSelected = recipeSelectedIngredientKeys.includes(String(index));
      const dropGroupIndex = ingredient.group_index ?? 0;
      return (
        <div
          className="ingredient-row canvas-recipe-item-row"
          data-selected={isSelected}
          draggable
          key={`${tone}-${index}`}
          onClick={(event) => toggleRecipeIngredientSelection(index, ingredient, event.metaKey || event.ctrlKey)}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", String(index));
            event.currentTarget.classList.add("is-dragging");
          }}
          onDragEnd={(event) => event.currentTarget.classList.remove("is-dragging")}
          onDragOver={(event) => {
            event.preventDefault();
            event.currentTarget.classList.add("is-dragover");
          }}
          onDragLeave={(event) => event.currentTarget.classList.remove("is-dragover")}
          onDrop={(event) => {
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.classList.remove("is-dragover");
            const draggedIndex = Number.parseInt(event.dataTransfer.getData("text/plain"), 10);
            if (Number.isInteger(draggedIndex)) moveIngredient(draggedIndex, tone, sectionIndex, dropGroupIndex);
          }}
        >
          <span
            className="cooking-row-drag-handle recipe-row-drag-handle"
            aria-label={`${ingredient.name || label}をドラッグして並び替え`}
            role="img"
            onClick={(event) => event.stopPropagation()}
          >
            <span aria-hidden="true">☰</span>
          </span>
          <button
            className="recipe-row-select-target"
            type="button"
            aria-label={`${ingredient.name || label}を選択`}
            aria-pressed={isSelected}
            data-tooltip={`${ingredient.name || label}を選択`}
            data-tooltip-pos="right"
            onClick={(event) => {
              event.stopPropagation();
              toggleRecipeIngredientSelection(index, ingredient, event.metaKey || event.ctrlKey);
            }}
          >
            <span aria-hidden="true" />
          </button>
          <input
            aria-label="品名"
            value={ingredient.name}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => updateIngredient(index, { name: event.target.value, item_type: tone })}
            placeholder={tone === "食材" ? "品名" : "調味料名"}
          />
          <span onClick={(event) => event.stopPropagation()}>
            <NumberField
              ariaLabel="数量"
              placeholder="数量"
              showSteppers={false}
              value={ingredient.amount}
              onChange={(next) => updateIngredient(index, { amount: next, item_type: tone })}
              allowFraction={isFractionalUnit(ingredient.unit)}
            />
          </span>
          <span onClick={(event) => event.stopPropagation()}>
            <UnitPicker value={ingredient.unit} onSelect={(unit) => updateIngredient(index, { unit, item_type: tone })} />
          </span>
          <button
            className="danger-button compact-button"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              removeIngredientRow(index);
            }}
            aria-label={`${label}を削除`}
            data-tooltip={`${ingredient.name || label}を削除`}
            data-tooltip-pos="left"
          >
            ×
          </button>
        </div>
      );
    };

    return (
      <div
        className={`ingredient-editor${tone === "調味料" ? " seasoning-editor" : ""}`}
        aria-label={`${label}入力`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const draggedIndex = Number.parseInt(event.dataTransfer.getData("text/plain"), 10);
          if (Number.isInteger(draggedIndex)) moveIngredient(draggedIndex, tone, entries.length, 0);
        }}
      >
        <div className="ingredient-editor-heading">
          <div className="ingredient-editor-title-actions">
            <span>{label}</span>
            {canGroup ? (
              <button className="cooking-group-action" type="button" onClick={() => groupSelectedRecipeIngredients(tone)} data-tooltip="選択行をグループ化">
                グルーピング
              </button>
            ) : null}
            {canUngroup ? (
              <button className="cooking-group-action" data-variant="ungroup" type="button" onClick={() => ungroupSelectedRecipeIngredients(tone)} data-tooltip="選択グループを解除">
                グループ解除
              </button>
            ) : null}
          </div>
          <button className={`secondary-button compact-button${addButtonClassName}`} type="button" onClick={() => addIngredientRow(tone)} data-tooltip={`${label}を1行追加`}>
            ＋ {label}を追加
          </button>
        </div>
        {runs.map((run, runIndex) =>
          run.groupIndex > 0 ? (
            <div
              className="recipe-ing-subgroup cooking-ing-subgroup"
              data-tone={tone}
              key={`${tone}-group-${run.groupIndex}-${runIndex}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const draggedIndex = Number.parseInt(event.dataTransfer.getData("text/plain"), 10);
                const lastEntry = run.entries[run.entries.length - 1];
                if (Number.isInteger(draggedIndex)) moveIngredient(draggedIndex, tone, lastEntry.sectionIndex + 1, run.groupIndex);
              }}
            >
              <div className="cooking-ing-subgroup-head">
                <span className="cooking-ing-subgroup-label" data-tone={tone}>
                  {subgroupLabel(tone, rankMap.get(run.groupIndex) ?? 0)}
                </span>
                <button className="cooking-group-action" data-variant="ungroup" type="button" onClick={() => ungroupRecipeSubgroup(tone, run.groupIndex)} data-tooltip="このサブグループを解除">
                  解除
                </button>
              </div>
              {run.entries.map(({ item, sectionIndex }) => renderRow(item, item.index, sectionIndex))}
            </div>
          ) : (
            <Fragment key={`${tone}-ungrouped-${runIndex}`}>
              {run.entries.map(({ item, sectionIndex }) => renderRow(item, item.index, sectionIndex))}
            </Fragment>
          )
        )}
      </div>
    );
  };

  return (
    <section className="recipe-meal-workspace" aria-labelledby="recipe-meal-heading">
      {toast ? (
        <div className="app-toast" data-tone={toast.tone} role="status" aria-live="polite">
          {toast.message}
        </div>
      ) : null}

      {photoCandidatePickerTarget ? (
        <PhotoCandidatePicker
          candidates={cookingPhotoCandidates}
          error={cookingPhotoCandidatesError}
          loading={cookingPhotoCandidatesLoading}
          onClose={() => setPhotoCandidatePickerTarget(null)}
          onSelect={choosePhotoCandidate}
          title={photoCandidatePickerTarget === "recipe-image" ? "レシピ画像に使う完成写真" : "料理記録に使う完成写真"}
        />
      ) : null}

      {activeCookingRecipe ? (
        <div className="cooking-overlay" role="dialog" aria-modal="true" aria-label="調理ビューア全画面">
          <header className="cooking-overlay-header">
            <button className="cooking-overlay-back" type="button" onClick={closeCookingViewer} aria-label="戻る" data-tooltip="調理ビューを閉じる" data-tooltip-pos="bottom-right">←</button>
            <div className="cooking-overlay-title">
              <h2>{activeCookingRecipe.name}</h2>
              <RecipeSourceLinks source={activeCookingRecipe.source} />
            </div>
            <div className="cooking-overlay-header-actions">
              <button
                className="cooking-overlay-schedule"
                type="button"
                onClick={() => openScheduleAddModal(activeCookingRecipe.id)}
                aria-label="スケジュールに追加"
                data-tooltip="献立スケジュールに追加"
                data-tooltip-pos="bottom-left"
              >
                スケジュール追加
              </button>
              <button className="cooking-overlay-edit" type="button" onClick={() => editActiveCookingRecipe(activeCookingRecipe)} aria-label="このレシピを編集" data-tooltip="このレシピを編集" data-tooltip-pos="bottom-left">
                編集
              </button>
            </div>
          </header>

          <div className="cooking-overlay-body">
            <CookingViewer
              highlightedIngredientName={highlightedIngredientName}
              imageUrl={recipeImageUrls.get(activeCookingRecipe.id) ?? null}
              ingredientTab={cookingIngredientTab}
              ingredientDrafts={cookingIngredientDrafts}
              inventoryItems={inventoryItemsForMeals}
              isPhotoOpen={isCookingPhotoOpen}
              isReorderDirty={hasCookingReorderChanges}
              mediaTab={cookingMediaTab}
              onChangeMediaTab={setCookingMediaTab}
              onGroupSelected={groupSelectedCookingIngredients}
              onHighlightIngredient={setHighlightedIngredientName}
              onIngredientTabChange={setCookingIngredientTab}
              onMoveIngredient={moveCookingIngredient}
              onMoveStep={moveCookingStep}
              onStepTabChange={setCookingStepTab}
              onToggleIngredientSelection={toggleCookingIngredientSelection}
              onTogglePhoto={() => setIsCookingPhotoOpen((prev) => !prev)}
              onToggleStockCheck={() => setCookingStockCheck((value) => !value)}
              onUngroupSelected={ungroupSelectedCookingIngredients}
              onUngroupSubgroup={ungroupCookingSubgroup}
              recipe={activeCookingRecipe}
              selectedIngredientIds={cookingSelectedIngredientIds}
              stepDrafts={cookingStepDrafts}
              stepTab={cookingStepTab}
              stockCheck={cookingStockCheck}
            />
          </div>

          <footer className="cooking-overlay-footer">
            <div className="cooking-reorder-history-actions" aria-label="並び替え履歴操作">
              <button className="secondary-button" type="button" disabled={!canUndoCookingReorder || isSaving} onClick={undoCookingReorder} data-tooltip="並び替えを1つ戻す">
                Undo
              </button>
              <button className="secondary-button" type="button" disabled={!canRedoCookingReorder || isSaving} onClick={redoCookingReorder} data-tooltip="並び替えをやり直す">
                Redo
              </button>
            </div>
            <button
              className="secondary-button cooking-reorder-save-cta"
              type="button"
              disabled={isSaving || !hasCookingReorderChanges}
              onClick={() => requestSaveCookingReorder(activeCookingRecipe)}
              data-tooltip="材料・手順の並び替えを保存"
            >
              {hasCookingReorderChanges ? "並び替えを確定" : "並び替え保存済み"}
            </button>
            {cookingSchedule && cookingSchedule.recipe_id === activeCookingRecipe.id ? (
              <button
                className="primary-button cooking-complete-cta"
                type="button"
                disabled={isSaving || isOpeningConsumption || cookingSchedule.status === "完了"}
                onClick={() => requestCompleteSchedule(cookingSchedule, activeCookingRecipe)}
                data-tooltip={cookingSchedule.status === "完了" ? "調理は完了済みです" : "料理を完了して在庫を消費する"}
              >
                {cookingSchedule.status === "完了" ? "調理完了済み" : "料理を完了する"}
              </button>
            ) : null}
          </footer>
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
              data-tooltip="消費量モーダルを閉じる"
              data-tooltip-pos="bottom-left"
            >
              ×
            </button>
            <h3 id="consumption-heading">実際の消費量を調整</h3>
            <ConsumptionEditor
              drafts={consumptionDrafts}
              inventoryItems={inventoryItemsForMeals}
              onChange={updateConsumptionDraft}
              onBulkSet={setVisibleConsumptionAmount}
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
              <div
                className="cooking-photo-picker photo-drop-area"
                data-dragging-over={cookingPhotoDrop.isDraggingOver}
                data-active={cookingPhotoDrop.isActive}
                aria-label="完成写真"
                {...cookingPhotoDrop.dragHandlers}
                {...cookingPhotoDrop.pasteAreaProps}
              >
                <small className="photo-paste-hint" data-active={cookingPhotoDrop.isActive} aria-live="polite">
                  {cookingPhotoDrop.isActive ? "クリップボードから貼り付け可（Ctrl+V）" : "クリックすると Ctrl+V で貼り付けできます"}
                </small>
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
                <button
                  className="secondary-button compact-button"
                  type="button"
                  disabled={isSaving}
                  onClick={() => setPhotoCandidatePickerTarget("cooking-photo")}
                  data-tooltip="過去の完成写真から選ぶ"
                >
                  過去の完成写真から選ぶ
                </button>
                {cookingPhotoPreviewUrl || selectedCookingPhotoCandidate?.signedUrl ? (
                  <div className="photo-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt="完成写真のプレビュー" src={cookingPhotoPreviewUrl ?? selectedCookingPhotoCandidate?.signedUrl ?? ""} />
                  </div>
                ) : (
                  <p className="photo-empty">写真なしでも完了できます。</p>
                )}
                {selectedCookingPhoto || selectedCookingPhotoCandidate ? (
                  <button className="secondary-button compact-button" type="button" onClick={resetCookingPhoto} disabled={isSaving} data-tooltip="選択した写真を外す">
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
                    data-tooltip={`評価 ${value}`}
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
              <button className="secondary-button" type="button" onClick={closeConsumptionModal} data-tooltip="消費を確定せずに閉じる">
                キャンセル
              </button>
              <button className="primary-button consumption-confirm" type="button" disabled={isSaving} onClick={() => completeSchedule(cookingSchedule)} data-tooltip="消費量を確定して料理完了にする">
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
        <button className="secondary-button compact-button" data-tab="recipes" data-active={activeView === "recipes"} type="button" onClick={() => switchRecipeView("recipes")} data-tooltip="レシピ一覧を表示">
          レシピ集
        </button>
        <button className="secondary-button compact-button" data-tab="schedule" data-active={activeView === "schedule"} type="button" onClick={() => switchRecipeView("schedule")} data-tooltip="献立スケジュールを表示">
          スケジュール
        </button>
      </div>

      {activeView === "recipes" ? (
        <div className="recipe-primary-actions" aria-label="レシピ追加">
          <button className="primary-button" type="button" onClick={openNewRecipeEditor} data-tooltip="新しいレシピを作成">+ 新規レシピ</button>
          <button className="secondary-button recipe-text-button" type="button" onClick={() => {
            setAiSourceText("");
            setIsTextImportOpen(true);
          }} data-tooltip="テキストからAIでレシピを構造化">テキストから追加</button>
          <button className="secondary-button recipe-ai-button" type="button" onClick={() => setIsAiMenuOpen(true)} data-tooltip="AIにレシピを考案してもらう">AI考案</button>
        </div>
      ) : null}

      {feedback && feedback.tone !== "error" ? (
        <p className="sr-only" role="status">
          {feedback.message}
        </p>
      ) : null}

      {pendingAiRecipeRetry ? (
        <section className="ai-fallback-panel" aria-label="Gemini API再実行">
          <p>無料APIでエラーになりました。同じ内容で再実行できます。</p>
          <small>有料APIキーを使用します。Google側で料金が発生する可能性があります。</small>
          <div className="ai-fallback-actions">
            <button className="secondary-button" type="button" disabled={isAiRunning || recipeLimitReached} onClick={() => retryAiRecipe("free")}>
              無料APIで再試行
            </button>
            <button className="primary-button" type="button" disabled={isAiRunning || recipeLimitReached} onClick={() => retryAiRecipe("paid")}>
              有料APIで続行
            </button>
            <button className="secondary-button" type="button" disabled={isAiRunning} onClick={cancelAiRecipeRetry}>
              キャンセル
            </button>
          </div>
        </section>
      ) : null}

      {pendingDelete ? (
        <DeleteConfirmPanel
          confirmLabel={pendingDelete.confirmLabel}
          disabled={isSaving}
          message={pendingDelete.message}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            const action = pendingDelete.confirm;
            setPendingDelete(null);
            action();
          }}
          target={pendingDelete.target}
          title={pendingDelete.title}
          tone={pendingDelete.tone}
        />
      ) : null}

      {isTextImportOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="recipe-text-modal-heading">
          <section className="canvas-modal text-import-modal">
            <button className="modal-close-button" type="button" onClick={() => {
              setAiSourceText("");
              setIsTextImportOpen(false);
            }} aria-label="閉じる" data-tooltip="テキストインポートを閉じる" data-tooltip-pos="bottom-left">×</button>
            <p className="eyebrow">ADD RECIPE FROM TEXT</p>
            <h3 id="recipe-text-modal-heading">テキストからレシピを追加</h3>
            <label>
              レシピテキスト
              <textarea rows={8} value={aiSourceText} onChange={(event) => setAiSourceText(event.target.value)} placeholder="Webやメモからコピーしたレシピテキストをここに貼り付けてください..." />
            </label>
            <button className="primary-button" type="button" disabled={isAiRunning || recipeLimitReached} onClick={structureRecipeText} data-tooltip="テキストをAIでレシピ形式に構造化">
              {isAiRunning ? "AIで構造化中" : "AIで構造化"}
            </button>
          </section>
        </div>
      ) : null}

      {isAiMenuOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="ai-menu-modal-heading">
          <section className="canvas-modal ai-add-modal">
            <button className="modal-close-button" type="button" onClick={() => setIsAiMenuOpen(false)} aria-label="閉じる" data-tooltip="AIメニューを閉じる" data-tooltip-pos="bottom-left">×</button>
            <p className="eyebrow">ADD RECIPE WITH AI</p>
            <h3 id="ai-menu-modal-heading">AI考案で追加</h3>
            <div className="ai-choice-grid">
              <button className="ai-choice-card danger-choice" type="button" disabled={isAiRunning || recipeLimitReached} onClick={generatePriorityRecipe} data-tooltip="期限が近い食材を使うレシピをAIが考案">
                <span>優先消費レシピ</span>
                <small>期限が近い食材から考案</small>
              </button>
              <button className="ai-choice-card purple-choice" type="button" onClick={() => setAiMode("generate")} data-tooltip="使いたい食材を指定してAIが考案">
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
            <button className="primary-button" type="button" disabled={isAiRunning || recipeLimitReached} onClick={generateFromIngredients} data-tooltip="指定した食材からAIがレシピを考案">
              {isAiRunning ? "考案中" : "指定食材で考案"}
            </button>
          </section>
        </div>
      ) : null}

      {isRecipeEditorOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="recipe-editor-heading">
          <section className="canvas-modal recipe-editor-modal">
            <button className="modal-close-button" type="button" onClick={closeRecipeEditor} aria-label="閉じる" data-tooltip="レシピエディタを閉じる" data-tooltip-pos="bottom-left">×</button>
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
              <div className="recipe-source-field">
                <div className="recipe-source-field-heading">
                  <span>出典</span>
                  <button
                    className="secondary-button compact-button"
                    disabled={isSaving || !recipeYoutubeVideoId}
                    onClick={retryYoutubeThumbnailPreview}
                    type="button"
                    data-tooltip="出典URLからYouTubeサムネイルをもう一度取得"
                  >
                    サムネ再取得
                  </button>
                </div>
                <textarea
                  aria-label="参考元"
                  rows={2}
                  value={recipeValues.source}
                  onChange={(event) => updateRecipeValue("source", event.target.value)}
                  placeholder="例: https://... または本の名前"
                />
              </div>

              {(() => {
                const savedPreviewUrl =
                  !recipeImageRemoved
                    ? // 署名付きURLは非同期に揃うため、最新の Map を優先しつつ開始時スナップショットへフォールバック。
                      (editingRecipeId ? recipeImageUrls.get(editingRecipeId) ?? null : null) ?? editingRecipeImageUrl
                    : null;
                const youtubePreviewUrl = youtubeThumbnailStatus?.status !== "error" ? youtubeThumbnailUrl : null;
                const previewUrl = recipeImageCandidate?.signedUrl ?? recipeImagePreviewUrl ?? youtubePreviewUrl ?? savedPreviewUrl;
                const previewKind: RecipeImagePreviewKind | null = recipeImageCandidate?.signedUrl
                  ? "candidate"
                  : recipeImagePreviewUrl
                    ? "file"
                    : youtubePreviewUrl
                      ? "youtube"
                      : savedPreviewUrl
                        ? "saved"
                        : null;
                const youtubeThumbnailDismissed = Boolean(
                  recipeYoutubeVideoId && canUseYoutubeThumbnailPreview && youtubeThumbnailDismissedVideoId === recipeYoutubeVideoId
                );

                return (
                  <RecipeImagePicker
                disabled={isSaving}
                inputRef={recipeImageInputRef}
                previewKind={previewKind}
                previewUrl={previewUrl}
                recipeName={recipeValues.name}
                removalPending={recipeImageRemoved && Boolean(editingRecipeImagePath)}
                selectedCandidate={Boolean(recipeImageCandidate)}
                selectedFileName={recipeImageFile?.name ?? null}
                youtubeThumbnailDismissed={youtubeThumbnailDismissed}
                youtubeThumbnailStatus={youtubeThumbnailStatus}
                showCancel={Boolean(recipeImageFile || recipeImageRemoved || recipeImageCandidate)}
                onCancel={cancelRecipeImageChange}
                onYoutubeThumbnailError={markYoutubeThumbnailError}
                onYoutubeThumbnailLoad={markYoutubeThumbnailReady}
                onYoutubeThumbnailRetry={retryYoutubeThumbnailPreview}
                onOpenCandidatePicker={() => setPhotoCandidatePickerTarget("recipe-image")}
                onRemove={removeRecipeImage}
                onDropFiles={(files) => setRecipeImageDraftFromFile(files[0] ?? null)}
                onSelect={selectRecipeImage}
              />
                );
              })()}

              {renderRecipeIngredientEditor("材料", "食材", foodIngredientEntries)}
              {renderRecipeIngredientEditor("調味料", "調味料", seasoningIngredientEntries, " seasoning-add-button")}

              <div className="recipe-step-sections">
                <div className="recipe-step-editor" aria-label="下ごしらえ入力">
                  <div className="ingredient-editor-heading">
                    <span>下ごしらえ</span>
                    <button className="secondary-button compact-button prep-add-button" type="button" onClick={() => addRecipeStep("prep_steps")} data-tooltip="下ごしらえの手順を1件追加">
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
                      <button className="danger-button compact-button" type="button" onClick={() => removeRecipeStep("prep_steps", index)} aria-label="下ごしらえを削除" data-tooltip="この下ごしらえを削除">
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
                    <button className="secondary-button compact-button cook-add-button" type="button" onClick={() => addRecipeStep("steps")} data-tooltip="調理工程を1件追加">
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
                      <button className="danger-button compact-button" type="button" onClick={() => removeRecipeStep("steps", index)} aria-label="工程を削除" data-tooltip="この工程を削除">
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
                <button className="secondary-button" type="button" onClick={closeRecipeEditor} data-tooltip="変更を破棄してエディタを閉じる">
                  キャンセル
                </button>
                <button className="secondary-button recipe-shopping-button" type="button" disabled={isSaving} onClick={addCurrentRecipeToShopping} data-tooltip="このレシピの不足食材を買い物リストへ追加">
                  買い物へ
                </button>
                <button className="primary-button" type="submit" disabled={isSaving} aria-label={editingRecipeId ? "レシピを更新" : "レシピを保存"} data-tooltip={editingRecipeId ? "レシピを更新して保存" : "レシピを保存"}>
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
            <button className="modal-close-button" type="button" onClick={closeShortageSelectionModal} aria-label="閉じる" data-tooltip="不足選択モーダルを閉じる" data-tooltip-pos="bottom-left">×</button>
            <h3 id="shopping-shortage-heading">買い物に追加するもの</h3>
            <p className="shopping-shortage-meta">{shortageSelectionRecipeName || "不足分を確認してください"}</p>
            <div className="shopping-shortage-tabs" aria-label="不足材料の表示切替">
              {[
                { count: shortageSelectionItems.length, label: "ALL", value: "all" as const },
                { count: shortageSelectionItems.filter((item) => item.type !== "調味料").length, label: "食材", value: "ingredients" as const },
                { count: shortageSelectionItems.filter((item) => item.type === "調味料").length, label: "調味料", value: "seasonings" as const }
              ].map((tab) => (
                <button data-active={shortageSelectionTab === tab.value} key={tab.value} onClick={() => setShortageSelectionTab(tab.value)} type="button" data-tooltip={`${tab.label}の不足材料を表示`}>
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
                      <small>不足 {formatQuantity(item.shortageQuantity)}{item.unit}</small>
                    </span>
                    <em data-type={item.type}>{item.type}</em>
                  </label>
                ))
              )}
            </div>
            <div className="shopping-shortage-actions">
              <button className="secondary-button" type="button" onClick={closeShortageSelectionModal} data-tooltip="あとで追加する">
                あとで
              </button>
              <button className="primary-button" type="button" disabled={isSaving} onClick={confirmRecipeShortageSelection} data-tooltip="選択した不足食材を買い物リストへ追加">
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
              onClick={() => setPickerSlot(null)}
              aria-label="閉じる"
              data-tooltip="レシピ選択を閉じる"
              data-tooltip-pos="bottom-left"
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
                <RecipeFilterControls
                  favoriteOnly={pickerFavoriteOnly}
                  search={pickerSearch}
                  searchLogic={pickerSearchLogic}
                  searchMode={pickerSearchMode}
                  sort={pickerSort}
                  onFavoriteFilterChange={setPickerFavoriteOnly}
                  onSearchChange={setPickerSearch}
                  onSearchLogicChange={setPickerSearchLogic}
                  onSearchModeChange={setPickerSearchMode}
                  onSortChange={setPickerSort}
                />
                <div className="schedule-picker-list">
                  {filterAndSortRecipes(
                    pickerFavoriteOnly ? recipes.filter((recipe) => recipe.is_favorite) : recipes,
                    pickerSearch,
                    pickerSort,
                    pickerSearchMode,
                    pickerSearchLogic
                  ).map((recipe) => (
                    <button
                      className="schedule-picker-option"
                      type="button"
                      key={recipe.id}
                      disabled={isSaving}
                      onClick={() =>
                        pickerSlot.replaceId
                          ? replaceScheduleRecipe(pickerSlot.replaceId, recipe.id)
                          : addScheduleFromPicker(pickerSlot.date, pickerSlot.meal, recipe.id)
                      }
                      title={pickerSlot.replaceId ? `${recipe.name} に変更` : `${recipe.name} を献立に追加`}
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
            <button className="modal-close-button" type="button" onClick={() => setSlotMenuId(null)} aria-label="閉じる" data-tooltip="献立メニューを閉じる" data-tooltip-pos="bottom-left">
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
                data-tooltip="調理ビューを開いて調理を開始"
              >
                調理を開始
              </button>
              <button
                className="slot-menu-button slot-menu-change"
                type="button"
                disabled={isSaving || recipes.length === 0}
                onClick={() => startSlotRecipeChange(slotMenuSchedule)}
                data-tooltip="この献立のレシピを別のレシピに変更"
              >
                別のレシピに変更
              </button>
              {slotMenuSchedule.status === "完了" ? (
                <button
                  className="slot-menu-button slot-menu-change"
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    const target = slotMenuSchedule;
                    setSlotMenuId(null);
                    requestDelete(
                      target.recipe_name || "献立",
                      "在庫を戻し、料理履歴と消費記録を削除して、この献立を未完了に戻します。完成写真は残ります。",
                      () => uncompleteSchedule(target),
                      { confirmLabel: "完了を外す", title: "完了解除確認", tone: "default" }
                    );
                  }}
                  data-tooltip="完了を取り消して未完了に戻す"
                >
                  完了を外す
                </button>
              ) : null}
              <button
                className="slot-menu-button slot-menu-delete"
                type="button"
                disabled={isSaving}
                onClick={() => {
                  const target = slotMenuSchedule;
                  setSlotMenuId(null);
                  requestDelete(target.recipe_name || "献立", scheduleDeleteMessage(target), () => deleteSchedule(target));
                }}
                data-tooltip="この献立を削除"
              >
                削除する
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {scheduleAddRecipe ? (
        <div className="modal-backdrop schedule-add-backdrop" role="dialog" aria-modal="true" aria-labelledby="schedule-add-heading">
          <section className="canvas-modal schedule-add-modal">
            <button className="modal-close-button" type="button" onClick={closeScheduleAddModal} aria-label="閉じる" data-tooltip="スケジュール追加を閉じる" data-tooltip-pos="bottom-left">
              ×
            </button>
            <h3 id="schedule-add-heading">スケジュールに追加</h3>
            <p className="schedule-add-recipe-name">{scheduleAddRecipe.name}</p>
            <p className="schedule-add-step-label">
              {scheduleAddSelectedDate ? "食事の時間帯を選んでください" : "日付を選んでください（今日から30日）"}
            </p>
            <div className="schedule-add-calendar" aria-label="日付を選ぶ">
              {scheduleAddDays.map((day) => {
                const count = scheduleCountByDate[day] ?? 0;
                return (
                  <button
                    className="schedule-add-day"
                    type="button"
                    key={day}
                    aria-label={`${formatScheduleDayLabel(day)} を選ぶ`}
                    data-today={day === todayValue()}
                    data-selected={day === scheduleAddSelectedDate}
                    onClick={() => setScheduleAddSelectedDate(day)}
                    title={`${formatScheduleDayLabel(day)} に追加`}
                  >
                    <span className="schedule-add-day-label">{formatScheduleDayLabel(day)}</span>
                    <span className="schedule-add-day-count" data-empty={count === 0}>
                      {count > 0 ? `献立 ${count}` : "なし"}
                    </span>
                  </button>
                );
              })}
            </div>
            {scheduleAddSelectedDate ? (
              <div className="schedule-add-meals" aria-label="食事の時間帯を選ぶ">
                {scheduleAddMealTypes.map((meal) => (
                  <button
                    className="schedule-add-meal"
                    type="button"
                    key={meal}
                    disabled={isSaving}
                    onClick={() => assignScheduleFromRecipe(meal)}
                    data-tooltip={`${meal}の献立として追加`}
                  >
                    {meal}
                  </button>
                ))}
              </div>
            ) : null}
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
              <button className="secondary-button compact-button" data-active={aiMode === "generate"} type="button" onClick={() => setAiMode("generate")} data-tooltip="食材を指定してAIがレシピを考案">
                食材から考案
              </button>
              <button className="secondary-button compact-button" data-active={aiMode === "structure"} type="button" onClick={() => setAiMode("structure")} data-tooltip="テキストをAIでレシピ形式に構造化">
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
            <button className="primary-button" type="button" disabled={isAiRunning || recipeLimitReached} onClick={runInlineAiRecipe} data-tooltip="AIでレシピを生成してエディタで開く">
              {isAiRunning ? "AI実行中" : "AIレシピを編集モーダルで開く"}
            </button>
          </section>

          <RecipeList
            disabled={isSaving}
            imageUrls={recipeImageUrls}
            onCook={openCookingViewer}
            onEdit={startEditRecipe}
            onSchedule={(recipe) => openScheduleAddModal(recipe.id)}
            onDelete={(recipe) => requestDelete(recipe.name, "このレシピを削除します。献立に紐づくレシピ参照も外れます。", () => deleteRecipe(recipe))}
            onSelect={setSelectedRecipeId}
            onToggleFavorite={toggleRecipeFavorite}
            favoriteOnly={recipeFavoriteOnly}
            onFavoriteFilterChange={setRecipeFavoriteOnly}
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
          <RecipeDetail imageUrl={recipeImageUrls.get(selectedRecipe.id) ?? null} onEdit={startEditRecipe} recipe={selectedRecipe} />
          <button className="primary-button" type="button" disabled={!selectedRecipe} onClick={() => selectedRecipe && openCookingViewer(selectedRecipe)} data-tooltip="このレシピの調理ビューを全画面で開く">
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
            <button className="primary-button" type="submit" disabled={isSaving || recipes.length === 0} data-tooltip="選択した日付・食事に献立を追加">
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
              <button className="primary-button compact-button" type="submit" disabled={isSaving || !selectedRecipe} data-tooltip="選択中のレシピを作りたい候補に追加">
                選択レシピを候補へ
              </button>
            </form>
            {activeCookCandidates.length === 0 ? (
              <p className="empty-list">作りたい候補はありません。</p>
            ) : (
              <div className="candidate-list">
                {activeCookCandidates.map((candidate) => {
                  const candidateRecipe = recipeForCandidate(candidate, recipes);
                  return (
                  <article className="candidate-item" key={candidate.id}>
                    <RecipeThumb
                      className="candidate-thumb"
                      imageUrl={candidateRecipe ? recipeImageUrls.get(candidateRecipe.id) ?? null : null}
                      recipe={candidateRecipe ?? { name: candidate.recipe_name || "レシピ名なし" }}
                    />
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
                      <button className="secondary-button compact-button" type="button" disabled={isSaving} onClick={() => assignCandidateToSchedule(candidate)} data-tooltip={`${candidate.recipe_name || "このレシピ"} を献立に追加`}>
                        献立へ追加
                      </button>
                      <button
                        className="danger-button compact-button"
                        type="button"
                        disabled={isSaving}
                        onClick={() => requestDelete(candidate.recipe_name || "候補", "この作りたい候補を解除します。レシピ本体は削除されません。", () => deleteCookCandidate(candidate))}
                        data-tooltip="作りたい候補から解除"
                      >
                        解除
                      </button>
                    </div>
                  </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
        ) : null}

        {activeView === "schedule" ? (
        <section className="stock-panel schedule-board-panel" aria-label="7日スケジュール">
          <div className="schedule-toolbar">
            <button className="schedule-nav-button" type="button" onClick={() => setScheduleWindowStart(addDays(scheduleWindowStart, -7))} data-tooltip="前の週を表示">
              ← 前の週
            </button>
            <button
              className="schedule-nav-button schedule-nav-today"
              type="button"
              onClick={() => {
                setScheduleWindowStart(addDays(todayValue(), -3));
                setScheduleDate(todayValue());
              }}
              data-tooltip="今週を表示"
            >
              今週
            </button>
            <button className="schedule-nav-button" type="button" onClick={() => setScheduleWindowStart(addDays(scheduleWindowStart, 7))} data-tooltip="次の週を表示">
              次の週 →
            </button>
          </div>

          <div className="schedule-board" aria-label="7日献立">
            <button
              className="schedule-shift"
              type="button"
              onClick={() => setScheduleWindowStart(addDays(scheduleWindowStart, -1))}
              aria-label="スケジュールを1日前へ移動"
              data-tooltip="1日前へ移動"
            >
              ↑
            </button>
            <div className="schedule-days-grid">
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
                      {scheduleMealTypes.map((mealType) => {
                        const slotSchedules = daySchedules.filter((item) => item.meal_type === mealType);
                        return (
                          <div
                            className="schedule-slot"
                            data-empty={slotSchedules.length === 0}
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
                                onClick={() => openPicker({ date: day, meal: mealType })}
                                aria-label={`${formatScheduleDayLabel(day)} ${mealType}に追加`}
                                data-tooltip={`${formatScheduleDayLabel(day)} ${mealType}に献立を追加`}
                              >
                                ＋
                              </button>
                            </div>
                            {slotSchedules.map((schedule) => {
                              const isSelected = selectedSchedule?.id === schedule.id;
                              return (
                              <article
                                key={schedule.id}
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
                                  className="schedule-meal-delete-button"
                                  type="button"
                                  disabled={isSaving}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    requestDelete(schedule.recipe_name || "献立", scheduleDeleteMessage(schedule), () => deleteSchedule(schedule));
                                  }}
                                  aria-label={`${schedule.recipe_name || "献立"} を削除`}
                                  data-tooltip={`${schedule.recipe_name || "献立"} を削除`}
                                >
                                  ×
                                </button>
                                <button
                                  className="schedule-meal-select"
                                  type="button"
                                  onClick={() => {
                                    setSelectedScheduleId(schedule.id);
                                    setSlotMenuId(schedule.id);
                                  }}
                                  aria-label={`${schedule.recipe_name || "レシピ名なし"} の操作`}
                                  data-tooltip={`${schedule.recipe_name || "献立"} の操作メニューを開く`}
                                >
                                  <span className="schedule-meal-handle" aria-hidden="true">≡</span>
                                  <span className="schedule-meal-body">
                                    <strong>{schedule.recipe_name || "レシピ名なし"}</strong>
                                    {schedule.status === "完了" ? <em>完了</em> : null}
                                  </span>
                                </button>
                              </article>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
            <button
              className="schedule-shift"
              type="button"
              onClick={() => setScheduleWindowStart(addDays(scheduleWindowStart, 1))}
              aria-label="スケジュールを1日後へ移動"
              data-tooltip="1日後へ移動"
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
                  data-tooltip={`${genre} を外す`}
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
          data-tooltip="検索テキストをクリア"
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
          data-tooltip="入力したジャンルを追加"
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
                <button className="genre-option" data-selected={isSelected} type="button" key={genre} onClick={() => toggle(genre)} title={isSelected ? `${genre} を外す` : `${genre} を選択`}>
                  <span className="genre-option-check" data-on={isSelected} aria-hidden="true">
                    ✓
                  </span>
                  <span className="genre-option-name">{genre}</span>
                </button>
              );
            })}
            {canCreate ? (
              <button className="genre-option genre-option-create" type="button" onClick={() => addNew(normalizedQuery)} title={`新しいジャンル「${normalizedQuery}」を作成`}>
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
  onBulkSet,
  onTabChange,
  recipe,
  tab
}: {
  drafts: ConsumptionDraft[];
  inventoryItems: StockItem[];
  onChange: (index: number, values: Partial<ConsumptionDraft>) => void;
  onBulkSet: (mode: ConsumptionBulkMode) => void;
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
      const consumeUnit = draft.consumeUnit || draft.requestedUnit;
      const amount = quantityToNumber(draft.amount);
      // おすすめ = 同分類・同単位（または単位換算成立）・在庫あり。それ以外は代替材料として「その他の在庫」に出す。
      // おすすめ内はスコア降順（ingredientNameMatchScore 高い方が先頭）に並べる。
      const rawOptions = ingredient
        ? inventoryItems.filter(
            (item) =>
              item.category === ingredient.item_type &&
              conversionFactorToUnit(item, ingredient.unit) !== null &&
              item.quantity > 0
          )
        : [];
      const options = ingredient
        ? [...rawOptions].sort(
            (a, b) =>
              ingredientNameMatchScore(b.name, ingredient.name) -
              ingredientNameMatchScore(a.name, ingredient.name)
          )
        : [];
      const recommendedIds = new Set(options.map((item) => item.id));
      const otherOptions = inventoryItems.filter((item) => item.quantity > 0 && !recommendedIds.has(item.id));
      // 選択中在庫の単位がレシピ単位と異なるなら、換算可否に関わらず単位セレクタを出す。
      // （換算不可在庫でも在庫単位を選んで正しく減算できる経路を確保する）
      const showUnitSelector = Boolean(stockItem && stockItem.unit !== draft.requestedUnit);
      // 不足判定: 入力量(consumeUnit) と 在庫量(consumeUnit 換算) を同一単位で比較する。
      const stockInConsumeUnit = stockItem ? stockAmountInUnit(stockItem, consumeUnit) : null;
      const compareStock = stockInConsumeUnit ?? Number(stockItem?.quantity ?? 0);
      return {
        showUnitSelector,
        consumeUnit,
        draft,
        index,
        ingredient,
        isShortage: Boolean(stockItem && Number.isFinite(amount) && amount > 0 && amount > compareStock),
        options,
        otherOptions,
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
              data-tooltip={value === "all" ? "全材料を表示" : `${value}のみ表示`}
            >
              {value === "all" ? "全" : value}
            </button>
          ))}
        </div>
        <div className="consumption-bulk-actions">
          <button className="secondary-button compact-button" type="button" onClick={() => onBulkSet("default")} data-tooltip="全材料の消費量をレシピ既定量にリセット">
            全部 既定量
          </button>
          <button className="secondary-button compact-button" type="button" onClick={() => onBulkSet("zero")} data-tooltip="全材料の消費量を0にリセット">
            全部 0
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
          {rows.map(({ showUnitSelector, consumeUnit, draft, index, ingredient, isShortage, options, otherOptions, stockItem }) => {
            const hasAnyStock = options.length > 0 || otherOptions.length > 0;
            return (
              <article className="consumption-row" data-active={quantityToNumber(draft.amount) > 0} key={`${draft.ingredientName}-${draft.requestedUnit}-${index}`}>
                <div className="consumption-row-top">
                  <div className="consumption-row-label">
                    <strong>{draft.ingredientName}</strong>
                    <small>必要 {formatQuantity(draft.requestedAmount)}{draft.requestedUnit}・{ingredient?.item_type ?? "未分類"}</small>
                  </div>
                  <div className="consumption-row-controls">
                    <select
                      aria-label="減らす在庫"
                      value={draft.stockItemId}
                      onChange={(event) => onChange(index, { stockItemId: event.target.value })}
                    >
                      <option value="">{hasAnyStock ? "在庫を選ぶ" : "在庫がありません"}</option>
                      {options.length > 0 ? (
                        <optgroup label="おすすめ（同分類・同単位）">
                          {options.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} / {stockQuantityDisplay(item)}{item.unit} / {item.storage_location}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                      {otherOptions.length > 0 ? (
                        <optgroup label="その他の在庫（代替材料）">
                          {otherOptions.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} / {stockQuantityDisplay(item)}{item.unit} / {item.storage_location}
                            </option>
                          ))}
                        </optgroup>
                      ) : null}
                    </select>
                    <span className="consumption-amount">
                      <NumberField
                        ariaLabel="消費量"
                        value={draft.amount}
                        onChange={(next) => onChange(index, { amount: next })}
                        allowFraction={isFractionalUnit(consumeUnit)}
                      />
                      {showUnitSelector && stockItem ? (
                        <select
                          aria-label="消費量の単位"
                          className="consumption-unit-select"
                          value={consumeUnit}
                          onChange={(event) => onChange(index, { consumeUnit: event.target.value, amount: "0" })}
                        >
                          <option value={draft.requestedUnit}>{draft.requestedUnit}</option>
                          <option value={stockItem.unit}>{stockItem.unit}</option>
                        </select>
                      ) : (
                        <span className="consumption-unit">{consumeUnit}</span>
                      )}
                    </span>
                  </div>
                </div>
                {isShortage && stockItem ? (
                  <p className="consumption-item-warning">
                    在庫 {stockQuantityDisplay(stockItem)}{stockItem.unit} に対して消費量が多いです。
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

function ingredientAmountText(ingredient: RecipeIngredient) {
  if (!ingredient.amount) return "";
  const amount = formatQuantity(ingredient.amount);
  if (ingredient.unit === "大さじ" || ingredient.unit === "小さじ") return `${ingredient.unit}${amount}`;
  return `${amount}${ingredient.unit}`;
}

function hasExplicitAmountAfterName(value: string) {
  return /^\s*(大さじ|小さじ)\s*[0-9０-９]+(?:[\/／．.][0-9０-９]+)?/.test(value);
}

function cookingAmountChip(text: string, unit: string, key: string) {
  if (unit === "大さじ" || unit === "小さじ") {
    const amount = text.replace(unit, "").trim();
    return (
      <span className="cooking-amount-chip" data-unit={unit} aria-label={text} key={key}>
        <span className="cooking-measure-unit" aria-hidden="true">
          <span className="cooking-measure-unit-label">{unit}</span>
        </span>
        <span className="cooking-measure-value" aria-hidden="true">{amount}</span>
      </span>
    );
  }

  return (
    <span className="cooking-amount-chip" data-unit={unit} key={key}>
      {text}
    </span>
  );
}

function chipifyStep(text: string, ingredients: RecipeIngredient[], onHighlight: (name: string) => void) {
  const names = ingredients
    .map((ingredient) => ({ ingredient, name: ingredient.name, type: ingredient.item_type }))
    .filter((entry) => entry.name)
    .sort((a, b) => b.name.length - a.name.length);

  const nodes: ReactNode[] = [];
  let remaining = text;
  let key = 0;
  let guard = 0;
  while (remaining.length > 0 && guard++ < 500) {
    let bestIdx = -1;
    let bestName: { ingredient: RecipeIngredient; name: string; type: "食材" | "調味料" } | null = null;
    let bestAmount: RegExpMatchArray | null = null;
    const amountMatch = remaining.match(/(大さじ|小さじ)\s*([0-9０-９]+(?:[\/／．.][0-9０-９]+)?)/);
    if (amountMatch?.index !== undefined) {
      bestIdx = amountMatch.index;
      bestAmount = amountMatch;
    }
    for (const entry of names) {
      const idx = remaining.indexOf(entry.name);
      if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
        bestIdx = idx;
        bestName = entry;
        bestAmount = null;
      }
    }
    if (bestIdx === -1) {
      nodes.push(remaining);
      break;
    }
    if (bestIdx > 0) nodes.push(remaining.slice(0, bestIdx));
    if (bestAmount) {
      const [matchedText, unit, amount] = bestAmount;
      nodes.push(cookingAmountChip(`${unit}${amount}`, unit, `amount-${key++}`));
      remaining = remaining.slice(bestIdx + matchedText.length);
      continue;
    }
    if (!bestName) {
      nodes.push(remaining.slice(bestIdx, bestIdx + 1));
      remaining = remaining.slice(bestIdx + 1);
      continue;
    }
    const matched = bestName;
    const nextRemaining = remaining.slice(bestIdx + matched.name.length);
    const amountText = ingredientAmountText(matched.ingredient);
    nodes.push(
      <button aria-label={matched.name} className="cooking-step-chip" data-type={matched.type} type="button" key={`chip-${key++}`} onClick={() => onHighlight(matched.name)}>
        {matched.name}
      </button>
    );
    if (amountText && !hasExplicitAmountAfterName(nextRemaining)) {
      nodes.push(cookingAmountChip(amountText, matched.ingredient.unit, `registered-amount-${key++}`));
    }
    remaining = nextRemaining;
  }
  return nodes;
}

function CookingViewer({
  highlightedIngredientName,
  imageUrl,
  ingredientTab,
  ingredientDrafts,
  inventoryItems,
  isPhotoOpen,
  isReorderDirty,
  mediaTab,
  onChangeMediaTab,
  onGroupSelected,
  onHighlightIngredient,
  onIngredientTabChange,
  onMoveIngredient,
  onMoveStep,
  onStepTabChange,
  onToggleIngredientSelection,
  onTogglePhoto,
  onToggleStockCheck,
  onUngroupSelected,
  onUngroupSubgroup,
  recipe,
  selectedIngredientIds,
  stepDrafts,
  stepTab,
  stockCheck
}: {
  highlightedIngredientName: string;
  imageUrl: string | null;
  ingredientTab: CookingIngredientTab;
  ingredientDrafts: CookingIngredientDraft[];
  inventoryItems: StockItem[];
  isPhotoOpen: boolean;
  isReorderDirty: boolean;
  mediaTab: CookingMediaTab;
  onChangeMediaTab: (tab: CookingMediaTab) => void;
  onGroupSelected: (tone: "食材" | "調味料") => void;
  onHighlightIngredient: (name: string) => void;
  onIngredientTabChange: (tab: CookingIngredientTab) => void;
  onMoveIngredient: (draggedId: string, targetType: "食材" | "調味料", targetIndex: number, targetGroupIndex?: number) => void;
  onMoveStep: (draggedId: string, targetKind: CookingStepKind, targetIndex: number) => void;
  onStepTabChange: (tab: CookingStepTab) => void;
  onToggleIngredientSelection: (ingredient: RecipeIngredient, additive: boolean) => void;
  onTogglePhoto: () => void;
  onToggleStockCheck: () => void;
  onUngroupSelected: (tone: "食材" | "調味料") => void;
  onUngroupSubgroup: (tone: "食材" | "調味料", groupIndex: number) => void;
  recipe: Recipe | null;
  selectedIngredientIds: string[];
  stepDrafts: CookingStepDraft[];
  stepTab: CookingStepTab;
  stockCheck: boolean;
}) {
  // recipe.source（改行区切り）から最初に取れた YouTube videoId。無ければ null。
  const youtubeVideoId = useMemo(
    () => findFirstYoutubeVideoId(recipe?.source ?? ""),
    [recipe?.source]
  );

  if (!recipe) {
    return <p className="empty-list">レシピを選ぶと調理ビューを確認できます。</p>;
  }

  const foods = ingredientDrafts.filter((draft) => draft.ingredient.item_type === "食材");
  const seasonings = ingredientDrafts.filter((draft) => draft.ingredient.item_type === "調味料");
  const prepStepDrafts = stepDrafts.filter((draft) => draft.kind === "prep_steps");
  const cookStepDrafts = stepDrafts.filter((draft) => draft.kind === "steps");
  const prepSteps = prepStepDrafts.map((draft) => draft.text);
  const cookSteps = cookStepDrafts.map((draft) => draft.text);
  const originalIngredients = recipe.ingredients.slice().sort((a, b) => a.sort_order - b.sort_order);
  const originalStepDrafts = buildCookingStepDrafts(recipe);
  const currentIngredients = ingredientDrafts.map((draft) => draft.ingredient);

  const ingredientChanged = (ingredient: RecipeIngredient) => {
    const originalIndex = originalIngredients.findIndex((item) => item.id === ingredient.id);
    const currentIndex = currentIngredients.findIndex((item) => item.id === ingredient.id);
    const original = originalIngredients[originalIndex];
    return originalIndex !== currentIndex || original?.item_type !== ingredient.item_type;
  };

  const stepChanged = (draft: CookingStepDraft) => {
    const originalIndex = originalStepDrafts.findIndex((item) => item.id === draft.id);
    const currentIndex = stepDrafts.findIndex((item) => item.id === draft.id);
    const original = originalStepDrafts[originalIndex];
    return originalIndex !== currentIndex || original?.kind !== draft.kind;
  };

  // 1行（材料カード）。globalIndex は item_type 内の通し位置で、D&Dのドロップ先計算に使う。
  // dropGroupIndex はドロップ時に引き継ぐサブグループ（隣接カードの group_index）。
  const renderIngredientCard = (draft: CookingIngredientDraft, tone: "食材" | "調味料", globalIndex: number) => {
    const ingredient = draft.ingredient;
    const stockAmount = inventoryAmountByNameAndUnit(inventoryItems, ingredient.name, ingredient.unit);
    const isShortage = ingredient.amount > 0 && stockAmount < ingredient.amount;
    const amountText = ingredientAmountText(ingredient);
    const dropGroupIndex = ingredient.group_index ?? 0;
    const isSelected = selectedIngredientIds.includes(ingredient.id);
    return (
      <article
        className="cooking-ing-card"
        draggable
        data-detailed={stockCheck}
        data-changed={ingredientChanged(ingredient)}
        data-shortage={stockCheck && isShortage}
        data-highlight={highlightedIngredientName === ingredient.name}
        data-selected={isSelected}
        key={ingredient.id || ingredient.name}
        onClick={(event) => onToggleIngredientSelection(ingredient, event.metaKey || event.ctrlKey)}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", ingredient.id);
          event.currentTarget.classList.add("is-dragging");
        }}
        onDragEnd={(event) => event.currentTarget.classList.remove("is-dragging")}
        onDragOver={(event) => {
          event.preventDefault();
          event.currentTarget.classList.add("is-dragover");
        }}
        onDragLeave={(event) => event.currentTarget.classList.remove("is-dragover")}
        onDrop={(event) => {
          event.preventDefault();
          event.stopPropagation();
          event.currentTarget.classList.remove("is-dragover");
          const draggedId = event.dataTransfer.getData("text/plain");
          if (draggedId) onMoveIngredient(draggedId, tone, globalIndex, dropGroupIndex);
        }}
      >
        <span
          className="cooking-row-drag-handle"
          aria-label={`${ingredient.name}をドラッグして並び替え`}
          role="img"
          onClick={(event) => event.stopPropagation()}
        >
          <span aria-hidden="true">☰</span>
        </span>
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
  };

  const renderIngredientGroup = (label: string, tone: "食材" | "調味料", items: CookingIngredientDraft[]) => {
    if (items.length === 0) return null;

    // サブグループの連続塊(run)に分解する。group_index===0 は見出しなしの未グループ。
    const rankMap = subgroupRankMap(items);
    const runs: { groupIndex: number; entries: { draft: CookingIngredientDraft; globalIndex: number }[] }[] = [];
    items.forEach((draft, globalIndex) => {
      const groupIndex = draft.ingredient.group_index ?? 0;
      const last = runs[runs.length - 1];
      if (last && last.groupIndex === groupIndex) {
        last.entries.push({ draft, globalIndex });
      } else {
        runs.push({ groupIndex, entries: [{ draft, globalIndex }] });
      }
    });

    const selectedInTone = items.filter((draft) => selectedIngredientIds.includes(draft.ingredient.id));
    const canGroup = selectedInTone.length >= 2;
    const canUngroup = selectedInTone.some((draft) => (draft.ingredient.group_index ?? 0) > 0);

    return (
      <div
        className="cooking-ing-group"
        key={label}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const draggedId = event.dataTransfer.getData("text/plain");
          if (draggedId) onMoveIngredient(draggedId, tone, items.length, 0);
        }}
      >
        <div className="cooking-ing-group-head">
          <p className="cooking-ing-group-label" data-tone={tone}>{label}</p>
          {canGroup ? (
            <button className="cooking-group-action" type="button" onClick={() => onGroupSelected(tone)} data-tooltip="選択行をグループ化">
              グルーピング
            </button>
          ) : null}
          {canUngroup ? (
            <button className="cooking-group-action" data-variant="ungroup" type="button" onClick={() => onUngroupSelected(tone)} data-tooltip="選択グループを解除">
              グループ解除
            </button>
          ) : null}
        </div>
        {runs.map((run, runIndex) =>
          run.groupIndex > 0 ? (
            <div
              className="cooking-ing-subgroup"
              data-tone={tone}
              key={`group-${run.groupIndex}-${runIndex}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                const draggedId = event.dataTransfer.getData("text/plain");
                const lastEntry = run.entries[run.entries.length - 1];
                if (draggedId) onMoveIngredient(draggedId, tone, lastEntry.globalIndex + 1, run.groupIndex);
              }}
            >
              <div className="cooking-ing-subgroup-head">
                <span className="cooking-ing-subgroup-label" data-tone={tone}>
                  {subgroupLabel(tone, rankMap.get(run.groupIndex) ?? 0)}
                </span>
                <button
                  className="cooking-group-action"
                  data-variant="ungroup"
                  type="button"
                  onClick={() => onUngroupSubgroup(tone, run.groupIndex)}
                  data-tooltip="このサブグループを解除"
                >
                  解除
                </button>
              </div>
              {run.entries.map((entry) => renderIngredientCard(entry.draft, tone, entry.globalIndex))}
            </div>
          ) : (
            <Fragment key={`ungrouped-${runIndex}`}>
              {run.entries.map((entry) => renderIngredientCard(entry.draft, tone, entry.globalIndex))}
            </Fragment>
          )
        )}
      </div>
    );
  };

  const renderStepGroup = (label: string, tone: "prep" | "cook", drafts: CookingStepDraft[]) => {
    const kind: CookingStepKind = tone === "prep" ? "prep_steps" : "steps";
    return (
      <div
        className="cooking-step-group"
        key={label}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const draggedId = event.dataTransfer.getData("text/plain");
          if (draggedId) onMoveStep(draggedId, kind, drafts.length);
        }}
      >
        <p className="cooking-step-group-label">{label}</p>
        {drafts.length === 0 ? <p className="empty-list">ここへ手順を移動できます。</p> : null}
        {drafts.map((draft, index) => (
          <article
            className="cooking-step-card"
            draggable
            data-changed={stepChanged(draft)}
            key={draft.id}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", draft.id);
              event.currentTarget.classList.add("is-dragging");
            }}
            onDragEnd={(event) => event.currentTarget.classList.remove("is-dragging")}
            onDragOver={(event) => {
              event.preventDefault();
              event.currentTarget.classList.add("is-dragover");
            }}
            onDragLeave={(event) => event.currentTarget.classList.remove("is-dragover")}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              event.currentTarget.classList.remove("is-dragover");
              const draggedId = event.dataTransfer.getData("text/plain");
              if (draggedId) onMoveStep(draggedId, kind, index);
            }}
          >
            <span className="cooking-row-drag-handle" aria-label={`${label}${index + 1}をドラッグして並び替え`} role="img">
              <span aria-hidden="true">☰</span>
            </span>
            <span className="cooking-step-badge" data-tone={tone}>{index + 1}</span>
            <p className="cooking-step-text">{chipifyStep(draft.text, recipe.ingredients, onHighlightIngredient)}</p>
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
        {(() => {
          const hasVideo = youtubeVideoId !== null;
          const showVideo = hasVideo && mediaTab === "video";
          const toggleHideLabel = hasVideo ? "写真・動画を隠す" : "レシピ写真を隠す";
          const toggleShowLabel = hasVideo ? "写真・動画を表示" : "レシピ写真を表示";
          return (
            <div className="cooking-pane-photo" data-open={isPhotoOpen} data-has-video={hasVideo}>
              {isPhotoOpen && hasVideo && (
                <div className="cooking-pane-media-tabs" role="group" aria-label="写真と動画の切替">
                  <button
                    className="cooking-pane-media-tab"
                    type="button"
                    data-active={showVideo}
                    aria-pressed={showVideo}
                    aria-label="動画を表示"
                    data-tooltip="動画を表示"
                    data-tooltip-pos="bottom"
                    onClick={() => onChangeMediaTab("video")}
                  >
                    動画
                  </button>
                  <button
                    className="cooking-pane-media-tab"
                    type="button"
                    data-active={!showVideo}
                    aria-pressed={!showVideo}
                    aria-label="写真を表示"
                    data-tooltip="写真を表示"
                    data-tooltip-pos="bottom"
                    onClick={() => onChangeMediaTab("photo")}
                  >
                    写真
                  </button>
                </div>
              )}
              {isPhotoOpen &&
                (showVideo ? (
                  <div className="cooking-pane-photo-video">
                    <iframe
                      className="cooking-pane-photo-iframe"
                      src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
                      title={`${recipe.name} の参考動画`}
                      allow="encrypted-media; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <RecipeThumb
                    className="cooking-pane-photo-thumb"
                    imageUrl={imageUrl}
                    recipe={recipe}
                    size="hero"
                  />
                ))}
              <button
                className="cooking-pane-photo-toggle"
                type="button"
                aria-label={isPhotoOpen ? toggleHideLabel : toggleShowLabel}
                aria-expanded={isPhotoOpen}
                data-tooltip={isPhotoOpen ? toggleHideLabel : toggleShowLabel}
                data-tooltip-pos="bottom"
                onClick={onTogglePhoto}
              >
                {isPhotoOpen ? `▲ ${toggleHideLabel}` : `▼ ${toggleShowLabel}`}
              </button>
            </div>
          );
        })()}
        <div className="cooking-pane-head">
          <span className="cooking-pane-eyebrow" data-tone="ing">材料</span>
          <div className="cooking-pane-head-right">
            <span className="cooking-pane-count">{foods.length + seasonings.length} 件</span>
            <button className="cooking-stock-toggle" data-on={stockCheck} type="button" onClick={onToggleStockCheck} aria-pressed={stockCheck} data-tooltip={stockCheck ? "在庫チェックをオフ" : "在庫チェックをオン"} data-tooltip-pos="bottom-left">
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
              data-tooltip={`${tab.label}を表示`}
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
          <span className="cooking-pane-hint">{isReorderDirty ? "並び替え未保存" : "文中の材料をタップで照合"}</span>
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
              data-tooltip={`${tab.label}を表示`}
            >
              {tab.label}
              <span className="cooking-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="cooking-step-list">
          {stepTab === "all" ? (
            <>
              {renderStepGroup("下ごしらえ", "prep", prepStepDrafts)}
              {renderStepGroup("調理工程", "cook", cookStepDrafts)}
            </>
          ) : stepTab === "prep" ? (
            renderStepGroup("下ごしらえ", "prep", prepStepDrafts)
          ) : (
            renderStepGroup("調理工程", "cook", cookStepDrafts)
          )}
          {prepSteps.length + cookSteps.length === 0 ? <p className="empty-list">手順は登録されていません。</p> : null}
        </div>
      </section>
    </section>
  );
}

function RecipeList({
  disabled,
  imageUrls,
  onCook,
  onDelete,
  onEdit,
  onSchedule,
  onSelect,
  onToggleFavorite,
  favoriteOnly,
  onFavoriteFilterChange,
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
  imageUrls: Map<string, string>;
  onCook: (recipe: Recipe) => void;
  onSchedule: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  onEdit: (recipe: Recipe) => void;
  onSelect: (id: string) => void;
  onToggleFavorite: (recipe: Recipe) => void;
  favoriteOnly: boolean;
  onFavoriteFilterChange: (value: boolean) => void;
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
  return (
    <section className="recipe-browser" aria-label="レシピ一覧">
      <RecipeFilterControls
        favoriteOnly={favoriteOnly}
        search={search}
        searchLogic={searchLogic}
        searchMode={searchMode}
        sort={sort}
        onFavoriteFilterChange={onFavoriteFilterChange}
        onSearchChange={onSearchChange}
        onSearchLogicChange={onSearchLogicChange}
        onSearchModeChange={onSearchModeChange}
        onSortChange={onSortChange}
      />
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
              <button
                className="recipe-thumb-button"
                type="button"
                disabled={disabled}
                onClick={(event) => { event.stopPropagation(); onCook(recipe); }}
                aria-label={`${recipe.name} の調理ビューを開く`}
                data-tooltip={`${recipe.name} の調理ビューを開く`}
              >
                <RecipeThumb imageUrl={imageUrls.get(recipe.id) ?? null} recipe={recipe} />
              </button>
              <div className="recipe-card-main">
                <div className="recipe-card-heading">
                  <button className="recipe-select-button" type="button" onClick={(event) => { event.stopPropagation(); onSelect(recipe.id); }} data-tooltip={`${recipe.name} の詳細を表示`}>
                    <strong>{recipe.name}</strong>
                  </button>
                  <div className="recipe-card-actions">
                    <button className="recipe-icon-button cook-button" type="button" disabled={disabled} onClick={(event) => { event.stopPropagation(); onCook(recipe); }} aria-label="料理する" data-tooltip="調理ビューを開く">
                      <span aria-hidden="true">III</span>
                    </button>
                    <button className="recipe-icon-button schedule-icon-button" type="button" disabled={disabled} onClick={(event) => { event.stopPropagation(); onSchedule(recipe); }} aria-label="スケジュールに追加" data-tooltip="献立スケジュールに追加">
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="M7 3v3M17 3v3M4 8h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1ZM12 12v4M10 14h4" />
                      </svg>
                    </button>
                    <button className="recipe-icon-button" type="button" disabled={disabled} onClick={(event) => { event.stopPropagation(); onEdit(recipe); }} aria-label="編集" data-tooltip="このレシピを編集">
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path d="m16.9 4.1 3 3L8 19H5v-3L16.9 4.1Z" />
                      </svg>
                    </button>
                    <button className="recipe-icon-button" type="button" disabled={disabled} onClick={(event) => { event.stopPropagation(); onDelete(recipe); }} aria-label={pendingDeleteRecipeId === recipe.id ? "削除する" : "削除"} data-tooltip="このレシピを削除" data-tooltip-pos="left">
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
                <div className="recipe-card-footer">
                  <button
                    className="recipe-favorite-button"
                    data-on={recipe.is_favorite}
                    type="button"
                    aria-pressed={recipe.is_favorite}
                    aria-label={recipe.is_favorite ? "お気に入りを解除" : "お気に入りに追加"}
                    onClick={(event) => { event.stopPropagation(); onToggleFavorite(recipe); }}
                    data-tooltip={recipe.is_favorite ? "お気に入りを解除" : "お気に入りに追加"}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
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

/**
 * レシピ編集フォーム内の画像 UI。プレビュー枠＋操作ボタン（選択／差し替え／削除／取り消し）。
 * 圧縮・アップロードは親の保存フローで行い、ここでは選択と表示・取り消しだけを扱う。
 */
function RecipeImagePicker({
  disabled,
  inputRef,
  previewKind,
  previewUrl,
  recipeName,
  removalPending,
  selectedCandidate,
  selectedFileName,
  showCancel,
  youtubeThumbnailDismissed,
  youtubeThumbnailStatus,
  onCancel,
  onYoutubeThumbnailError,
  onYoutubeThumbnailLoad,
  onYoutubeThumbnailRetry,
  onOpenCandidatePicker,
  onDropFiles,
  onRemove,
  onSelect
}: {
  disabled: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  previewKind: RecipeImagePreviewKind | null;
  previewUrl: string | null;
  recipeName: string;
  removalPending: boolean;
  selectedCandidate: boolean;
  selectedFileName: string | null;
  showCancel: boolean;
  youtubeThumbnailDismissed: boolean;
  youtubeThumbnailStatus: YoutubeThumbnailStatus | null;
  onCancel: () => void;
  onYoutubeThumbnailError: (videoId: string) => void;
  onYoutubeThumbnailLoad: (videoId: string) => void;
  onYoutubeThumbnailRetry: () => void;
  onOpenCandidatePicker: () => void;
  onDropFiles: (files: File[]) => void;
  onRemove: () => void;
  onSelect: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const hasPreview = Boolean(previewUrl);
  const selectLabel = hasPreview ? "画像を差し替える" : "画像を選ぶ";
  const { dragHandlers, pasteAreaProps, isActive, isDraggingOver } = useImageFileDrop({
    disabled,
    onFiles: onDropFiles
  });

  return (
    <div
      className="recipe-image-field"
      data-dragging-over={isDraggingOver}
      data-active={isActive}
      aria-label="レシピ画像"
      {...dragHandlers}
      {...pasteAreaProps}
    >
      <div className="recipe-image-field-heading">
        <span>レシピ画像</span>
        <small>カードや詳細に表示されます（任意）</small>
        <small className="photo-paste-hint" data-active={isActive} aria-live="polite">
          {isActive ? "クリップボードから貼り付け可（Ctrl+V）" : "クリックすると Ctrl+V で貼り付けできます"}
        </small>
      </div>
      <div className="recipe-image-preview">
        {hasPreview && previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 署名付きURL/プレビュー。next/image は使わない。
          <img
            alt={recipeName ? `${recipeName} の画像プレビュー` : "レシピ画像プレビュー"}
            onError={previewKind === "youtube" && youtubeThumbnailStatus ? () => onYoutubeThumbnailError(youtubeThumbnailStatus.videoId) : undefined}
            onLoad={previewKind === "youtube" && youtubeThumbnailStatus ? () => onYoutubeThumbnailLoad(youtubeThumbnailStatus.videoId) : undefined}
            src={previewUrl}
          />
        ) : (
          <span className="recipe-image-preview-empty" aria-hidden="true">
            画像なし
          </span>
        )}
      </div>
      <div className="recipe-image-actions">
        <label className="photo-file-button recipe-image-select" data-disabled={disabled}>
          {selectLabel}
          <input accept="image/*" disabled={disabled} onChange={onSelect} ref={inputRef} type="file" />
        </label>
        <button className="secondary-button compact-button" disabled={disabled} onClick={onOpenCandidatePicker} type="button" data-tooltip="過去の料理写真からレシピ画像を選ぶ">
          過去の完成写真から選ぶ
        </button>
        {hasPreview ? (
          <button className="danger-button compact-button" disabled={disabled} onClick={onRemove} type="button" data-tooltip="設定したレシピ画像を削除">
            画像を削除
          </button>
        ) : null}
        {showCancel ? (
          <button className="secondary-button compact-button" disabled={disabled} onClick={onCancel} type="button" data-tooltip="画像の変更をキャンセル">
            変更を取り消す
          </button>
        ) : null}
      </div>
      {selectedFileName ? <p className="recipe-image-hint">選択中: {selectedFileName}（保存時に圧縮して登録します）</p> : null}
      {selectedCandidate ? <p className="recipe-image-hint">過去の完成写真を選択中です。保存時にコピーして登録します。</p> : null}
      {removalPending ? <p className="recipe-image-hint">現在の画像を削除します。保存すると反映されます。</p> : null}
      {previewKind === "youtube" && youtubeThumbnailStatus?.status === "loading" ? (
        <p className="recipe-image-hint recipe-image-hint-loading">
          <span className="recipe-image-spinner" aria-hidden="true" />
          YouTubeサムネイルを確認中です。
        </p>
      ) : null}
      {previewKind === "youtube" && youtubeThumbnailStatus?.status === "ready" ? (
        <p className="recipe-image-hint">YouTubeサムネイルを使用します。画像を削除すると手動画像に差し替えできます。</p>
      ) : null}
      {youtubeThumbnailStatus?.status === "error" ? (
        <div className="recipe-image-inline-alert" data-tone="error">
          <p>{youtubeThumbnailStatus.error}</p>
          <button className="secondary-button compact-button" disabled={disabled} onClick={onYoutubeThumbnailRetry} type="button" data-tooltip="YouTubeサムネイルをもう一度取得">
            再取得
          </button>
        </div>
      ) : null}
      {youtubeThumbnailDismissed ? (
        <div className="recipe-image-inline-alert" data-tone="info">
          <p>このYouTubeサムネイルは使いません。画像を選ぶか、必要なら再取得してください。</p>
          <button className="secondary-button compact-button" disabled={disabled} onClick={onYoutubeThumbnailRetry} type="button" data-tooltip="YouTubeサムネイルをもう一度取得">
            再取得
          </button>
        </div>
      ) : null}
    </div>
  );
}

function RecipeDetail({ imageUrl, onEdit, recipe }: { imageUrl?: string | null; onEdit: (recipe: Recipe) => void; recipe: Recipe | null }) {
  if (!recipe) {
    return <p className="empty-list">レシピを選ぶと材料と手順を確認できます。</p>;
  }

  const foodIngredients = recipe.ingredients.filter((ingredient) => ingredient.item_type === "食材");
  const seasoningIngredients = recipe.ingredients.filter((ingredient) => ingredient.item_type === "調味料");

  return (
    <div className="recipe-detail">
      <section className="recipe-detail-hero" aria-label="レシピ概要">
        <RecipeThumb className="recipe-detail-photo" imageUrl={imageUrl} recipe={recipe} size="hero" />
        <div className="recipe-detail-hero-body">
          <h4>{recipe.name}</h4>
          {recipe.genre.length > 0 ? <div className="recipe-detail-genres">{recipe.genre.map((genre) => <span key={genre}>#{genre}</span>)}</div> : null}
          <p className="item-note">材料 {recipe.ingredients.length} 品目 / 調理回数 {recipe.cook_count} 回</p>
          {recipe.source ? (
            <p className="item-note">参考元: <RecipeSourceLinks source={recipe.source} inline /></p>
          ) : null}
          <button aria-label="レシピ詳細を編集" className="secondary-button recipe-detail-edit-button" type="button" onClick={() => onEdit(recipe)} data-tooltip="このレシピを編集">
            編集
          </button>
        </div>
      </section>
      <div className="recipe-detail-columns">
        <div className="recipe-detail-column">
          <IngredientSummary title="食材" ingredients={foodIngredients} />
          <IngredientSummary title="調味料" ingredients={seasoningIngredients} />
        </div>
        <div className="recipe-detail-column">
          <StepSummary title="下準備" steps={recipe.prep_steps} />
          <StepSummary title="調理手順" steps={recipe.steps} />
        </div>
      </div>
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

// Canvas版に合わせ、sourceを改行区切りで分割し、各行がURLならリンク、
// それ以外（本の名前など）はテキストで表示する。XSSはReactのエスケープで担保。
function RecipeSourceLinks({ source, inline = false }: { source: string; inline?: boolean }) {
  const entries = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (entries.length === 0) return null;

  return (
    <span className={inline ? "recipe-source-links recipe-source-links-inline" : "recipe-source-links"}>
      {entries.map((entry, index) =>
        /^https?:\/\//.test(entry) ? (
          <a key={`${entry}-${index}`} href={entry} target="_blank" rel="noreferrer">
            {entry}
          </a>
        ) : (
          <span key={`${entry}-${index}`} className="recipe-source-text">
            {entry}
          </span>
        )
      )}
    </span>
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
