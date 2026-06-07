"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CookingRecordEditModal } from "@/components/cooking-record-edit-modal";
import { useShellNavigation, useShellSubView } from "@/components/web-mode-shell";
import { CookingHistoryItem, CookingHistoryPhoto } from "@/lib/cooking-history/types";
import type { StockItem } from "@/lib/inventory/types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { useCachedSignedUrls } from "@/lib/photos/signed-url-cache";

type CookingHistoryBoardProps = {
  initialHistory: CookingHistoryItem[];
  initialInventoryItems: StockItem[];
  userId: string;
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

export function CookingHistoryBoard({ initialHistory, initialInventoryItems, userId }: CookingHistoryBoardProps) {
  const router = useRouter();
  const history = initialHistory;
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  // 全履歴写真の storage_path を収集し、共有キャッシュで署名URL解決する（TKT-0205）。
  const allPhotoPaths = useMemo(
    () => history.flatMap((item) => item.photos.map((photo) => photo.storage_path)).filter(Boolean),
    [history]
  );
  const photoUrlMap = useCachedSignedUrls(supabase, allPhotoPaths);

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
  const [editingItem, setEditingItem] = useState<CookingHistoryItem | null>(null);
  const [viewingItem, setViewingItem] = useState<CookingHistoryItem | null>(null);
  const { requestViewRecipe } = useShellNavigation();
  const { selectedSubViews, selectShellLeaf } = useShellSubView();

  useEffect(() => {
    setHistoryView(selectedSubViews.cooking);
  }, [selectedSubViews.cooking]);

  function switchHistoryView(view: HistoryView) {
    setHistoryView(view);
    selectShellLeaf("cooking", view);
  }

  const visibleHistory = history.filter((item) => {
    const query = historySearch.trim().toLowerCase();
    const cookedDate = toLocalDate(dateKey(item.cooked_at));
    const currentDate = new Date(today);
    currentDate.setHours(0, 0, 0, 0);
    const hasPhoto = item.photos.some((photo) => photo.storage_path);
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
  const photoCount = history.filter((item) => item.photos.some((photo) => photo.storage_path)).length;
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
    .filter((item) => dateKey(item.cooked_at).startsWith(monthKey(today)) && item.photos.some((photo) => photo.storage_path))
    .slice(0, 6);

  function shiftCalendarMonth(offset: number) {
    const next = new Date(calendarBase.getFullYear(), calendarBase.getMonth() + offset, 1);
    const nextMonth = monthKey(next);
    setCalendarMonth(nextMonth);
    setSelectedDate(`${nextMonth}-01`);
  }

  function handleSaved() {
    setEditingItem(null);
    router.refresh();
  }

  function handleViewEdit(item: CookingHistoryItem) {
    setViewingItem(null);
    setEditingItem(item);
  }

  return (
    <section className="cooking-history-workspace" aria-labelledby="cooking-history-heading">
      <h2 className="sr-only" id="cooking-history-heading">料理履歴</h2>

      <div className="cooking-summary-grid" aria-label="料理記録サマリー">
        <SummaryTile label="今月" tone="orange" value={`${monthCount}回`} />
        <SummaryTile label="今週" tone="green" value={`${weekCount}回`} />
        <SummaryTile label="写真あり" tone="indigo" value={`${photoRate}%`} />
        <SummaryTile compact label="よく作る" tone="slate" value={topRecipe?.[0] ?? "未集計"} />
      </div>

      <div className="cooking-view-tabs" role="tablist" aria-label="料理履歴表示">
        <button aria-selected={historyView === "calendar"} data-active={historyView === "calendar"} onClick={() => switchHistoryView("calendar")} role="tab" type="button">
          カレンダー
        </button>
        <button aria-selected={historyView === "timeline"} data-active={historyView === "timeline"} onClick={() => switchHistoryView("timeline")} role="tab" type="button">
          タイムライン
        </button>
        <button aria-selected={historyView === "insights"} data-active={historyView === "insights"} onClick={() => switchHistoryView("insights")} role="tab" type="button">
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
          <p className="empty-list">料理履歴はまだありません。献立の「料理を完了する」から記録できます。</p>
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
                // 写真あり判定は storage_path の有無で行う（TKT-0205）。
                const photoItem = items.find((item) => item.photos.some((photo) => photo.storage_path));
                const photo = photoItem?.photos.find((photo) => photo.storage_path);
                const photoUrl = photo ? photoUrlMap.get(photo.storage_path) : undefined;
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
                    {photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" src={photoUrl} />
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
            <HistoryDateGroup
              items={selectedItems}
              onEdit={setEditingItem}
              onView={setViewingItem}
              onViewRecipe={requestViewRecipe}
              photoUrlMap={photoUrlMap}
              title={formatCookingDateLabel(selectedDate)}
            />
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
                    // storage_path があるものを代表写真として選択し、キャッシュMapから URL を引く。
                    const photo = item.photos.find((entry) => entry.storage_path);
                    const photoUrl = photo ? photoUrlMap.get(photo.storage_path) : undefined;
                    return photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={`${displayRecipeName(item.recipe_name)}の完成写真`} key={item.id} src={photoUrl} />
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
              <HistoryDateGroup
                items={groupedHistory[key]}
                key={key}
                onEdit={setEditingItem}
                onView={setViewingItem}
                onViewRecipe={requestViewRecipe}
                photoUrlMap={photoUrlMap}
                title={formatCookingDateLabel(key)}
              />
            ))}
          </div>
        )}
      </section>

      {editingItem ? (
        <CookingRecordEditModal
          inventoryItems={initialInventoryItems}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={handleSaved}
          userId={userId}
        />
      ) : null}

      {viewingItem ? (
        <CookingRecordViewModal
          item={viewingItem}
          onClose={() => setViewingItem(null)}
          onEdit={() => handleViewEdit(viewingItem)}
          photoUrlMap={photoUrlMap}
        />
      ) : null}
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

function HistoryDateGroup({
  items,
  onEdit,
  onView,
  onViewRecipe,
  photoUrlMap,
  title
}: {
  items: CookingHistoryItem[];
  onEdit: (item: CookingHistoryItem) => void;
  onView: (item: CookingHistoryItem) => void;
  onViewRecipe: (recipeId: string, origin?: "recipes" | "cooking") => void;
  photoUrlMap: Map<string, string>;
  title: string;
}) {
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
              <button className="history-edit-button" onClick={() => onEdit(item)} type="button">
                編集
              </button>
              <HistoryPhoto photos={item.photos} photoUrlMap={photoUrlMap} recipeName={displayRecipeName(item.recipe_name)} onView={() => onView(item)} />
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
                  {item.photos.some((photo) => photo.storage_path) ? <em>写真あり</em> : null}
                  {item.note ? <em>メモあり</em> : null}
                </div>
                <p className="item-note">{item.note || "感想なし"}</p>
                {item.recipe_id ? (
                  <div className="history-card-actions">
                    <button data-primary="true" type="button" onClick={() => onViewRecipe(item.recipe_id!, "cooking")}>
                      レシピを見る
                    </button>
                  </div>
                ) : null}
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

function CookingRecordViewModal({
  item,
  onClose,
  onEdit,
  photoUrlMap
}: {
  item: CookingHistoryItem;
  onClose: () => void;
  onEdit: () => void;
  photoUrlMap: Map<string, string>;
}) {
  // storage_path があるものを「写真あり」とみなす（TKT-0205）。
  const visiblePhotos = item.photos.filter((photo) => photo.storage_path);
  const recipeName = displayRecipeName(item.recipe_name);

  return (
    <div className="modal-backdrop cooking-record-view-backdrop" role="dialog" aria-modal="true" aria-labelledby="cooking-record-view-heading" onClick={onClose}>
      <section className="canvas-modal cooking-record-view-modal" onClick={(event) => event.stopPropagation()}>
        <button className="modal-close-button" aria-label="閉じる" onClick={onClose} type="button">
          ×
        </button>
        <div className="cooking-record-view-header">
          <span>{formatTimestamp(item.cooked_at)}</span>
          <h3 id="cooking-record-view-heading">{recipeName}</h3>
        </div>

        <div className="cooking-record-view-photos" aria-label={`${recipeName}の写真`}>
          {visiblePhotos.length ? (
            visiblePhotos.map((photo, index) => {
              const photoUrl = photoUrlMap.get(photo.storage_path);
              return (
                <figure className="cooking-record-view-photo" key={photo.id}>
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt={`${recipeName}の完成写真 ${index + 1}`} />
                  ) : (
                    <span className="photo-thumb-fallback" aria-hidden="true">読み込み中…</span>
                  )}
                </figure>
              );
            })
          ) : (
            <div className="cooking-record-view-photo-empty">写真なし</div>
          )}
        </div>

        <div className="cooking-record-view-meta">
          <section>
            <span>評価</span>
            <div className="history-stars" aria-label={ratingLabel(item.rating)}>
              {renderStars(item.rating)}
            </div>
          </section>
          <section>
            <span>コメント</span>
            <p>{item.note || "感想なし"}</p>
          </section>
        </div>

        <div className="cooking-record-view-actions">
          <button type="button" onClick={onEdit}>
            編集
          </button>
          <button type="button" onClick={onClose}>
            閉じる
          </button>
        </div>
      </section>
    </div>
  );
}

function HistoryPhoto({
  photos,
  photoUrlMap,
  recipeName,
  onView
}: {
  photos: CookingHistoryPhoto[];
  photoUrlMap: Map<string, string>;
  recipeName: string;
  onView: () => void;
}) {
  // storage_path がある写真を「写真あり」とみなす（TKT-0205）。
  const photosWithPath = photos.filter((photo) => photo.storage_path);
  const photo = photosWithPath[0];
  const photoUrl = photo ? photoUrlMap.get(photo.storage_path) : undefined;

  if (!photo) {
    return <div className="history-photo-empty">写真なし</div>;
  }

  if (!photoUrl) {
    // storage_path はあるが署名URLがまだ解決されていない（初回レンダリング直後）。
    return <div className="history-photo-empty">写真なし</div>;
  }

  return (
    <button className="history-photo history-photo-button" aria-label={`${recipeName}の写真を表示`} onClick={onView} type="button">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photoUrl} alt={`${recipeName}の完成写真`} />
      {photosWithPath.length >= 2 ? <span className="history-photo-count-badge">📷{photosWithPath.length}</span> : null}
    </button>
  );
}
