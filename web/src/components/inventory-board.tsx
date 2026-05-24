"use client";

import { ChangeEvent, FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { DeleteConfirmPanel } from "@/components/delete-confirm-panel";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  emptyStockItemFormValues,
  StorageLocation,
  StockItem,
  StockItemFormValues,
  UnitConversion,
  toFormValues
} from "@/lib/inventory/types";
import { buildPhotoStoragePath, compressImageFile } from "@/lib/photos/compress";

type InventoryBoardProps = {
  userId: string;
  initialInventoryItems: StockItem[];
  initialStorageLocations?: StorageLocation[];
  initialStagingItems: StockItem[];
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

type ScanIngredientsResponse = {
  items?: StockItem[];
  error?: string;
};

type EditingTarget =
  | { list: "staging"; item: StockItem }
  | { list: "inventory"; item: StockItem }
  | null;

type InventoryFilters = {
  category: "all" | StockItem["category"];
  storageLocation: string;
  expiry: "all" | "has_expiry" | "no_expiry";
  sort: "created_desc" | "expiry_asc" | "name_asc";
};

type NormalizedForm =
  | { data: Omit<StockItem, "id" | "created_at" | "updated_at"> }
  | { error: string };

function normalizeUnitConversion(values: StockItemFormValues): UnitConversion | null | { error: string } {
  const hasAnyConversionValue =
    values.conversion_from_qty || values.conversion_from_unit || values.conversion_to_qty || values.conversion_to_unit;

  if (!hasAnyConversionValue) {
    return null;
  }

  const fromQty = Number(values.conversion_from_qty);
  const toQty = Number(values.conversion_to_qty);
  const fromUnit = values.conversion_from_unit.trim();
  const toUnit = values.conversion_to_unit.trim();

  if (!Number.isFinite(fromQty) || fromQty <= 0 || !Number.isFinite(toQty) || toQty <= 0 || !fromUnit || !toUnit) {
    return { error: "単位換算は「1 パック = 150 g」のように数量と単位をすべて入力してください。" };
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

function formatDate(value: string | null) {
  if (!value) return "未設定";
  return value;
}

function itemSubtitle(item: StockItem) {
  return `${item.quantity}${item.unit} / ${item.storage_location}`;
}

function unitConversionLabel(item: StockItem) {
  const conversion = item.unit_conversion;
  if (!conversion) return "";
  return `${conversion.fromQty}${conversion.fromUnit} = ${conversion.toQty}${conversion.toUnit}`;
}

function toInventoryInsert(item: StockItem, userId: string): Omit<StockItem, "id" | "created_at" | "updated_at"> {
  return {
    user_id: userId,
    category: item.category,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    unit_conversion: item.unit_conversion,
    display_expires_on: item.display_expires_on,
    effective_expires_on: item.effective_expires_on,
    storage_location: item.storage_location,
    status_note: item.status_note,
    source: item.source || "manual"
  };
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
  initialStorageLocations = [],
  initialStagingItems
}: InventoryBoardProps) {
  const [inventoryItems, setInventoryItems] = useState(initialInventoryItems);
  const [storageLocations, setStorageLocations] = useState(initialStorageLocations);
  const [stagingItems, setStagingItems] = useState(initialStagingItems);
  const [values, setValues] = useState<StockItemFormValues>(emptyStockItemFormValues);
  const [newLocationName, setNewLocationName] = useState("");
  const [editing, setEditing] = useState<EditingTarget>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [photoFeedback, setPhotoFeedback] = useState<Feedback | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [inventoryFilters, setInventoryFilters] = useState<InventoryFilters>({
    category: "all",
    storageLocation: "all",
    expiry: "all",
    sort: "created_desc"
  });
  const [selectedStagingIds, setSelectedStagingIds] = useState<string[]>([]);
  const [selectedInventoryIds, setSelectedInventoryIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  function requestDelete(target: string, message: string, confirm: () => void) {
    setPendingDelete({ target, message, confirm });
    setFeedback(null);
  }
  const storageLocationOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...defaultStorageLocationNames,
          ...storageLocations.map((location) => location.name),
          ...inventoryItems.map((item) => item.storage_location),
          ...stagingItems.map((item) => item.storage_location)
        ].filter(Boolean))
      ).sort((a, b) => a.localeCompare(b, "ja")),
    [inventoryItems, stagingItems, storageLocations]
  );
  const storageLocationUsage = useMemo(
    () =>
      [...inventoryItems, ...stagingItems].reduce<Record<string, number>>((usage, item) => {
        usage[item.storage_location] = (usage[item.storage_location] ?? 0) + 1;
        return usage;
      }, {}),
    [inventoryItems, stagingItems]
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

  function updateInventoryFilter<K extends keyof InventoryFilters>(key: K, value: InventoryFilters[K]) {
    setInventoryFilters((current) => ({ ...current, [key]: value }));
  }

  function toggleSelected(list: "staging" | "inventory", itemId: string) {
    const update = (ids: string[]) => (ids.includes(itemId) ? ids.filter((id) => id !== itemId) : [...ids, itemId]);
    if (list === "staging") {
      setSelectedStagingIds(update);
    } else {
      setSelectedInventoryIds(update);
    }
  }

  function selectAllVisible(list: "staging" | "inventory", itemIds: string[]) {
    if (list === "staging") {
      setSelectedStagingIds(itemIds);
    } else {
      setSelectedInventoryIds(itemIds);
    }
  }

  function clearSelected(list: "staging" | "inventory") {
    if (list === "staging") {
      setSelectedStagingIds([]);
    } else {
      setSelectedInventoryIds([]);
    }
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

  async function addStorageLocation() {
    const name = newLocationName.trim();
    if (!name) {
      setFeedback({ tone: "error", message: "保存場所名を入力してください。" });
      return;
    }
    if (storageLocationOptions.includes(name)) {
      setFeedback({ tone: "info", message: `${name} はすでに候補にあります。` });
      setNewLocationName("");
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const { data, error } = await supabase
      .from("storage_locations")
      .insert({ user_id: userId, name, sort_order: storageLocations.length })
      .select()
      .single();

    setIsSaving(false);

    if (error || !data) {
      setFeedback({ tone: "error", message: "保存場所を追加できませんでした。ログイン状態を確認してください。" });
      return;
    }

    setStorageLocations((locations) => [...locations, data as StorageLocation]);
    setNewLocationName("");
    setFeedback({ tone: "success", message: `${name} を保存場所に追加しました。` });
  }

  async function deleteStorageLocation(location: StorageLocation) {
    if ((storageLocationUsage[location.name] ?? 0) > 0) {
      setFeedback({ tone: "error", message: "使用中の保存場所は削除できません。在庫や登録待ちの保存場所を変更してから削除してください。" });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const { error } = await supabase.from("storage_locations").delete().eq("id", location.id).eq("user_id", userId);

    setIsSaving(false);

    if (error) {
      setFeedback({ tone: "error", message: "保存場所を削除できませんでした。ログイン状態を確認してください。" });
      return;
    }

    setStorageLocations((locations) => locations.filter((current) => current.id !== location.id));
    setFeedback({ tone: "info", message: `${location.name} を保存場所から削除しました。` });
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
        body: JSON.stringify({ photoId: photo.id })
      });
      const scanResult = (await scanResponse.json().catch(() => ({}))) as ScanIngredientsResponse;

      if (!scanResponse.ok || scanResult.error || !scanResult.items) {
        setPhotoFeedback({
          tone: "error",
          message:
            scanResult.error ||
            "原因: AI解析結果を取得できませんでした。影響: 登録待ちへ追加できません。修正方法: 時間を置いて再度解析してください。"
        });
        return;
      }

      setStagingItems((items) => [...(scanResult.items ?? []), ...items]);
      resetPhoto();
      setPhotoFeedback({ tone: "success", message: `${scanResult.items.length}件の候補を登録待ちへ追加しました。確認してから在庫へ確定してください。` });
    } catch {
      setPhotoFeedback({
        tone: "error",
        message: "原因: 写真の保存またはAI解析に失敗しました。影響: 登録待ちへ追加できません。修正方法: 別の写真で撮り直してください。"
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  }

  function startEdit(list: "staging" | "inventory", item: StockItem) {
    setValues(toFormValues(item));
    setEditing({ list, item });
    setFeedback({ tone: "info", message: `${item.name} を編集中です。` });
  }

  async function saveStaging(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeForm(values, userId);
    if ("error" in normalized) {
      setFeedback({ tone: "error", message: normalized.error });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    if (editing) {
      const table = editing.list === "staging" ? "staging_items" : "inventory_items";
      const { data, error } = await supabase
        .from(table)
        .update(normalized.data)
        .eq("id", editing.item.id)
        .eq("user_id", userId)
        .select()
        .single();

      setIsSaving(false);

      if (error || !data) {
        setFeedback({ tone: "error", message: "更新できませんでした。ログイン状態と入力内容を確認してください。" });
        return;
      }

      if (editing.list === "staging") {
        setStagingItems((items) => items.map((item) => (item.id === data.id ? (data as StockItem) : item)));
      } else {
        setInventoryItems((items) => items.map((item) => (item.id === data.id ? (data as StockItem) : item)));
      }
      resetForm();
      setFeedback({ tone: "success", message: "内容を更新しました。" });
      return;
    }

    const { data, error } = await supabase.from("staging_items").insert(normalized.data).select().single();
    setIsSaving(false);

    if (error || !data) {
      setFeedback({ tone: "error", message: "登録待ちに追加できませんでした。ログイン状態と入力内容を確認してください。" });
      return;
    }

    setStagingItems((items) => [data as StockItem, ...items]);
    resetForm();
    setFeedback({ tone: "success", message: "登録待ちに追加しました。" });
  }

  async function confirmStaging(item: StockItem) {
    setIsSaving(true);
    setFeedback(null);

    const { data: inventoryData, error: insertError } = await supabase
      .from("inventory_items")
      .insert(toInventoryInsert(item, userId))
      .select()
      .single();

    if (insertError || !inventoryData) {
      setIsSaving(false);
      setFeedback({ tone: "error", message: "在庫へ確定できませんでした。時間を置いて再度お試しください。" });
      return;
    }

    const { error: deleteError } = await supabase
      .from("staging_items")
      .delete()
      .eq("id", item.id)
      .eq("user_id", userId);

    setIsSaving(false);

    if (deleteError) {
      setInventoryItems((items) => [inventoryData as StockItem, ...items]);
      setFeedback({
        tone: "error",
        message: "在庫には追加されましたが、登録待ちから削除できませんでした。画面を更新して確認してください。"
      });
      return;
    }

    setInventoryItems((items) => [inventoryData as StockItem, ...items]);
    setStagingItems((items) => items.filter((current) => current.id !== item.id));
    setSelectedStagingIds((ids) => ids.filter((id) => id !== item.id));
    if (editing?.item.id === item.id) resetForm();
    setFeedback({ tone: "success", message: `${item.name} を在庫へ確定しました。` });
  }

  async function useUpItem(item: StockItem) {
    setIsSaving(true);
    setFeedback(null);

    const { data, error } = await supabase
      .from("inventory_items")
      .update({ quantity: 0, status_note: item.status_note ? `${item.status_note} / 使い切り` : "使い切り" })
      .eq("id", item.id)
      .eq("user_id", userId)
      .select()
      .single();

    setIsSaving(false);

    if (error || !data) {
      setFeedback({ tone: "error", message: "使い切りに更新できませんでした。ログイン状態を確認してください。" });
      return;
    }

    setInventoryItems((items) => items.map((current) => (current.id === item.id ? (data as StockItem) : current)));
    setFeedback({ tone: "success", message: `${item.name} を使い切りにしました。` });
  }

  async function deleteItem(list: "staging" | "inventory", item: StockItem) {
    setIsSaving(true);
    setFeedback(null);

    const table = list === "staging" ? "staging_items" : "inventory_items";
    const { error } = await supabase.from(table).delete().eq("id", item.id).eq("user_id", userId);

    setIsSaving(false);

    if (error) {
      setFeedback({ tone: "error", message: "削除できませんでした。ログイン状態を確認してください。" });
      return;
    }

    if (list === "staging") {
      setStagingItems((items) => items.filter((current) => current.id !== item.id));
      setSelectedStagingIds((ids) => ids.filter((id) => id !== item.id));
    } else {
      setInventoryItems((items) => items.filter((current) => current.id !== item.id));
      setSelectedInventoryIds((ids) => ids.filter((id) => id !== item.id));
    }
    if (editing?.item.id === item.id) resetForm();
    setFeedback({ tone: "info", message: `${item.name} を削除しました。` });
  }

  async function deleteSelectedStaging() {
    if (selectedStagingIds.length === 0) return;
    setIsSaving(true);
    setFeedback(null);

    const { error } = await supabase.from("staging_items").delete().eq("user_id", userId).in("id", selectedStagingIds);

    setIsSaving(false);

    if (error) {
      setFeedback({ tone: "error", message: "登録待ちを一括削除できませんでした。ログイン状態を確認してください。" });
      return;
    }

    const deletedCount = selectedStagingIds.length;
    setStagingItems((items) => items.filter((item) => !selectedStagingIds.includes(item.id)));
    setSelectedStagingIds([]);
    if (editing && selectedStagingIds.includes(editing.item.id)) resetForm();
    setFeedback({ tone: "info", message: `登録待ちを${deletedCount}件削除しました。` });
  }

  return (
    <section className="inventory-workspace" aria-labelledby="inventory-heading">
      <div className="section-heading">
        <p className="eyebrow">Inventory</p>
        <h2 id="inventory-heading">在庫と登録待ち</h2>
      </div>

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

      <div className="inventory-grid">
        <section className="stock-panel" aria-labelledby="staging-heading">
          <div className="panel-title">
            <div>
              <span>登録待ち</span>
              <h3 id="staging-heading">確認してから在庫へ</h3>
            </div>
            <strong>{stagingItems.length}件</strong>
          </div>

          <section className="location-manager" aria-labelledby="location-manager-heading">
            <div className="location-manager-heading">
              <div>
                <span>保存場所</span>
                <h4 id="location-manager-heading">保存場所を管理</h4>
              </div>
              <div className="location-add-row">
                <input
                  aria-label="追加する保存場所"
                  value={newLocationName}
                  onChange={(event) => setNewLocationName(event.target.value)}
                  placeholder="例: 野菜室"
                />
                <button className="secondary-button compact-button" disabled={isSaving} onClick={addStorageLocation} type="button">
                  追加
                </button>
              </div>
            </div>
            <div className="location-chip-list">
              {storageLocationOptions.map((name) => {
                const location = storageLocations.find((item) => item.name === name);
                const usageCount = storageLocationUsage[name] ?? 0;
                return (
                  <div className="location-chip" key={name}>
                    <span>{name}</span>
                    <small>{usageCount}件</small>
                    {location ? (
                      <button
                        className="danger-button compact-button"
                        disabled={isSaving || usageCount > 0}
                        onClick={() => requestDelete(location.name, "この保存場所を削除します。使用中の場所は削除できません。", () => deleteStorageLocation(location))}
                        type="button"
                      >
                        削除
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <form className="stock-form" onSubmit={saveStaging}>
            <div className="form-row two-columns">
              <label>
                種別
                <select value={values.category} onChange={(event) => updateValue("category", event.target.value as StockItemFormValues["category"])}>
                  <option value="食材">食材</option>
                  <option value="調味料">調味料</option>
                </select>
              </label>
              <label>
                数量
                <input
                  min="0"
                  step="0.1"
                  type="number"
                  value={values.quantity}
                  onChange={(event) => updateValue("quantity", event.target.value)}
                />
              </label>
            </div>
            <label>
              品名
              <input value={values.name} onChange={(event) => updateValue("name", event.target.value)} placeholder="例: 牛乳" />
            </label>
            <div className="form-row two-columns">
              <label>
                単位
                <input value={values.unit} onChange={(event) => updateValue("unit", event.target.value)} placeholder="個" />
              </label>
              <label>
                保存場所
                <input
                  list="storage-location-options"
                  value={values.storage_location}
                  onChange={(event) => updateValue("storage_location", event.target.value)}
                  placeholder="冷蔵庫"
                />
                <datalist id="storage-location-options">
                  {storageLocationOptions.map((location) => (
                    <option key={location} value={location} />
                  ))}
                </datalist>
              </label>
            </div>
            <fieldset className="unit-conversion-fields">
              <legend>単位換算</legend>
              <div className="conversion-row">
                <input
                  aria-label="換算元数量"
                  inputMode="decimal"
                  min="0"
                  step="0.1"
                  type="number"
                  value={values.conversion_from_qty}
                  onChange={(event) => updateValue("conversion_from_qty", event.target.value)}
                  placeholder="1"
                />
                <input
                  aria-label="換算元単位"
                  value={values.conversion_from_unit}
                  onChange={(event) => updateValue("conversion_from_unit", event.target.value)}
                  placeholder="パック"
                />
                <span>=</span>
                <input
                  aria-label="換算先数量"
                  inputMode="decimal"
                  min="0"
                  step="0.1"
                  type="number"
                  value={values.conversion_to_qty}
                  onChange={(event) => updateValue("conversion_to_qty", event.target.value)}
                  placeholder="150"
                />
                <input
                  aria-label="換算先単位"
                  value={values.conversion_to_unit}
                  onChange={(event) => updateValue("conversion_to_unit", event.target.value)}
                  placeholder="g"
                />
              </div>
              <p>例: 1パック = 150g。調理完了時の在庫消費で使います。</p>
            </fieldset>
            <div className="form-row two-columns">
              <label>
                表示期限
                <input type="date" value={values.display_expires_on} onChange={(event) => updateValue("display_expires_on", event.target.value)} />
              </label>
              <label>
                実質期限
                <input type="date" value={values.effective_expires_on} onChange={(event) => updateValue("effective_expires_on", event.target.value)} />
              </label>
            </div>
            <label>
              メモ
              <textarea rows={3} value={values.status_note} onChange={(event) => updateValue("status_note", event.target.value)} />
            </label>
            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={isSaving}>
                {editing ? "内容を更新" : "登録待ちに追加"}
              </button>
              {editing ? (
                <button className="secondary-button" type="button" onClick={resetForm}>
                  編集をやめる
                </button>
              ) : null}
            </div>
          </form>

          <section className="photo-capture-panel" aria-labelledby="photo-capture-heading">
            <div className="photo-capture-heading">
              <div>
                <span>写真登録</span>
                <h4 id="photo-capture-heading">写真を解析して登録待ちへ</h4>
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
              <p className="photo-empty">写真は非公開で保存し、サーバー側でAI解析します。APIキーはブラウザへ出しません。</p>
            )}

            {photoFeedback ? (
              <p className="operation-message photo-message" data-tone={photoFeedback.tone} role={photoFeedback.tone === "error" ? "alert" : "status"}>
                {photoFeedback.message}
              </p>
            ) : null}

            <div className="photo-actions">
              <button className="primary-button" type="button" disabled={!selectedPhoto || isUploadingPhoto || isSaving} onClick={scanPhoto}>
                {isUploadingPhoto ? "解析中" : "AI解析する"}
              </button>
              <button className="secondary-button" type="button" disabled={!selectedPhoto || isUploadingPhoto} onClick={resetPhoto}>
                別の写真にする
              </button>
            </div>
          </section>

          <ItemList
            emptyText="登録待ちはありません。まずは手動で1件追加してください。"
            items={stagingItems}
            list="staging"
            onConfirm={confirmStaging}
            onDelete={(list, item) => requestDelete(item.name, "この登録待ちを削除します。元には戻せません。", () => deleteItem(list, item))}
            onEdit={startEdit}
            onSelect={toggleSelected}
            selectedIds={selectedStagingIds}
            toolbar={
              <ListToolbar
                disabled={isSaving}
                itemIds={stagingItems.map((item) => item.id)}
                onClear={() => clearSelected("staging")}
                onDeleteSelected={() => requestDelete(`${selectedStagingIds.length}件の登録待ち`, "選択した登録待ちをまとめて削除します。元には戻せません。", deleteSelectedStaging)}
                onSelectAll={(ids) => selectAllVisible("staging", ids)}
                selectedCount={selectedStagingIds.length}
                showDelete
              />
            }
            disabled={isSaving}
          />
        </section>

        <section className="stock-panel" aria-labelledby="inventory-list-heading">
          <div className="panel-title">
            <div>
              <span>在庫</span>
              <h3 id="inventory-list-heading">いま使える食材</h3>
            </div>
            <strong>{inventoryItems.length}件</strong>
          </div>

          <div className="list-controls" aria-label="在庫の絞り込み">
            <label>
              在庫の保存場所
              <select
                value={inventoryFilters.storageLocation}
                onChange={(event) => updateInventoryFilter("storageLocation", event.target.value)}
              >
                <option value="all">すべて</option>
                {storageLocationOptions.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </label>
            <label>
              在庫の種別
              <select
                value={inventoryFilters.category}
                onChange={(event) => updateInventoryFilter("category", event.target.value as InventoryFilters["category"])}
              >
                <option value="all">すべて</option>
                <option value="食材">食材</option>
                <option value="調味料">調味料</option>
              </select>
            </label>
            <label>
              在庫の期限
              <select
                value={inventoryFilters.expiry}
                onChange={(event) => updateInventoryFilter("expiry", event.target.value as InventoryFilters["expiry"])}
              >
                <option value="all">すべて</option>
                <option value="has_expiry">期限あり</option>
                <option value="no_expiry">期限なし</option>
              </select>
            </label>
            <label>
              在庫の並び順
              <select
                value={inventoryFilters.sort}
                onChange={(event) => updateInventoryFilter("sort", event.target.value as InventoryFilters["sort"])}
              >
                <option value="created_desc">登録が新しい順</option>
                <option value="expiry_asc">期限が近い順</option>
                <option value="name_asc">名前順</option>
              </select>
            </label>
          </div>

          <ItemList
            emptyText="在庫はありません。登録待ちから確定するとここに表示されます。"
            items={filteredInventoryItems}
            list="inventory"
            onDelete={(list, item) => requestDelete(item.name, "この在庫を削除します。元には戻せません。", () => deleteItem(list, item))}
            onEdit={startEdit}
            onSelect={toggleSelected}
            onUseUp={useUpItem}
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
      </div>
    </section>
  );
}

type ItemListProps = {
  disabled: boolean;
  emptyText: string;
  items: StockItem[];
  list: "staging" | "inventory";
  onConfirm?: (item: StockItem) => void;
  onDelete: (list: "staging" | "inventory", item: StockItem) => void;
  onEdit: (list: "staging" | "inventory", item: StockItem) => void;
  onSelect: (list: "staging" | "inventory", itemId: string) => void;
  onUseUp?: (item: StockItem) => void;
  selectedIds: string[];
  toolbar: ReactNode;
};

function ItemList({ disabled, emptyText, items, list, onConfirm, onDelete, onEdit, onSelect, onUseUp, selectedIds, toolbar }: ItemListProps) {
  if (items.length === 0) {
    return <p className="empty-list">{emptyText}</p>;
  }

  return (
    <div className="stock-list">
      {toolbar}
      {items.map((item) => (
        <article className="stock-item" key={item.id}>
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
            <span>{item.category}</span>
            <h4>{item.name}</h4>
            <p>{itemSubtitle(item)}</p>
            {item.unit_conversion ? <p className="conversion-note">換算: {unitConversionLabel(item)}</p> : null}
          </div>
          <dl className="item-meta">
            <div>
              <dt>表示期限</dt>
              <dd>{formatDate(item.display_expires_on)}</dd>
            </div>
            <div>
              <dt>実質期限</dt>
              <dd>{formatDate(item.effective_expires_on)}</dd>
            </div>
          </dl>
          {item.status_note ? <p className="item-note">{item.status_note}</p> : null}
          <div className="item-actions">
            {list === "staging" && onConfirm ? (
              <button className="primary-button" type="button" disabled={disabled} onClick={() => onConfirm(item)}>
                在庫へ確定
              </button>
            ) : null}
            <button className="secondary-button" type="button" disabled={disabled} onClick={() => onEdit(list, item)}>
              編集
            </button>
            {list === "inventory" && onUseUp ? (
              <button className="secondary-button" type="button" disabled={disabled || item.quantity === 0} onClick={() => onUseUp(item)}>
                使い切り
              </button>
            ) : null}
            <button className="danger-button" type="button" disabled={disabled} onClick={() => onDelete(list, item)}>
              削除
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
      <span>{selectedCount}件選択中</span>
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
