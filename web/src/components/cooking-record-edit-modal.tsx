"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { applyAdjustmentsToQuantities, buildDraftsFromRecipeIngredients, buildEditDrafts, computeInventoryAdjustments } from "@/lib/cooking-history/edit";
import type { ConsumptionEditDraft, CookingConsumptionEvent, CookingHistoryItem, CookingHistoryPhoto } from "@/lib/cooking-history/types";
import type { StockItem } from "@/lib/inventory/types";
import type { RecipeIngredient } from "@/lib/recipes/types";
import { buildCookingHistoryPhotoStoragePath, compressImageFile } from "@/lib/photos/compress";
import { useImageFileDrop } from "@/lib/photos/use-image-file-drop";
import { useCachedSignedUrls } from "@/lib/photos/signed-url-cache";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type Feedback = {
  message: string;
  tone: "error" | "info" | "success";
};

type ConsumptionTab = "all" | "食材" | "調味料";

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
  const [consumptionTab, setConsumptionTab] = useState<ConsumptionTab>("all");
  const [isRebuiltFromRecipe, setIsRebuiltFromRecipe] = useState(false);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState<string[]>([]);

  // 新規追加写真のサムネ用 objectURL を生成し、差し替え/取り消し/破棄で必ず解放する（リーク防止）。
  useEffect(() => {
    const urls = newPhotos.map((file) => URL.createObjectURL(file));
    setNewPhotoPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newPhotos]);

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

      const events = (data ?? []) as CookingConsumptionEvent[];

      // レシピ材料は分類（食材/調味料）の正本。イベント有無に関わらず取得して item_type を引く。
      let recipeIngredients: RecipeIngredient[] = [];
      if (item.recipe_id) {
        const { data: ingredients, error: ingredientsError } = await supabase
          .from("recipe_ingredients")
          .select("*")
          .eq("user_id", userId)
          .eq("recipe_id", item.recipe_id)
          .order("sort_order", { ascending: true });

        if (!mounted) return;

        if (ingredientsError) {
          setFeedback({
            tone: "error",
            message: "原因: レシピ材料を読み込めませんでした。影響: 消費量の入力欄を復元できません。修正方法: ログイン状態とレシピデータを確認してください。"
          });
          setDrafts([]);
          return;
        }

        recipeIngredients = (ingredients ?? []) as RecipeIngredient[];
      }

      if (events.length > 0 || !item.recipe_id) {
        setIsRebuiltFromRecipe(false);
        setDrafts(buildEditDrafts(events, recipeIngredients));
        return;
      }

      setIsRebuiltFromRecipe(true);
      setDrafts(buildDraftsFromRecipeIngredients(recipeIngredients, inventoryItems));
    }

    loadConsumptionEvents();

    return () => {
      mounted = false;
    };
  }, [inventoryItems, item.id, item.recipe_id, supabase, userId]);

  function updateDraft(index: number, values: Partial<ConsumptionEditDraft>) {
    setDrafts((current) => current.map((draft, draftIndex) => (draftIndex === index ? { ...draft, ...values } : draft)));
  }

  function setVisibleConsumptionSelected(selected: boolean) {
    setDrafts((current) =>
      current.map((draft) =>
        consumptionTab === "all" || consumptionTab === draft.item_type ? { ...draft, selected } : draft
      )
    );
  }

  function toggleDeletedPhoto(photoId: string) {
    setDeletedPhotoIds((current) => (current.includes(photoId) ? current.filter((id) => id !== photoId) : [...current, photoId]));
  }

  // 削除予定にした既存写真をすべて復元する（確認ダイアログは出さず、誤操作の救済導線）。
  function restoreDeletedPhotos() {
    setDeletedPhotoIds([]);
  }

  // 完成写真の追加（input選択・ファイルドロップの共通経路）。複数画像を受け付ける。
  function addNewPhotos(files: File[]) {
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) return;
    setNewPhotos((current) => [...current, ...images]);
  }

  function handleNewPhotosChange(event: ChangeEvent<HTMLInputElement>) {
    addNewPhotos(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function removeNewPhoto(index: number) {
    setNewPhotos((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  // 完成写真エリアのファイルD&D＋クリックでアクティブ化してのCtrl+V貼り付け（いずれも複数対応）。クリック選択は従来どおり。
  const newPhotoDrop = useImageFileDrop({ disabled: isSaving, onFiles: addNewPhotos });

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
        if (draft.isNew) continue;
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
      if (draft.isNew) {
        const { error } = await supabase.from("cooking_consumption_events").insert({
          user_id: userId,
          cooking_history_id: item.id,
          meal_schedule_id: item.meal_schedule_id,
          recipe_id: item.recipe_id,
          ingredient_name: draft.ingredientName,
          requested_amount: Number.isFinite(draft.requestedAmount) ? Math.max(0, draft.requestedAmount) : 0,
          requested_unit: draft.requestedUnit,
          consumed_amount: Math.max(0, draft.consumedAmount),
          consumed_unit: draft.consumedUnit || draft.requestedUnit,
          stock_item_id: draft.stockItemId || null,
          stock_item_name: stockItemName,
          substitute_for: stockItemName && stockItemName !== draft.ingredientName ? draft.ingredientName : ""
        });

        if (error) {
          setIsSaving(false);
          setFeedback({ tone: "error", message: "原因: 新しい消費明細を保存できませんでした。影響: 在庫だけ更新済みの可能性があります。修正方法: 画面を再読み込みし、必要なら再編集してください。" });
          return;
        }
        continue;
      }

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
          cacheControl: "31536000",
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
    <div className="modal-backdrop consumption-backdrop" role="dialog" aria-modal="true" aria-labelledby="consumption-edit-heading">
      <section className="canvas-modal consumption-modal cooking-record-edit-modal">
        <button
          className="modal-close-button"
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          disabled={isSaving}
        >
          ×
        </button>
        <h3 id="consumption-edit-heading">実際の消費量を調整</h3>
        <p className="consumption-edit-note">
          {isRebuiltFromRecipe
            ? "前回の消費量明細がないため、レシピ材料から調理完了時と同じ入力欄を復元しています。"
            : "履歴を編集しています。前回確定した消費量が入った状態で開いています。"}
        </p>

        {feedback ? (
          <div className="inline-feedback" data-tone={feedback.tone} role="status">
            {feedback.message}
          </div>
        ) : null}

        {isLoading ? (
          <p className="empty-list">消費量を読み込んでいます...</p>
        ) : (
          <ConsumptionEditList
            drafts={drafts}
            inventoryItems={inventoryItems}
            onChange={updateDraft}
            onSelectVisible={setVisibleConsumptionSelected}
            onTabChange={setConsumptionTab}
            tab={consumptionTab}
          />
        )}

        <section className="cooking-record-panel" aria-label="料理記録">
          <div className="panel-title compact-title">
            <div>
              <span>料理記録</span>
              <h4>写真・評価・コメント</h4>
            </div>
          </div>

          <ExistingPhotoList
            deletedPhotoIds={deletedPhotoIds}
            disabled={isSaving}
            photos={item.photos}
            supabase={supabase}
            onRestoreDeleted={restoreDeletedPhotos}
            onToggleDeleted={toggleDeletedPhoto}
          />

          <div
            className="cooking-photo-picker photo-drop-area"
            data-dragging-over={newPhotoDrop.isDraggingOver}
            data-active={newPhotoDrop.isActive}
            aria-label="完成写真"
            {...newPhotoDrop.dragHandlers}
            {...newPhotoDrop.pasteAreaProps}
          >
            <small className="photo-paste-hint" data-active={newPhotoDrop.isActive} aria-live="polite">
              {newPhotoDrop.isActive ? "クリップボードから貼り付け可（Ctrl+V）" : "クリックすると Ctrl+V で貼り付けできます"}
            </small>
            <label className="photo-file-button">
              完成写真を撮る / 選ぶ
              <input accept="image/*" capture="environment" disabled={isSaving} multiple onChange={handleNewPhotosChange} type="file" />
            </label>
            {item.photos.length === 0 && newPhotos.length === 0 ? <p className="photo-empty">写真なしでも完了できます。</p> : null}
          </div>
          {newPhotos.length ? (
            <div className="photo-thumb-grid new-photo-list" aria-label="追加する写真">
              {newPhotos.map((photo, index) => (
                <div className="photo-thumb" key={`${photo.name}-${index}`}>
                  {newPhotoPreviews[index] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={`追加する写真 ${index + 1}（${photo.name}）`} src={newPhotoPreviews[index]} />
                  ) : (
                    <span className="photo-thumb-fallback" aria-hidden="true">
                      画像
                    </span>
                  )}
                  <button
                    className="photo-thumb-remove"
                    disabled={isSaving}
                    onClick={() => removeNewPhoto(index)}
                    type="button"
                    aria-label={`${photo.name} を取り消す`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="cooking-rating-picker" aria-label="評価">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                aria-pressed={Number(rating) === value}
                data-active={Number(rating) >= value}
                disabled={isSaving}
                key={value}
                onClick={() => setRating(rating === String(value) ? "" : String(value))}
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
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="例：少し薄味。次回は味噌を多めにする"
            />
          </label>
        </section>

        <div className="consumption-modal-actions">
          <button className="secondary-button" disabled={isSaving} onClick={onClose} type="button">
            キャンセル
          </button>
          <button className="primary-button consumption-confirm" disabled={isSaving || isLoading || Boolean(feedback?.tone === "error" && drafts.length === 0)} onClick={saveRecord} type="button">
            {isSaving ? "保存中..." : "確定"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ConsumptionEditList({
  drafts,
  inventoryItems,
  onChange,
  onSelectVisible,
  onTabChange,
  tab
}: {
  drafts: ConsumptionEditDraft[];
  inventoryItems: StockItem[];
  onChange: (index: number, values: Partial<ConsumptionEditDraft>) => void;
  onSelectVisible: (selected: boolean) => void;
  onTabChange: (tab: ConsumptionTab) => void;
  tab: ConsumptionTab;
}) {
  if (drafts.length === 0) {
    return <p className="empty-list">消費量の明細はありません。写真・評価・コメントだけ編集できます。</p>;
  }

  const rows = drafts
    .map((draft, index) => {
      const stockItem = inventoryItems.find((item) => item.id === draft.stockItemId);
      const category = draft.item_type;
      const amount = Number(draft.amount);
      return {
        category,
        draft,
        index,
        isShortage: Boolean(draft.selected && stockItem && Number.isFinite(amount) && amount > Number(stockItem.quantity || 0)),
        stockItem
      };
    })
    .filter((row) => tab === "all" || row.category === tab);
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
      {rows.length === 0 ? (
        <p className="empty-list">このカテゴリの材料はありません。</p>
      ) : (
        <div className="consumption-list">
          {rows.map(({ category, draft, index, isShortage, stockItem }) => (
              <article className="consumption-item" data-selected={draft.selected} key={draft.id}>
                <div className="item-main">
                  <label className="consumption-check">
                    <input checked={draft.selected} onChange={(event) => onChange(index, { selected: event.target.checked })} type="checkbox" />
                    <span>
                      <small>
                        前回 {draft.originalConsumedAmount}{draft.consumedUnit || draft.requestedUnit} / 必要 {draft.requestedAmount}{draft.requestedUnit} / {category}
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
                        {item.name} / 現在 {item.quantity}{item.unit} / {item.storage_location}
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
          ))}
        </div>
      )}
    </section>
  );
}

function ExistingPhotoList({
  deletedPhotoIds,
  disabled,
  onRestoreDeleted,
  onToggleDeleted,
  photos,
  supabase
}: {
  deletedPhotoIds: string[];
  disabled: boolean;
  onRestoreDeleted: () => void;
  onToggleDeleted: (photoId: string) => void;
  photos: CookingHistoryPhoto[];
  supabase: Parameters<typeof useCachedSignedUrls>[0];
}) {
  // storage_path の一覧を収集し、共有キャッシュで署名URL解決する（TKT-0205）。
  const paths = useMemo(() => photos.map((photo) => photo.storage_path), [photos]);
  const photoUrlMap = useCachedSignedUrls(supabase, paths);

  if (photos.length === 0) {
    return <p className="empty-list">既存写真はありません。</p>;
  }

  // 削除予定（×を押した写真）はグリッドから即非表示にし、確定時に実削除する。
  const visiblePhotos = photos.filter((photo) => !deletedPhotoIds.includes(photo.id));
  const deletedCount = photos.length - visiblePhotos.length;

  return (
    <div className="existing-photo-block">
      {visiblePhotos.length ? (
        <div className="photo-thumb-grid existing-photo-list" aria-label="既存写真">
          {visiblePhotos.map((photo) => {
            const photoUrl = photoUrlMap.get(photo.storage_path);
            return (
              <div className="photo-thumb" key={photo.id}>
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="既存の料理写真" src={photoUrl} />
                ) : (
                  <span className="photo-thumb-fallback" aria-hidden="true">
                    写真
                  </span>
                )}
                <button
                  className="photo-thumb-remove"
                  disabled={disabled}
                  onClick={() => onToggleDeleted(photo.id)}
                  type="button"
                  aria-label="この写真を削除"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="empty-list">表示できる既存写真はありません。</p>
      )}
      {deletedCount > 0 ? (
        <p className="photo-deleted-note" aria-live="polite">
          削除予定 {deletedCount}件（確定で削除）
          <button className="photo-restore-button" disabled={disabled} onClick={onRestoreDeleted} type="button">
            元に戻す
          </button>
        </p>
      ) : null}
    </div>
  );
}
