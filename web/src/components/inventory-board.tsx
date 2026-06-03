"use client";

import { ChangeEvent, FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AiUsageMeter } from "@/components/ai-usage-meter";
import { DeleteConfirmPanel } from "@/components/delete-confirm-panel";
import { GeminiApiKeyPanel } from "@/components/gemini-api-key-panel";
import { ShoppingListSection } from "@/components/shopping-list-section";
import { NumberField } from "@/components/number-field";
import { UnitPicker } from "@/components/unit-picker";
import { useShellAiUsage, useShellSubView, type InventoryShellLeaf } from "@/components/web-mode-shell";
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
import { buildPhotoStoragePath, compressImageFile } from "@/lib/photos/compress";

type InventoryBoardProps = {
  userId: string;
  initialInventoryItems: StockItem[];
  initialShoppingItems?: ShoppingItem[];
  initialStorageLocations?: StorageLocation[];
};

type Feedback = {
  tone: "success" | "error" | "info";
  message: string;
};

const inventorySaveErrorMessage =
  "原因: 在庫をDBへ保存できませんでした。影響: 入力した食材は在庫一覧に追加されません。修正方法: ログイン状態と入力内容を確認してください。";

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

type InventoryInsert = Omit<StockItem, "id" | "created_at" | "updated_at">;

type ScanCandidate = {
  clientId: string;
  item: InventoryInsert;
};

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
  const quantity = Number(values.quantity);

  if (!values.name.trim()) {
    return { error: "品名を入力してください。" };
  }

  if (!Number.isFinite(quantity) || quantity < 0) {
    return { error: "数量は0以上の数字で入力してください。" };
  }

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

function stockItemIcon(item: StockItem) {
  if (item.category === "調味料") return "SP";
  if (item.source === "photo") return "AI";
  return "FD";
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

export function InventoryBoard({
  userId,
  initialInventoryItems,
  initialShoppingItems = [],
  initialStorageLocations = []
}: InventoryBoardProps) {
  const [inventoryItems, setInventoryItems] = useState(initialInventoryItems);
  const [shoppingItems, setShoppingItems] = useState(initialShoppingItems);
  const [selectedShoppingIds, setSelectedShoppingIds] = useState<string[]>([]);
  const [shoppingValues, setShoppingValues] = useState<ShoppingFormValues>({ name: "", required_quantity: "1", unit: "個" });
  const [storageLocations, setStorageLocations] = useState(initialStorageLocations);
  const [values, setValues] = useState<StockItemFormValues>(emptyStockItemFormValues);
  const [editing, setEditing] = useState<EditingTarget>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [addFlow, setAddFlow] = useState<AddFlow>(null);
  const [photoFeedback, setPhotoFeedback] = useState<Feedback | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [scanCandidates, setScanCandidates] = useState<ScanCandidate[]>([]);
  const [selectedScanCandidateIds, setSelectedScanCandidateIds] = useState<string[]>([]);
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
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const { aiUsageSummary, refreshAiUsage } = useShellAiUsage();
  const { selectedSubViews, selectShellLeaf } = useShellSubView();
  const scanLimitReached = Boolean(
    aiUsageSummary?.ok && (aiUsageSummary.ingredient_scan.remaining <= 0 || aiUsageSummary.total.remaining <= 0)
  );

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
    router.refresh();
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
    router.refresh();
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
    router.refresh();
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
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  function updateValue<K extends keyof StockItemFormValues>(key: K, value: StockItemFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setValues(emptyStockItemFormValues);
    setEditing(null);
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
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setSelectedPhoto(null);
    setPhotoPreviewUrl(null);
    setPhotoFeedback(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      resetPhoto();
      setPhotoFeedback({
        tone: "error",
        message: "原因: 画像ではないファイルです。影響: 写真を保存できません。修正方法: カメラで撮影するか画像を選んでください。"
      });
      return;
    }

    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setSelectedPhoto(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
    setPhotoFeedback({ tone: "info", message: "写真を選びました。内容を確認してから保存してください。" });
  }

  async function scanPhoto() {
    if (!selectedPhoto) {
      setPhotoFeedback({
        tone: "error",
        message: "原因: 写真が未選択です。影響: AI解析できません。修正方法: 先に写真を撮るか選んでください。"
      });
      return;
    }

    const trimmedApiKey = geminiApiKey.trim();
    if (!trimmedApiKey) {
      setPhotoFeedback({
        tone: "error",
        message: "原因: ユーザー自身のGemini APIキーが未入力です。影響: AI解析を実行できません。修正方法: Gemini APIキーを入力してから再度お試しください。"
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
    setPhotoFeedback(null);

    try {
      const compressed = await compressImageFile(selectedPhoto);
      const storagePath = buildPhotoStoragePath(userId);
      const { error: uploadError } = await supabase.storage.from("photos").upload(storagePath, compressed.blob, {
        contentType: compressed.contentType,
        upsert: false
      });

      if (uploadError) {
        setPhotoFeedback({
          tone: "error",
          message: "原因: 写真をStorageへ保存できませんでした。影響: AI解析用の写真が残りません。修正方法: 通信状態とログイン状態を確認してください。"
        });
        return;
      }

      const { data: photo, error: insertError } = await supabase
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

      if (insertError || !photo) {
        await supabase.storage.from("photos").remove([storagePath]);
        setPhotoFeedback({
          tone: "error",
          message: "原因: 写真情報をDBへ保存できませんでした。影響: 保存した写真を後で探せません。修正方法: ログイン状態を確認して再度保存してください。"
        });
        return;
      }

      setPhotoFeedback({ tone: "info", message: "写真を保存しました。AIで食材候補を解析しています。" });

      const scanResponse = await fetch("/api/ai/scan-ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ photoId: photo.id, geminiApiKey: trimmedApiKey })
      });
      const scanResult = (await scanResponse.json().catch(() => ({}))) as ScanIngredientsResponse;

      // 成功・429いずれの場合も残り回数表示を更新する。
      void refreshAiUsage();

      if (!scanResponse.ok || scanResult.error || !scanResult.items) {
        setPhotoFeedback({
          tone: "error",
          message:
            scanResult.error ||
            "原因: AI解析結果を取得できませんでした。影響: 食材候補を作成できません。修正方法: 時間を置いて再度解析してください。"
        });
        return;
      }

      const candidates = (scanResult.items ?? []).map((item, index) => ({
        clientId: `${Date.now()}-${index}`,
        item
      }));
      setScanCandidates(candidates);
      setSelectedScanCandidateIds(candidates.map((candidate) => candidate.clientId));
      resetPhoto();
      setPhotoFeedback({ tone: "success", message: `${candidates.length}件の候補を見つけました。確認してから在庫に追加してください。` });
    } catch {
      setPhotoFeedback({
        tone: "error",
        message: "原因: 写真の保存またはAI解析に失敗しました。影響: 食材候補を作成できません。修正方法: 別の写真で撮り直してください。"
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  function startEdit(_list: "inventory", item: StockItem) {
    setValues(toFormValues(item));
    setEditing({ item });
    setAddFlow("manual");
    setFeedback({ tone: "info", message: `${item.name} を編集中です。` });
  }

  function editScanCandidate(candidate: ScanCandidate) {
    setValues({
      category: candidate.item.category,
      name: candidate.item.name,
      quantity: String(candidate.item.quantity),
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
    setScanCandidates((items) => items.filter((item) => item.clientId !== candidate.clientId));
    setSelectedScanCandidateIds((ids) => ids.filter((id) => id !== candidate.clientId));
    setAddFlow("manual");
    setPhotoFeedback({ tone: "info", message: `${candidate.item.name} をフォームで編集中です。保存すると在庫に追加されます。` });
  }

  async function saveInventory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeForm(values, userId);
    if ("error" in normalized) {
      setFeedback({ tone: "error", message: normalized.error });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    if (editing) {
      const { data, error } = await supabase
        .from("inventory_items")
        .update(normalized.data)
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

      setInventoryItems((items) => items.map((item) => (item.id === data.id ? (data as StockItem) : item)));
      resetForm();
      setAddFlow(null);
      setFeedback({ tone: "success", message: "内容を更新しました。" });
      return;
    }

    const { data, error } = await supabase.from("inventory_items").insert(normalized.data).select().single();
    setIsSaving(false);

    if (error || !data) {
      logInventorySaveError("insert", error);
      setFeedback({ tone: "error", message: inventorySaveErrorMessage });
      return;
    }

    setInventoryItems((items) => [data as StockItem, ...items]);
    resetForm();
    setAddFlow(null);
    setFeedback({ tone: "success", message: "在庫に追加しました。" });
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
    const nextQuantity = Math.max(0, Number((item.quantity + delta).toFixed(2)));
    setIsSaving(true);
    setFeedback(null);

    const { data, error } = await supabase
      .from("inventory_items")
      .update({ quantity: nextQuantity })
      .eq("id", item.id)
      .eq("user_id", userId)
      .select()
      .single();

    setIsSaving(false);

    if (error || !data) {
      setFeedback({ tone: "error", message: "数量を更新できませんでした。ログイン状態を確認してください。" });
      return;
    }

    setInventoryItems((items) => items.map((current) => (current.id === item.id ? (data as StockItem) : current)));
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
          <button className="secondary-button compact-button inventory-view-tab" data-active={activeView === "inventory"} type="button" onClick={() => switchInventoryView("inventory")}>
            食材管理
          </button>
          <button className="secondary-button compact-button inventory-view-tab" data-active={activeView === "shopping"} type="button" onClick={() => switchInventoryView("shopping")}>
            買い物リスト
          </button>
          <button className="primary-button compact-button icon-action" type="button" onClick={openAddChoice} aria-label="食材を追加">
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
            <button className="modal-close-button" type="button" onClick={closeAddModal} aria-label="閉じる">×</button>
            <div className="panel-title">
              <div>
                <span>ADD STOCK</span>
                <h3 id="add-choice-heading">食材を追加</h3>
              </div>
            </div>
            <div className="add-choice-grid">
              <button className="add-choice-card scan-choice" type="button" onClick={openPhotoAdd} aria-label="画像スキャン">
                <span>画像スキャン</span>
                <small>写真からAI候補を作り、確認してから在庫に追加します。</small>
              </button>
              <button className="add-choice-card manual-choice" type="button" onClick={openManualAdd} aria-label="手動で追加">
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
          <button className="modal-close-button" type="button" onClick={closeAddModal} aria-label="閉じる">×</button>
          <div className="panel-title">
            <div>
              <span>{editing ? "EDIT STOCK" : "MANUAL ADD"}</span>
              <h3 id="inventory-editor-heading">{editing ? "在庫を編集" : "食材をリストへ"}</h3>
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
            <div className="form-row two-columns">
              <label>
                分類
                <select value={values.category} onChange={(event) => updateValue("category", event.target.value as StockItemFormValues["category"])}>
                  <option value="食材">食材</option>
                  <option value="調味料">調味料</option>
                </select>
              </label>
              <label className="genre-field-label">
                保存場所
                <LocationTagPicker
                  value={values.storage_location}
                  candidates={storageLocationOptions}
                  onSelect={(name) => updateValue("storage_location", name)}
                  onCreate={addStorageLocation}
                />
              </label>
            </div>
            <div className="form-row two-columns">
              <label>
                数量・単位
                <div className="qty-unit-wrap">
                  <NumberField ariaLabel="数量" value={values.quantity} onChange={(next) => updateValue("quantity", next)} />
                  <UnitPicker value={values.unit} onSelect={(unit) => updateValue("unit", unit)} />
                </div>
              </label>
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
              <button className="primary-button submit-large" type="submit" disabled={isSaving}>
                {editing ? "内容を更新する" : "在庫に追加"}
              </button>
            </div>
          </form>
        </section>
        </div>
      ) : null}

      {addFlow === "photo" ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="photo-capture-heading">
        <section className="stock-panel canvas-modal inventory-editor-modal photo-scan-modal" aria-labelledby="photo-capture-heading">
          <button className="modal-close-button" type="button" onClick={closeAddModal} aria-label="閉じる">×</button>
          <section className="photo-capture-panel" aria-labelledby="photo-capture-heading">
              <div className="photo-capture-heading">
                <div>
                  <span>写真登録</span>
                  <h4 id="photo-capture-heading">写真を解析して在庫へ</h4>
                </div>
                <label className="photo-file-button">
                  写真を撮る
                  <input
                    ref={photoInputRef}
                    accept="image/*"
                    capture="environment"
                    type="file"
                    onChange={selectPhoto}
                    disabled={isUploadingPhoto}
                  />
                </label>
              </div>

              {photoPreviewUrl ? (
                <div className="photo-preview">
                  {/* Blob URL previews are local-only, so Next Image optimization is not useful here. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreviewUrl} alt="選択した食材写真のプレビュー" />
                </div>
              ) : (
                <p className="photo-empty">写真は非公開で保存し、入力したGemini APIキーでAI解析します。APIキーはDBに保存しません。</p>
              )}

              <GeminiApiKeyPanel apiKey={geminiApiKey} disabled={isUploadingPhoto} id="ingredient-scan-gemini-api-key" onChange={setGeminiApiKey} />

              <AiUsageMeter summary={aiUsageSummary} feature="ingredient_scan" />

              {photoFeedback ? (
                <p className="operation-message photo-message" data-tone={photoFeedback.tone} role={photoFeedback.tone === "error" ? "alert" : "status"}>
                  {photoFeedback.message}
                </p>
              ) : null}

              <div className="photo-actions">
                <button className="primary-button" type="button" disabled={!selectedPhoto || isUploadingPhoto || isSaving || scanLimitReached} onClick={scanPhoto}>
                  {isUploadingPhoto ? "解析中" : "AI解析する"}
                </button>
                <button className="secondary-button" type="button" disabled={!selectedPhoto || isUploadingPhoto} onClick={resetPhoto}>
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
                    <div>
                      <h4>{candidate.item.name}</h4>
                      <p>{candidate.item.quantity}{candidate.item.unit} · {candidate.item.storage_location}</p>
                      {candidate.item.display_expires_on || candidate.item.effective_expires_on ? (
                        <small>期限 {candidate.item.effective_expires_on ?? candidate.item.display_expires_on}</small>
                      ) : null}
                    </div>
                    <button className="secondary-button compact-button" type="button" disabled={isSaving} onClick={() => editScanCandidate(candidate)}>
                      編集
                    </button>
                  </article>
                ))}
              </div>
              <button className="primary-button submit-large" type="button" disabled={isSaving} onClick={saveSelectedScanCandidates}>
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
        </section>
        ) : null}

        {activeView === "inventory" ? (
        <section className="canvas-inventory-list" aria-labelledby="inventory-list-heading">
          <div className="location-tab-row" aria-label="保存場所タブ">
            <button className="location-tab" data-active={inventoryFilters.storageLocation === "all"} type="button" onClick={() => updateInventoryFilter("storageLocation", "all")}>
              すべて <span>{inventoryItems.length}</span>
            </button>
            <button className="location-tab" data-active={inventoryFilters.expiry === "has_expiry"} type="button" onClick={() => updateInventoryFilter("expiry", inventoryFilters.expiry === "has_expiry" ? "all" : "has_expiry")}>
              使い切り <span>{inventoryItems.filter((item) => item.quantity === 0).length}</span>
            </button>
            {storageLocationOptions.map((location) => (
              <button
                className="location-tab"
                data-active={inventoryFilters.storageLocation === location}
                key={location}
                type="button"
                onClick={() => updateInventoryFilter("storageLocation", location)}
              >
                {location} <span>{inventoryItems.filter((item) => item.storage_location === location).length}</span>
              </button>
            ))}
          </div>

          <div className="canvas-sort-row" aria-label="在庫の並び替え">
            <span>並び</span>
            <button data-active={inventoryFilters.sort === "expiry_asc"} type="button" onClick={() => updateInventoryFilter("sort", "expiry_asc")}>
              期限順 ▲
            </button>
            <button data-active={inventoryFilters.sort === "name_asc"} type="button" onClick={() => updateInventoryFilter("sort", "name_asc")}>
              名前順
            </button>
            <button data-active={inventoryFilters.sort === "created_desc"} type="button" onClick={() => updateInventoryFilter("sort", "created_desc")}>
              購入日順
            </button>
          </div>

          <ItemList
            emptyText="在庫はありません。右上の＋から追加してください。"
            items={filteredInventoryItems}
            list="inventory"
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
                onSelectAll={(ids) => selectAllVisible("inventory", ids)}
                selectedCount={selectedInventoryIds.length}
              />
            }
            disabled={isSaving}
          />
        </section>
        ) : null}
      </div>
    </section>
  );
}

type ItemListProps = {
  disabled: boolean;
  emptyText: string;
  items: StockItem[];
  list: "inventory";
  onDelete: (list: "inventory", item: StockItem) => void;
  onEdit: (list: "inventory", item: StockItem) => void;
  onQuantityChange?: (item: StockItem, delta: number) => void;
  onSelect: (list: "inventory", itemId: string) => void;
  selectedIds: string[];
  toolbar: ReactNode;
};

function ItemList({ disabled, emptyText, items, list, onDelete, onEdit, onQuantityChange, onSelect, selectedIds, toolbar }: ItemListProps) {
  if (items.length === 0) {
    return <p className="empty-list">{emptyText}</p>;
  }

  return (
    <div className="stock-list">
      {toolbar}
      {items.map((item) => (
        <article className="stock-item" key={item.id}>
          <span className="stock-item-icon" aria-hidden="true">{stockItemIcon(item)}</span>
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
              {expiryBadge(item) ? <span className="expiry-chip" data-tone={expiryBadge(item)?.tone}>{expiryBadge(item)?.label}</span> : null}
              {item.unit_conversion ? <span className="conversion-chip">{unitConversionLabel(item)}</span> : null}
            </div>
            <p>{item.storage_location} · 購入 {compactDate(item.created_at.slice(0, 10)) || "-"}</p>
          </div>
          {item.status_note ? <p className="item-note">{item.status_note}</p> : null}
          {onQuantityChange ? (
            <div className="quantity-stepper" aria-label={`${item.name}の数量`}>
              <button type="button" disabled={disabled || item.quantity <= 0} onClick={() => onQuantityChange(item, item.unit === "g" || item.unit === "ml" ? -50 : -1)}>
                -
              </button>
              <span>
                {item.quantity}
                <small>{item.unit}</small>
              </span>
              <button type="button" disabled={disabled} onClick={() => onQuantityChange(item, item.unit === "g" || item.unit === "ml" ? 50 : 1)}>
                +
              </button>
            </div>
          ) : null}
          <div className="item-actions">
            <button className="secondary-button icon-button" type="button" disabled={disabled} onClick={() => onEdit(list, item)} aria-label={`${item.name}を編集`}>
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="m16.9 4.1 3 3L8 19H5v-3L16.9 4.1Z" />
              </svg>
            </button>
            <button className="danger-button icon-button" type="button" disabled={disabled} onClick={() => onDelete(list, item)} aria-label={`${item.name}を削除`}>
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6M14 10v6" />
              </svg>
            </button>
          </div>
        </article>
      ))}
    </div>
  );
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
      <button className="secondary-button compact-button" type="button" disabled={disabled || itemIds.length === 0} onClick={() => onSelectAll(itemIds)}>
        すべて選択
      </button>
      <button className="secondary-button compact-button" type="button" disabled={disabled || selectedCount === 0} onClick={onClear}>
        選択解除
      </button>
      {showDelete && onDeleteSelected ? (
        <button className="danger-button compact-button" type="button" disabled={disabled || selectedCount === 0} onClick={onDeleteSelected}>
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
                <button className="genre-option" data-selected={isSelected} type="button" key={name} onClick={() => select(name)}>
                  <span className="genre-option-check" data-on={isSelected} aria-hidden="true">
                    ✓
                  </span>
                  <span className="genre-option-name">{name}</span>
                </button>
              );
            })}
            {canCreate ? (
              <button className="genre-option genre-option-create" type="button" onClick={() => create(normalizedQuery)}>
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
