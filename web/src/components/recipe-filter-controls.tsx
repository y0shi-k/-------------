"use client";

export type RecipeSearchLogic = "and" | "or";
export type RecipeSearchMode = "name" | "ingredient" | "all";
export type RecipeSort = "created_desc" | "updated_desc" | "name_asc" | "count_desc" | "ingredients_desc";

const searchTabs: Array<{ label: string; value: RecipeSearchMode }> = [
  { label: "レシピ名", value: "name" },
  { label: "食材", value: "ingredient" },
  { label: "すべて", value: "all" }
];

const sortTabs: Array<{ label: string; value: RecipeSort }> = [
  { label: "登録日時", value: "created_desc" },
  { label: "更新日時", value: "updated_desc" },
  { label: "レシピ名", value: "name_asc" },
  { label: "調理回数", value: "count_desc" },
  { label: "材料数", value: "ingredients_desc" }
];

export function RecipeFilterControls({
  favoriteOnly,
  search,
  searchLogic,
  searchMode,
  sort,
  onFavoriteFilterChange,
  onSearchChange,
  onSearchLogicChange,
  onSearchModeChange,
  onSortChange
}: {
  favoriteOnly: boolean;
  search: string;
  searchLogic: RecipeSearchLogic;
  searchMode: RecipeSearchMode;
  sort: RecipeSort;
  onFavoriteFilterChange: (value: boolean) => void;
  onSearchChange: (value: string) => void;
  onSearchLogicChange: (value: RecipeSearchLogic) => void;
  onSearchModeChange: (value: RecipeSearchMode) => void;
  onSortChange: (value: RecipeSort) => void;
}) {
  return (
    <>
      <div className="recipe-search-controls">
        <div className="recipe-search-mode-tabs" aria-label="レシピ検索対象">
          {searchTabs.map((tab) => (
            <button data-active={searchMode === tab.value} key={tab.value} onClick={() => onSearchModeChange(tab.value)} type="button" data-tooltip={`${tab.label}で検索`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="recipe-search-logic" aria-label="検索条件">
          <button data-active={searchLogic === "and"} onClick={() => onSearchLogicChange("and")} type="button" data-tooltip="すべての条件に一致するレシピを検索">AND</button>
          <button data-active={searchLogic === "or"} onClick={() => onSearchLogicChange("or")} type="button" data-tooltip="いずれかの条件に一致するレシピを検索">OR</button>
        </div>
        <div className="recipe-search-field">
          <input aria-label="レシピ検索" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="検索..." />
          {search ? <button aria-label="検索をクリア" onClick={() => onSearchChange("")} type="button" data-tooltip="検索テキストをクリア">×</button> : null}
        </div>
        <select className="canvas-hidden-compat" aria-label="レシピの並び順" value={sort} onChange={(event) => onSortChange(event.target.value as RecipeSort)}>
          <option value="created_desc">登録が新しい順</option>
          <option value="updated_desc">更新が新しい順</option>
          <option value="name_asc">名前順</option>
          <option value="count_desc">調理回数が多い順</option>
          <option value="ingredients_desc">材料が多い順</option>
        </select>
      </div>
      <div className="recipe-sort-row">
        <span>並び</span>
        {sortTabs.map((tab) => (
          <button data-active={sort === tab.value} key={tab.value} onClick={() => onSortChange(tab.value)} type="button" data-tooltip={`${tab.label}で並び替え`}>
            {tab.label}{sort === tab.value ? "▼" : ""}
          </button>
        ))}
      </div>
      <div className="recipe-filter-chips" aria-label="レシピの絞り込み">
        <button className="recipe-filter-chip" data-active={!favoriteOnly} type="button" onClick={() => onFavoriteFilterChange(false)} data-tooltip="全レシピを表示">
          すべて
        </button>
        <button className="recipe-filter-chip" data-active={favoriteOnly} type="button" onClick={() => onFavoriteFilterChange(true)} data-tooltip="お気に入りのみ表示">
          お気に入り
        </button>
      </div>
    </>
  );
}
