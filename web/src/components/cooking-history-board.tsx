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

type HistoryView = "timeline" | "calendar" | "insights";
type RatingFilter = "all" | "5" | "4" | "3" | "1";
type PhotoFilter = "all" | "with" | "without";
type PeriodFilter = "all" | "week" | "month" | "quarter";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function displayRecipeName(value: string) {
  return value.trim() || "料理名なし";
}

function ratingLabel(rating: number | null) {
  return rating ? `評価 ${rating}/5` : "未評価";
}

function dateKey(value: string) {
  return value.slice(0, 10);
}

function toLocalDate(key: string) {
  return new Date(`${key}T00:00:00`);
}

function formatCookingDateLabel(key: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return key || "日付なし";
  const date = toLocalDate(key);
  return `${Number(key.slice(5, 7))}/${Number(key.slice(8, 10))}（${WEEKDAYS[date.getDay()]}）`;
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function localDateKey(date: Date) {
  return `${monthKey(date)}-${String(date.getDate()).padStart(2, "0")}`;
}

function getMonthCells(month: string) {
  const [yearValue, monthValue] = month.split("-").map(Number);
  const base =
    Number.isFinite(yearValue) && Number.isFinite(monthValue)
      ? new Date(yearValue, monthValue - 1, 1)
      : new Date();
  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
  const first = new Date(start);
  first.setDate(start.getDate() - start.getDay());
  const last = new Date(end);
  last.setDate(end.getDate() + (6 - end.getDay()));
  const cells: Date[] = [];
  for (const cursor = new Date(first); cursor <= last; cursor.setDate(cursor.getDate() + 1)) {
    cells.push(new Date(cursor));
  }
  return { base, cells };
}

function renderStars(rating: number | null) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  return Array.from({ length: 5 }, (_, index) => (
    <span className={index < value ? "star-filled" : "star-empty"} key={index}>
      ★
    </span>
  ));
}

export function CookingHistoryBoard({ initialHistory, userId }: CookingHistoryBoardProps) {
  const [history, setHistory] = useState(initialHistory);
  const [historyView, setHistoryView] = useState<HistoryView>("timeline");
  const [historySearch, setHistorySearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");
  const [photoFilter, setPhotoFilter] = useState<PhotoFilter>("all");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [mealFilter, setMealFilter] = useState("all");
  const today = useMemo(() => new Date(), []);
  const [calendarMonth, setCalendarMonth] = useState(monthKey(today));
  const [selectedDate, setSelectedDate] = useState(localDateKey(today));
  const [values, setValues] = useState(emptyCookingHistoryFormValues);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const visibleHistory = history.filter((item) => {
    const query = historySearch.trim().toLowerCase();
    const cookedDate = toLocalDate(dateKey(item.cooked_at));
    const currentDate = new Date(today);
    currentDate.setHours(0, 0, 0, 0);
    const hasPhoto = item.photos.some((photo) => photo.signed_url);
    const matchesQuery = query
      ? [item.recipe_name, item.note, ratingLabel(item.rating)].join(" ").toLowerCase().includes(query)
      : true;
    const minRating = ratingFilter === "all" ? 0 : Number(ratingFilter);
    const matchesRating = minRating === 0 ? true : Number(item.rating) >= minRating;
    const matchesPhoto = photoFilter === "all" ? true : photoFilter === "with" ? hasPhoto : !hasPhoto;
    const matchesPeriod =
      periodFilter === "all"
        ? true
        : periodFilter === "month"
          ? dateKey(item.cooked_at).startsWith(monthKey(today))
          : (() => {
              const days = periodFilter === "week" ? 7 : 90;
              const threshold = new Date(currentDate);
              threshold.setDate(currentDate.getDate() - days + 1);
              return !Number.isNaN(cookedDate.getTime()) && cookedDate >= threshold;
            })();
    const matchesGenre = genreFilter === "all";
    const matchesMeal = mealFilter === "all";
    return matchesQuery && matchesRating && matchesPhoto && matchesPeriod && matchesGenre && matchesMeal;
  });
  const recipeCounts = visibleHistory.reduce<Record<string, number>>((counts, item) => {
    const name = displayRecipeName(item.recipe_name);
    counts[name] = (counts[name] ?? 0) + 1;
    return counts;
  }, {});
  const topRecipes = Object.entries(recipeCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))
    .slice(0, 5);
  const allRecipeCounts = history.reduce<Record<string, number>>((counts, item) => {
    const name = displayRecipeName(item.recipe_name);
    counts[name] = (counts[name] ?? 0) + 1;
    return counts;
  }, {});
  const topRecipe = Object.entries(allRecipeCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ja"))[0];
  const monthCount = history.filter((item) => dateKey(item.cooked_at).startsWith(monthKey(today))).length;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekCount = history.filter((item) => toLocalDate(dateKey(item.cooked_at)) >= weekStart).length;
  const photoCount = history.filter((item) => item.photos.some((photo) => photo.signed_url)).length;
  const photoRate = history.length ? Math.round((photoCount / history.length) * 100) : 0;
  const groupedHistory = visibleHistory.reduce<Record<string, CookingHistoryItem[]>>((groups, item) => {
    const key = dateKey(item.cooked_at);
    groups[key] = [...(groups[key] ?? []), item];
    return groups;
  }, {});
  const { base: calendarBase, cells: calendarCells } = getMonthCells(calendarMonth);
  const selectedItems = groupedHistory[selectedDate] ?? [];
  const favoriteItems = history.filter((item) => Number(item.rating) >= 4).slice(0, 5);
  const staleRecipes = Object.entries(allRecipeCounts)
    .map(([name]) => {
      const last = history.find((item) => displayRecipeName(item.recipe_name) === name);
      return { name, lastDate: last ? dateKey(last.cooked_at) : "" };
    })
    .sort((a, b) => a.lastDate.localeCompare(b.lastDate))
    .slice(0, 5);
  const monthPhotos = history
    .filter((item) => dateKey(item.cooked_at).startsWith(monthKey(today)) && item.photos.some((photo) => photo.signed_url))
    .slice(0, 6);

  function shiftCalendarMonth(offset: number) {
    const next = new Date(calendarBase.getFullYear(), calendarBase.getMonth() + offset, 1);
    const nextMonth = monthKey(next);
    setCalendarMonth(nextMonth);
    setSelectedDate(`${nextMonth}-01`);
  }

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
      <h2 className="sr-only" id="cooking-history-heading">料理履歴</h2>

      {feedback ? (
        <p className="operation-message" data-tone={feedback.tone} role={feedback.tone === "error" ? "alert" : "status"}>
          {feedback.message}
        </p>
      ) : null}

      <div className="cooking-summary-grid" aria-label="料理記録サマリー">
        <SummaryTile label="今月" tone="orange" value={`${monthCount}回`} />
        <SummaryTile label="今週" tone="green" value={`${weekCount}回`} />
        <SummaryTile label="写真あり" tone="indigo" value={`${photoRate}%`} />
        <SummaryTile compact label="よく作る" tone="slate" value={topRecipe?.[0] ?? "未集計"} />
      </div>

      <div className="cooking-view-tabs" role="tablist" aria-label="料理履歴表示">
        <button aria-selected={historyView === "calendar"} data-active={historyView === "calendar"} onClick={() => setHistoryView("calendar")} role="tab" type="button">
          カレンダー
        </button>
        <button aria-selected={historyView === "timeline"} data-active={historyView === "timeline"} onClick={() => setHistoryView("timeline")} role="tab" type="button">
          タイムライン
        </button>
        <button aria-selected={historyView === "insights"} data-active={historyView === "insights"} onClick={() => setHistoryView("insights")} role="tab" type="button">
          振り返り
        </button>
      </div>

      {historyView !== "insights" ? (
        <div className="cooking-history-controls">
          <input aria-label="料理履歴検索" value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="レシピ名・メモで検索..." />
          <div className="cooking-filter-row">
            <select aria-label="料理履歴期間フィルタ" value={periodFilter} onChange={(event) => setPeriodFilter(event.target.value as PeriodFilter)}>
              <option value="all">期間すべて</option>
              <option value="week">7日以内</option>
              <option value="month">今月</option>
              <option value="quarter">90日以内</option>
            </select>
            <select aria-label="料理履歴評価フィルタ" value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value as RatingFilter)}>
              <option value="all">評価すべて</option>
              <option value="5">★★★★★</option>
              <option value="4">★★★★以上</option>
              <option value="3">★★★以上</option>
              <option value="1">評価あり</option>
            </select>
            <select aria-label="料理履歴写真フィルタ" value={photoFilter} onChange={(event) => setPhotoFilter(event.target.value as PhotoFilter)}>
              <option value="all">写真すべて</option>
              <option value="with">写真あり</option>
              <option value="without">写真なし</option>
            </select>
            <select aria-label="料理履歴ジャンルフィルタ" value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)}>
              <option value="all">ジャンルすべて</option>
            </select>
            <select aria-label="料理履歴献立枠フィルタ" value={mealFilter} onChange={(event) => setMealFilter(event.target.value)}>
              <option value="all">献立枠すべて</option>
            </select>
          </div>
        </div>
      ) : null}

      <section className="cooking-content-panel">
        {history.length === 0 ? (
          <p className="empty-list">料理履歴はまだありません。下の記録フォームから1件保存できます。</p>
        ) : visibleHistory.length === 0 && historyView !== "insights" ? (
          <p className="empty-list">条件に一致する料理履歴がありません。</p>
        ) : historyView === "calendar" ? (
          <div className="cooking-calendar-view" aria-label="料理履歴カレンダー">
            <div className="calendar-month-bar">
              <button aria-label="前の月" onClick={() => shiftCalendarMonth(-1)} type="button">‹</button>
              <div>
                <strong>{calendarBase.getFullYear()}年{calendarBase.getMonth() + 1}月</strong>
                <span>日付を選ぶと記録を確認できます</span>
              </div>
              <button aria-label="次の月" onClick={() => shiftCalendarMonth(1)} type="button">›</button>
            </div>
            <div className="calendar-week-row">
              {WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}
            </div>
            <div className="calendar-cell-grid">
              {calendarCells.map((cell) => {
                const key = localDateKey(cell);
                const items = groupedHistory[key] ?? [];
                const photoItem = items.find((item) => item.photos.some((photo) => photo.signed_url));
                const photo = photoItem?.photos.find((item) => item.signed_url);
                const selected = selectedDate === key;
                return (
                  <button
                    className="calendar-cell"
                    data-in-month={cell.getMonth() === calendarBase.getMonth()}
                    data-selected={selected}
                    key={key}
                    onClick={() => setSelectedDate(key)}
                    type="button"
                  >
                    <span>{cell.getDate()}</span>
                    <div className="calendar-dots">
                      {items.length ? <i data-kind="record" /> : null}
                      {photo ? <i data-kind="photo" /> : null}
                      {items.some((item) => Number(item.rating) >= 4) ? <i data-kind="rating" /> : null}
                    </div>
                    {photo?.signed_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" src={photo.signed_url} />
                    ) : null}
                  </button>
                );
              })}
            </div>
            <div className="calendar-legend">
              <span><i data-kind="record" />記録</span>
              <span><i data-kind="photo" />写真</span>
              <span><i data-kind="rating" />高評価</span>
              <span>予定のみ</span>
            </div>
            <HistoryDateGroup items={selectedItems} title={formatCookingDateLabel(selectedDate)} />
          </div>
        ) : historyView === "insights" ? (
          <div className="cooking-insights-view" aria-label="料理履歴振り返り">
            <div className="insight-grid">
              <InsightPanel title="最近よく作った" rows={topRecipes.map(([name, count]) => [name, `${count}回`])} />
              <InsightPanel title="評価が高い" rows={favoriteItems.map((item) => [displayRecipeName(item.recipe_name), `${item.rating ?? 0}`])} stars />
              <InsightPanel title="しばらく作っていない" rows={staleRecipes.map((item) => [item.name, item.lastDate])} />
              <InsightPanel title="ジャンル傾向" rows={[["未設定", `${history.length}回`]]} green />
            </div>
            <section className="photo-month-panel">
              <div>
                <h3>写真で見る今月</h3>
                <span>{monthPhotos.length}枚</span>
              </div>
              {monthPhotos.length ? (
                <div className="photo-month-grid">
                  {monthPhotos.map((item) => {
                    const photo = item.photos.find((entry) => entry.signed_url);
                    return photo?.signed_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={`${displayRecipeName(item.recipe_name)}の完成写真`} key={item.id} src={photo.signed_url} />
                    ) : null;
                  })}
                </div>
              ) : (
                <p>今月の写真付き記録はまだありません。</p>
              )}
            </section>
          </div>
        ) : (
          <div className="cooking-timeline-view">
            {Object.keys(groupedHistory).map((key) => (
              <HistoryDateGroup items={groupedHistory[key]} key={key} title={formatCookingDateLabel(key)} />
            ))}
          </div>
        )}
      </section>

      <details className="cooking-entry-details">
        <summary>料理履歴を追加</summary>
        <form className="stock-form cooking-entry-form" onSubmit={saveHistory}>
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
                <input ref={photoInputRef} accept="image/*" capture="environment" type="file" onChange={selectPhoto} disabled={isSaving} />
              </label>
            </div>
            {photoPreviewUrl ? (
              <div className="photo-preview">
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
      </details>
    </section>
  );
}

function SummaryTile({ compact, label, tone, value }: { compact?: boolean; label: string; tone: string; value: string }) {
  return (
    <div className="cooking-summary-tile">
      <span>{label}</span>
      <strong className={`summary-${tone}`} data-compact={compact}>{value}</strong>
    </div>
  );
}

function HistoryDateGroup({ items, title }: { items: CookingHistoryItem[]; title: string }) {
  return (
    <section className="history-date-group">
      <div className="history-date-heading">
        <h3>{title}</h3>
        <span>{items.length}件</span>
      </div>
      {items.length ? (
        <div className="history-list">
          {items.map((item) => (
            <article className="history-item" key={item.id}>
              <HistoryPhoto photos={item.photos} recipeName={displayRecipeName(item.recipe_name)} />
              <div className="history-item-body">
                <div className="history-item-topline">
                  <div>
                    <span>{formatTimestamp(item.cooked_at)}</span>
                    <h4>{displayRecipeName(item.recipe_name)}</h4>
                  </div>
                  <div className="history-stars">{renderStars(item.rating)}</div>
                </div>
                <div className="history-tags">
                  <em>その他</em>
                  {item.photos.some((photo) => photo.signed_url) ? <em>写真あり</em> : null}
                  {item.note ? <em>メモあり</em> : null}
                </div>
                <p className="item-note">{item.note || "感想なし"}</p>
                <div className="history-card-actions">
                  {item.photos.some((photo) => photo.signed_url) ? <button type="button">写真を開く</button> : null}
                  <button type="button">レシピを見る</button>
                  <button data-primary="true" type="button">もう一度作る</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-list">この日の料理記録・予定はありません。</p>
      )}
    </section>
  );
}

function InsightPanel({ green, rows, stars, title }: { green?: boolean; rows: string[][]; stars?: boolean; title: string }) {
  return (
    <section className="insight-panel">
      <h3>{title}</h3>
      {rows.length ? (
        <ul>
          {rows.map(([name, value]) => (
            <li key={`${title}-${name}-${value}`}>
              <span>{name}</span>
              <strong data-green={green}>{stars ? renderStars(Number(value)) : value}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p>未集計</p>
      )}
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
