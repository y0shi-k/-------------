"use client";

import { ChangeEvent, type CSSProperties, FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DeleteConfirmPanel } from "@/components/delete-confirm-panel";
import { ShoppingListSection } from "@/components/shopping-list-section";
import { IngredientIcon } from "@/components/ui/ingredient-icon";
import { NumberField } from "@/components/number-field";
import {
  detectNotation,
  displayQuantity,
  formatQuantityForInput,
  isFractionalUnit,
  parseQuantityInput,
  roundQuantity,
  type QuantityNotation
} from "@/lib/format/numeric";
import { clearQuantityNotation, getQuantityNotation, setQuantityNotation } from "@/lib/format/quantity-notation";
import { getCustomFractions } from "@/lib/format/fraction-candidates";
import { UnitPicker } from "@/components/unit-picker";
import { useInventoryStore } from "@/components/inventory-store";
import { useShellAiUsage, useShellSubView, type InventoryShellLeaf } from "@/components/web-mode-shell";
import { loadUserGeminiApiKeys, type UserGeminiApiKeys } from "@/lib/ai/user-gemini-api-key";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  emptyStockItemFormValues,
  StorageLocation,
  StockItem,
  StockItemFormValues,
  UnitConversion,
  toFormValues
} from "@/lib/inventory/types";
import type { ShoppingItem } from "@/lib/recipes/types";
import {
  buildInventoryImageStoragePath,
  buildPhotoStoragePath,
  buildUserIngredientImageStoragePath,
  compressImageFile,
  compressIngredientImageFile,
  imageExtensionFromContentType
} from "@/lib/photos/compress";
import { useImageFileDrop } from "@/lib/photos/use-image-file-drop";
import { PHOTOS_BUCKET } from "@/lib/photos/user-image";
import { invalidateUserImageSignedUrl, useCachedSignedUrls } from "@/lib/photos/signed-url-cache";
import { normalizeIngredientImageName, resolveUserIngredientImage, type UserIngredientImage } from "@/lib/ui/ingredient-image";
import {
  applyStockCardBgIntensity,
  applyStockLabelBg,
  getStockCardBgIntensity,
  getStockLabelBgAlpha,
  getStockLabelBgColor,
} from "@/lib/ui/stock-card-background";

type InventoryBoardProps = {
  userId: string;
  initialInventoryItems: StockItem[];
  initialArchivedInventoryItems?: StockItem[];
  initialStorageLocations?: StorageLocation[];
  initialShoppingItems?: ShoppingItem[];
  initialUserIngredientImages?: UserIngredientImage[];
};

type Feedback = {
  tone: "success" | "error" | "info";
  message: string;
};

type AiApiKeyKind = "free" | "paid";

const inventorySaveErrorMessage =
  "原因: 在庫をDBへ保存できませんでした。影響: 入力した食材は在庫一覧に追加されません。修正方法: ログイン状態と入力内容を確認してください。";
const ingredientImageSaveErrorMessage =
  "原因: 食材画像を保存できませんでした。影響: 在庫情報は保存されましたが、画像は反映されません。修正方法: 別の画像を選び、通信状態とログイン状態を確認してください。";

function logInventorySaveError(action: "insert" | "update", error: unknown) {
  if (!error) return;
  console.error(`[InventoryBoard] inventory_items ${action} failed`, error);
}

type PendingDelete = {
  confirm: () => void;
  message: string;
  target: string;
};

type ScanIngredientsResponse = {
  items?: InventoryInsert[];
  error?: string;
  failedCount?: number;
};

type EditingTarget = { item: StockItem } | null;

type InventoryFilters = {
  category: "all" | StockItem["category"];
  storageLocation: string;
  expiry: "all" | "has_expiry" | "no_expiry";
  sort: "expiry_asc" | "name_asc" | "created_desc";
};

type InventoryView = "inventory" | "shopping";

type ShoppingFormValues = {
  name: string;
  required_quantity: string;
  unit: string;
};

type AddFlow = "choice" | "manual" | "photo" | null;

type InventoryInsert = Omit<StockItem, "id" | "created_at" | "updated_at" | "image_storage_path" | "archived_at" | "archived_reason"> &
  Partial<Pick<StockItem, "archived_at" | "archived_reason">>;

type ScanCandidate = {
  clientId: string;
  item: InventoryInsert;
};

const inventoryCategoryFilterOptions: { label: string; value: InventoryFilters["category"] }[] = [
  { label: "All", value: "all" },
  { label: "材料", value: "食材" },
  { label: "調味料", value: "調味料" }
];

type NormalizedForm =
  | { data: InventoryInsert }
  | { error: string };

function normalizeUnitConversion(values: StockItemFormValues): UnitConversion | null | { error: string } {
  const hasAnyConversionValue = values.conversion_to_qty || values.conversion_to_unit;

  if (!hasAnyConversionValue) {
    return null;
  }

  const fromQty = 1;
  const toQty = Number(values.conversion_to_qty);
  const fromUnit = values.unit.trim();
  const toUnit = values.conversion_to_unit.trim();

  if (!fromUnit || !Number.isFinite(toQty) || toQty <= 0 || !toUnit) {
    return { error: "単位換算は「1 本 = 1000 ml」のように換算先の数量と単位を入力してください。" };
  }

  return { fromQty, fromUnit, toQty, toUnit };
}

function normalizeForm(values: StockItemFormValues, userId: string): NormalizedForm {
  if (!values.name.trim()) {
    return { error: "品名を入力してください。" };
  }

  const parsedQuantity = parseQuantityInput(values.quantity);
  if (!parsedQuantity.ok) {
    return { error: parsedQuantity.error };
  }
  const quantity = parsedQuantity.value;

  if (!values.unit.trim()) {
    return { error: "単位を入力してください。" };
  }

  const unitConversion = normalizeUnitConversion(values);
  if (unitConversion && "error" in unitConversion) {
    return { error: unitConversion.error };
  }

  return {
    data: {
      user_id: userId,
      category: values.category,
      name: values.name.trim(),
      quantity,
      unit: values.unit.trim(),
      unit_conversion: unitConversion,
      display_expires_on: values.display_expires_on || null,
      effective_expires_on: values.effective_expires_on || null,
      storage_location: values.storage_location.trim() || "その他",
      status_note: values.status_note.trim(),
      source: "manual"
    }
  };
}

function compactDate(value: string | null) {
  if (!value) return "";
  const [, month, day] = value.split("-");
  if (!month || !day) return value;
  return `${Number(month)}/${Number(day)}`;
}

function expiryBadge(item: StockItem) {
  const date = item.effective_expires_on ?? item.display_expires_on;
  if (!date) return null;
  const target = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  const label = diff <= 0 ? `${compactDate(date)} 期限切` : diff <= 3 ? `あと${diff}日 ${compactDate(date)}` : compactDate(date);
  const tone = diff <= 0 ? "expired" : diff <= 3 ? "soon" : "normal";
  return { label, tone };
}

function unitConversionLabel(item: StockItem) {
  const conversion = item.unit_conversion;
  if (!conversion) return "";
  return `${conversion.fromQty}${conversion.fromUnit} = ${conversion.toQty}${conversion.toUnit}`;
}

function sortItems(items: StockItem[], sort: InventoryFilters["sort"]) {
  return [...items].sort((a, b) => {
    if (sort === "expiry_asc") {
      const aDate = a.effective_expires_on ?? a.display_expires_on ?? "9999-12-31";
      const bDate = b.effective_expires_on ?? b.display_expires_on ?? "9999-12-31";
      return aDate.localeCompare(bDate);
    }
    if (sort === "name_asc") {
      return a.name.localeCompare(b.name, "ja");
    }
    return b.created_at.localeCompare(a.created_at);
  });
}

const defaultStorageLocationNames = ["冷蔵庫", "冷凍庫", "常温", "その他"];

function archiveFieldsForQuantity(
  quantity: number,
  reason: "manual_zero" | "restore" | "insert_zero"
): Pick<StockItem, "archived_at" | "archived_reason"> {
  if (quantity > 0 || reason === "restore") {
    return { archived_at: null, archived_reason: null };
  }
  return { archived_at: new Date().toISOString(), archived_reason: reason };
}

export function InventoryBoard({
  userId,
  initialInventoryItems,
  initialArchivedInventoryItems = [],
  initialStorageLocations = [],
  initialUserIngredientImages = []
}: InventoryBoardProps) {
  const { inventoryItems, archivedInventoryItems, storageLocations, shoppingItems, setInventoryItems, setArchivedInventoryItems, setStorageLocations, setShoppingItems } = useInventoryStore();
  const [restoreQuantities, setRestoreQuantities] = useState<Record<string, string>>({});
  // 数量の表示形式（分数 or 小数）。SSRとの不一致を避けるため初期は空にし、マウント後に localStorage から読み込む。
  const [quantityNotations, setQuantityNotations] = useState<Record<string, QuantityNotation>>({});
  // ユーザーが追加した分数候補（例 "3/8"）。一覧で帯分数表示に使う。
  const [customFractions, setCustomFractions] = useState<string[]>([]);
  const [selectedShoppingIds, setSelectedShoppingIds] = useState<string[]>([]);
  const [shoppingValues, setShoppingValues] = useState<ShoppingFormValues>({ name: "", required_quantity: "1", unit: "個" });
  const [userIngredientImages, setUserIngredientImages] = useState(initialUserIngredientImages);
  const [values, setValues] = useState<StockItemFormValues>(emptyStockItemFormValues);
  const [editing, setEditing] = useState<EditingTarget>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [addFlow, setAddFlow] = useState<AddFlow>(null);
  const [photoFeedback, setPhotoFeedback] = useState<Feedback | null>(null);
  const [geminiApiKeys, setGeminiApiKeys] = useState<UserGeminiApiKeys>({ free: "", paid: "" });
  const [pendingScanRetryPhotoIds, setPendingScanRetryPhotoIds] = useState<string[] | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [selectedIngredientImage, setSelectedIngredientImage] = useState<File | null>(null);
  const [ingredientImagePreviewUrl, setIngredientImagePreviewUrl] = useState<string | null>(null);
  const [applyImageToSameName, setApplyImageToSameName] = useState(true);
  const [removeInventoryImageOnSave, setRemoveInventoryImageOnSave] = useState(false);
  const [removeUserNameImageOnSave, setRemoveUserNameImageOnSave] = useState(false);
  const [scanCandidates, setScanCandidates] = useState<ScanCandidate[]>([]);
  const [selectedScanCandidateIds, setSelectedScanCandidateIds] = useState<string[]>([]);
  const [editingScanCandidateId, setEditingScanCandidateId] = useState<string | null>(null);
  const [inventoryFilters, setInventoryFilters] = useState<InventoryFilters>({
    category: "all",
    storageLocation: "all",
    expiry: "all",
    sort: "expiry_asc"
  });
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<InventoryView>("inventory");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const ingredientImageInputRef = useRef<HTMLInputElement | null>(null);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const { aiUsageSummary, refreshAiUsage } = useShellAiUsage();
  const { selectedSubViews, selectShellLeaf } = useShellSubView();
  const scanLimitReached = Boolean(
    aiUsageSummary?.ok && (aiUsageSummary.ingredient_scan.remaining <= 0 || aiUsageSummary.total.remaining <= 0)
  );
  const {
    dragHandlers: ingredientImageDragHandlers,
    pasteAreaProps: ingredientImagePasteAreaProps,
    isActive: isIngredientImageActive,
    isDraggingOver: isIngredientImageDraggingOver
  } = useImageFileDrop({
    disabled: isSaving,
    onFiles: (files) => {
      const file = files[0] ?? null;
      if (file) selectIngredientImageFile(file);
    }
  });

  useEffect(() => {
    setGeminiApiKeys(loadUserGeminiApiKeys());
  }, []);

  // 食材カードの背景写真の濃さ・文字背景（設定）を localStorage から読み、CSS変数に反映する。
  useEffect(() => {
    applyStockCardBgIntensity(getStockCardBgIntensity());
    applyStockLabelBg(getStockLabelBgColor(), getStockLabelBgAlpha());
  }, []);

  // マウント後に、現在の在庫アイテムの表示形式と分数候補を localStorage から読み込む。
  useEffect(() => {
    const next: Record<string, QuantityNotation> = {};
    for (const item of inventoryItems) {
      const stored = getQuantityNotation(item.id);
      if (stored) {
        next[item.id] = stored;
      }
    }
    setQuantityNotations(next);
    setCustomFractions(getCustomFractions());
  }, [inventoryItems]);

  useEffect(() => {
    setActiveView(selectedSubViews.ingredients);
  }, [selectedSubViews.ingredients]);

  function requestDelete(target: string, message: string, confirm: () => void) {
    setPendingDelete({ target, message, confirm });
    setFeedback(null);
  }

  function updateShoppingValue<K extends keyof ShoppingFormValues>(key: K, value: ShoppingFormValues[K]) {
    setShoppingValues((current) => ({ ...current, [key]: value }));
  }

  function switchInventoryView(view: InventoryShellLeaf) {
    setActiveView(view);
    selectShellLeaf("ingredients", view);
  }

  function toggleShoppingSelected(itemId: string) {
    setSelectedShoppingIds((ids) => (ids.includes(itemId) ? ids.filter((id) => id !== itemId) : [...ids, itemId]));
  }

  // 新規保存場所をマスタ(storage_locations)へ登録する。食材0件でも上部タブに残すため。
  async function addStorageLocation(name: string) {
    const trimmed = name.trim();
    if (!trimmed || storageLocations.some((location) => location.name === trimmed)) return;

    const sortOrder = storageLocations.reduce((max, location) => Math.max(max, location.sort_order), 0) + 1;
    const { data, error } = await supabase
      .from("storage_locations")
      .insert({ user_id: userId, name: trimmed, sort_order: sortOrder })
      .select()
      .single();

    if (error || !data) return;

    setStorageLocations((items) => [...items, data as StorageLocation]);
    router.refresh();
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

  async function deleteSelectedInventoryItems() {
    if (selectedInventoryIds.length === 0) return;

    setIsSaving(true);
    setFeedback(null);

    const { error } = await supabase.from("inventory_items").delete().eq("user_id", userId).in("id", selectedInventoryIds);

    setIsSaving(false);

    if (error) {
      setFeedback({ tone: "error", message: "原因: 食材を一括削除できませんでした。影響: 選択した食材が残ります。修正方法: ログイン状態を確認してください。" });
      return;
    }

    const deletedIds = [...selectedInventoryIds];
    const deletedCount = deletedIds.length;

    deletedIds.forEach((id) => clearQuantityNotation(id));
    setQuantityNotations((current) => {
      const next = { ...current };
      deletedIds.forEach((id) => delete next[id]);
      return next;
    });
    setInventoryItems((items) => items.filter((item) => !deletedIds.includes(item.id)));
    setSelectedInventoryIds([]);
    if (editing && deletedIds.includes(editing.item.id)) resetForm();
    setFeedback({ tone: "info", message: `食材を${deletedCount}件削除しました。` });
  }

  const storageLocationOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...defaultStorageLocationNames,
          ...storageLocations.map((location) => location.name),
          ...inventoryItems.map((item) => item.storage_location),
          ...scanCandidates.map((candidate) => candidate.item.storage_location)
        ].filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, "ja")),
    [inventoryItems, scanCandidates, storageLocations]
  );
  const filteredInventoryItems = useMemo(() => {
    const filtered = inventoryItems.filter((item) => {
      if (inventoryFilters.category !== "all" && item.category !== inventoryFilters.category) return false;
      if (inventoryFilters.storageLocation !== "all" && item.storage_location !== inventoryFilters.storageLocation) return false;
      if (inventoryFilters.expiry === "has_expiry" && !item.display_expires_on && !item.effective_expires_on) return false;
      if (inventoryFilters.expiry === "no_expiry" && (item.display_expires_on || item.effective_expires_on)) return false;
      return true;
    });
    return sortItems(filtered, inventoryFilters.sort);
  }, [inventoryFilters, inventoryItems]);
  const openShoppingItems = shoppingItems.filter((item) => item.status === "未購入");
  const purchasedShoppingItems = shoppingItems.filter((item) => item.status === "購入済");

  useEffect(() => {
    return () => {
      photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photoPreviewUrls]);

  useEffect(() => {
    return () => {
      if (ingredientImagePreviewUrl) URL.revokeObjectURL(ingredientImagePreviewUrl);
    };
  }, [ingredientImagePreviewUrl]);

  // 食材画像（在庫＋ユーザー登録画像）の署名URLを path 単位の共有キャッシュ経由で解決する。
  // 再マウント（モード往復）でも同一URLを返すため、ブラウザ画像キャッシュがヒットし再DLが消える（TKT-0204）。
  const ingredientImagePaths = useMemo(() => {
    const inventoryPaths = inventoryItems.map((item) => item.image_storage_path).filter(Boolean) as string[];
    const userPaths = userIngredientImages.map((image) => image.image_storage_path).filter(Boolean);
    return [...inventoryPaths, ...userPaths];
  }, [inventoryItems, userIngredientImages]);
  const ingredientImageUrls = useCachedSignedUrls(supabase, ingredientImagePaths);

  function updateValue<K extends keyof StockItemFormValues>(key: K, value: StockItemFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setValues(emptyStockItemFormValues);
    setEditing(null);
    setEditingScanCandidateId(null);
    resetIngredientImageSelection();
  }

  function openAddChoice() {
    resetForm();
    resetPhoto();
    setScanCandidates([]);
    setSelectedScanCandidateIds([]);
    setAddFlow("choice");
  }

  function openManualAdd() {
    resetForm();
    setAddFlow("manual");
  }

  function openPhotoAdd() {
    resetForm();
    resetPhoto();
    setScanCandidates([]);
    setSelectedScanCandidateIds([]);
    setAddFlow("photo");
  }

  function closeAddModal() {
    if (editingScanCandidateId) {
      resetForm();
      setAddFlow("photo");
      setPhotoFeedback({ tone: "info", message: "候補編集をキャンセルしました。候補一覧から確認を続けられます。" });
      return;
    }

    resetForm();
    resetPhoto();
    setScanCandidates([]);
    setSelectedScanCandidateIds([]);
    setAddFlow(null);
  }

  function updateInventoryFilter<K extends keyof InventoryFilters>(key: K, value: InventoryFilters[K]) {
    setInventoryFilters((current) => ({ ...current, [key]: value }));
  }

  function toggleSelected(list: "inventory", itemId: string) {
    const update = (ids: string[]) => (ids.includes(itemId) ? ids.filter((id) => id !== itemId) : [...ids, itemId]);
    if (list === "inventory") setSelectedInventoryIds(update);
  }

  function selectAllVisible(list: "inventory", itemIds: string[]) {
    if (list === "inventory") setSelectedInventoryIds(itemIds);
  }

  function clearSelected(list: "inventory") {
    if (list === "inventory") setSelectedInventoryIds([]);
  }

  function resetPhoto() {
    photoPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    setSelectedPhotos([]);
    setPhotoPreviewUrls([]);
    setPhotoFeedback(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  function resetIngredientImageSelection() {
    if (ingredientImagePreviewUrl) URL.revokeObjectURL(ingredientImagePreviewUrl);
    setSelectedIngredientImage(null);
    setIngredientImagePreviewUrl(null);
    setApplyImageToSameName(true);
    setRemoveInventoryImageOnSave(false);
    setRemoveUserNameImageOnSave(false);
    if (ingredientImageInputRef.current) {
      ingredientImageInputRef.current.value = "";
    }
  }

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    const invalidFile = files.find((file) => !file.type.startsWith("image/"));

    if (invalidFile) {
      resetPhoto();
      setPhotoFeedback({
        tone: "error",
        message: "原因: 画像ではないファイルが含まれています。影響: 写真を保存できません。修正方法: カメラで撮影するか画像だけを選んでください。"
      });
      return;
    }

    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    const totalCount = selectedPhotos.length + files.length;
    setSelectedPhotos((current) => [...current, ...files]);
    setPhotoPreviewUrls((current) => [...current, ...newPreviewUrls]);
    setPhotoFeedback({ tone: "info", message: `${totalCount}枚の写真を選びました。内容を確認してから解析してください。` });
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  function selectIngredientImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      resetIngredientImageSelection();
      setFeedback({
        tone: "error",
        message: "原因: 画像ではないファイルです。影響: 食材画像を保存できません。修正方法: 画像ファイルを選んでください。"
      });
      return;
    }

    if (ingredientImagePreviewUrl) URL.revokeObjectURL(ingredientImagePreviewUrl);
    setSelectedIngredientImage(file);
    setIngredientImagePreviewUrl(URL.createObjectURL(file));
    setRemoveInventoryImageOnSave(false);
    setRemoveUserNameImageOnSave(false);
    setFeedback({ tone: "info", message: "画像を選びました。保存するとこの食材に反映します。" });
  }

  function selectIngredientImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    selectIngredientImageFile(file);
  }

  function imageUrlForItem(item: StockItem) {
    if (item.image_storage_path) return ingredientImageUrls.get(item.image_storage_path) ?? null;
    const userImage = resolveUserIngredientImage(item.name, userIngredientImages);
    return userImage ? ingredientImageUrls.get(userImage.image_storage_path) ?? null : null;
  }

  function currentUserNameImage() {
    return resolveUserIngredientImage(values.name, userIngredientImages);
  }

  async function runIngredientScan(photoIds: string[], apiKeyKind: AiApiKeyKind, failedPhotoSaveCount = 0) {
    const trimmedApiKey = geminiApiKeys[apiKeyKind].trim();
    if (!trimmedApiKey) {
      setPhotoFeedback({
        tone: "error",
        message:
          apiKeyKind === "free"
            ? "原因: 無料用Gemini APIキーが未入力です。影響: AI解析を実行できません。修正方法: 設定画面で無料用Gemini APIキーを登録してから再度お試しください。"
            : "原因: 有料Gemini APIキーが未入力です。影響: 有料APIで続行できません。修正方法: 設定画面で有料用Gemini APIキーを登録してから再度お試しください。"
      });
      return;
    }

    if (scanLimitReached) {
      setPhotoFeedback({
        tone: "error",
        message: "原因: 本日の食材写真解析の上限に達しました。影響: 今日は食材写真解析を実行できません。修正方法: 明日再度お試しください。"
      });
      return;
    }

    setPendingScanRetryPhotoIds(null);
    setPhotoFeedback({ tone: "info", message: `${photoIds.length}枚の写真をAIで食材候補に解析しています。` });

    let scanResponse: Response;
    let scanResult: ScanIngredientsResponse;
    try {
      scanResponse = await fetch("/api/ai/scan-ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ photoIds, geminiApiKey: trimmedApiKey })
      });
      scanResult = (await scanResponse.json().catch(() => ({}))) as ScanIngredientsResponse;
    } catch {
      if (apiKeyKind === "free") {
        setPendingScanRetryPhotoIds(photoIds);
      }
      setPhotoFeedback({
        tone: "error",
        message: "原因: AI解析通信に失敗しました。影響: 食材候補を作成できません。修正方法: 通信状態を確認してください。"
      });
      return;
    }

    // 成功・429いずれの場合も残り回数表示を更新する。
    void refreshAiUsage();

    if (!scanResponse.ok || scanResult.error || !scanResult.items) {
      if (apiKeyKind === "free") {
        setPendingScanRetryPhotoIds(photoIds);
      }
      setPhotoFeedback({
        tone: "error",
        message:
          scanResult.error ||
          "原因: AI解析結果を取得できませんでした。影響: 食材候補を作成できません。修正方法: 時間を置いて再度解析してください。"
      });
      return;
    }

    const hadExistingCandidates = scanCandidates.length > 0;
    const candidateBatchId = `${Date.now()}-${photoIds.join("-")}`;
    const candidates = (scanResult.items ?? []).map((item, index) => ({
      clientId: `${candidateBatchId}-${index}`,
      item
    }));
    setScanCandidates((current) => [...current, ...candidates]);
    setSelectedScanCandidateIds((current) => [...new Set([...current, ...candidates.map((candidate) => candidate.clientId)])]);
    resetPhoto();
    const failedCount = failedPhotoSaveCount + (scanResult.failedCount ?? 0);
    setPhotoFeedback({
      tone: failedCount > 0 ? "info" : "success",
      message:
        failedCount > 0
          ? `${candidates.length}件の候補を${hadExistingCandidates ? "追加しました" : "見つけました"}。${failedCount}枚は解析できませんでした。成功分を確認してから在庫に追加してください。`
          : `${candidates.length}件の候補を${hadExistingCandidates ? "追加しました" : "見つけました"}。確認してから在庫に追加してください。`
    });
  }

  async function retryIngredientScan(apiKeyKind: AiApiKeyKind) {
    if (!pendingScanRetryPhotoIds) return;
    setIsUploadingPhoto(true);
    try {
      await runIngredientScan(pendingScanRetryPhotoIds, apiKeyKind);
    } catch {
      if (apiKeyKind === "free") {
        setPendingScanRetryPhotoIds(pendingScanRetryPhotoIds);
      }
      setPhotoFeedback({
        tone: "error",
        message: "原因: AI解析通信に失敗しました。影響: 食材候補を作成できません。修正方法: 通信状態を確認してください。"
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  function cancelIngredientScanRetry() {
    setPendingScanRetryPhotoIds(null);
    setPhotoFeedback({ tone: "info", message: "AI解析の再実行をキャンセルしました。保存済み写真は既存フローに合わせて保持します。" });
  }

  async function scanPhoto() {
    if (selectedPhotos.length === 0) {
      setPhotoFeedback({
        tone: "error",
        message: "原因: 写真が未選択です。影響: AI解析できません。修正方法: 先に写真を撮るか選んでください。"
      });
      return;
    }

    if (!geminiApiKeys.free.trim()) {
      setPhotoFeedback({
        tone: "error",
        message: "原因: 無料用Gemini APIキーが未入力です。影響: AI解析を実行できません。修正方法: 設定画面で無料用Gemini APIキーを登録してから再度お試しください。"
      });
      return;
    }

    if (scanLimitReached) {
      setPhotoFeedback({
        tone: "error",
        message: "原因: 本日の食材写真解析の上限に達しました。影響: 今日は食材写真解析を実行できません。修正方法: 明日再度お試しください。"
      });
      return;
    }

    setIsUploadingPhoto(true);
    setPendingScanRetryPhotoIds(null);
    setPhotoFeedback(null);

    try {
      const photoIds: string[] = [];
      let failedPhotoSaveCount = 0;

      for (const photo of selectedPhotos) {
        try {
          const compressed = await compressImageFile(photo);
          const storagePath = buildPhotoStoragePath(userId);
          const { error: uploadError } = await supabase.storage.from("photos").upload(storagePath, compressed.blob, {
            contentType: compressed.contentType,
            cacheControl: "31536000",
            upsert: false
          });

          if (uploadError) {
            failedPhotoSaveCount += 1;
            continue;
          }

          const { data: photoRow, error: insertError } = await supabase
            .from("photos")
            .insert({
              user_id: userId,
              bucket_id: "photos",
              storage_path: storagePath,
              usage_type: "ingredient_scan",
              content_type: compressed.contentType,
              byte_size: compressed.byteSize,
              width: compressed.width,
              height: compressed.height
            })
            .select("id")
            .single();

          if (insertError || !photoRow) {
            failedPhotoSaveCount += 1;
            await supabase.storage.from("photos").remove([storagePath]);
            continue;
          }

          photoIds.push(photoRow.id);
        } catch {
          failedPhotoSaveCount += 1;
        }
      }

      if (photoIds.length === 0) {
        setPhotoFeedback({
          tone: "error",
          message: "原因: 選択した写真をStorageまたはDBへ保存できませんでした。影響: AI解析を開始できません。修正方法: 通信状態とログイン状態を確認してください。"
        });
        return;
      }

      setPhotoFeedback({ tone: "info", message: `${photoIds.length}枚の写真を保存しました。AIで食材候補を解析しています。` });
      await runIngredientScan(photoIds, "free", failedPhotoSaveCount);
    } catch {
      // 写真保存後の通信失敗ではphotoIdsがある場合だけrunIngredientScan側で再試行UIを出す。
      setPhotoFeedback({
        tone: "error",
        message: "原因: 写真の保存またはAI解析に失敗しました。影響: 食材候補を作成できません。修正方法: 別の写真で撮り直してください。"
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  function startEdit(_list: "inventory", item: StockItem) {
    setValues(toFormValues(item, isFractionalUnit(item.unit) ? quantityNotations[item.id] : "decimal"));
    setEditing({ item });
    resetIngredientImageSelection();
    setAddFlow("manual");
    setFeedback({ tone: "info", message: `${item.name} を編集中です。` });
  }

  function editScanCandidate(candidate: ScanCandidate) {
    setValues({
      category: candidate.item.category,
      name: candidate.item.name,
      quantity: formatQuantityForInput(candidate.item.quantity, { allowFraction: isFractionalUnit(candidate.item.unit) }),
      unit: candidate.item.unit,
      conversion_from_qty: "",
      conversion_from_unit: "",
      conversion_to_qty: "",
      conversion_to_unit: "",
      display_expires_on: candidate.item.display_expires_on ?? "",
      effective_expires_on: candidate.item.effective_expires_on ?? "",
      purchase_date: "",
      storage_location: candidate.item.storage_location,
      status_note: candidate.item.status_note
    });
    setEditingScanCandidateId(candidate.clientId);
    resetIngredientImageSelection();
    setAddFlow("manual");
    setFeedback({ tone: "info", message: `${candidate.item.name} を候補として編集中です。保存しても在庫にはまだ追加されません。` });
  }

  // 保存した数量の表示形式（分数 or 小数）を端末に記憶する。g/cc は常に小数。
  function rememberQuantityNotation(itemId: string, unit: string, rawQuantity: string) {
    const notation: QuantityNotation = isFractionalUnit(unit) ? detectNotation(rawQuantity) : "decimal";
    setQuantityNotation(itemId, notation);
    setQuantityNotations((current) => ({ ...current, [itemId]: notation }));
    // ピッカーで追加された分数候補を一覧表示にも反映する。
    setCustomFractions(getCustomFractions());
  }

  async function saveInventory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeForm(values, userId);
    if ("error" in normalized) {
      setFeedback({ tone: "error", message: normalized.error });
      return;
    }

    if (editingScanCandidateId) {
      let updatedCandidateName = values.name.trim();
      setScanCandidates((items) =>
        items.map((candidate) => {
          if (candidate.clientId !== editingScanCandidateId) return candidate;
          updatedCandidateName = normalized.data.name;
          return {
            ...candidate,
            item: {
              ...normalized.data,
              source: candidate.item.source
            }
          };
        })
      );
      resetForm();
      setAddFlow("photo");
      setPhotoFeedback({ tone: "success", message: `${updatedCandidateName}の候補を更新しました。確認してから在庫に追加してください。` });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    const inventoryPayload = {
      ...normalized.data,
      ...archiveFieldsForQuantity(normalized.data.quantity, normalized.data.quantity <= 0 ? "insert_zero" : "restore")
    };

    if (editing) {
      const { data, error } = await supabase
        .from("inventory_items")
        .update({
          ...normalized.data,
          ...archiveFieldsForQuantity(normalized.data.quantity, "manual_zero")
        })
        .eq("id", editing.item.id)
        .eq("user_id", userId)
        .select()
        .single();

      setIsSaving(false);

      if (error || !data) {
        logInventorySaveError("update", error);
        setFeedback({
          tone: "error",
          message:
            "原因: 在庫をDBで更新できませんでした。影響: 入力した変更は在庫一覧に反映されません。修正方法: ログイン状態と入力内容を確認してください。"
        });
        return;
      }

      const imageResult = await persistIngredientImageChange(data as StockItem);
      if (!imageResult.ok) {
        setFeedback({ tone: "error", message: imageResult.error });
      }
      const savedItem = { ...(data as StockItem), image_storage_path: imageResult.ok ? imageResult.imageStoragePath : (data as StockItem).image_storage_path };
      rememberQuantityNotation(savedItem.id, values.unit, values.quantity);
      if (savedItem.archived_at || savedItem.quantity <= 0) {
        setInventoryItems((items) => items.filter((item) => item.id !== savedItem.id));
        setArchivedInventoryItems((items) => [savedItem, ...items.filter((item) => item.id !== savedItem.id)].slice(0, 50));
      } else {
        setInventoryItems((items) => items.map((item) => (item.id === data.id ? savedItem : item)));
      }
      resetForm();
      setAddFlow(null);
      setFeedback({
        tone: imageResult.ok ? (imageResult.warning ? "info" : "success") : "error",
        message: imageResult.ok ? imageResult.warning ?? "内容を更新しました。" : imageResult.error
      });
      return;
    }

    const { data, error } = await supabase.from("inventory_items").insert(inventoryPayload).select().single();
    setIsSaving(false);

    if (error || !data) {
      logInventorySaveError("insert", error);
      setFeedback({ tone: "error", message: inventorySaveErrorMessage });
      return;
    }

    const imageResult = await persistIngredientImageChange(data as StockItem);
    const savedItem = { ...(data as StockItem), image_storage_path: imageResult.ok ? imageResult.imageStoragePath : (data as StockItem).image_storage_path };
    rememberQuantityNotation(savedItem.id, values.unit, values.quantity);
    if (savedItem.archived_at || savedItem.quantity <= 0) {
      setArchivedInventoryItems((items) => [savedItem, ...items.filter((item) => item.id !== savedItem.id)].slice(0, 50));
    } else {
      setInventoryItems((items) => [savedItem, ...items]);
    }
    resetForm();
    setAddFlow(null);
    setFeedback({
      tone: imageResult.ok ? (imageResult.warning ? "info" : "success") : "error",
      message: imageResult.ok ? imageResult.warning ?? "在庫に追加しました。" : imageResult.error
    });
  }

  async function persistIngredientImageChange(
    item: StockItem
  ): Promise<{ ok: true; imageStoragePath: string | null; warning?: string } | { ok: false; error: string }> {
    const previousItemPath = editing?.item.id === item.id ? editing.item.image_storage_path : item.image_storage_path;
    const normalizedName = normalizeIngredientImageName(item.name);
    const previousUserImage = normalizedName ? userIngredientImages.find((image) => image.normalized_name === normalizedName) ?? null : null;

    if (!selectedIngredientImage && !removeInventoryImageOnSave && !removeUserNameImageOnSave) {
      return { ok: true, imageStoragePath: item.image_storage_path };
    }

    try {
      if (selectedIngredientImage) {
        const compressed = await compressIngredientImageFile(selectedIngredientImage);
        const extension = imageExtensionFromContentType(compressed.contentType);
        const inventoryPath = buildInventoryImageStoragePath(userId, item.id, extension);

        const { error: uploadError } = await supabase.storage.from(PHOTOS_BUCKET).upload(inventoryPath, compressed.blob, {
          contentType: compressed.contentType,
          cacheControl: "31536000",
          upsert: false
        });
        if (uploadError) return { ok: false, error: ingredientImageSaveErrorMessage };

        const { error: updateError } = await supabase
          .from("inventory_items")
          .update({ image_storage_path: inventoryPath })
          .eq("id", item.id)
          .eq("user_id", userId);
        if (updateError) {
          await supabase.storage.from(PHOTOS_BUCKET).remove([inventoryPath]);
          return { ok: false, error: ingredientImageSaveErrorMessage };
        }

        if (applyImageToSameName && normalizedName) {
          const userPath = buildUserIngredientImageStoragePath(userId, normalizedName, extension);
          const { error: userUploadError } = await supabase.storage.from(PHOTOS_BUCKET).upload(userPath, compressed.blob, {
            contentType: compressed.contentType,
            cacheControl: "31536000",
            upsert: false
          });
          if (userUploadError) {
            return { ok: true, imageStoragePath: inventoryPath, warning: "個別画像を保存しました。同じ食材名への記憶は失敗しました。" };
          }

          const nextUserImage = {
            user_id: userId,
            normalized_name: normalizedName,
            display_name: item.name,
            image_storage_path: userPath
          };
          const { error: upsertError } = await supabase.from("user_ingredient_images").upsert(nextUserImage, {
            onConflict: "user_id,normalized_name"
          });
          if (upsertError) {
            await supabase.storage.from(PHOTOS_BUCKET).remove([userPath]);
            return { ok: true, imageStoragePath: inventoryPath, warning: "個別画像を保存しました。同じ食材名への記憶は失敗しました。" };
          }

          setUserIngredientImages((images) => [
            ...images.filter((image) => image.normalized_name !== normalizedName),
            { normalized_name: normalizedName, image_storage_path: userPath }
          ]);
          if (previousUserImage?.image_storage_path && previousUserImage.image_storage_path !== userPath) {
            await supabase.storage.from(PHOTOS_BUCKET).remove([previousUserImage.image_storage_path]);
            invalidateUserImageSignedUrl(previousUserImage.image_storage_path);
          }
        }

        if (previousItemPath && previousItemPath !== inventoryPath) {
          await supabase.storage.from(PHOTOS_BUCKET).remove([previousItemPath]);
          invalidateUserImageSignedUrl(previousItemPath);
        }
        return { ok: true, imageStoragePath: inventoryPath };
      }

      let imageStoragePath = item.image_storage_path;
      if (removeInventoryImageOnSave && previousItemPath) {
        const { error: updateError } = await supabase
          .from("inventory_items")
          .update({ image_storage_path: null })
          .eq("id", item.id)
          .eq("user_id", userId);
        if (updateError) return { ok: false, error: ingredientImageSaveErrorMessage };
        await supabase.storage.from(PHOTOS_BUCKET).remove([previousItemPath]);
        invalidateUserImageSignedUrl(previousItemPath);
        imageStoragePath = null;
      }

      if (removeUserNameImageOnSave && previousUserImage) {
        const { error: deleteError } = await supabase
          .from("user_ingredient_images")
          .delete()
          .eq("user_id", userId)
          .eq("normalized_name", previousUserImage.normalized_name);
        if (deleteError) return { ok: false, error: ingredientImageSaveErrorMessage };
        await supabase.storage.from(PHOTOS_BUCKET).remove([previousUserImage.image_storage_path]);
        invalidateUserImageSignedUrl(previousUserImage.image_storage_path);
        setUserIngredientImages((images) => images.filter((image) => image.normalized_name !== previousUserImage.normalized_name));
      }

      return { ok: true, imageStoragePath };
    } catch {
      return { ok: false, error: ingredientImageSaveErrorMessage };
    }
  }

  function toggleScanCandidate(candidateId: string) {
    setSelectedScanCandidateIds((ids) => (ids.includes(candidateId) ? ids.filter((id) => id !== candidateId) : [...ids, candidateId]));
  }

  async function saveSelectedScanCandidates() {
    const selectedItems = scanCandidates
      .filter((candidate) => selectedScanCandidateIds.includes(candidate.clientId))
      .map((candidate) => candidate.item);

    if (selectedItems.length === 0) {
      setPhotoFeedback({ tone: "error", message: "在庫に追加する候補を1件以上選んでください。" });
      return;
    }

    setIsSaving(true);
    setPhotoFeedback(null);

    const { data, error } = await supabase
      .from("inventory_items")
      .insert(selectedItems)
      .select()
      .order("created_at", { ascending: false });

    setIsSaving(false);

    if (error || !data) {
      setPhotoFeedback({ tone: "error", message: "在庫に追加できませんでした。ログイン状態と候補の内容を確認してください。" });
      return;
    }

    setInventoryItems((items) => [...(data as StockItem[]), ...items]);
    setScanCandidates([]);
    setSelectedScanCandidateIds([]);
    setAddFlow(null);
    setFeedback({ tone: "success", message: `${selectedItems.length}件を在庫に追加しました。` });
  }

  async function adjustInventoryQuantity(item: StockItem, delta: number) {
    const nextQuantity = Math.max(0, roundQuantity(item.quantity + delta));
    setIsSaving(true);
    setFeedback(null);

    const { data, error } = await supabase
      .from("inventory_items")
      .update({
        quantity: nextQuantity,
        ...archiveFieldsForQuantity(nextQuantity, "manual_zero")
      })
      .eq("id", item.id)
      .eq("user_id", userId)
      .select()
      .single();

    setIsSaving(false);

    if (error || !data) {
      setFeedback({ tone: "error", message: "数量を更新できませんでした。ログイン状態を確認してください。" });
      return;
    }

    const savedItem = data as StockItem;
    if (savedItem.archived_at || savedItem.quantity <= 0) {
      setInventoryItems((items) => items.filter((current) => current.id !== item.id));
      setArchivedInventoryItems((items) => [savedItem, ...items.filter((current) => current.id !== item.id)].slice(0, 50));
      setSelectedInventoryIds((ids) => ids.filter((id) => id !== item.id));
      setFeedback({ tone: "info", message: `${item.name} は数量0になったため、通常一覧から復元履歴へ移しました。` });
      return;
    }

    setInventoryItems((items) => items.map((current) => (current.id === item.id ? savedItem : current)));
  }

  async function restoreArchivedInventory(item: StockItem) {
    const rawQuantity = restoreQuantities[item.id] ?? "1";
    const parsedQuantity = parseQuantityInput(rawQuantity);
    if (!parsedQuantity.ok || parsedQuantity.value <= 0) {
      setFeedback({ tone: "error", message: "原因: 復元数量に不備があります。影響: 在庫へ戻せません。修正方法: 0より大きい数量を入力してください。" });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const { data, error } = await supabase
      .from("inventory_items")
      .update({
        quantity: parsedQuantity.value,
        ...archiveFieldsForQuantity(parsedQuantity.value, "restore")
      })
      .eq("id", item.id)
      .eq("user_id", userId)
      .select()
      .single();

    setIsSaving(false);

    if (error || !data) {
      setFeedback({ tone: "error", message: "原因: 復元をDBへ保存できませんでした。影響: 食材は通常一覧へ戻りません。修正方法: ログイン状態を確認してください。" });
      return;
    }

    const restoredItem = data as StockItem;
    rememberQuantityNotation(restoredItem.id, restoredItem.unit, rawQuantity);
    setArchivedInventoryItems((items) => items.filter((current) => current.id !== restoredItem.id));
    setInventoryItems((items) => [restoredItem, ...items.filter((current) => current.id !== restoredItem.id)]);
    setRestoreQuantities((current) => {
      const next = { ...current };
      delete next[restoredItem.id];
      return next;
    });
    setFeedback({ tone: "success", message: `${restoredItem.name} を数量${displayQuantity(restoredItem.quantity, isFractionalUnit(restoredItem.unit) ? quantityNotations[restoredItem.id] : "decimal")}${restoredItem.unit}で戻しました。` });
  }

  async function deleteItem(_list: "inventory", item: StockItem) {
    setIsSaving(true);
    setFeedback(null);

    const { error } = await supabase.from("inventory_items").delete().eq("id", item.id).eq("user_id", userId);

    setIsSaving(false);

    if (error) {
      setFeedback({ tone: "error", message: "削除できませんでした。ログイン状態を確認してください。" });
      return;
    }

    clearQuantityNotation(item.id);
    setQuantityNotations((current) => {
      if (!(item.id in current)) return current;
      const next = { ...current };
      delete next[item.id];
      return next;
    });
    setInventoryItems((items) => items.filter((current) => current.id !== item.id));
    setSelectedInventoryIds((ids) => ids.filter((id) => id !== item.id));
    if (editing?.item.id === item.id) resetForm();
    setFeedback({ tone: "info", message: `${item.name} を削除しました。` });
  }

  return (
    <section className="inventory-workspace" aria-labelledby="inventory-heading">
      <div className="inventory-canvas-header">
        <div>
          <h2 id="inventory-heading">食材管理</h2>
          <p className="eyebrow">{activeView === "shopping" ? "SHOPPING LIST" : "ALL STORAGE"}</p>
          <h2 className="sr-only">在庫</h2>
        </div>

        <div className="canvas-mode-control inventory-view-control" aria-label="食材管理の表示切替">
          <button className="secondary-button compact-button inventory-view-tab" data-active={activeView === "inventory"} type="button" onClick={() => switchInventoryView("inventory")} data-tooltip="在庫リストを表示" data-tooltip-pos="bottom">
            食材管理
          </button>
          <button className="secondary-button compact-button inventory-view-tab" data-active={activeView === "shopping"} type="button" onClick={() => switchInventoryView("shopping")} data-tooltip="買い物リストを表示" data-tooltip-pos="bottom">
            買い物リスト
          </button>
          <button className="primary-button compact-button icon-action" type="button" onClick={openAddChoice} aria-label="食材を追加" data-tooltip="食材を追加" data-tooltip-pos="bottom-left">
            +
          </button>
        </div>
      </div>

      {feedback && addFlow !== "manual" ? (
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

      {addFlow === "choice" ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-choice-heading">
          <section className="stock-panel canvas-modal add-choice-modal" aria-labelledby="add-choice-heading">
            <button className="modal-close-button" type="button" onClick={closeAddModal} aria-label="閉じる" data-tooltip="追加モーダルを閉じる" data-tooltip-pos="bottom-left">×</button>
            <div className="panel-title">
              <div>
                <span>ADD STOCK</span>
                <h3 id="add-choice-heading">食材を追加</h3>
              </div>
            </div>
            <div className="add-choice-grid">
              <button className="add-choice-card scan-choice" type="button" onClick={openPhotoAdd} aria-label="画像スキャン" data-tooltip="写真をAIで解析して在庫に追加">
                <span>画像スキャン</span>
                <small>写真からAI候補を作り、確認してから在庫に追加します。</small>
              </button>
              <button className="add-choice-card manual-choice" type="button" onClick={openManualAdd} aria-label="手動で追加" data-tooltip="品名・数量を手入力して在庫に追加">
                <span>手動で追加</span>
                <small>品名や数量を入力して、在庫へ直接追加します。</small>
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {addFlow === "manual" ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="inventory-editor-heading">
        <section className="stock-panel canvas-modal inventory-editor-modal" aria-labelledby="inventory-editor-heading">
          <button className="modal-close-button" type="button" onClick={closeAddModal} aria-label="閉じる" data-tooltip="編集モーダルを閉じる" data-tooltip-pos="bottom-left">×</button>
          <div className="panel-title">
            <div>
              <span>{editingScanCandidateId ? "EDIT AI CANDIDATE" : editing ? "EDIT STOCK" : "MANUAL ADD"}</span>
              <h3 id="inventory-editor-heading">{editingScanCandidateId ? "AI候補を編集" : editing ? "在庫を編集" : "食材をリストへ"}</h3>
            </div>
          </div>

          <form className="stock-form" onSubmit={saveInventory}>
            {feedback ? (
              <p className="operation-message modal-operation-message" data-tone={feedback.tone} role={feedback.tone === "error" ? "alert" : "status"}>
                {feedback.message}
              </p>
            ) : null}
            <label>
              品名
              <input value={values.name} onChange={(event) => updateValue("name", event.target.value)} placeholder="例: 牛乳" />
            </label>
            {!editingScanCandidateId ? (
              <section
                className="ingredient-image-editor"
                aria-label="食材画像"
                data-dragging-over={isIngredientImageDraggingOver}
                data-active={isIngredientImageActive}
                {...ingredientImageDragHandlers}
                {...ingredientImagePasteAreaProps}
              >
                <div className="ingredient-image-preview">
                  {ingredientImagePreviewUrl ? (
                    <>
                      {/* Blob URL previews are local-only, so Next Image optimization is not useful here. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ingredientImagePreviewUrl} alt="選択した食材画像のプレビュー" />
                    </>
                  ) : editing && imageUrlForItem(editing.item) && !removeInventoryImageOnSave ? (
                    <>
                      {/* Supabase signed URLs are already scoped and short lived. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrlForItem(editing.item) ?? ""} alt="現在の食材画像" />
                    </>
                  ) : (
                    <IngredientIcon category={values.category} name={values.name || "食材"} size="lg" />
                  )}
                </div>
                <div className="ingredient-image-controls">
                  <label className="photo-file-button ingredient-image-file-button">
                    画像を選ぶ
                    <input
                      ref={ingredientImageInputRef}
                      accept="image/*"
                      capture="environment"
                      type="file"
                      onChange={selectIngredientImage}
                      disabled={isSaving}
                    />
                  </label>
                  <label className="image-memory-toggle">
                    <input
                      checked={applyImageToSameName}
                      disabled={isSaving}
                      onChange={(event) => setApplyImageToSameName(event.currentTarget.checked)}
                      type="checkbox"
                    />
                    同じ食材名にも使う
                  </label>
                  <div className="ingredient-image-remove-row">
                    <button
                      className="secondary-button compact-button"
                      type="button"
                      disabled={isSaving || (!selectedIngredientImage && !ingredientImagePreviewUrl)}
                      onClick={resetIngredientImageSelection}
                      data-tooltip="選択した食材画像をリセット"
                    >
                      選択を取り消す
                    </button>
                    {editing?.item.image_storage_path ? (
                      <button
                        className="danger-button compact-button"
                        type="button"
                        disabled={isSaving}
                        onClick={() => {
                          resetIngredientImageSelection();
                          setRemoveInventoryImageOnSave(true);
                        }}
                        data-tooltip="この食材のみの個別画像を削除"
                      >
                        個別画像を削除
                      </button>
                    ) : null}
                    {currentUserNameImage() ? (
                      <button
                        className="danger-button compact-button"
                        type="button"
                        disabled={isSaving}
                        onClick={() => {
                          resetIngredientImageSelection();
                          setRemoveUserNameImageOnSave(true);
                        }}
                        data-tooltip="同じ品名に設定した画像を削除"
                      >
                        同名画像を削除
                      </button>
                    ) : null}
                  </div>
                  {removeInventoryImageOnSave || removeUserNameImageOnSave ? (
                    <p className="ingredient-image-note">保存すると画像を削除し、標準画像または絵文字へ戻します。</p>
                  ) : (
                    <p className="ingredient-image-note">画像は非公開Storageへ保存します。公開URLは保存しません。</p>
                  )}
                  <p className="photo-paste-hint ingredient-image-paste-hint" data-active={isIngredientImageActive} aria-live="polite">
                    {isIngredientImageActive
                      ? "クリップボードから貼り付け可（Ctrl+V）"
                      : "画像エリアをクリックすると Ctrl+V で貼り付けできます"}
                  </p>
                </div>
              </section>
            ) : null}
            <div className="form-row two-columns">
              <label>
                分類
                <select value={values.category} onChange={(event) => updateValue("category", event.target.value as StockItemFormValues["category"])}>
                  <option value="食材">食材</option>
                  <option value="調味料">調味料</option>
                </select>
              </label>
              <div className="genre-field-label">
                <span>保存場所</span>
                <LocationTagPicker
                  value={values.storage_location}
                  candidates={storageLocationOptions}
                  onSelect={(name) => updateValue("storage_location", name)}
                  onCreate={addStorageLocation}
                />
              </div>
            </div>
            <div className="form-row two-columns">
              <div className="genre-field-label">
                <span>数量・単位</span>
                <div className="qty-unit-wrap">
                  <NumberField
                    ariaLabel="数量"
                    value={values.quantity}
                    onChange={(next) => updateValue("quantity", next)}
                    allowFraction={isFractionalUnit(values.unit)}
                  />
                  <UnitPicker value={values.unit} onSelect={(unit) => updateValue("unit", unit)} />
                </div>
              </div>
              <label>
                表示期限
                <input type="date" value={values.display_expires_on} onChange={(event) => updateValue("display_expires_on", event.target.value)} />
              </label>
            </div>
            <div className="unit-conversion-fields">
              <span className="unit-conversion-label">単位換算</span>
              <div className="conversion-row">
                <span className="conversion-from-label">1{values.unit || "—"}</span>
                <span className="conversion-equals">=</span>
                <NumberField
                  ariaLabel="換算先数量"
                  placeholder="1000"
                  value={values.conversion_to_qty}
                  onChange={(next) => updateValue("conversion_to_qty", next)}
                />
                <UnitPicker value={values.conversion_to_unit} onSelect={(unit) => updateValue("conversion_to_unit", unit)} ariaLabel="換算先単位" />
              </div>
              <p>例: 1本 = 1000ml。料理完了時に双方向で換算します。</p>
            </div>
            <div className="form-row two-columns">
              <label>
                購入日
                <input type="date" value={values.purchase_date} onChange={(event) => updateValue("purchase_date", event.target.value)} />
              </label>
              <label className="indigo-date-label">
                開封日 (推測用)
                <input className="indigo-date-input" type="date" value={values.effective_expires_on} onChange={(event) => updateValue("effective_expires_on", event.target.value)} />
              </label>
            </div>
            <label>
              メモ
              <textarea rows={2} value={values.status_note} onChange={(event) => updateValue("status_note", event.target.value)} />
            </label>
            {editing ? (
              <div className="ai-limit-card">
                <label>AI判定済 実質期限</label>
                <input
                  className="ai-limit-input"
                  type="date"
                  value={values.effective_expires_on}
                  onChange={(event) => updateValue("effective_expires_on", event.target.value)}
                />
                <span className="ai-limit-badge">AI</span>
              </div>
            ) : null}
            <div className="form-actions">
              {editingScanCandidateId ? (
                <button className="secondary-button submit-large" type="button" disabled={isSaving} onClick={closeAddModal} data-tooltip="編集をキャンセルして閉じる">
                  キャンセル
                </button>
              ) : null}
              <button className="primary-button submit-large" type="submit" disabled={isSaving} data-tooltip={editingScanCandidateId ? "AI候補の内容を更新" : editing ? "在庫の内容を更新して保存" : "入力した内容を在庫に追加"}>
                {editingScanCandidateId ? "候補を更新" : editing ? "内容を更新する" : "在庫に追加"}
              </button>
            </div>
          </form>
        </section>
        </div>
      ) : null}

      {addFlow === "photo" ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="photo-capture-heading">
        <section className="stock-panel canvas-modal inventory-editor-modal photo-scan-modal" aria-labelledby="photo-capture-heading">
          <button className="modal-close-button" type="button" onClick={closeAddModal} aria-label="閉じる" data-tooltip="写真スキャンモーダルを閉じる" data-tooltip-pos="bottom-left">×</button>
          <section className="photo-capture-panel" aria-labelledby="photo-capture-heading">
              <div className="photo-capture-heading">
                <div>
                  <span>写真登録</span>
                  <h4 id="photo-capture-heading">写真を解析して在庫へ</h4>
                </div>
                <label className="photo-file-button">
                  {selectedPhotos.length > 0 ? "次の写真を撮る" : "写真を撮る"}
                  <input
                    ref={photoInputRef}
                    accept="image/*"
                    capture="environment"
                    multiple
                    type="file"
                    onChange={selectPhoto}
                    disabled={isUploadingPhoto}
                  />
                </label>
              </div>

              {photoPreviewUrls.length > 0 ? (
                <div className="photo-preview-grid" aria-label="選択した食材写真">
                  {photoPreviewUrls.map((url, index) => (
                    <div className="photo-preview" key={`${url}-${index}`}>
                      {/* Blob URL previews are local-only, so Next Image optimization is not useful here. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`選択した食材写真のプレビュー ${index + 1}`} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="photo-empty">写真は非公開で保存し、入力したGemini APIキーでAI解析します。APIキーはDBに保存しません。</p>
              )}

              {photoFeedback ? (
                <p className="operation-message photo-message" data-tone={photoFeedback.tone} role={photoFeedback.tone === "error" ? "alert" : "status"}>
                  {photoFeedback.message}
                </p>
              ) : null}

              {pendingScanRetryPhotoIds ? (
                <section className="ai-fallback-panel" aria-label="Gemini API再実行">
                  <p>無料APIでエラーになりました。保存済み写真を使ってAI解析だけ再実行できます。</p>
                  <small>有料APIキーを使用します。Google側で料金が発生する可能性があります。</small>
                  <div className="ai-fallback-actions">
                    <button className="secondary-button" type="button" disabled={isUploadingPhoto || scanLimitReached} onClick={() => retryIngredientScan("free")}>
                      無料APIで再試行
                    </button>
                    <button className="primary-button" type="button" disabled={isUploadingPhoto || scanLimitReached} onClick={() => retryIngredientScan("paid")}>
                      有料APIで続行
                    </button>
                    <button className="secondary-button" type="button" disabled={isUploadingPhoto} onClick={cancelIngredientScanRetry}>
                      キャンセル
                    </button>
                  </div>
                </section>
              ) : null}

              <div className="photo-actions">
                <button className="primary-button" type="button" disabled={selectedPhotos.length === 0 || isUploadingPhoto || isSaving || scanLimitReached} onClick={scanPhoto} data-tooltip="選択した写真をAIで解析して候補を作成">
                  {isUploadingPhoto ? "解析中" : "AI解析する"}
                </button>
                <button className="secondary-button" type="button" disabled={selectedPhotos.length === 0 || isUploadingPhoto} onClick={resetPhoto} data-tooltip="選択した写真をリセット">
                  別の写真にする
                </button>
              </div>
          </section>

          {scanCandidates.length > 0 ? (
            <section className="scan-candidate-panel" aria-labelledby="scan-candidate-heading">
              <div className="panel-title">
                <div>
                  <span>AI候補</span>
                  <h3 id="scan-candidate-heading">確認して在庫に追加</h3>
                </div>
                <strong>{selectedScanCandidateIds.length}件選択中</strong>
              </div>
              <div className="scan-candidate-list">
                {scanCandidates.map((candidate) => (
                  <article className="scan-candidate-card" key={candidate.clientId}>
                    <label className="select-row">
                      <input
                        checked={selectedScanCandidateIds.includes(candidate.clientId)}
                        disabled={isSaving}
                        onChange={() => toggleScanCandidate(candidate.clientId)}
                        type="checkbox"
                      />
                      選択
                    </label>
                    <IngredientIcon className="scan-candidate-icon" name={candidate.item.name} size="sm" />
                    <div className="scan-candidate-main">
                      <h4>{candidate.item.name}</h4>
                      <p>{displayQuantity(candidate.item.quantity, isFractionalUnit(candidate.item.unit) ? undefined : "decimal")}{candidate.item.unit} · {candidate.item.storage_location}</p>
                      {candidate.item.display_expires_on || candidate.item.effective_expires_on ? (
                        <small>期限 {candidate.item.effective_expires_on ?? candidate.item.display_expires_on}</small>
                      ) : null}
                    </div>
                    <button className="secondary-button compact-button" type="button" disabled={isSaving} onClick={() => editScanCandidate(candidate)} data-tooltip={`${candidate.item.name}の候補を編集`}>
                      編集
                    </button>
                  </article>
                ))}
              </div>
              <button className="primary-button submit-large" type="button" disabled={isSaving} onClick={saveSelectedScanCandidates} data-tooltip="チェックした候補を在庫に追加">
                選択した候補を在庫に追加
              </button>
            </section>
          ) : null}
        </section>
        </div>
      ) : null}

      <div className="inventory-grid">

        {activeView === "shopping" ? (
        <section className="stock-panel canvas-panel-wide shopping-empty-panel" aria-labelledby="shopping-list-heading">
          <div className="shopping-heading-row">
            <h3 id="shopping-list-heading">買い物リスト</h3>
            <button
              className="danger-button compact-button"
              type="button"
              disabled={isSaving || selectedShoppingIds.length === 0}
              onClick={() => requestDelete(`${selectedShoppingIds.length}件の買い物`, "選択した買い物を削除します。元には戻せません。", deleteSelectedShoppingItems)}
              data-tooltip="選択した買い物項目を削除"
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
            <NumberField
              ariaLabel="買い物の数量"
              placeholder="1"
              value={shoppingValues.required_quantity}
              onChange={(next) => updateShoppingValue("required_quantity", next)}
            />
            <UnitPicker value={shoppingValues.unit} onSelect={(unit) => updateShoppingValue("unit", unit)} ariaLabel="買い物の単位" />
            <button className="primary-button compact-button" type="submit" disabled={isSaving} data-tooltip="入力した品目を買い物リストに追加">
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
            userImageUrls={ingredientImageUrls}
            userIngredientImages={userIngredientImages}
          />
          <ShoppingListSection
            emptyText="購入済みの買い物はありません。"
            items={purchasedShoppingItems}
            onSelect={toggleShoppingSelected}
            selectedIds={selectedShoppingIds}
            title="購入済み"
            userImageUrls={ingredientImageUrls}
            userIngredientImages={userIngredientImages}
          />
        </section>
        ) : null}

        {activeView === "inventory" ? (
        <section className="canvas-inventory-list" aria-labelledby="inventory-list-heading">
          <div className="inventory-category-row" aria-label="カテゴリフィルタ">
            {inventoryCategoryFilterOptions.map((option) => (
              <button
                className="inventory-category-chip"
                data-active={inventoryFilters.category === option.value}
                key={option.value}
                type="button"
                onClick={() => updateInventoryFilter("category", option.value)}
                data-tooltip={`${option.label}のみ表示`}
              >
                {option.label}
                <span>
                  {option.value === "all" ? inventoryItems.length : inventoryItems.filter((item) => item.category === option.value).length}
                </span>
              </button>
            ))}
          </div>

          <div className="location-tab-row" aria-label="保存場所タブ">
            <button className="location-tab" data-active={inventoryFilters.storageLocation === "all"} type="button" onClick={() => updateInventoryFilter("storageLocation", "all")} data-tooltip="全保存場所を表示">
              すべて <span>{inventoryItems.length}</span>
            </button>
            <button className="location-tab" data-active={inventoryFilters.expiry === "has_expiry"} type="button" onClick={() => updateInventoryFilter("expiry", inventoryFilters.expiry === "has_expiry" ? "all" : "has_expiry")} data-tooltip="数量0の食材を表示">
              使い切り <span>{inventoryItems.filter((item) => item.quantity === 0).length}</span>
            </button>
            {storageLocationOptions.map((location) => (
              <button
                className="location-tab"
                data-active={inventoryFilters.storageLocation === location}
                key={location}
                type="button"
                onClick={() => updateInventoryFilter("storageLocation", location)}
                data-tooltip={`${location}の食材を表示`}
              >
                {location} <span>{inventoryItems.filter((item) => item.storage_location === location).length}</span>
              </button>
            ))}
          </div>

          <div className="canvas-sort-row" aria-label="在庫の並び替え">
            <span>並び</span>
            <button data-active={inventoryFilters.sort === "expiry_asc"} type="button" onClick={() => updateInventoryFilter("sort", "expiry_asc")} data-tooltip="賞味期限の近い順に並び替え">
              期限順 ▲
            </button>
            <button data-active={inventoryFilters.sort === "name_asc"} type="button" onClick={() => updateInventoryFilter("sort", "name_asc")} data-tooltip="品名の五十音順に並び替え">
              名前順
            </button>
            <button data-active={inventoryFilters.sort === "created_desc"} type="button" onClick={() => updateInventoryFilter("sort", "created_desc")} data-tooltip="登録日の新しい順に並び替え">
              購入日順
            </button>
          </div>

          <ItemList
            emptyText="在庫はありません。右上の＋から追加してください。"
            items={filteredInventoryItems}
            imageUrls={ingredientImageUrls}
            list="inventory"
            notations={quantityNotations}
            customFractions={customFractions}
            onDelete={(list, item) => requestDelete(item.name, "この在庫を削除します。元には戻せません。", () => deleteItem(list, item))}
            onEdit={startEdit}
            onQuantityChange={adjustInventoryQuantity}
            onSelect={toggleSelected}
            selectedIds={selectedInventoryIds}
            toolbar={
              <ListToolbar
                disabled={isSaving}
                itemIds={filteredInventoryItems.map((item) => item.id)}
                onClear={() => clearSelected("inventory")}
                onDeleteSelected={() => requestDelete(`${selectedInventoryIds.length}件の食材`, "選択した在庫を削除します。元には戻せません。", deleteSelectedInventoryItems)}
                onSelectAll={(ids) => selectAllVisible("inventory", ids)}
                selectedCount={selectedInventoryIds.length}
                showDelete
              />
            }
            disabled={isSaving}
            userIngredientImages={userIngredientImages}
          />

          <section className="inventory-archive-panel" aria-labelledby="inventory-archive-heading">
            <div>
              <h3 id="inventory-archive-heading">復元履歴</h3>
              <p>数量0になった食材の直近50件</p>
            </div>
            {archivedInventoryItems.length === 0 ? (
              <p className="empty-list">復元できる0在庫はありません。</p>
            ) : (
              <div className="inventory-archive-list">
                {archivedInventoryItems.map((item) => (
                  <article className="inventory-archive-item" key={item.id}>
                    <IngredientIcon category={item.category} className="stock-item-icon" imageUrl={resolveItemImageUrl(item, userIngredientImages, ingredientImageUrls)} name={item.name} size="sm" />
                    <div className="item-main">
                      <h4>{item.name}</h4>
                      <p>
                        {item.storage_location} · 0在庫 {compactDate((item.archived_at ?? item.updated_at).slice(0, 10)) || "-"}
                      </p>
                    </div>
                    <NumberField
                      ariaLabel={`${item.name}の復元数量`}
                      allowFraction={isFractionalUnit(item.unit)}
                      min={0}
                      onChange={(next) => setRestoreQuantities((current) => ({ ...current, [item.id]: next }))}
                      placeholder="1"
                      showSteppers={false}
                      value={restoreQuantities[item.id] ?? "1"}
                    />
                    <span className="restore-unit">{item.unit}</span>
                    <button className="secondary-button compact-button" disabled={isSaving} type="button" onClick={() => restoreArchivedInventory(item)} data-tooltip={`${item.name}を在庫に復元`}>
                      戻す
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
        ) : null}
      </div>
    </section>
  );
}

type ItemListProps = {
  disabled: boolean;
  emptyText: string;
  imageUrls: Map<string, string>;
  items: StockItem[];
  list: "inventory";
  notations: Record<string, QuantityNotation>;
  customFractions: string[];
  onDelete: (list: "inventory", item: StockItem) => void;
  onEdit: (list: "inventory", item: StockItem) => void;
  onQuantityChange?: (item: StockItem, delta: number) => void;
  onSelect: (list: "inventory", itemId: string) => void;
  selectedIds: string[];
  toolbar: ReactNode;
  userIngredientImages: UserIngredientImage[];
};

function ItemList({ disabled, emptyText, imageUrls, items, list, notations, customFractions, onDelete, onEdit, onQuantityChange, onSelect, selectedIds, toolbar, userIngredientImages }: ItemListProps) {
  if (items.length === 0) {
    return <p className="empty-list">{emptyText}</p>;
  }

  return (
    <div className="stock-list">
      {toolbar}
      {items.map((item) => {
        const itemImageUrl = resolveItemImageUrl(item, userIngredientImages, imageUrls);
        const badge = expiryBadge(item);
        return (
        <article
          className="stock-item"
          key={item.id}
          data-has-bg={itemImageUrl ? "true" : undefined}
          style={itemImageUrl ? ({ "--bg-image": `url(${itemImageUrl})` } as CSSProperties) : undefined}
        >
          <IngredientIcon category={item.category} className="stock-item-icon" imageUrl={itemImageUrl} name={item.name} size="md" />
          <label className="select-row">
            <input
              checked={selectedIds.includes(item.id)}
              disabled={disabled}
              onChange={() => onSelect(list, item.id)}
              type="checkbox"
            />
            選択
          </label>
          <div className="item-main">
            <div className="item-title-row">
              <h4>{item.name}</h4>
            </div>
            <p>{item.storage_location} · 購入 {compactDate(item.created_at.slice(0, 10)) || "-"}</p>
            <div className="item-badge-row" data-empty={!badge}>
              {badge ? <span className="expiry-chip" data-tone={badge.tone}>{badge.label}</span> : null}
            </div>
          </div>
          <p className="item-note" data-empty={!item.status_note} aria-hidden={!item.status_note}>
            {item.status_note}
          </p>
          {onQuantityChange || item.unit_conversion ? (
            <div className="quantity-meta">
              {onQuantityChange ? (
                <div className="quantity-stepper" aria-label={`${item.name}の数量`}>
                  <button type="button" disabled={disabled || item.quantity <= 0} onClick={() => onQuantityChange(item, item.unit === "g" || item.unit === "ml" ? -50 : -1)} data-tooltip={`${item.name}の数量を減らす`}>
                    -
                  </button>
                  <span>
                    {displayQuantity(item.quantity, isFractionalUnit(item.unit) ? notations[item.id] : "decimal", customFractions)}
                    <small>{item.unit}</small>
                  </span>
                  <button type="button" disabled={disabled} onClick={() => onQuantityChange(item, item.unit === "g" || item.unit === "ml" ? 50 : 1)} data-tooltip={`${item.name}の数量を増やす`}>
                    +
                  </button>
                </div>
              ) : null}
              <span className="conversion-slot" data-empty={!item.unit_conversion}>
                {item.unit_conversion ? <span className="conversion-chip">{unitConversionLabel(item)}</span> : null}
              </span>
            </div>
          ) : null}
          <div className="item-actions">
            <button className="secondary-button icon-button" type="button" disabled={disabled} onClick={() => onEdit(list, item)} aria-label={`${item.name}を編集`} data-tooltip={`${item.name}を編集`} data-tooltip-pos="left">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m16.9 4.1 3 3L8 19H5v-3L16.9 4.1Z" />
              </svg>
            </button>
            <button className="danger-button icon-button" type="button" disabled={disabled} onClick={() => onDelete(list, item)} aria-label={`${item.name}を削除`} data-tooltip={`${item.name}を削除`} data-tooltip-pos="left">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6M14 10v6" />
              </svg>
            </button>
          </div>
        </article>
        );
      })}
    </div>
  );
}

function resolveItemImageUrl(item: StockItem, userIngredientImages: UserIngredientImage[], imageUrls: Map<string, string>) {
  if (item.image_storage_path) return imageUrls.get(item.image_storage_path) ?? null;
  const userImage = resolveUserIngredientImage(item.name, userIngredientImages);
  return userImage ? imageUrls.get(userImage.image_storage_path) ?? null : null;
}

type ListToolbarProps = {
  disabled: boolean;
  itemIds: string[];
  onClear: () => void;
  onDeleteSelected?: () => void;
  onSelectAll: (itemIds: string[]) => void;
  selectedCount: number;
  showDelete?: boolean;
};

function ListToolbar({ disabled, itemIds, onClear, onDeleteSelected, onSelectAll, selectedCount, showDelete = false }: ListToolbarProps) {
  return (
    <div className="bulk-toolbar" aria-label="一括操作">
      <label className="select-row">
        <input
          checked={itemIds.length > 0 && selectedCount === itemIds.length}
          disabled={disabled || itemIds.length === 0}
          onChange={(event) => (event.currentTarget.checked ? onSelectAll(itemIds) : onClear())}
          type="checkbox"
        />
        すべて選択
      </label>
      <button className="secondary-button compact-button" type="button" disabled={disabled || itemIds.length === 0} onClick={() => onSelectAll(itemIds)} data-tooltip="表示中の全項目を選択">
        すべて選択
      </button>
      <button className="secondary-button compact-button" type="button" disabled={disabled || selectedCount === 0} onClick={onClear} data-tooltip="選択をすべて解除">
        選択解除
      </button>
      {showDelete && onDeleteSelected ? (
        <button className="danger-button compact-button bulk-delete-button" type="button" disabled={disabled || selectedCount === 0} onClick={onDeleteSelected} data-tooltip="選択した項目を削除">
          選択削除
        </button>
      ) : null}
    </div>
  );
}

function locationPaletteIndex(name: string) {
  const sum = Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return sum % 7;
}

// レシピのジャンルタグ(AppSheet風)と同じUI・CSSを流用した、保存場所用の単一選択タグピッカー。
function LocationTagPicker({
  value,
  candidates,
  onSelect,
  onCreate
}: {
  value: string;
  candidates: string[];
  onSelect: (name: string) => void;
  onCreate: (name: string) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedQuery = query.trim();
  const filtered = candidates.filter((name) => !normalizedQuery || name.toLowerCase().includes(normalizedQuery.toLowerCase()));
  const canCreate = Boolean(normalizedQuery) && !candidates.some((name) => name.toLowerCase() === normalizedQuery.toLowerCase());

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const select = (name: string) => {
    onSelect(name);
    setQuery("");
    setOpen(false);
  };
  const create = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSelect(trimmed);
    void onCreate(trimmed);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="genre-picker" ref={containerRef}>
      <div className="genre-field" onClick={() => setOpen(true)}>
        {value ? (
          <div className="genre-tags">
            <span className="genre-tag" data-palette={locationPaletteIndex(value)}>
              <span className="genre-tag-name">{value}</span>
              <button
                className="genre-tag-remove"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect("");
                }}
                aria-label="保存場所を外す"
                data-tooltip="保存場所の選択を外す"
              >
                ×
              </button>
            </span>
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
              const first = filtered[0];
              if (first) select(first);
              else if (canCreate) create(normalizedQuery);
            } else if (event.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder="保存場所を検索・追加"
          aria-label="保存場所を検索・追加"
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
            if (normalizedQuery) create(normalizedQuery);
            else setOpen(true);
          }}
          aria-label="保存場所を追加"
          data-tooltip="入力した保存場所を追加"
        >
          ＋
        </button>
      </div>
      {open ? (
        <div className="genre-popover">
          <div className="genre-popover-head">
            <span className="genre-selected-count">
              <span className="genre-selected-check" aria-hidden="true">✓</span>
              {value ? value : "未選択"}
            </span>
            <span className="genre-popover-eyebrow">PLACE</span>
          </div>
          <div className="genre-popover-list">
            {filtered.map((name) => {
              const isSelected = value === name;
              return (
                <button className="genre-option" data-selected={isSelected} type="button" key={name} onClick={() => select(name)} title={isSelected ? `${name} を外す` : `${name} を選択`}>
                  <span className="genre-option-check" data-on={isSelected} aria-hidden="true">
                    ✓
                  </span>
                  <span className="genre-option-name">{name}</span>
                </button>
              );
            })}
            {canCreate ? (
              <button className="genre-option genre-option-create" type="button" onClick={() => create(normalizedQuery)} title={`新しい保存場所「${normalizedQuery}」を作成`}>
                <span className="genre-option-check genre-option-create-icon" aria-hidden="true">
                  ＋
                </span>
                <span className="genre-option-name">新規作成「{normalizedQuery}」を追加</span>
              </button>
            ) : null}
            {filtered.length === 0 && !canCreate ? <p className="genre-popover-empty">該当する保存場所はありません</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
