"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  CookingHistoryItem,
  CookingHistoryPhoto,
  emptyCookingHistoryFormValues,
  toDatetimeLocalValue
} from "@/lib/cooking-history/types";
import { buildCookingHistoryPhotoStoragePath, compressImageFile } from "@/lib/photos/compress";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type CookingHistoryBoardProps = {
  initialHistory: CookingHistoryItem[];
  userId: string;
};

type Feedback = {
  tone: "success" | "error" | "info";
  message: string;
};

function formatCookedAt(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function displayRecipeName(value: string) {
  return value.trim() || "料理名なし";
}

function ratingLabel(rating: number | null) {
  return rating ? `評価 ${rating}/5` : "未評価";
}

export function CookingHistoryBoard({ initialHistory, userId }: CookingHistoryBoardProps) {
  const [history, setHistory] = useState(initialHistory);
  const [values, setValues] = useState(emptyCookingHistoryFormValues);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  function resetPhoto() {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setSelectedPhoto(null);
    setPhotoPreviewUrl(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  }

  function resetForm() {
    setValues({
      ...emptyCookingHistoryFormValues,
      cooked_at: toDatetimeLocalValue()
    });
    resetPhoto();
  }

  function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      resetPhoto();
      setFeedback({
        tone: "error",
        message: "原因: 画像ではないファイルです。影響: 完成写真を保存できません。修正方法: カメラで撮影するか画像を選んでください。"
      });
      return;
    }

    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setSelectedPhoto(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
    setFeedback({ tone: "info", message: "完成写真を選びました。内容を確認してから保存してください。" });
  }

  async function saveHistory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const recipeName = values.recipe_name.trim();
    if (!recipeName) {
      setFeedback({
        tone: "error",
        message: "原因: 料理名が未入力です。影響: 履歴を後で探しにくくなります。修正方法: 料理名を入力してください。"
      });
      return;
    }

    const cookedAt = new Date(values.cooked_at);
    if (!values.cooked_at || Number.isNaN(cookedAt.getTime())) {
      setFeedback({
        tone: "error",
        message: "原因: 調理日時が正しくありません。影響: 履歴を保存できません。修正方法: 日時を選び直してください。"
      });
      return;
    }

    const rating = values.rating ? Number(values.rating) : null;
    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      setFeedback({
        tone: "error",
        message: "原因: 評価の値が正しくありません。影響: 履歴を保存できません。修正方法: 1から5の評価を選んでください。"
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    const { data: savedHistory, error: historyError } = await supabase
      .from("cooking_history")
      .insert({
        user_id: userId,
        cooked_at: cookedAt.toISOString(),
        recipe_name: recipeName,
        note: values.note.trim(),
        rating
      })
      .select()
      .single();

    if (historyError || !savedHistory) {
      setIsSaving(false);
      setFeedback({
        tone: "error",
        message: "原因: 料理履歴をDBへ保存できませんでした。影響: 写真も紐づけられません。修正方法: ログイン状態と入力内容を確認してください。"
      });
      return;
    }

    const baseHistory = { ...(savedHistory as Omit<CookingHistoryItem, "photos">), photos: [] };

    if (!selectedPhoto) {
      setHistory((items) => [baseHistory, ...items]);
      resetForm();
      setIsSaving(false);
      setFeedback({ tone: "success", message: "写真なしで料理履歴を保存しました。" });
      return;
    }

    try {
      const compressed = await compressImageFile(selectedPhoto);
      const storagePath = buildCookingHistoryPhotoStoragePath(userId);
      const { error: uploadError } = await supabase.storage.from("photos").upload(storagePath, compressed.blob, {
        contentType: compressed.contentType,
        upsert: false
      });

      if (uploadError) {
        setHistory((items) => [baseHistory, ...items]);
        resetForm();
        setIsSaving(false);
        setFeedback({
          tone: "error",
          message: "原因: 完成写真をStorageへ保存できませんでした。影響: 料理履歴は写真なしで保存済みです。修正方法: 通信状態を確認し、あとで写真を追加してください。"
        });
        return;
      }

      const { data: savedPhoto, error: photoError } = await supabase
        .from("photos")
        .insert({
          user_id: userId,
          bucket_id: "photos",
          storage_path: storagePath,
          usage_type: "cooking_history",
          cooking_history_id: baseHistory.id,
          content_type: compressed.contentType,
          byte_size: compressed.byteSize,
          width: compressed.width,
          height: compressed.height
        })
        .select()
        .single();

      if (photoError || !savedPhoto) {
        await supabase.storage.from("photos").remove([storagePath]);
        setHistory((items) => [baseHistory, ...items]);
        resetForm();
        setIsSaving(false);
        setFeedback({
          tone: "error",
          message: "原因: 完成写真の情報をDBへ保存できませんでした。影響: 料理履歴は写真なしで保存済みです。修正方法: ログイン状態を確認して、あとで写真を追加してください。"
        });
        return;
      }

      const photo = savedPhoto as CookingHistoryPhoto;
      const { data: signedUrlData } = await supabase.storage.from(photo.bucket_id).createSignedUrl(photo.storage_path, 60 * 30);
      const photoWithUrl = { ...photo, signed_url: signedUrlData?.signedUrl ?? null };

      setHistory((items) => [{ ...baseHistory, photos: [photoWithUrl] }, ...items]);
      resetForm();
      setIsSaving(false);
      setFeedback({ tone: "success", message: "完成写真付きで料理履歴を保存しました。" });
    } catch {
      setHistory((items) => [baseHistory, ...items]);
      resetForm();
      setIsSaving(false);
      setFeedback({
        tone: "error",
        message: "原因: 写真の圧縮または保存に失敗しました。影響: 料理履歴は写真なしで保存済みです。修正方法: 別の写真で撮り直してください。"
      });
    }
  }

  return (
    <section className="cooking-history-workspace" aria-labelledby="cooking-history-heading">
      <div className="section-heading">
        <p className="eyebrow">Cooking History</p>
        <h2 id="cooking-history-heading">料理履歴</h2>
      </div>

      {feedback ? (
        <p className="operation-message" data-tone={feedback.tone} role={feedback.tone === "error" ? "alert" : "status"}>
          {feedback.message}
        </p>
      ) : null}

      <div className="cooking-history-grid">
        <section className="stock-panel" aria-labelledby="cooking-history-form-heading">
          <div className="panel-title">
            <div>
              <span>記録</span>
              <h3 id="cooking-history-form-heading">作った料理を残す</h3>
            </div>
            <strong>{history.length}件</strong>
          </div>

          <form className="stock-form" onSubmit={saveHistory}>
            <label>
              料理名
              <input
                value={values.recipe_name}
                onChange={(event) => setValues((current) => ({ ...current, recipe_name: event.target.value }))}
                placeholder="例: カレー"
              />
            </label>
            <div className="form-row two-columns">
              <label>
                調理日時
                <input
                  type="datetime-local"
                  value={values.cooked_at}
                  onChange={(event) => setValues((current) => ({ ...current, cooked_at: event.target.value }))}
                />
              </label>
              <label>
                評価
                <select value={values.rating} onChange={(event) => setValues((current) => ({ ...current, rating: event.target.value }))}>
                  <option value="">未評価</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </label>
            </div>
            <label>
              メモ
              <textarea
                rows={3}
                value={values.note}
                onChange={(event) => setValues((current) => ({ ...current, note: event.target.value }))}
                placeholder="味付けや次回の改善点"
              />
            </label>

            <div className="history-photo-panel">
              <div className="photo-capture-heading">
                <div>
                  <span>完成写真</span>
                  <h4>写真を添付</h4>
                </div>
                <label className="photo-file-button">
                  写真を選ぶ
                  <input
                    ref={photoInputRef}
                    accept="image/*"
                    capture="environment"
                    type="file"
                    onChange={selectPhoto}
                    disabled={isSaving}
                  />
                </label>
              </div>

              {photoPreviewUrl ? (
                <div className="photo-preview">
                  {/* Blob URL previews are local-only, so Next Image optimization is not useful here. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoPreviewUrl} alt="選択した完成写真のプレビュー" />
                </div>
              ) : (
                <p className="photo-empty">写真なしでも保存できます。写真は圧縮して非公開Storageに保存します。</p>
              )}

              <button className="secondary-button" type="button" disabled={!selectedPhoto || isSaving} onClick={resetPhoto}>
                写真を外す
              </button>
            </div>

            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={isSaving}>
                {isSaving ? "保存中" : "料理履歴を保存"}
              </button>
            </div>
          </form>
        </section>

        <section className="stock-panel" aria-labelledby="cooking-history-list-heading">
          <div className="panel-title">
            <div>
              <span>履歴</span>
              <h3 id="cooking-history-list-heading">最近作った料理</h3>
            </div>
          </div>

          {history.length === 0 ? (
            <p className="empty-list">料理履歴はありません。作った料理を1件保存してください。</p>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <article className="history-item" key={item.id}>
                  <HistoryPhoto photos={item.photos} recipeName={displayRecipeName(item.recipe_name)} />
                  <div className="history-item-body">
                    <span>{formatCookedAt(item.cooked_at)}</span>
                    <h4>{displayRecipeName(item.recipe_name)}</h4>
                    <p>{ratingLabel(item.rating)}</p>
                    {item.note ? <p className="item-note">{item.note}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function HistoryPhoto({ photos, recipeName }: { photos: CookingHistoryPhoto[]; recipeName: string }) {
  const photo = photos.find((item) => item.signed_url) ?? photos[0];

  if (!photo?.signed_url) {
    return <div className="history-photo-empty">写真なし</div>;
  }

  return (
    <div className="history-photo">
      {/* Supabase signed URLs are already scoped and short lived, so Next Image optimization is not needed here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.signed_url} alt={`${recipeName}の完成写真`} />
    </div>
  );
}
