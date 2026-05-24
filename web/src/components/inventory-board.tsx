"use client";

import { FormEvent, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  emptyStockItemFormValues,
  StockItem,
  StockItemFormValues,
  toFormValues
} from "@/lib/inventory/types";

type InventoryBoardProps = {
  userId: string;
  initialInventoryItems: StockItem[];
  initialStagingItems: StockItem[];
};

type Feedback = {
  tone: "success" | "error" | "info";
  message: string;
};

type EditingTarget =
  | { list: "staging"; item: StockItem }
  | { list: "inventory"; item: StockItem }
  | null;

type NormalizedForm =
  | { data: Omit<StockItem, "id" | "created_at" | "updated_at"> }
  | { error: string };

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

  return {
    data: {
      user_id: userId,
      category: values.category,
      name: values.name.trim(),
      quantity,
      unit: values.unit.trim(),
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

function toInventoryInsert(item: StockItem, userId: string): Omit<StockItem, "id" | "created_at" | "updated_at"> {
  return {
    user_id: userId,
    category: item.category,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    display_expires_on: item.display_expires_on,
    effective_expires_on: item.effective_expires_on,
    storage_location: item.storage_location,
    status_note: item.status_note,
    source: item.source || "manual"
  };
}

export function InventoryBoard({
  userId,
  initialInventoryItems,
  initialStagingItems
}: InventoryBoardProps) {
  const [inventoryItems, setInventoryItems] = useState(initialInventoryItems);
  const [stagingItems, setStagingItems] = useState(initialStagingItems);
  const [values, setValues] = useState<StockItemFormValues>(emptyStockItemFormValues);
  const [editing, setEditing] = useState<EditingTarget>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  function updateValue<K extends keyof StockItemFormValues>(key: K, value: StockItemFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setValues(emptyStockItemFormValues);
    setEditing(null);
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
    if (editing?.item.id === item.id) resetForm();
    setFeedback({ tone: "success", message: `${item.name} を在庫へ確定しました。` });
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
    } else {
      setInventoryItems((items) => items.filter((current) => current.id !== item.id));
    }
    if (editing?.item.id === item.id) resetForm();
    setFeedback({ tone: "info", message: `${item.name} を削除しました。` });
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

      <div className="inventory-grid">
        <section className="stock-panel" aria-labelledby="staging-heading">
          <div className="panel-title">
            <div>
              <span>登録待ち</span>
              <h3 id="staging-heading">確認してから在庫へ</h3>
            </div>
            <strong>{stagingItems.length}件</strong>
          </div>

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
                <input value={values.storage_location} onChange={(event) => updateValue("storage_location", event.target.value)} placeholder="冷蔵庫" />
              </label>
            </div>
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

          <div className="photo-placeholder" aria-label="写真取り込みは次のチケットで対応">
            写真取り込みは TKT-0106 で追加します。
          </div>

          <ItemList
            emptyText="登録待ちはありません。まずは手動で1件追加してください。"
            items={stagingItems}
            list="staging"
            onConfirm={confirmStaging}
            onDelete={deleteItem}
            onEdit={startEdit}
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

          <ItemList
            emptyText="在庫はありません。登録待ちから確定するとここに表示されます。"
            items={inventoryItems}
            list="inventory"
            onDelete={deleteItem}
            onEdit={startEdit}
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
};

function ItemList({ disabled, emptyText, items, list, onConfirm, onDelete, onEdit }: ItemListProps) {
  if (items.length === 0) {
    return <p className="empty-list">{emptyText}</p>;
  }

  return (
    <div className="stock-list">
      {items.map((item) => (
        <article className="stock-item" key={item.id}>
          <div className="item-main">
            <span>{item.category}</span>
            <h4>{item.name}</h4>
            <p>{itemSubtitle(item)}</p>
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
            <button className="danger-button" type="button" disabled={disabled} onClick={() => onDelete(list, item)}>
              削除
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
