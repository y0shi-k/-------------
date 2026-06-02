"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { applyAdjustmentsToQuantities, buildEditDrafts, computeInventoryAdjustments } from "@/lib/cooking-history/edit";
import type { ConsumptionEditDraft, CookingConsumptionEvent, CookingHistoryItem, CookingHistoryPhoto } from "@/lib/cooking-history/types";
import type { StockItem } from "@/lib/inventory/types";
import { buildCookingHistoryPhotoStoragePath, compressImageFile } from "@/lib/photos/compress";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Feedback = {
  message: string;
  tone: "error" | "info" | "success";
};

type CookingRecordEditModalProps = {
  inventoryItems: StockItem[];
  item: CookingHistoryItem;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
};

export function CookingRecordEditModal({ inventoryItems, item, onClose, onSaved, userId }: CookingRecordEditModalProps) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [drafts, setDrafts] = useState<ConsumptionEditDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [note, setNote] = useState(item.note ?? "");
  const [rating, setRating] = useState(item.rating ? String(item.rating) : "");
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadConsumptionEvents() {
      setIsLoading(true);
      setFeedback(null);
      const { data, error } = await supabase
        .from("cooking_consumption_events")
        .select("*")
        .eq("user_id", userId)
        .eq("cooking_history_id", item.id)
        .order("created_at", { ascending: true });

      if (!mounted) return;
      setIsLoading(false);

      if (error) {
        setFeedback({
          tone: "error",
          message: "原因: 消費量の明細を読み込めませんでした。影響: 在庫差分を計算できないため保存できません。修正方法: ログイン状態を確認して、画面を再読み込みしてください。"
        });
        return;
      }

      setDrafts(buildEditDrafts((data ?? []) as CookingConsumptionEvent[]));
    }

    loadConsumptionEvents();

    return () => {
      mounted = false;
    };
  }, [item.id, supabase, userId]);

  function updateDraft(index: number, values: Partial<ConsumptionEditDraft>) {
    setDrafts((current) => current.map((draft, draftIndex) => (draftIndex === index ? { ...draft, ...values } : draft)));
  }

  function toggleDeletedPhoto(photoId: string) {
    setDeletedPhotoIds((current) => (current.includes(photoId) ? current.filter((id) => id !== photoId) : [...current, photoId]));
  }

  function handleNewPhotosChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    setNewPhotos((current) => [...current, ...files]);
    event.target.value = "";
  }

  function removeNewPhoto(index: number) {
    setNewPhotos((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function saveRecord() {
    const normalizedDrafts = drafts.map((draft) => ({ ...draft, consumedAmount: Number(draft.amount) }));
    const invalidDraft = normalizedDrafts.find((draft) => draft.selected && (!Number.isFinite(draft.consumedAmount) || draft.consumedAmount < 0));
    if (invalidDraft) {
      setFeedback({ tone: "error", message: "原因: 消費量に不備があります。影響: 在庫と料理履歴を更新できません。修正方法: 消費量を0以上の数値に直してください。" });
      return;
    }

    const ratingValue = rating ? Number(rating) : null;
    if (ratingValue !== null && (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5)) {
      setFeedback({ tone: "error", message: "原因: 評価の値に不備があります。影響: 料理履歴を保存できません。修正方法: ★1〜5の範囲で選んでください。" });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const adjustments = computeInventoryAdjustments(drafts);
    const quantityUpdates = applyAdjustmentsToQuantities(inventoryItems, adjustments).filter((update) => !update.missing);
    const missingUpdateCount = adjustments.length - quantityUpdates.length;

    for (const update of quantityUpdates) {
      const { error } = await supabase
        .from("inventory_items")
        .update({ quantity: update.nextQuantity })
        .eq("id", update.id)
        .eq("user_id", userId);

      if (error) {
        setIsSaving(false);
        setFeedback({ tone: "error", message: "原因: 在庫数量を更新できませんでした。影響: 消費量・写真・コメントの保存を中止しました。修正方法: ログイン状態と在庫データを確認してください。" });
        return;
      }
    }

    for (const draft of normalizedDrafts) {
      if (!draft.selected) {
        const { error } = await supabase.from("cooking_consumption_events").delete().eq("id", draft.id).eq("user_id", userId);
        if (error) {
          setIsSaving(false);
          setFeedback({ tone: "error", message: "原因: 削除した消費明細をDBへ反映できませんでした。影響: 在庫だけ更新済みの可能性があります。修正方法: 画面を再読み込みし、必要なら再編集してください。" });
          return;
        }
        continue;
      }

      const stockItem = inventoryItems.find((entry) => entry.id === draft.stockItemId);
      const stockItemName = stockItem?.name ?? draft.stockItemName;
      const { error } = await supabase
        .from("cooking_consumption_events")
        .update({
          consumed_amount: Math.max(0, draft.consumedAmount),
          consumed_unit: draft.consumedUnit,
          stock_item_id: draft.stockItemId || null,
          stock_item_name: stockItemName,
          substitute_for: stockItemName && stockItemName !== draft.ingredientName ? draft.ingredientName : ""
        })
        .eq("id", draft.id)
        .eq("user_id", userId);

      if (error) {
        setIsSaving(false);
        setFeedback({ tone: "error", message: "原因: 消費明細を更新できませんでした。影響: 在庫だけ更新済みの可能性があります。修正方法: 画面を再読み込みし、必要なら再編集してください。" });
        return;
      }
    }

    const { error: historyError } = await supabase
      .from("cooking_history")
      .update({ note: note.trim(), rating: ratingValue, updated_at: new Date().toISOString() })
      .eq("id", item.id)
      .eq("user_id", userId);

    if (historyError) {
      setIsSaving(false);
      setFeedback({ tone: "error", message: "原因: コメントまたは評価を更新できませんでした。影響: 在庫と消費明細だけ更新済みの可能性があります。修正方法: 画面を再読み込みし、必要なら再編集してください。" });
      return;
    }

    const photoError = await savePhotoChanges();
    if (photoError) {
      setIsSaving(false);
      setFeedback({ tone: "error", message: photoError });
      return;
    }

    setIsSaving(false);
    setFeedback({
      tone: "success",
      message: missingUpdateCount
        ? "保存しました。一部の削除済み在庫には差分を反映できなかったため、在庫一覧を確認してください。"
        : "料理記録を保存しました。"
    });
    onSaved();
  }

  async function savePhotoChanges() {
    const deletingPhotos = item.photos.filter((photo) => deletedPhotoIds.includes(photo.id));
    for (const photo of deletingPhotos) {
      const { error: storageError } = await supabase.storage.from(photo.bucket_id).remove([photo.storage_path]);
      if (storageError) {
        return "原因: 写真ファイルをStorageから削除できませんでした。影響: 写真情報の削除を中止しました。修正方法: ログイン状態とStorage権限を確認してください。";
      }

      const { error: photoDeleteError } = await supabase.from("photos").delete().eq("id", photo.id).eq("user_id", userId);
      if (photoDeleteError) {
        return "原因: 写真情報をDBから削除できませんでした。影響: Storageの写真ファイルだけ削除済みの可能性があります。修正方法: 画面を再読み込みして写真一覧を確認してください。";
      }
    }

    for (const file of newPhotos) {
      try {
        const compressed = await compressImageFile(file);
        const storagePath = buildCookingHistoryPhotoStoragePath(userId);
        const { error: uploadError } = await supabase.storage.from("photos").upload(storagePath, compressed.blob, {
          contentType: compressed.contentType,
          upsert: false
        });

        if (uploadError) {
          return "原因: 新しい写真をStorageへ保存できませんでした。影響: 写真追加だけ反映されません。修正方法: 写真サイズとログイン状態を確認してください。";
        }

        const { error: insertError } = await supabase.from("photos").insert({
          user_id: userId,
          bucket_id: "photos",
          storage_path: storagePath,
          usage_type: "cooking_history",
          cooking_history_id: item.id,
          content_type: compressed.contentType,
          byte_size: compressed.byteSize,
          width: compressed.width,
          height: compressed.height
        });

        if (insertError) {
          await supabase.storage.from("photos").remove([storagePath]);
          return "原因: 新しい写真情報をDBへ保存できませんでした。影響: 写真追加だけ反映されません。修正方法: ログイン状態を確認してください。";
        }
      } catch {
        return "原因: 写真を処理できませんでした。影響: 写真追加だけ反映されません。修正方法: 別の画像ファイルを選び直してください。";
      }
    }

    return "";
  }

  return (
    <div className="modal-backdrop consumption-backdrop" role="presentation">
      <section aria-label="料理記録を編集" aria-modal="true" className="canvas-modal consumption-modal cooking-record-edit-modal" role="dialog">
        <div className="modal-heading">
          <div>
            <span>料理履歴</span>
            <h3>料理記録を編集</h3>
          </div>
          <button aria-label="閉じる" className="icon-button" disabled={isSaving} onClick={onClose} type="button">
            ×
          </button>
        </div>

        {feedback ? (
          <div className="inline-feedback" data-tone={feedback.tone} role="status">
            {feedback.message}
          </div>
        ) : null}

        {isLoading ? (
          <p className="empty-list">消費量を読み込んでいます...</p>
        ) : (
          <ConsumptionEditList drafts={drafts} inventoryItems={inventoryItems} onChange={updateDraft} />
        )}

        <section className="cooking-record-panel" aria-label="写真・評価・コメント">
          <div className="panel-title compact-title">
            <div>
              <span>記録</span>
              <h4>写真・評価・コメント</h4>
            </div>
          </div>

          <ExistingPhotoList deletedPhotoIds={deletedPhotoIds} photos={item.photos} onToggleDeleted={toggleDeletedPhoto} />

          <label className="cooking-photo-picker">
            新しい写真を追加
            <input accept="image/*" capture="environment" multiple onChange={handleNewPhotosChange} type="file" />
          </label>
          {newPhotos.length ? (
            <div className="new-photo-list">
              {newPhotos.map((photo, index) => (
                <button key={`${photo.name}-${index}`} onClick={() => removeNewPhoto(index)} type="button">
                  {photo.name} を取り消す
                </button>
              ))}
            </div>
          ) : null}

          <div className="cooking-rating-picker" role="group" aria-label="評価">
            <button data-active={rating === ""} onClick={() => setRating("")} type="button">未</button>
            {[1, 2, 3, 4, 5].map((value) => (
              <button data-active={Number(rating) >= value} key={value} onClick={() => setRating(String(value))} type="button">
                ★
              </button>
            ))}
          </div>

          <label className="cooking-comment-field">
            コメント
            <textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="感想や次回のメモ" />
          </label>
        </section>

        <div className="consumption-modal-actions">
          <button disabled={isSaving} onClick={onClose} type="button">
            キャンセル
          </button>
          <button className="consumption-confirm" disabled={isSaving || isLoading || Boolean(feedback?.tone === "error" && drafts.length === 0)} onClick={saveRecord} type="button">
            {isSaving ? "保存中..." : "保存"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ConsumptionEditList({
  drafts,
  inventoryItems,
  onChange
}: {
  drafts: ConsumptionEditDraft[];
  inventoryItems: StockItem[];
  onChange: (index: number, values: Partial<ConsumptionEditDraft>) => void;
}) {
  if (drafts.length === 0) {
    return <p className="empty-list">消費量の明細はありません。写真・評価・コメントだけ編集できます。</p>;
  }

  return (
    <section className="consumption-editor" aria-label="消費量編集">
      <div className="panel-title compact-title">
        <div>
          <span>消費確認</span>
          <h4>在庫から減らした量</h4>
        </div>
      </div>
      <div className="consumption-list">
        {drafts.map((draft, index) => {
          const stockItem = inventoryItems.find((item) => item.id === draft.stockItemId);
          const amount = Number(draft.amount);
          const isShortage = Boolean(draft.selected && stockItem && Number.isFinite(amount) && amount > Number(stockItem.quantity || 0));

          return (
            <article className="consumption-item" data-selected={draft.selected} key={draft.id}>
              <div className="item-main">
                <label className="consumption-check">
                  <input checked={draft.selected} onChange={(event) => onChange(index, { selected: event.target.checked })} type="checkbox" />
                  <span>
                    <small>
                      元の消費 {draft.originalConsumedAmount}{draft.consumedUnit || draft.requestedUnit} / 必要 {draft.requestedAmount}{draft.requestedUnit}
                    </small>
                    <strong>{draft.ingredientName}</strong>
                  </span>
                </label>
              </div>
              <label>
                減らす在庫
                <select value={draft.stockItemId} onChange={(event) => onChange(index, { stockItemId: event.target.value })}>
                  <option value="">減算しない</option>
                  {inventoryItems.map((item) => (
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
              <button className="consumption-remove-button" onClick={() => onChange(index, { selected: !draft.selected })} type="button">
                {draft.selected ? "行を削除" : "削除を取り消す"}
              </button>
              {isShortage && stockItem ? (
                <p className="consumption-item-warning">
                  現在の在庫 {stockItem.quantity}{stockItem.unit} より多いです。保存時は在庫が0で止まります。
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ExistingPhotoList({
  deletedPhotoIds,
  onToggleDeleted,
  photos
}: {
  deletedPhotoIds: string[];
  onToggleDeleted: (photoId: string) => void;
  photos: CookingHistoryPhoto[];
}) {
  if (photos.length === 0) {
    return <p className="empty-list">既存写真はありません。</p>;
  }

  return (
    <div className="existing-photo-list" aria-label="既存写真">
      {photos.map((photo) => {
        const deleted = deletedPhotoIds.includes(photo.id);
        return (
          <button data-deleted={deleted} key={photo.id} onClick={() => onToggleDeleted(photo.id)} type="button">
            {photo.signed_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="既存の料理写真" src={photo.signed_url} />
            ) : (
              <span>写真</span>
            )}
            <strong>{deleted ? "削除を取り消す" : "削除"}</strong>
          </button>
        );
      })}
    </div>
  );
}
